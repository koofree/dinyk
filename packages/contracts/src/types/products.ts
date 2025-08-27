// Contract return type interfaces - These match on-chain structs
export interface ProductContractData {
  productId: bigint;
  metadataHash: string;
  active: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  trancheIds: bigint[];
}

export interface TrancheContractData {
  trancheId: bigint;
  productId: bigint;
  triggerType: bigint;
  threshold: bigint;
  maturityTimestamp: bigint;
  premiumRateBps: bigint;
  perAccountMin: bigint;
  perAccountMax: bigint;
  trancheCap: bigint;
  oracleRouteId: bigint;
  active: boolean;
  createdAt: bigint;
  updatedAt: bigint;
  roundIds: bigint[];
}

export interface RoundContractData {
  roundId: bigint;
  trancheId: bigint;
  state: bigint;
  maturityTimestamp: bigint;
  salesStartTime: bigint;
  salesEndTime: bigint;
  coverageStartTime: bigint;
  coverageEndTime: bigint;
  totalPurchased: bigint;
  totalCollateral: bigint;
  matchedAmount: bigint;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface PoolAccountingData {
  totalAssets: bigint;
  lockedAssets: bigint;
  totalSupply: bigint;
  availableAssets: bigint;
}

// Enums matching smart contract enums
export enum TriggerType {
  PRICE_BELOW = 0,
  PRICE_ABOVE = 1,
  RELATIVE = 2,
  BOOLEAN = 3,
  CUSTOM = 4,
}

export enum RoundState {
  ANNOUNCED = 0,
  OPEN = 1,
  ACTIVE = 2,
  MATURED = 3,
  SETTLED = 4,
  CANCELED = 5,
}

// Product types
export interface Product {
  productId: number;
  metadataHash: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  tranches: Tranche[];
  metadata?: ProductMetadata;
}

export interface ProductMetadata {
  name: string;
  description: string;
  category: string;
  tags: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  underlyingAsset: string;
  imageUrl?: string;
  documentUrl?: string;
}

// Tranche types
export interface Tranche {
  trancheId: number;
  productId: number;
  triggerType: TriggerType;
  threshold: bigint;
  maturityTimestamp: number;
  maturityDays?: number; // Days to maturity
  premiumRateBps: number;
  perAccountMin: bigint;
  perAccountMax: bigint;
  trancheCap: bigint;
  oracleRouteId: number;
  poolAddress?: string; // Pool contract address
  active?: boolean;
  createdAt?: number;
  updatedAt?: number;
  rounds?: number[]; // Array of round IDs
  currentRound?: Round;
  name?: string; // Optional tranche name

  // Derived fields
  premiumRate?: number;
  maturityDate?: Date;
  isExpired: boolean;
  availableCapacity: bigint;
  utilizationRate: number;
}

// Round types
export interface Round {
  roundId: number;
  trancheId?: number;
  salesStartTime?: number;
  salesEndTime?: number;
  salesDeadline?: number; // Alternative field for sales closing
  startTime?: number; // Round start time
  endTime?: number; // Round end time
  state: RoundState;
  totalBuyerPurchases?: bigint;
  totalSellerCollateral: bigint;
  matchedAmount: bigint;
  createdAt?: number;
  stateChangedAt?: number;

  // Derived fields
  salesStartDate?: Date;
  salesEndDate?: Date;
  isActive?: boolean;
  isOpen: boolean;
  isClosed?: boolean;
  utilizationRate?: number;
  fillRate?: number;
}

// Purchase and order types
export interface BuyInsuranceParams {
  roundId: bigint;
  amount: bigint;
  recipient?: string;
}

export interface ProvideLiquidityParams {
  roundId: bigint;
  amount: bigint;
}

export interface PremiumCalculation {
  purchaseAmount: bigint;
  premium: bigint;
  premiumRate: number;
  totalPayment: bigint;
  protocolFee?: bigint;
}
