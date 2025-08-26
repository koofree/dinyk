// Main exports for @dinsure/contracts package

// Types
export * from './types/common';
export * from './types/products';

// Services
export { ProductCatalogService } from './services/ProductCatalogService';

// Utilities  
export { CacheManager } from './utils/cache';
export { formatAddress, formatCurrency, formatPercentage, formatTimeRemaining, isValidAddress } from './utils/formatters';

// React hooks - export specific hooks to avoid conflicts
export {
  useBuyerOperations, useContracts, useMonitoring, useProductManagement,
  useRoundManagement, useSellerOperations, useSettlement,
  useUserPortfolio
} from './hooks';

// Export portfolio types
export type { UserInsurancePosition, UserLiquidityPosition, UserPosition } from './hooks';

// React providers
export { ContractProvider, useContractFactory } from './providers/ContractProvider';
export { useWeb3, Web3Provider } from './providers/Web3Provider';

// Configuration
export * from './config/constants';
