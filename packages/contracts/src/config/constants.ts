// Error codes
export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  RPC_ERROR = "RPC_ERROR",

  // Transaction errors
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  USER_REJECTED = "USER_REJECTED",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  GAS_ESTIMATION_FAILED = "GAS_ESTIMATION_FAILED",

  // Contract errors
  CONTRACT_REVERT = "CONTRACT_REVERT",
  INVALID_PARAMETERS = "INVALID_PARAMETERS",
  UNAUTHORIZED = "UNAUTHORIZED",

  // Business logic errors
  ROUND_NOT_OPEN = "ROUND_NOT_OPEN",
  AMOUNT_TOO_LOW = "AMOUNT_TOO_LOW",
  AMOUNT_TOO_HIGH = "AMOUNT_TOO_HIGH",
  TRANCHE_CAP_EXCEEDED = "TRANCHE_CAP_EXCEEDED",
  INSUFFICIENT_LIQUIDITY = "INSUFFICIENT_LIQUIDITY",

  // Oracle errors
  ORACLE_PRICE_STALE = "ORACLE_PRICE_STALE",
  ORACLE_UNAVAILABLE = "ORACLE_UNAVAILABLE",

  // Validation errors
  INVALID_ADDRESS = "INVALID_ADDRESS",
  INVALID_AMOUNT = "INVALID_AMOUNT",
  INVALID_TRANCHE_ID = "INVALID_TRANCHE_ID",
  INVALID_ROUND_ID = "INVALID_ROUND_ID",
}

// Default gas limits for different operations
export const GAS_LIMITS = {
  APPROVE_TOKEN: 50000,
  BUY_INSURANCE: 250000,
  PROVIDE_LIQUIDITY: 200000,
  WITHDRAW_LIQUIDITY: 180000,
  CLAIM_PAYOUT: 150000,
  ORACLE_UPDATE: 100000,
} as const;

// Get the current network environment
const isTestnet = process.env.NEXT_PUBLIC_NETWORK_ENV === "testnet";

// Kaia Mainnet configuration (Official specifications)
export const KAIA_MAINNET = {
  chainId: 8217,
  chainIdHex: "0x2019",
  name: "Kaia",
  currency: {
    name: "Kaia",
    symbol: "KAIA",
    decimals: 18,
  },
  rpcUrl: "https://public-en.node.kaia.io",
  wsUrl: "wss://public-en.node.kaia.io/ws",
  blockExplorer: "https://kaiascan.io",
  contracts: {
    DinRegistry: "",
    DinToken: "",
    DinUSDT: "",
    FeeTreasury: "",
    InsuranceToken: "",
    OraklPriceFeed: "",
    ProductCatalog: "",
    DinoOracle: "",
    TranchePoolFactory: "",
    YieldRouter: "",
    OracleRouter: "",
    SettlementEngine: "",
    OraklBtcUsdtFeedProxy: "",
    OraklEthUsdtFeedProxy: "",
    OraklKaiaUsdtFeedProxy: "",
    TestFaucet: "",
  },
} as const;

// Kaia Testnet (Kairos) configuration with REAL deployed contracts
export const KAIA_TESTNET = {
  chainId: 1001,
  chainIdHex: "0x3e9",
  name: "Kaia Kairos",
  currency: {
    name: "Kaia",
    symbol: "KAIA",
    decimals: 18,
  },
  rpcUrl: "https://public-en-kairos.node.kaia.io",
  wsUrl: "wss://public-en-kairos.node.kaia.io/ws",
  blockExplorer: "https://kairos.kaiascan.io",
  faucet: "https://faucet.kaia.io",
  contracts: {
    // Contract Addresses (Phase 1 - Basic Contracts - UPDATED with fixed deployment)
    DinRegistry: "0x49C56ef6AE40cDCcbF8a4564A320174ac4D2F215", // DinRegistry contract address
    DinToken: "0xF38F908DB960B46E43114ed473AC53Ce2f195336", // DinToken contract address
    DinUSDT: "0x7F1A3aB736b1D8f47126ABcDDF886dAeFfe30916", // DinUSDT contract address
    FeeTreasury: "0x327479B3b31012751A57a998eb4B31d597dE0AA9", // FeeTreasury contract address
    InsuranceToken: "0x03baae944160DcB6B06F20a466FB68Cd09CE3c82", // InsuranceToken contract address
    OraklPriceFeed: "0xf7b509bfEa5F1e83be7Ea80aa6Eb5bEdF760545F", // OraklPriceFeed contract address
    ProductCatalog: "0x780898725199fe45A766dD6Fb950904d0Ae97583", // ProductCatalog contract address

    // Oracle and Tranche/Settlement System Addresses (Phase 3 - registry-dependent deployment)
    DinoOracle: "0xFBdF3Cc16899acBcbe99a9c09466594388A4FcfB", // DinoOracle contract address
    TranchePoolFactory: "0x44E0453144D37880Dd29Ef236469A49aA01A87A9", // TranchePoolFactory contract address
    YieldRouter: "0xA2bc41830e29AE8752C61e3d7aCF6aE450f030da", // YieldRouter contract address
    OracleRouter: "0x1edD6a98c7D2B6aA0B0fAc520BfC201956202eE3", // OracleRouter contract address
    SettlementEngine: "0x07401954b3108Ad998d5d57Fd86EBd5c23733bB9", // SettlementEngine contract address

    // Orakl Network Feed Addresses (Kairos testnet)
    OraklBtcUsdtFeedProxy: "0x43add670a0e1948c90386d2b972fcaec6ce1be90", // BTC/USD price feed from Orakl Network
    OraklEthUsdtFeedProxy: "0x22be5ff1ef09ebf06995da9050d44d23070c2142", // ETH/USD price feed from Orakl Network
    OraklKaiaUsdtFeedProxy: "0xc2caa26226585f666ec79f8ecdb0aec17893af1d", // KAIA/USD price feed from Orakl Network

    TestFaucet: "0x51aFE5dC26834C7902A18fE60E64b21Eb89A397f",
  },
} as const;

// Active network configuration based on environment
export const ACTIVE_NETWORK = isTestnet ? KAIA_TESTNET : KAIA_MAINNET;

// Alternative RPC endpoints for failover (only verified working endpoints)
export const KAIA_RPC_ENDPOINTS = isTestnet
  ? (["https://public-en-kairos.node.kaia.io"] as const)
  : (["https://public-en.node.kaia.io"] as const);

// Provider types
export enum ProviderType {
  METAMASK = "metamask",
  KAIA = "kaia",
  WALLET_CONNECT = "walletconnect",
}

// Storage keys
export const STORAGE_KEYS = {
  ACCOUNT: "din_wallet_account",
  CONNECTED: "din_wallet_connected",
  PROVIDER_TYPE: "din_provider_type",
} as const;

// Network switch helper
export const switchToKaiaNetwork = async () => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet detected");
  }

  const targetNetwork = ACTIVE_NETWORK;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetNetwork.chainIdHex }],
    });
  } catch (switchError) {
    // Network not added, add it
    const errorWithCode = switchError as { code?: number };
    if (errorWithCode.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: targetNetwork.chainIdHex,
            chainName: targetNetwork.name,
            nativeCurrency: targetNetwork.currency,
            rpcUrls: [targetNetwork.rpcUrl],
            blockExplorerUrls: [targetNetwork.blockExplorer],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
};

// Round states from ProductCatalog contract
export const ROUND_STATES = {
  ANNOUNCED: "ANNOUNCED",
  OPEN: "OPEN",
  ACTIVE: "ACTIVE",
  MATURED: "MATURED",
  SETTLED: "SETTLED",
  CANCELED: "CANCELED",
} as const;

// Trigger types from ProductCatalog contract
export const TRIGGER_TYPES = {
  PRICE_BELOW: 0,
  PRICE_ABOVE: 1,
  RELATIVE: 2,
  BOOLEAN: 3,
  CUSTOM: 4,
} as const;

// Oracle route id to type map
export const ORACLE_ROUTE_ID_TO_TYPE = {
  1: "BTC-USDT",
  2: "ETH-USDT",
  3: "KAIA-USDT",
} as const;
