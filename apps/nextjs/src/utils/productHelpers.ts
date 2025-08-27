import { ethers } from "ethers";

import type { Product, Tranche } from "@dinsure/contracts";

/**
 * Get the display description for a product
 */
export function getProductDescription(product: Product): string {
  return product.metadata?.description || "No description available";
}

/**
 * Get a short name for a tranche (e.g., "BTC Tranche A (-5%)")
 */
export function getTrancheShortName(
  tranche: Tranche,
  product?: Product,
): string {
  const asset = product?.metadata?.underlyingAsset || "Asset";
  const trancheLetter = getTrancheLetterByPremium(tranche.premiumRateBps);
  const triggerText = getTriggerDescription(tranche);

  return `${asset} Tranche ${trancheLetter} ${triggerText}`;
}

/**
 * Get tranche letter designation based on premium (A=safest, B=medium, C=riskiest)
 */
function getTrancheLetterByPremium(premiumBps: number): string {
  const premium = premiumBps / 100; // Convert to percentage
  if (premium <= 2) return "A";
  if (premium <= 5) return "B";
  if (premium <= 10) return "C";
  return "D";
}

/**
 * Get risk level description for a tranche
 */
function getTrancheRiskLevel(tranche: Tranche): string {
  const premium = tranche.premiumRateBps / 100;
  if (premium <= 2) return "Low";
  if (premium <= 5) return "Medium";
  if (premium <= 10) return "High";
  return "Very High";
}

/**
 * Generate trigger description from tranche configuration
 */
export function getTriggerDescription(tranche: Tranche): string {
  const thresholdPrice = Number(ethers.formatEther(tranche.threshold));

  switch (tranche.triggerType) {
    case 0: // PRICE_BELOW
      return `(${calculateTriggerPercent(tranche)}% drop)`;
    case 1: // PRICE_ABOVE
      return `(${calculateTriggerPercent(tranche)}% rise)`;
    case 2: // RELATIVE
      return `(±${calculateTriggerPercent(tranche)}%)`;
    default:
      return `($${thresholdPrice.toLocaleString()})`;
  }
}

/**
 * Calculate the trigger percentage based on premium and common patterns
 */
function calculateTriggerPercent(tranche: Tranche): number {
  const premiumRate = tranche.premiumRateBps / 100;

  // Common insurance tranche patterns based on premium rates
  // Low premium = further from trigger, High premium = closer to trigger
  if (premiumRate <= 2) return 5; // Tranche A: -5% trigger, 2% premium
  if (premiumRate <= 5) return 10; // Tranche B: -10% trigger, 5% premium
  if (premiumRate <= 10) return 15; // Tranche C: -15% trigger, 10% premium
  if (premiumRate <= 15) return 20; // Tranche D: -20% trigger, 15% premium
  return 25; // Extreme risk tranche
}

/**
 * Get the underlying asset from product metadata
 */
export function getUnderlyingAsset(product: Product): string {
  return product.metadata?.underlyingAsset || "Unknown Asset";
}

/**
 * Check if a product has BTC as underlying asset
 */
export function isBTCProduct(product: Product): boolean {
  const asset = getUnderlyingAsset(product).toLowerCase();
  return asset.includes("btc") || asset.includes("bitcoin");
}

/**
 * Check if a product has ETH as underlying asset
 */
export function isETHProduct(product: Product): boolean {
  const asset = getUnderlyingAsset(product).toLowerCase();
  return asset.includes("eth") || asset.includes("ethereum");
}

/**
 * Get asset icon based on product
 */
export function getProductIcon(product: Product): string {
  if (isBTCProduct(product)) return "🪙";
  if (isETHProduct(product)) return "⚡";
  return "💰";
}
