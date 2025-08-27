// Contract identifiers (from DinRegistry)
export const CONTRACT_IDENTIFIERS = {
  USDT_TOKEN: "USDT_TOKEN",
  DIN_TOKEN: "DIN_TOKEN",
  PRODUCT_CATALOG: "PRODUCT_CATALOG",
  TRANCHE_POOL_FACTORY: "TRANCHE_POOL_FACTORY",
  SETTLEMENT_ENGINE: "SETTLEMENT_ENGINE",
  ORACLE_ROUTER: "ORACLE_ROUTER",
  ORAKL_PRICE_FEED: "ORAKL_PRICE_FEED",
  DINO_ORACLE: "DINO_ORACLE",
  FEE_TREASURY: "FEE_TREASURY",
} as const;

// Parameter identifiers (from DinRegistry)
export const PARAMETER_IDENTIFIERS = {
  MAX_PREMIUM_BPS: "MAX_PREMIUM_BPS",
  MIN_MATURITY_SECONDS: "MIN_MATURITY_SECONDS",
  MAX_MATURITY_SECONDS: "MAX_MATURITY_SECONDS",
  PROTOCOL_FEE_BPS: "PROTOCOL_FEE_BPS",
  DISPUTE_WINDOW_SECONDS: "DISPUTE_WINDOW_SECONDS",
  LIVENESS_WINDOW_SECONDS: "LIVENESS_WINDOW_SECONDS",
  PER_ACCOUNT_MIN_DEFAULT: "PER_ACCOUNT_MIN_DEFAULT",
  PER_ACCOUNT_MAX_DEFAULT: "PER_ACCOUNT_MAX_DEFAULT",
} as const;

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
    DinRegistry: "0x029A3a8737f87AA4bFCba746eDe65811C135aA52", // DinRegistry contract address
    DinToken: "0x9bDD3B401385a6210590CB15313663898c1c6208", // DinToken contract address
    DinUSDT: "0xd154254c4be2AF3C92CdaE0c60d08fB554445536", // DinUSDT contract address
    FeeTreasury: "0x05FFF34642F2736055A48bD356a02c7DcA7E4446", // FeeTreasury contract address
    InsuranceToken: "0x4cd06921A17524514223B4e445b83299B5F1eD1a", // InsuranceToken contract address
    OraklPriceFeed: "0x2FA183Ce51f63fdB905F5787e3570DE336b89DDB", // OraklPriceFeed contract address
    ProductCatalog: "0x1eA1611350EAD1f7C99fd70EB50fBf19D2fFC3Ec", // ProductCatalog contract address

    // Oracle and Tranche/Settlement System Addresses (Phase 3 - TO BE FILLED after registry-dependent deployment)
    DinoOracle: "0x263831761BA898A687B9f109461E91f155c7BF43", // DinoOracle contract address (will be deployed with correct DIN token)
    TranchePoolFactory: "0x3877C72aa6bB608F12D15087bDE8e46f307D0aB0", // TranchePoolFactory contract address
    YieldRouter: "0x2D2d2C0317f7b09aA51d750a03FB8C6C8cfFc7F8", // YieldRouter contract address
    OracleRouter: "0x1EFE5cdf9F7078AfE9480464834A6CEe51E9e3d0", // OracleRouter contract address
    SettlementEngine: "0x0c4EdFEe5f2860eB8d8B29fDdcfa317fFF33B49F", // SettlementEngine contract address

    // Orakl Network Feed Addresses (Kairos testnet - get from Orakl docs)
    OraklBtcUsdtFeedProxy: "0x43add670a0e1948c90386d2b972fcaec6ce1be90", // BTC/USD price feed from Orakl Network
    OraklEthUsdtFeedProxy: "0x22be5ff1ef09ebf06995da9050d44d23070c2142", // ETH/USD price feed from Orakl Network
    OraklKaiaUsdtFeedProxy: "0xc2caa26226585f666ec79f8ecdb0aec17893af1d", // KAIA/USD price feed from Orakl Network

    TestFaucet: "0xc2b80EB3F65042Aedc0140DE20cBD45097cE54eb", // Faucet contract address
  },
} as const;

// Active network configuration based on environment
export const ACTIVE_NETWORK = isTestnet ? KAIA_TESTNET : KAIA_MAINNET;

// Alternative RPC endpoints for failover (only verified working endpoints)
export const KAIA_RPC_ENDPOINTS = isTestnet
  ? (["https://public-en-kairos.node.kaia.io"] as const)
  : ([
      "https://rpc.ankr.com/klaytn",
      "https://public-en.node.kaia.io",
      "https://archive-en.node.kaia.io",
    ] as const);

// Provider types
export enum ProviderType {
  METAMASK = "metamask",
  KAIA = "kaia",
  WALLET_CONNECT = "walletconnect",
}

// Storage keys
export const STORAGE_KEYS = {
  ACCOUNT: "dinyk_wallet_account",
  CONNECTED: "dinyk_wallet_connected",
  PROVIDER_TYPE: "dinyk_provider_type",
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

// Real insurance products from deployed contracts
// Based on ../din-contract/scripts/operation/profile/insurances.json
export const INSURANCE_PRODUCTS = [
  {
    id: 1,
    productId: 1, // On-chain product ID
    asset: "BTC",
    name: "Bitcoin Price Protection",
    description:
      "DIN Bitcoin Price Protection Insurance - Protect against BTC price movements",
    metadata: "DINBTCPriceProtection2025",
    tranches: [
      {
        id: 1, // On-chain tranche ID
        name: "Conservative Downside",
        triggerType: "PRICE_BELOW",
        triggerPrice: 110000, // $110,000
        triggerLevel: -5, // Approximate percentage from current price
        premium: 3, // 3% premium rate
        premiumRateBps: 300, // 300 basis points
        capacity: "50000", // $50K total capacity
        perAccountMin: "100",
        perAccountMax: "5000",
        filled: "0", // Will be updated from contract
        available: "50000",
        expiry: 30, // 30 days maturity
        maturityDays: 30,
        oracleRouteId: 1,
        riskLevel: "LOW" as const,
        roundState: "ANNOUNCED" as const, // Will be updated from contract
      },
      {
        id: 2,
        name: "Moderate Downside",
        triggerType: "PRICE_BELOW",
        triggerPrice: 100000, // $100,000
        triggerLevel: -10,
        premium: 5,
        premiumRateBps: 500,
        capacity: "100000", // $100K total capacity
        perAccountMin: "100",
        perAccountMax: "10000",
        filled: "0",
        available: "100000",
        expiry: 30,
        maturityDays: 30,
        oracleRouteId: 1,
        riskLevel: "MEDIUM" as const,
        roundState: "ANNOUNCED" as const,
      },
      {
        id: 3,
        name: "Aggressive Downside",
        triggerType: "PRICE_BELOW",
        triggerPrice: 90000, // $90,000
        triggerLevel: -15,
        premium: 8,
        premiumRateBps: 800,
        capacity: "200000", // $200K total capacity
        perAccountMin: "100",
        perAccountMax: "20000",
        filled: "0",
        available: "200000",
        expiry: 30,
        maturityDays: 30,
        oracleRouteId: 1,
        riskLevel: "HIGH" as const,
        roundState: "ANNOUNCED" as const,
      },
      {
        id: 4,
        name: "Bull Market Protection",
        triggerType: "PRICE_ABOVE",
        triggerPrice: 130000, // $130,000
        triggerLevel: 20, // Upside protection
        premium: 4,
        premiumRateBps: 400,
        capacity: "75000", // $75K total capacity
        perAccountMin: "100",
        perAccountMax: "8000",
        filled: "0",
        available: "75000",
        expiry: 30,
        maturityDays: 30,
        oracleRouteId: 1,
        riskLevel: "MEDIUM" as const,
        roundState: "ANNOUNCED" as const,
      },
    ],
  },
];

// Round states from ProductCatalog contract
export const ROUND_STATES = {
  ANNOUNCED: "ANNOUNCED",
  OPEN: "OPEN",
  MATCHED: "MATCHED",
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

// Mock insurance products data (DEPRECATED - use INSURANCE_PRODUCTS above)
export const MOCK_INSURANCE_PRODUCTS = [
  {
    id: 1,
    asset: "BTC",
    name: "BTC Price Protection",
    description: "Protect against BTC price drops",
    tranches: [
      {
        id: "btc-5",
        triggerLevel: -5,
        premium: 2,
        capacity: "100000",
        filled: "60000",
        available: "40000",
        expiry: 7,
        riskLevel: "LOW" as const,
      },
      {
        id: "btc-10",
        triggerLevel: -10,
        premium: 5,
        capacity: "50000",
        filled: "40000",
        available: "10000",
        expiry: 7,
        riskLevel: "MEDIUM" as const,
      },
      {
        id: "btc-15",
        triggerLevel: -15,
        premium: 10,
        capacity: "25000",
        filled: "7500",
        available: "17500",
        expiry: 7,
        riskLevel: "HIGH" as const,
      },
    ],
  },
  {
    id: 2,
    asset: "ETH",
    name: "ETH Price Protection",
    description: "Protect against ETH price drops",
    tranches: [
      {
        id: "eth-5",
        triggerLevel: -5,
        premium: 2.5,
        capacity: "80000",
        filled: "50000",
        available: "30000",
        expiry: 14,
        riskLevel: "LOW" as const,
      },
      {
        id: "eth-10",
        triggerLevel: -10,
        premium: 6,
        capacity: "40000",
        filled: "35000",
        available: "5000",
        expiry: 14,
        riskLevel: "MEDIUM" as const,
      },
      {
        id: "eth-15",
        triggerLevel: -15,
        premium: 12,
        capacity: "20000",
        filled: "5000",
        available: "15000",
        expiry: 14,
        riskLevel: "HIGH" as const,
      },
    ],
  },
  {
    id: 3,
    asset: "KAIA",
    name: "KAIA Price Protection",
    description: "Protect against KAIA price drops",
    tranches: [
      {
        id: "kaia-10",
        triggerLevel: -10,
        premium: 4,
        capacity: "30000",
        filled: "15000",
        available: "15000",
        expiry: 30,
        riskLevel: "MEDIUM" as const,
      },
      {
        id: "kaia-20",
        triggerLevel: -20,
        premium: 12,
        capacity: "15000",
        filled: "3000",
        available: "12000",
        expiry: 30,
        riskLevel: "HIGH" as const,
      },
    ],
  },
] as const;

// Mock user positions
export const MOCK_USER_POSITIONS = [
  {
    id: "1234",
    asset: "BTC",
    type: "insurance" as const,
    tranche: "BTC -10%",
    coverage: "1000",
    premiumPaid: "50",
    status: "active" as const,
    expiresIn: 5,
    currentPrice: 44500,
    triggerPrice: 40500,
    baseline: 45000,
  },
  {
    id: "1235",
    asset: "ETH",
    type: "insurance" as const,
    tranche: "ETH -15%",
    coverage: "500",
    premiumPaid: "40",
    status: "claimable" as const,
    payout: "500",
    currentPrice: 2100,
    triggerPrice: 2125,
    baseline: 2500,
  },
] as const;

// Mock LP positions
export const MOCK_LP_POSITIONS = [
  {
    id: "lp-1",
    asset: "BTC",
    type: "liquidity" as const,
    tranche: "BTC -10% Tranche",
    deposited: "5000",
    currentValue: "5087",
    earnedPremium: "250",
    stakingRewards: "87",
    roundStatus: "active" as const,
    daysLeft: 2,
  },
  {
    id: "lp-2",
    asset: "ETH",
    type: "liquidity" as const,
    tranche: "ETH -5% Tranche",
    deposited: "3000",
    currentValue: "3045",
    earnedPremium: "60",
    stakingRewards: "45",
    roundStatus: "settlement" as const,
    daysLeft: 0,
  },
] as const;
