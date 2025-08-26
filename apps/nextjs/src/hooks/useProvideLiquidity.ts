import { KAIA_TESTNET_ADDRESSES, useContracts, useWeb3 } from "@dinsure/contracts";
import { ethers } from "ethers";
import { useCallback, useState } from "react";
import TranchePoolCoreABI from "../../../../packages/contracts/src/config/abis/TranchePoolCore.json";
import type { RoundDetails, TrancheDetails } from "./useTrancheData";


export interface ProvideLiquidityParams {
  tranche: TrancheDetails;
  round: RoundDetails;
  amount: string; // Amount in USDT as string
}

export function useProvideLiquidity() {
  const { account, signer, isConnected } = useWeb3();
  const { usdt } = useContracts();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [approving, setApproving] = useState(false);

  const checkAllowance = useCallback(async (poolAddress: string, amount: bigint) => {
    if (!usdt || !account) return false;

    try {
      console.log("Checking USDT allowance:", {
        account,
        poolAddress,
        usdtAddress: await usdt.getAddress()
      });
      
      const currentAllowance = await usdt.allowance(account, poolAddress);
      console.log("Current allowance:", ethers.formatUnits(currentAllowance, 6), "USDT");
      
      return currentAllowance >= amount;
    } catch (err) {
      console.error("Error checking allowance:", err);
      return false;
    }
  }, [usdt, account]);

  const approveUSDT = useCallback(async (poolAddress: string, amount: bigint) => {
    if (!usdt || !signer) throw new Error("No USDT contract or signer available");

    try {
      setApproving(true);
      
      // Reset to zero first (some tokens require this)
      const resetTx = await usdt.connect(signer).approve(poolAddress, 0);
      await resetTx.wait();
      
      // Then approve the amount
      const approveTx = await usdt.connect(signer).approve(poolAddress, amount);
      await approveTx.wait();
      
      return true;
    } catch (err) {
      console.error("Error approving USDT:", err);
      throw err;
    } finally {
      setApproving(false);
    }
  }, [usdt, signer]);

  const calculateYield = useCallback((
    amount: string,
    premiumRateBps: number,
    maturityTimestamp: number
  ): {
    collateralAmount: bigint;
    premiumRate: number;
    daysToMaturity: number;
    annualizedYield: number;
    potentialEarnings: bigint;
  } => {
    // USDT uses 6 decimals
    const collateralAmount = ethers.parseUnits(amount, 6);
    const premiumRate = premiumRateBps / 100;
    
    // Calculate days to maturity
    const now = Math.floor(Date.now() / 1000);
    const daysToMaturity = Math.max(1, (maturityTimestamp - now) / (24 * 60 * 60));
    
    // Calculate annualized yield
    const annualizedYield = premiumRate * (365 / daysToMaturity);
    
    // Calculate potential earnings (premium if not triggered)
    const potentialEarnings = (collateralAmount * BigInt(premiumRateBps)) / 10000n;
    
    return {
      collateralAmount,
      premiumRate,
      daysToMaturity,
      annualizedYield,
      potentialEarnings,
    };
  }, []);

  const checkBalance = useCallback(async (): Promise<bigint> => {
    if (!usdt || !account) return 0n;

    try {
      return await usdt.balanceOf(account);
    } catch (err) {
      console.error("Error checking USDT balance:", err);
      return 0n;
    }
  }, [usdt, account]);

  const getPoolInfo = useCallback(async (poolAddress: string) => {
    if (!signer) return null;

    try {
      const pool = new ethers.Contract(poolAddress, TranchePoolCoreABI.abi, signer);
      const poolAccounting = await pool.getPoolAccounting();
      
      return {
        totalAssets: poolAccounting.totalAssets,
        lockedAssets: poolAccounting.lockedAssets,
        totalShares: poolAccounting.totalShares,
        navPerShare: poolAccounting.navPerShare,
        availableCapacity: poolAccounting.totalAssets - poolAccounting.lockedAssets,
      };
    } catch (err) {
      console.error("Error getting pool info:", err);
      return null;
    }
  }, [signer]);

  const provideLiquidity = useCallback(async ({
    tranche,
    round,
    amount
  }: ProvideLiquidityParams) => {
    if (!signer || !account) {
      throw new Error("Wallet not connected");
    }

    if (!tranche.poolAddress || tranche.poolAddress === ethers.ZeroAddress) {
      throw new Error("No pool found for this tranche");
    }

    setLoading(true);
    setError(null);

    try {
      // Check round state
      if (round.stateName !== 'OPEN' && round.stateName !== 'ANNOUNCED' && round.stateName !== 'ACTIVE') {
        throw new Error(`Round is not open for liquidity. Current state: ${round.stateName}`);
      }

      // Calculate yield
      const { 
        collateralAmount, 
        premiumRate, 
        daysToMaturity, 
        annualizedYield,
        potentialEarnings 
      } = calculateYield(amount, tranche.premiumRateBps, tranche.maturityTimestamp);

      console.log("Liquidity calculation:", {
        collateral: ethers.formatUnits(collateralAmount, 6),
        premiumRate: `${premiumRate}%`,
        daysToMaturity: daysToMaturity.toFixed(1),
        annualizedYield: `${annualizedYield.toFixed(2)}%`,
        potentialEarnings: ethers.formatUnits(potentialEarnings, 6)
      });

      // Check USDT balance
      const balance = await checkBalance();
      if (balance < collateralAmount) {
        throw new Error(
          `Insufficient USDT balance. Required: ${ethers.formatUnits(collateralAmount, 6)} USDT, ` +
          `Available: ${ethers.formatUnits(balance, 6)} USDT`
        );
      }

      // Check and handle allowance
      const hasAllowance = await checkAllowance(tranche.poolAddress, collateralAmount);
      if (!hasAllowance) {
        console.log("Approving USDT spend...");
        await approveUSDT(tranche.poolAddress, collateralAmount);
      }

      // Get pool contract
      const pool = new ethers.Contract(tranche.poolAddress, TranchePoolCoreABI.abi, signer);
      
      // Get share balance before
      const shareBalanceBefore = await pool.shareBalances(account);
      
      // Deposit collateral
      console.log("Depositing collateral...");
      const tx = await pool.depositCollateral(round.roundId, collateralAmount);
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      // Get updated balances
      const shareBalanceAfter = await pool.shareBalances(account);
      const sellerPosition = await pool.getSellerPosition(round.roundId, account);
      const poolAccounting = await pool.getPoolAccounting();
      
      // Calculate shares minted
      const sharesMinted = shareBalanceAfter - shareBalanceBefore;
      const shareValue = (shareBalanceAfter * poolAccounting.navPerShare) / ethers.parseEther("1");
      
      return {
        success: true,
        txHash: receipt.hash,
        collateralDeposited: sellerPosition.collateralAmount,
        sharesMinted,
        totalShares: shareBalanceAfter,
        shareValue,
        potentialEarnings,
      };
    } catch (err) {
      console.error("Error providing liquidity:", err);
      setError(err instanceof Error ? err : new Error("Failed to provide liquidity"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signer, account, calculateYield, checkBalance, checkAllowance, approveUSDT]);

  return {
    provideLiquidity,
    calculateYield,
    checkBalance,
    checkAllowance,
    approveUSDT,
    getPoolInfo,
    loading,
    approving,
    error,
  };
}