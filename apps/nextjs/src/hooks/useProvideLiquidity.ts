import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/context/Web3Provider";
import { KAIA_TESTNET_ADDRESSES } from "@dinsure/contracts";
import { USDT_ABI } from "@/utils/contractABIs";
import type { TrancheDetails, RoundDetails } from "./useTrancheData";

// Pool-specific ABI (not in shared ABIs yet)
const POOL_ABI = [
  "function depositCollateral(uint256 roundId, uint256 collateralAmount) returns (uint256)",
  "function getSellerPosition(uint256 roundId, address seller) view returns (tuple(uint256 collateralAmount, uint256 filledCollateral, uint256 lockedSharesAssigned, bool withdrawn, uint256 refundAmount))",
  "function getPoolAccounting() view returns (tuple(uint256 totalAssets, uint256 lockedAssets, uint256 totalShares, uint256 navPerShare))",
  "function shareBalances(address account) view returns (uint256)",
  "function getAvailableCollateral(address seller) view returns (uint256)",
  "function getRoundEconomics(uint256 roundId) view returns (uint256, uint256, uint256, uint256, uint256)",
];

export interface ProvideLiquidityParams {
  tranche: TrancheDetails;
  round: RoundDetails;
  amount: string; // Amount in USDT as string
}

export function useProvideLiquidity() {
  const { account, signer, isConnected } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [approving, setApproving] = useState(false);

  const checkAllowance = useCallback(async (poolAddress: string, amount: bigint) => {
    if (!signer || !account) return false;

    try {
      const usdt = new ethers.Contract(KAIA_TESTNET_ADDRESSES.DinUSDT, USDT_ABI, signer);
      const currentAllowance = await usdt.allowance(account, poolAddress);
      return currentAllowance >= amount;
    } catch (err) {
      console.error("Error checking allowance:", err);
      return false;
    }
  }, [signer, account]);

  const approveUSDT = useCallback(async (poolAddress: string, amount: bigint) => {
    if (!signer) throw new Error("No signer available");

    try {
      setApproving(true);
      const usdt = new ethers.Contract(KAIA_TESTNET_ADDRESSES.DinUSDT, USDT_ABI, signer);
      
      // Reset to zero first (some tokens require this)
      const resetTx = await usdt.approve(poolAddress, 0);
      await resetTx.wait();
      
      // Then approve the amount
      const approveTx = await usdt.approve(poolAddress, amount);
      await approveTx.wait();
      
      return true;
    } catch (err) {
      console.error("Error approving USDT:", err);
      throw err;
    } finally {
      setApproving(false);
    }
  }, [signer]);

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
    if (!signer || !account) return 0n;

    try {
      const usdt = new ethers.Contract(KAIA_TESTNET_ADDRESSES.DinUSDT, USDT_ABI, signer);
      return await usdt.balanceOf(account);
    } catch (err) {
      console.error("Error checking USDT balance:", err);
      return 0n;
    }
  }, [signer, account]);

  const getPoolInfo = useCallback(async (poolAddress: string) => {
    if (!signer) return null;

    try {
      const pool = new ethers.Contract(poolAddress, POOL_ABI, signer);
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
      const pool = new ethers.Contract(tranche.poolAddress, POOL_ABI, signer);
      
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