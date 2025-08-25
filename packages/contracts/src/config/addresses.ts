// Contract addresses for different networks
export interface ContractAddresses {
  DinRegistry: string;
  DinToken: string;
  DinUSDT: string;
  ProductCatalog: string;
  InsuranceToken: string;
  FeeTreasury: string;
  TranchePoolFactory: string;
  SettlementEngine: string;
  OracleRouter: string;
  OraklPriceFeed: string;
  DinoOracle: string;
}

// Kaia Testnet (Chain ID: 1001) - Deployed addresses from environment or defaults
export const KAIA_TESTNET_ADDRESSES: ContractAddresses = {
  DinRegistry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? "0xCD2B28186b257869B3C2946ababB56683F4304C3",
  DinToken: process.env.NEXT_PUBLIC_DIN_TOKEN_ADDRESS ?? "0x7126Dbd15e6888AeDd606A7242C998DBED7530Fd",
  DinUSDT: process.env.NEXT_PUBLIC_USDT_ADDRESS ?? "0x8C034f0DBA8664DA4242Cb4CF7fCD7e0a3aa5c90",
  FeeTreasury: process.env.NEXT_PUBLIC_FEE_TREASURY_ADDRESS ?? "0xb96D484cB71A5d5C3C3AB1Ac18dF587cC6AC6914",
  InsuranceToken: process.env.NEXT_PUBLIC_INSURANCE_TOKEN_ADDRESS ?? "0x3bEDE5f043E8D0597F9F0b60eCfc52B134d8E934",
  OraklPriceFeed: process.env.NEXT_PUBLIC_ORAKL_PRICE_FEED_ADDRESS ?? "0xFa2f0063BAC2e5BA304f50eC54b6EA07aCC534fF",
  ProductCatalog: process.env.NEXT_PUBLIC_PRODUCT_CATALOG_ADDRESS ?? "0x145E2f2e2B9C6Bdd22D8cE21504f6d5fca0Cc72D",
  DinoOracle: process.env.NEXT_PUBLIC_DINO_ORACLE_ADDRESS ?? "0x6317f2f9271d484548871915DDDff95aD4c45aC3",
  TranchePoolFactory: process.env.NEXT_PUBLIC_POOL_FACTORY_ADDRESS ?? "0x3810066EfEAc98F18cF6A1E62FF3f089CC30Fb01",
  YieldRouter: process.env.NEXT_PUBLIC_YIELD_ROUTER_ADDRESS ?? "0xC5dB540bca54FAce539AF2d2a7c5ac717795fb11",
  OracleRouter: process.env.NEXT_PUBLIC_ORACLE_ROUTER_ADDRESS ?? "0x5F54ce2BFE2A63472a9462FFe2Cf89Da59b29D72",
  SettlementEngine: process.env.NEXT_PUBLIC_SETTLEMENT_ENGINE_ADDRESS ?? "0x1d3975e61A50e9dd0e4995F837F051A94F36fdd8",
}

// Kaia Mainnet (Chain ID: 8217) - To be deployed
export const KAIA_MAINNET_ADDRESSES: ContractAddresses = {
  DinRegistry: "",
  DinToken: "",
  DinUSDT: "",
  ProductCatalog: "",
  InsuranceToken: "",
  FeeTreasury: "",
  TranchePoolFactory: "",
  YieldRouter: "",
  SettlementEngine: "",
  OracleRouter: "",
  OraklPriceFeed: "",
  DinoOracle: "",
};

// Default to testnet addresses for now
export const CONTRACT_ADDRESSES = KAIA_TESTNET_ADDRESSES;

export const CONTRACT_ADDRESSES_BY_CHAIN: Record<number, ContractAddresses> = {
  1001: KAIA_TESTNET_ADDRESSES, // Kaia Testnet
  8217: KAIA_MAINNET_ADDRESSES, // Kaia Mainnet
};

export function getContractAddresses(chainId: number): ContractAddresses {
  const addresses = CONTRACT_ADDRESSES_BY_CHAIN[chainId];
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return addresses;
}