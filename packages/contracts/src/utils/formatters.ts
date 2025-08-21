import { ethers } from 'ethers';

// Simple formatters that work with ethers v6
export function formatCurrency(
  amount: bigint, 
  symbol: string = 'USDT', 
  decimals: number = 6,
  precision: number = 2
): string {
  const formatted = Number(ethers.formatUnits(amount, decimals)).toFixed(precision);
  return `${formatted} ${symbol}`;
}

export function formatPercentage(bps: number, precision: number = 2): string {
  return `${(bps / 100).toFixed(precision)}%`;
}

export function formatTimeRemaining(targetTimestamp: number): string {
  const now = Date.now() / 1000;
  const remaining = targetTimestamp - now;
  
  if (remaining <= 0) {
    return 'Expired';
  }
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export function formatAddress(address: string, length: number = 8): string {
  if (!address) return '';
  const start = address.slice(0, length / 2 + 2);
  const end = address.slice(-length / 2);
  return `${start}...${end}`;
}

export function isValidAddress(address: string): boolean {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
}

// Note: TriggerType and RoundState are exported from types/products