// Global window extensions for wallet providers
declare global {
  interface Window {
    ethereum?: any;
    klaytn?: any;
  }
}

export interface InsuranceTranche {
  id: string;
  triggerLevel: number;
  premium: number;
  capacity: string;
  filled: string;
  available: string;
  expiry: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface InsuranceProduct {
  id: number;
  asset: string;
  name: string;
  description: string;
  tranches: InsuranceTranche[];
}

export interface UserPosition {
  id: string;
  asset: string;
  type: 'insurance' | 'liquidity';
  tranche: string;
  coverage?: string;
  premiumPaid?: string;
  status?: 'active' | 'claimable' | 'expired';
  expiresIn?: number;
  currentPrice?: number;
  triggerPrice?: number;
  baseline?: number;
  payout?: string;
  deposited?: string;
  currentValue?: string;
  earnedPremium?: string;
  stakingRewards?: string;
  roundStatus?: 'active' | 'settlement' | 'completed';
  daysLeft?: number;
}

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  chainId: number | null;
  balance: string;
  error: Error | null;
}

export interface TransactionState {
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  hash: string | null;
}