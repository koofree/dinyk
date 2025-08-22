export const USDT_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
] as const;

export const POOL_ABI = [
  "function placeBuyerOrder(uint256 roundId, uint256 purchaseAmount) returns (uint256)",
  "function getBuyerOrder(uint256 roundId, address buyer) view returns (tuple(uint256 purchaseAmount, uint256 premiumPaid, uint256 filledAmount, bool claimed, uint256 refundAmount))",
  "function getRoundEconomics(uint256 roundId) view returns (uint256, uint256, uint256, uint256, uint256)",
  "function placeSellerDeposit(uint256 roundId, uint256 depositAmount) returns (uint256)",
  "function getSellerDeposit(uint256 roundId, address seller) view returns (tuple(uint256 depositAmount, uint256 filledAmount, uint256 unfilledAmount, bool claimed, uint256 premiumEarned))",
] as const;

export const INSURANCE_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function getTokenInfo(uint256 tokenId) view returns (tuple(uint256 trancheId, uint256 roundId, uint256 purchaseAmount, address originalBuyer))",
] as const;

export const PRODUCT_CATALOG_ABI = [
  "function getActiveProducts() view returns (uint256[])",
  "function getProductInfo(uint256 productId) view returns (tuple(string name, string asset, string category, bool isActive, uint256 createdAt))",
  "function getProductTranches(uint256 productId) view returns (uint256[])",
  "function getTrancheInfo(uint256 trancheId) view returns (tuple(uint256 productId, uint256 triggerBps, uint256 premiumRateBps, uint256 minCapacity, uint256 maxCapacity, address poolAddress, bool isActive))",
  "function getRoundInfo(uint256 roundId) view returns (tuple(uint256 trancheId, uint8 state, uint256 startTime, uint256 endTime, uint256 maturityTime, uint256 totalBuyerPurchases, uint256 totalSellerDeposits, uint256 matchedAmount, bool triggerOccurred, uint256 settledTime))",
  "function getTrancheRounds(uint256 trancheId) view returns (uint256[])",
] as const;

export const REGISTRY_ABI = [
  "function getProductCatalog() view returns (address)",
  "function getInsuranceToken() view returns (address)",
  "function getSettlementEngine() view returns (address)",
  "function getFeeTreasury() view returns (address)",
  "function getPoolFactory() view returns (address)",
  "function getOracleRouter() view returns (address)",
  "function getProtocolFeeRate() view returns (uint256)",
] as const;