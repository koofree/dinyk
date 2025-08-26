import type { BigNumber, Contract } from "ethers";

// Contract instance types
export interface ContractInstances {
  dinRegistry: Contract;
  productCatalog: Contract;
  tranchePoolFactory: Contract;
  settlementEngine: Contract;
  oracleRouter: Contract;
  insuranceToken: Contract;
  feeTreasury: Contract;
  dinToken: Contract;
  dinUSDT: Contract;
}

// Contract call results
export interface ContractCallResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  gasUsed?: BigNumber;
}

// Contract transaction parameters
export interface ContractTxParams {
  gasLimit?: BigNumber;
  gasPrice?: BigNumber;
  maxFeePerGas?: BigNumber;
  maxPriorityFeePerGas?: BigNumber;
  value?: BigNumber;
  from?: string;
  nonce?: number;
}

// Registry contract interfaces
export interface IDinRegistry {
  // Address management
  setAddress(identifier: string, address: string): Promise<string>;
  getContractAddress(identifier: string): Promise<string>;
  setAddresses(identifiers: string[], addresses: string[]): Promise<string>;

  // Parameter management
  setParameter(identifier: string, value: BigNumber): Promise<string>;
  getParameter(identifier: string): Promise<BigNumber>;

  // Convenience getters
  getUSDTToken(): Promise<string>;
  getProductCatalog(): Promise<string>;
  getTranchePoolFactory(): Promise<string>;
  getSettlementEngine(): Promise<string>;

  // System status
  isSystemPaused(): Promise<boolean>;
  pause(): Promise<string>;
  unpause(): Promise<string>;
}

// Product catalog interfaces
export interface IProductCatalog {
  // Product management
  createProduct(
    metadataHash: string,
  ): Promise<{ productId: BigNumber; txHash: string }>;
  getProduct(productId: BigNumber): Promise<any>;
  getActiveProducts(): Promise<BigNumber[]>;

  // Tranche management
  createTranche(params: any): Promise<{ trancheId: BigNumber; txHash: string }>;
  getTranche(trancheId: BigNumber): Promise<any>;
  getActiveTranches(): Promise<BigNumber[]>;

  // Round management
  announceRound(
    trancheId: BigNumber,
    startTime: BigNumber,
    endTime: BigNumber,
  ): Promise<{ roundId: BigNumber; txHash: string }>;
  openRound(roundId: BigNumber): Promise<string>;
  closeAndMarkMatched(
    roundId: BigNumber,
    matchedAmount: BigNumber,
  ): Promise<string>;
  getRound(roundId: BigNumber): Promise<any>;

  // Calculations
  calculatePremium(
    trancheId: BigNumber,
    purchaseAmount: BigNumber,
  ): Promise<BigNumber>;
}

// Pool interfaces
export interface ITranchePool {
  // Core operations
  buyInsurance(
    roundId: BigNumber,
    amount: BigNumber,
    recipient: string,
  ): Promise<{ tokenId: BigNumber; txHash: string }>;
  depositCollateral(
    roundId: BigNumber,
    amount: BigNumber,
  ): Promise<{ shares: BigNumber; txHash: string }>;
  computeMatchAndDistribute(
    roundId: BigNumber,
  ): Promise<{ matchedAmount: BigNumber; txHash: string }>;

  // Information getters
  getTranche(): Promise<any>;
  getRoundEconomics(roundId: BigNumber): Promise<any>;
  getPoolStats(): Promise<any>;

  // User positions
  getBuyerOrders(roundId: BigNumber, buyer: string): Promise<any[]>;
  getSellerPositions(roundId: BigNumber, seller: string): Promise<any[]>;

  // NAV and economics
  totalAssets(): Promise<BigNumber>;
  totalShares(): Promise<BigNumber>;
  navPerShare(): Promise<BigNumber>;
}

// Token interfaces
export interface IERC20 {
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<number>;
  totalSupply(): Promise<BigNumber>;
  balanceOf(account: string): Promise<BigNumber>;
  allowance(owner: string, spender: string): Promise<BigNumber>;
  approve(spender: string, amount: BigNumber): Promise<string>;
  transfer(to: string, amount: BigNumber): Promise<string>;
  transferFrom(from: string, to: string, amount: BigNumber): Promise<string>;
}

export interface IERC721 {
  balanceOf(owner: string): Promise<BigNumber>;
  ownerOf(tokenId: BigNumber): Promise<string>;
  approve(to: string, tokenId: BigNumber): Promise<string>;
  getApproved(tokenId: BigNumber): Promise<string>;
  setApprovalForAll(operator: string, approved: boolean): Promise<string>;
  isApprovedForAll(owner: string, operator: string): Promise<boolean>;
  transferFrom(from: string, to: string, tokenId: BigNumber): Promise<string>;
  safeTransferFrom(
    from: string,
    to: string,
    tokenId: BigNumber,
  ): Promise<string>;
  tokenURI(tokenId: BigNumber): Promise<string>;
}

// Oracle interfaces
export interface IOracleRouter {
  getPrice(
    routeId: BigNumber,
  ): Promise<{ price: BigNumber; timestamp: BigNumber }>;
  getPriceWithDeviation(
    routeId: BigNumber,
  ): Promise<{ price: BigNumber; timestamp: BigNumber; deviation: BigNumber }>;
  configureRoute(routeId: BigNumber, config: any): Promise<string>;
  checkTrigger(
    routeId: BigNumber,
    triggerType: number,
    threshold: BigNumber,
  ): Promise<boolean>;
}

// Settlement interfaces
export interface ISettlementEngine {
  initSettlement(
    roundId: BigNumber,
    poolAddress: string,
    triggerData: any,
  ): Promise<string>;
  finalizeSettlement(roundId: BigNumber): Promise<string>;
  disputeSettlement(roundId: BigNumber, evidence: any): Promise<string>;
  getSettlementStatus(roundId: BigNumber): Promise<any>;
}

// Factory interfaces
export interface ITranchePoolFactory {
  createTranchePool(
    trancheId: BigNumber,
  ): Promise<{ poolAddress: string; txHash: string }>;
  getTranchePool(trancheId: BigNumber): Promise<string>;
  getAllPools(): Promise<string[]>;
  setPoolAuthorization(
    trancheId: BigNumber,
    authorized: boolean,
  ): Promise<string>;
}

// Contract event filters and subscriptions
export interface ContractEventFilter {
  address?: string;
  topics?: (string | string[])[];
  fromBlock?: number;
  toBlock?: number;
}

export interface EventSubscription {
  eventName: string;
  contract: Contract;
  filter?: ContractEventFilter;
  callback: (event: any) => void;
}

// Batch operations
export interface BatchCallRequest {
  target: string;
  callData: string;
  allowFailure?: boolean;
}

export interface BatchCallResult {
  success: boolean;
  returnData: string;
}

// Contract deployment info
export interface ContractDeploymentInfo {
  address: string;
  deploymentBlock: number;
  deploymentTx: string;
  deployer: string;
  constructorArgs: any[];
  verified: boolean;
}
