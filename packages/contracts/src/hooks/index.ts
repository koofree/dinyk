/**
 * DIN Insurance Platform - Complete Hook Collection
 *
 * This file exports all hooks for interacting with the DIN insurance smart contracts.
 * These hooks provide a comprehensive interface for all platform operations.
 */

// Core contract hooks
export { useContracts } from "./useContracts";
export type { ContractsState } from "./useContracts";

// Product and tranche management
export { useProductManagement } from "./useProductManagement";
export type {
  ProductSpec,
  RegisterProductParams,
  RegisterTrancheParams,
} from "./useProductManagement";

// Round lifecycle management
export { RoundState, useRoundManagement } from "./useRoundManagement";
export type {
  AnnounceRoundParams,
  RoundEconomics,
  RoundInfo,
} from "./useRoundManagement";

// Buyer operations (insurance purchase)
export { useBuyerOperations } from "./useBuyerOperations";
export type {
  BuyerOrder,
  BuyInsuranceParams,
  InsuranceTokenInfo,
  PurchaseCalculation,
} from "./useBuyerOperations";

// Seller operations (liquidity provision)
export { useSellerOperations } from "./useSellerOperations";
export type {
  DepositCollateralParams,
  PoolAccounting,
  SellerPosition,
  YieldAnalysis,
} from "./useSellerOperations";

// Monitoring and analytics
export { useMonitoring } from "./useMonitoring";
export type {
  PoolHealth,
  RoundMonitoring,
  SystemMetrics,
  TrancheRiskAnalysis,
} from "./useMonitoring";

// Settlement and claims
export { useSettlement } from "./useSettlement";
export type { SettlementInfo, SettlementStatus } from "./useSettlement";

// User portfolio management
export { useUserPortfolio } from "./useUserPortfolio";
export type {
  UserInsurancePosition,
  UserLiquidityPosition,
  UserPosition,
} from "./useUserPortfolio";
