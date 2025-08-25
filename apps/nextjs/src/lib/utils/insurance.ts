/**
 * Insurance utility functions
 */

export function calculatePremium(coverageAmount: string, premiumBps: bigint): string {
  if (!coverageAmount || parseFloat(coverageAmount) <= 0) return "0";
  const premium = (parseFloat(coverageAmount) * Number(premiumBps)) / 10000;
  return premium.toFixed(2);
}

export function getRoundStatusColor(state: number): string {
  const colors = [
    "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",    // Announced
    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400", // Open
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400", // Matched
    "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400", // Active
    "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400", // Matured
    "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",    // Settled
    "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"         // Canceled
  ];
  return colors[state] || "bg-gray-100 text-gray-800";
}

export function getRoundStatusText(state: number): string {
  const states = ["Announced", "Open", "Matched", "Active", "Matured", "Settled", "Canceled"];
  return states[state] || "Unknown";
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatPercentage(bps: bigint): string {
  return `${Number(bps) / 100}%`;
}

export function formatTrigger(trigger: bigint): string {
  return `-${Number(trigger) / 100}%`;
}