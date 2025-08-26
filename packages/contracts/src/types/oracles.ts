import type { BigNumber } from 'ethers';

// Oracle types
export interface OracleRoute {
  routeId: number;
  primaryOracle: string;
  fallbackOracles: string[];
  heartbeat: number; // Maximum staleness in seconds
  decimals: number;
  active: boolean;
  description: string;
}

export interface PriceData {
  price: BigNumber;
  timestamp: number;
  decimals: number;
  roundId?: BigNumber;
  source: string; // Oracle source identifier
}

export interface PriceResult {
  price: BigNumber;
  timestamp: number;
  decimals: number;
  source: 'ORAKL' | 'DINO' | 'FALLBACK';
  confidence: number; // Confidence score 0-100
  deviation?: number; // Deviation from other sources
}

// Oracle aggregation
export interface AggregatedPriceData {
  price: BigNumber;
  timestamp: number;
  sources: PriceSourceData[];
  median: BigNumber;
  average: BigNumber;
  deviation: number;
  confidence: number;
}

export interface PriceSourceData {
  source: string;
  price: BigNumber;
  timestamp: number;
  weight: number;
  active: boolean;
}

// Trigger evaluation
export interface TriggerCheck {
  triggered: boolean;
  currentPrice: BigNumber;
  threshold: BigNumber;
  triggerType: number;
  timestamp: number;
  confidence: number;
}

export interface TriggerEvent {
  roundId: number;
  trancheId: number;
  poolAddress: string;
  triggerType: number;
  threshold: BigNumber;
  actualPrice: BigNumber;
  timestamp: number;
  oracleSource: string;
  settled: boolean;
}

// Oracle governance (DINO)
export interface PriceProposal {
  proposalId: BigNumber;
  proposer: string;
  identifier: string; // Asset identifier
  timestamp: number;
  price: BigNumber;
  description: string;
  stake: BigNumber;
  disputed: boolean;
  resolved: boolean;
  finalPrice?: BigNumber;
  votes: ProposalVote[];
}

export interface ProposalVote {
  voter: string;
  support: boolean;
  stake: BigNumber;
  timestamp: number;
  reason?: string;
}

export interface DisputeInfo {
  disputeId: BigNumber;
  proposalId: BigNumber;
  disputer: string;
  reason: string;
  stake: BigNumber;
  resolved: boolean;
  outcome: 'UPHELD' | 'OVERTURNED' | 'PENDING';
  resolutionTime?: number;
}

// Oracle monitoring
export interface OracleHealth {
  routeId: number;
  status: 'ACTIVE' | 'STALE' | 'OFFLINE' | 'DISPUTED';
  lastUpdate: number;
  staleness: number; // Seconds since last update
  priceDeviations: number[]; // Recent price deviations
  uptime: number; // Percentage uptime over last 24h
  responseTime: number; // Average response time in ms
}

export interface OracleMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  uptimePercentage: number;
  priceAccuracy: number; // Compared to reference price
  disputeRate: number; // % of prices disputed
}

// Oracle configuration
export interface OracleConfig {
  routeId: number;
  asset: string;
  primarySource: string;
  fallbackSources: string[];
  aggregationMethod: 'MEDIAN' | 'AVERAGE' | 'WEIGHTED_AVERAGE';
  minSources: number;
  maxDeviation: number; // Maximum allowed deviation between sources
  stalenessThreshold: number; // Seconds after which price is stale
  disputeWindow: number; // Seconds for dispute submission
  bondRequirement: BigNumber; // Minimum stake for proposals
}

// Price feed interfaces
export interface IPriceFeed {
  getPrice: (identifier: string) => Promise<PriceData>;
  getLatestPrice: (identifier: string) => Promise<PriceData>;
  getPriceHistory: (identifier: string, from: number, to: number) => Promise<PriceData[]>;
  isStale: (identifier: string) => Promise<boolean>;
}

export interface IAggregator {
  aggregatePrices: (sources: PriceSourceData[]) => AggregatedPriceData;
  validatePrice: (price: PriceData, threshold: number) => boolean;
  calculateDeviation: (prices: BigNumber[]) => number;
  getConfidenceScore: (sources: PriceSourceData[]) => number;
}