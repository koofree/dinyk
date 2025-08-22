import { ethers } from "ethers";

export interface PremiumCalculation {
  purchaseAmount: bigint;
  premiumAmount: bigint;
  totalCost: bigint;
  premiumRate: number;
  protocolFee?: bigint;
}

export function calculatePremium(
  amount: string,
  premiumRateBps: number,
  protocolFeeBps?: number
): PremiumCalculation {
  // USDT uses 6 decimals
  const purchaseAmount = ethers.parseUnits(amount, 6);
  const premiumAmount = (purchaseAmount * BigInt(premiumRateBps)) / 10000n;
  const protocolFee = protocolFeeBps 
    ? (premiumAmount * BigInt(protocolFeeBps)) / 10000n
    : 0n;
  const totalCost = purchaseAmount + premiumAmount;
  
  return {
    purchaseAmount,
    premiumAmount,
    totalCost,
    premiumRate: premiumRateBps / 100,
    protocolFee
  };
}

export function formatUSDT(amount: bigint | string): string {
  if (typeof amount === 'string') {
    return parseFloat(amount).toFixed(2);
  }
  return parseFloat(ethers.formatUnits(amount, 6)).toFixed(2);
}

export function formatPercentage(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function calculateUtilization(used: bigint, total: bigint): number {
  if (total === 0n) return 0;
  return Number((used * 10000n) / total) / 100;
}

export function calculateAPR(premiumBps: number, daysToMaturity: number): number {
  const annualizedFactor = 365 / daysToMaturity;
  return (premiumBps / 100) * annualizedFactor;
}