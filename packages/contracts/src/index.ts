// Main exports for @dinsure/contracts package

// Types
export * from './types/products';
export * from './types/common';

// Services
export { ProductCatalogService } from './services/ProductCatalogService';

// Utilities  
export { formatCurrency, formatPercentage, formatTimeRemaining, formatAddress, isValidAddress } from './utils/formatters';
export { CacheManager } from './utils/cache';

// React hooks
export { useProducts } from './hooks/useProducts';
export { useBuyInsurance } from './hooks/useBuyInsurance';

// React providers
export { ContractProvider, useContracts, useContractFactory } from './providers/ContractProvider';

// Configuration
export * from './config/addresses';
export * from './config/networks';