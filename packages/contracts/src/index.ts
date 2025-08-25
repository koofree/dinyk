// Main exports for @dinsure/contracts package

// Types
export * from './types/products';
export * from './types/common';

// Services
export { ProductCatalogService } from './services/ProductCatalogService';

// Utilities  
export { formatCurrency, formatPercentage, formatTimeRemaining, formatAddress, isValidAddress } from './utils/formatters';
export { CacheManager } from './utils/cache';

// React hooks - export specific hooks to avoid conflicts
export { 
  useContracts,
  useProductManagement,
  useRoundManagement,
  useBuyerOperations,
  useSellerOperations,
  useMonitoring,
  useSettlement
} from './hooks';

// React providers
export { ContractProvider, useContractFactory } from './providers/ContractProvider';
export { Web3Provider, useWeb3, ProviderType, ACTIVE_NETWORK, STORAGE_KEYS, switchToKaiaNetwork, KAIA_RPC_ENDPOINTS } from './providers/Web3Provider';

// Configuration
export * from './config/addresses';
export * from './config/networks';