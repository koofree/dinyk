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
  DinRegistry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0x0000760e713fed5b6F866d3Bad87927337DF61c0",
  DinToken: process.env.NEXT_PUBLIC_DIN_TOKEN_ADDRESS || "0x01200e08D6C522C288bE660eb7E8c82d5f095a42",
  DinUSDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || "0x53232164780a589dfAe08fB16D1962bD78591Aa0",
  FeeTreasury: process.env.NEXT_PUBLIC_FEE_TREASURY_ADDRESS || "0x9C20316Ba669e762Fb43dbb6d3Ff63062b89945D",
  InsuranceToken: process.env.NEXT_PUBLIC_INSURANCE_TOKEN_ADDRESS || "0x147f4660515aE91c81FdB43Cf743C6faCACa9903",
  OraklPriceFeed: process.env.NEXT_PUBLIC_ORAKL_PRICE_FEED_ADDRESS || "0x1320682DCe0b0A52A09937d19b404901d32D5f68",
  ProductCatalog: process.env.NEXT_PUBLIC_PRODUCT_CATALOG_ADDRESS || "0x5c251A3561E47700a9bcbD6ec91e61fB52Eb50d2",
  DinoOracle: process.env.NEXT_PUBLIC_DINO_ORACLE_ADDRESS || "0x2480108C0dA6F7563a887D7d9d969630529340dD",
  TranchePoolFactory: process.env.NEXT_PUBLIC_POOL_FACTORY_ADDRESS || "0x563e95673d4210148eD59eDb6310AC7d488F5Ec0",
  OracleRouter: process.env.NEXT_PUBLIC_ORACLE_ROUTER_ADDRESS || "0x5d83444EBa6899f1B7abD34eF04dDF7Dd7b38a37",
  SettlementEngine: process.env.NEXT_PUBLIC_SETTLEMENT_ENGINE_ADDRESS || "0xAE3FA73652499Bf0aB0b79B8C309DD62137f142D",
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