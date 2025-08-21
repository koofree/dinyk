// Global window extensions for wallet providers
declare global {
  interface Window {
    ethereum?: any;
    klaytn?: any;
  }
}

// Matches TrancheSpec from ProductCatalog.sol
export interface InsuranceTranche {
  id: number; // On-chain tranche ID
  name: string; // Human-readable name
  productId?: number; // Parent product ID
  triggerType: 'PRICE_BELOW' | 'PRICE_ABOVE' | 'RELATIVE' | 'BOOLEAN' | 'CUSTOM';
  triggerPrice: number; // Actual trigger price in USD
  triggerLevel: number; // Percentage for UI display
  threshold?: string; // On-chain threshold value
  premium: number; // Premium percentage for display
  premiumRateBps: number; // Premium in basis points (100 = 1%)
  capacity: string; // Total tranche capacity (trancheCap)
  filled: string; // Amount already filled
  available: string; // Remaining available
  perAccountMin: string; // Minimum purchase per account
  perAccountMax: string; // Maximum purchase per account
  expiry: number; // Days until expiry (for display)
  maturityDays: number; // Maturity period in days
  maturityTimestamp?: number; // On-chain maturity timestamp
  oracleRouteId: number; // Oracle route for price feeds
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  roundState?: 'ANNOUNCED' | 'OPEN' | 'MATCHED' | 'ACTIVE' | 'MATURED' | 'SETTLED' | 'CANCELED';
  roundId?: number; // Current round ID if exists
  active?: boolean; // Whether tranche is active
}

// Matches Product from ProductCatalog.sol
export interface InsuranceProduct {
  id: number; // Local ID for UI
  productId: number; // On-chain product ID
  asset: string; // Asset being insured (BTC, ETH, etc.)
  name: string; // Product name
  description: string; // Product description
  metadata?: string; // On-chain metadata hash
  metadataHash?: string; // bytes32 metadata hash
  active?: boolean; // Whether product is active
  createdAt?: number; // Creation timestamp
  updatedAt?: number; // Last update timestamp
  tranches: InsuranceTranche[]; // Array of tranches
}

// User positions with NFT insurance tokens
export interface UserPosition {
  id: string; // NFT token ID or position ID
  tokenId?: number; // InsuranceToken NFT ID
  asset: string;
  type: 'insurance' | 'liquidity';
  tranche: string;
  trancheId?: number;
  roundId?: number;
  
  // Insurance buyer fields
  coverage?: string; // Purchase amount (coverage)
  premiumPaid?: string;
  status?: 'active' | 'claimable' | 'expired' | 'settled';
  expiresIn?: number;
  currentPrice?: number;
  triggerPrice?: number;
  baseline?: number;
  payout?: string;
  
  // Liquidity provider fields
  deposited?: string; // Collateral amount
  shares?: string; // Share tokens minted
  currentValue?: string; // NAV of shares
  earnedPremium?: string;
  stakingRewards?: string;
  lockedAmount?: string; // Amount locked in active rounds
  
  // Round status
  roundStatus?: 'active' | 'settlement' | 'completed';
  roundState?: 'ANNOUNCED' | 'OPEN' | 'MATCHED' | 'ACTIVE' | 'MATURED' | 'SETTLED' | 'CANCELED';
  daysLeft?: number;
  maturityTimestamp?: number;
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

// Round data from ProductCatalog.sol
export interface Round {
  roundId: number;
  trancheId: number;
  salesStartTime: number;
  salesEndTime: number;
  state: 'ANNOUNCED' | 'OPEN' | 'MATCHED' | 'ACTIVE' | 'MATURED' | 'SETTLED' | 'CANCELED';
  totalBuyerPurchases: string; // Total amount buyers want
  totalSellerCollateral: string; // Total seller collateral
  matchedAmount: string; // Final matched amount
  createdAt: number;
  stateChangedAt: number;
}

// Pool economics from TranchePoolCore
export interface RoundEconomics {
  totalBuyerPurchases: string;
  totalSellerCollateral: string;
  matchedAmount: string;
  lockedCollateral: string;
  premiumPool: string;
  protocolFees: string;
}

// Pool accounting from TranchePoolCore
export interface PoolAccounting {
  totalAssets: string;
  totalShares: string;
  lockedAssets: string;
  premiumReserve: string;
  navPerShare: string; // 18 decimals
  lastUpdateTime: number;
}