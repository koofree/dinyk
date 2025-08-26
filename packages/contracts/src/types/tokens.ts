import type { BigNumber } from 'ethers';

// Token interfaces
export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: BigNumber;
  chainId: number;
}

export interface TokenBalance {
  address: string;
  symbol: string;
  balance: BigNumber;
  balanceFormatted: string;
  decimals: number;
  usdValue?: number;
}

// USDT Token (DinUSDT)
export interface USDTTokenInfo extends TokenInfo {
  isBlacklisted: (address: string) => Promise<boolean>;
  fee: BigNumber;
  maximumFee: BigNumber;
  paused: boolean;
  deprecated: boolean;
  upgradedAddress?: string;
}

export interface USDTTransferParams {
  to: string;
  amount: BigNumber;
  checkBlacklist?: boolean;
}

// DIN Token
export interface DINTokenInfo extends TokenInfo {
  maxSupply: BigNumber;
  currentSupply: BigNumber;
  mintable: boolean;
  burnable: boolean;
  paused: boolean;
  roles: {
    admin: string[];
    minter: string[];
    burner: string[];
    pauser: string[];
  };
}

export interface DINTokenStats {
  totalSupply: BigNumber;
  circulatingSupply: BigNumber;
  maxSupply: BigNumber;
  mintRate: BigNumber; // Tokens minted per period
  burnRate: BigNumber; // Tokens burned per period
  holders: number;
  transferVolume24h: BigNumber;
}

// Insurance Token (ERC-721)
export interface InsuranceTokenInfo {
  tokenId: BigNumber;
  owner: string;
  trancheId: number;
  roundId: number;
  purchaseAmount: BigNumber;
  premiumPaid: BigNumber;
  originalBuyer: string;
  mintTimestamp: number;
  transferable: boolean;
  expired: boolean;
  claimed: boolean;
  metadata?: InsuranceTokenMetadata;
}

export interface InsuranceTokenMetadata {
  name: string;
  description: string;
  image?: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
  external_url?: string;
}

export interface InsurancePosition {
  tokenId: BigNumber;
  owner: string;
  trancheInfo: {
    trancheId: number;
    productId: number;
    triggerType: number;
    threshold: BigNumber;
    maturityTimestamp: number;
  };
  purchaseInfo: {
    amount: BigNumber;
    premium: BigNumber;
    purchaseTimestamp: number;
  };
  status: {
    active: boolean;
    expired: boolean;
    claimed: boolean;
    triggered: boolean;
    payout?: BigNumber;
  };
  marketInfo?: {
    floorPrice?: BigNumber;
    lastSalePrice?: BigNumber;
    listingPrice?: BigNumber;
    tradingVolume24h?: BigNumber;
  };
}

// Token operations
export interface TokenApprovalParams {
  spender: string;
  amount: BigNumber;
  deadline?: number;
}

export interface TokenTransferParams {
  to: string;
  amount: BigNumber;
  from?: string;
}

// Token allowances
export interface TokenAllowance {
  owner: string;
  spender: string;
  amount: BigNumber;
  unlimited: boolean;
}

export interface AllowanceCheck {
  hasAllowance: boolean;
  currentAllowance: BigNumber;
  requiredAllowance: BigNumber;
  needsApproval: boolean;
}

// Token events
export interface TokenEvent {
  type: 'TRANSFER' | 'APPROVAL' | 'MINT' | 'BURN';
  tokenAddress: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  from?: string;
  to?: string;
  value?: BigNumber;
  spender?: string;
}

// Multi-token operations
export type MultiTokenBalance = Record<string, TokenBalance>;

export interface TokenPortfolio {
  totalUsdValue: number;
  tokens: TokenBalance[];
  positions: InsurancePosition[];
  lastUpdated: number;
}

// Token utility functions interface
export interface ITokenService {
  getTokenInfo: (address: string) => Promise<TokenInfo>;
  getBalance: (tokenAddress: string, userAddress: string) => Promise<BigNumber>;
  getAllowance: (tokenAddress: string, owner: string, spender: string) => Promise<BigNumber>;
  approve: (tokenAddress: string, spender: string, amount: BigNumber) => Promise<string>;
  transfer: (tokenAddress: string, to: string, amount: BigNumber) => Promise<string>;
  ensureAllowance: (tokenAddress: string, spender: string, requiredAmount: BigNumber) => Promise<void>;
}