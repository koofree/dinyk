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

// Kaia Testnet (Chain ID: 1001) - Deployed addresses
export const KAIA_TESTNET_ADDRESSES: ContractAddresses = {
  DinRegistry: "0x4f2415EB664e5597DD356b9B87F284781244c025",         // DinRegistry contract address
  DinToken: "0x7Ff9f76f2114ec2C63e0b60F6E3c4E162c27Ea55",            // DinToken contract address
  DinUSDT: "0x1D7a996bf178237Ac044AD5816Cb3407B1D44A6E",             // DinUSDT contract address
  FeeTreasury: "0x6651C17EEEf004eb57DD4D352a3619ECCaD758Cd",         // FeeTreasury contract address
  InsuranceToken: "0x0d98927514eB09C87B8fe4201E22520708E75bc5",      // InsuranceToken contract address
  OraklPriceFeed: "0xC7d92b736dD59FDFc06ecd0e7D9FE2dcF8aE87C7",      // OraklPriceFeed contract address
  ProductCatalog: "0xC4BEF597Afb471746e209019dADce0d053789419",      // ProductCatalog contract address
  DinoOracle: "0x7964188fC31237233738c9672b8d743af0388c63",          // DinoOracle contract address (will be deployed with correct DIN token)
  TranchePoolFactory: "0x703f0695bB455060b2CE7E07945A6E2852295467",  // TranchePoolFactory contract address
  OracleRouter: "0xF35461e6aC137892F360381549269D8152a8781f",        // OracleRouter contract address
  SettlementEngine: "0x020AA21564b6ee17a293Ab33bA3FBA493e13bE0e",    // SettlementEngine contract address
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

export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  1001: KAIA_TESTNET_ADDRESSES, // Kaia Testnet
  8217: KAIA_MAINNET_ADDRESSES, // Kaia Mainnet
};

export function getContractAddresses(chainId: number): ContractAddresses {
  const addresses = CONTRACT_ADDRESSES[chainId];
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return addresses;
}