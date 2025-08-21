import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/context/Web3Provider";
import { KAIA_TESTNET_ADDRESSES } from "@dinsure/contracts";
import type { TrancheDetails, RoundDetails } from "./useTrancheData";

// ABI fragments for the contracts we need
const USDT_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

const POOL_ABI = [
  "function placeBuyerOrder(uint256 roundId, uint256 purchaseAmount) returns (uint256)",
  "function getBuyerOrder(uint256 roundId, address buyer) view returns (tuple(uint256 purchaseAmount, uint256 premiumPaid, uint256 filledAmount, bool claimed, uint256 refundAmount))",
  "function getRoundEconomics(uint256 roundId) view returns (uint256, uint256, uint256, uint256, uint256)",
];

const INSURANCE_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function getTokenInfo(uint256 tokenId) view returns (tuple(uint256 trancheId, uint256 roundId, uint256 purchaseAmount, address originalBuyer))",
];

export interface BuyInsuranceParams {
  tranche: TrancheDetails;
  round: RoundDetails;
  amount: string; // Amount in USDT as string
}

export function useBuyInsurance() {
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

  const calculatePremium = useCallback((amount: string, premiumRateBps: number): {
    purchaseAmount: bigint;
    premiumAmount: bigint;
    totalCost: bigint;
    premiumRate: number;
  } => {
    // USDT uses 6 decimals
    const purchaseAmount = ethers.parseUnits(amount, 6);
    const premiumAmount = (purchaseAmount * BigInt(premiumRateBps)) / 10000n;
    const totalCost = purchaseAmount + premiumAmount;
    
    return {
      purchaseAmount,
      premiumAmount,
      totalCost,
      premiumRate: premiumRateBps / 100,
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

  const buyInsurance = useCallback(async ({
    tranche,
    round,
    amount
  }: BuyInsuranceParams) => {
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
        throw new Error(`Round is not open for purchases. Current state: ${round.stateName}`);
      }

      // Calculate premium
      const { purchaseAmount, premiumAmount, totalCost, premiumRate } = calculatePremium(
        amount,
        tranche.premiumRateBps
      );

      console.log("Purchase calculation:", {
        coverage: ethers.formatUnits(purchaseAmount, 6),
        premium: ethers.formatUnits(premiumAmount, 6),
        total: ethers.formatUnits(totalCost, 6),
        premiumRate: `${premiumRate}%`
      });

      // Check USDT balance
      const balance = await checkBalance();
      if (balance < totalCost) {
        throw new Error(
          `Insufficient USDT balance. Required: ${ethers.formatUnits(totalCost, 6)} USDT, ` +
          `Available: ${ethers.formatUnits(balance, 6)} USDT`
        );
      }

      // Check and handle allowance
      const hasAllowance = await checkAllowance(tranche.poolAddress, totalCost);
      if (!hasAllowance) {
        console.log("Approving USDT spend...");
        await approveUSDT(tranche.poolAddress, totalCost);
      }

      // Place buyer order
      const pool = new ethers.Contract(tranche.poolAddress, POOL_ABI, signer);
      console.log("Placing insurance order...");
      
      const tx = await pool.placeBuyerOrder(round.roundId, purchaseAmount);
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      // Get the buyer order details
      const buyerOrder = await pool.getBuyerOrder(round.roundId, account);
      
      return {
        success: true,
        txHash: receipt.hash,
        purchaseAmount: buyerOrder.purchaseAmount,
        premiumPaid: buyerOrder.premiumPaid,
        filledAmount: buyerOrder.filledAmount,
      };
    } catch (err) {
      console.error("Error buying insurance:", err);
      setError(err instanceof Error ? err : new Error("Failed to buy insurance"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [signer, account, calculatePremium, checkBalance, checkAllowance, approveUSDT]);

  return {
    buyInsurance,
    calculatePremium,
    checkBalance,
    checkAllowance,
    approveUSDT,
    loading,
    approving,
    error,
  };
}