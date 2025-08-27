// Main exports for @dinsure/contracts package

// Types
export * from "./types/common";
export * from "./types/products";

// Services
export { ProductCatalogService } from "./services/ProductCatalogService";

// Utilities
export { CacheManager } from "./utils/cache";
export {
  formatAddress,
  formatCurrency,
  formatPercentage,
  formatTimeRemaining,
  isValidAddress,
} from "./utils/formatters";
export {
  METAMASK_ERROR_CODES,
  useWeb3ErrorHandler,
  WEB3_ERROR_PATTERNS,
  Web3ErrorHandler,
} from "./utils/web3-errors";
export type { ErrorHandlingResult, Web3Error } from "./utils/web3-errors";

// React hooks - export specific hooks to avoid conflicts
export {
  useBuyerOperations,
  useContracts,
  useMonitoring,
  useProductManagement,
  useRoundManagement,
  useSellerOperations,
  useSettlement,
  useUserPortfolio,
} from "./hooks";

// Price store - using Zustand for simplicity
export { usePriceStore } from "./store/priceStore.zustand";
export type { PriceData } from "./store/priceStore.zustand";

export type { ContractsState } from "./hooks";

// Export portfolio types
export type {
  UserInsurancePosition,
  UserLiquidityPosition,
  UserPosition,
} from "./hooks";

// React providers
export {
  ContractProvider,
  useContractFactory,
} from "./providers/ContractProvider";

export { useWeb3, Web3Provider } from "./providers/Web3Provider";
export type { Web3ContextType } from "./providers/Web3Provider";

// Configuration
export * from "./config/constants";
export * from "./types/generated";
