// In ethers v6, BigNumber is replaced with native bigint

// Common interfaces
export interface TransactionResult {
  success: boolean;
  transactionHash: string;
  gasUsed: bigint;
  blockNumber: number;
  tokenId?: bigint;
  sharesMinted?: bigint;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

// PremiumCalculation moved to products.ts to avoid duplication

// Chain and network types
export interface ChainInfo {
  chainId: number;
  name: string;
  isTestnet: boolean;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

// Contract state types
export interface ContractState {
  address: string;
  isLoading: boolean;
  isError: boolean;
  error?: Error;
}

// Cache types
export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
}

// Event types
export interface ContractEvent {
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  event: string;
  args: unknown[];
}

// Gas estimation
export interface GasEstimate {
  gasLimit: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  totalCost?: bigint;
}

// Transaction options
export interface TransactionOptions {
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  value?: bigint;
  from?: string;
}

// Pagination
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Sorting and filtering
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export type FilterOptions = Record<string, any>;

// Error types
export interface ContractErrorData {
  code: string;
  message: string;
  data?: any;
}

// Address validation
export type EthereumAddress = string;
export type Bytes32 = string;
export type BigNumberish = bigint | string | number;