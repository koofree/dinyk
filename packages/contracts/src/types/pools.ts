import { BigNumber } from 'ethers';

// Pool types
export interface PoolInfo {
  poolAddress: string;
  trancheId: number;
  registry: string;
  insuranceToken: string;
  active: boolean;
  frozen: boolean;
}

export interface PoolStats {
  tvl: BigNumber;
  totalShares: BigNumber;
  lockedAssets: BigNumber;
  availableLiquidity: BigNumber;
  navPerShare: BigNumber;
  utilizationRate: number;
  premiumReserve: BigNumber;
  totalPremiumsCollected: BigNumber;
  totalPayoutsMade: BigNumber;
}

export interface PoolEconomics {
  totalBuyerPurchases: BigNumber;
  totalSellerCollateral: BigNumber;
  matchedAmount: BigNumber;
  unfilledBuyerAmount: BigNumber;
  unfilledSellerAmount: BigNumber;
  totalPremiumsCollected: BigNumber;
  protocolFeesCollected: BigNumber;
}

// Liquidity provider types
export interface LiquidityPosition {
  provider: string;
  poolAddress: string;
  trancheId: number;
  totalDeposited: BigNumber;
  totalShares: BigNumber;
  currentValue: BigNumber;
  unrealizedGains: BigNumber;
  realizedGains: BigNumber;
  premiumsEarned: BigNumber;
  stakingRewards: BigNumber;
  lastUpdateTime: number;
  
  // Derived fields
  profitLoss: BigNumber;
  roi: number;
  apy: number;
}

export interface ShareTokenInfo {
  tokenId: BigNumber;
  owner: string;
  trancheId: number;
  roundId: number;
  shares: BigNumber;
  depositAmount: BigNumber;
  premiumsEarned: BigNumber;
  mintTimestamp: number;
}

// Pool events
export interface PoolEvent {
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PREMIUM_DISTRIBUTION' | 'PAYOUT' | 'MATCH';
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  user: string;
  amount: BigNumber;
  shares?: BigNumber;
  roundId?: number;
}

// Pool configuration
export interface PoolConfig {
  trancheId: number;
  minDepositAmount: BigNumber;
  maxDepositAmount: BigNumber;
  premiumDistributionDelay: number;
  emergencyWithdrawalEnabled: boolean;
  managementFee: number; // In basis points
  performanceFee: number; // In basis points
}

// Yield farming / restaking
export interface RestakingStrategy {
  strategyId: number;
  name: string;
  protocol: string;
  apy: number;
  tvl: BigNumber;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  active: boolean;
  allocation: BigNumber; // Amount allocated to this strategy
  maxAllocation: BigNumber; // Maximum allowed allocation
}

export interface PoolYieldInfo {
  baseApy: number; // From premiums
  stakingApy: number; // From restaking
  totalApy: number; // Combined APY
  strategies: RestakingStrategy[];
  restakedAmount: BigNumber;
  maxRestakeRatio: number; // Maximum % that can be restaked
  currentRestakeRatio: number; // Current % restaked
}

// Pool operations
export interface DepositParams {
  roundId: number;
  amount: BigNumber;
  minShares?: BigNumber;
  deadline?: number;
}

export interface WithdrawalParams {
  shares: BigNumber;
  minAmount?: BigNumber;
  deadline?: number;
}

export interface PoolRebalanceInfo {
  targetAllocation: { [strategyId: number]: number };
  currentAllocation: { [strategyId: number]: number };
  rebalanceNeeded: boolean;
  estimatedGas: BigNumber;
  estimatedSlippage: number;
}

// Pool monitoring
export interface PoolHealth {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  liquidityRatio: number; // Available / Total
  concentrationRisk: number; // Largest position / Total
  utilizationHealth: 'LOW' | 'OPTIMAL' | 'HIGH';
  lastRebalance: number;
  daysSinceRebalance: number;
  alerts: PoolAlert[];
}

export interface PoolAlert {
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  type: 'LIQUIDITY' | 'CONCENTRATION' | 'PERFORMANCE' | 'SECURITY';
  message: string;
  timestamp: number;
  resolved: boolean;
}

// Pool analytics
export interface PoolPerformanceMetrics {
  dailyVolume: BigNumber;
  weeklyVolume: BigNumber;
  monthlyVolume: BigNumber;
  dailyPremiums: BigNumber;
  weeklyPremiums: BigNumber;
  monthlyPremiums: BigNumber;
  sharpe: number;
  volatility: number;
  maxDrawdown: number;
  winRate: number; // % of rounds that were profitable for LPs
}