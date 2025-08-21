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
  MATCHED = 2,
  ACTIVE = 3,
  MATURED = 4,
  SETTLED = 5,
  CANCELED = 6,
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
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
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
  premiumRateBps: number;
  perAccountMin: bigint;
  perAccountMax: bigint;
  trancheCap: bigint;
  oracleRouteId: number;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  rounds: Round[];
  currentRound?: Round;
  
  // Derived fields
  premiumRate: number;
  maturityDate: Date;
  isExpired: boolean;
  availableCapacity: bigint;
  utilizationRate: number;
}

// Round types
export interface Round {
  roundId: number;
  trancheId: number;
  salesStartTime: number;
  salesEndTime: number;
  state: RoundState;
  totalBuyerPurchases: bigint;
  totalSellerCollateral: bigint;
  matchedAmount: bigint;
  createdAt: number;
  stateChangedAt: number;
  
  // Derived fields
  salesStartDate: Date;
  salesEndDate: Date;
  isActive: boolean;
  isOpen: boolean;
  isClosed: boolean;
  utilizationRate: number;
  fillRate: number;
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