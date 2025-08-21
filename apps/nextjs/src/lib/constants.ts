// Get the current network environment
const isTestnet = process.env.NEXT_PUBLIC_NETWORK_ENV === 'testnet';

// Kaia Mainnet configuration (Official specifications)
export const KAIA_MAINNET = {
  chainId: 8217,
  chainIdHex: '0x2019',
  name: 'Kaia',
  currency: {
    name: 'Kaia',
    symbol: 'KAIA',
    decimals: 18,
  },
  rpcUrl: 'https://public-en.node.kaia.io',
  wsUrl: 'wss://public-en.node.kaia.io/ws',
  blockExplorer: 'https://kaiascan.io',
  contracts: {
    insurance: process.env.NEXT_PUBLIC_MAINNET_INSURANCE_CONTRACT || '0x742d35Cc64C9b16b2E4517b44b6BBAe6C4e3b5C5',
    treasury: process.env.NEXT_PUBLIC_MAINNET_TREASURY_CONTRACT || '0x9f1B8F0A8aA8A8aA8A8aA8A8aA8A8aA8A8aA8A8a',
    tranchePool: process.env.NEXT_PUBLIC_MAINNET_TRANCHE_POOL_CONTRACT || '0x1234567890abcdef1234567890abcdef12345678',
  }
} as const;

// Kaia Testnet (Kairos) configuration with REAL deployed contracts
export const KAIA_TESTNET = {
  chainId: 1001,
  chainIdHex: '0x3e9',
  name: 'Kaia Kairos',
  currency: {
    name: 'Kaia',
    symbol: 'KAIA',
    decimals: 18,
  },
  rpcUrl: 'https://public-en-kairos.node.kaia.io',
  wsUrl: 'wss://public-en-kairos.node.kaia.io/ws',
  blockExplorer: 'https://kairos.kaiascan.io',
  faucet: 'https://faucet.kaia.io',
  contracts: {
    // Core Contracts
    registry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '0x0000760e713fed5b6F866d3Bad87927337DF61c0',
    productCatalog: process.env.NEXT_PUBLIC_PRODUCT_CATALOG_ADDRESS || '0x5c251A3561E47700a9bcbD6ec91e61fB52Eb50d2',
    insuranceToken: process.env.NEXT_PUBLIC_INSURANCE_TOKEN_ADDRESS || '0x147f4660515aE91c81FdB43Cf743C6faCACa9903',
    settlementEngine: process.env.NEXT_PUBLIC_SETTLEMENT_ENGINE_ADDRESS || '0xAE3FA73652499Bf0aB0b79B8C309DD62137f142D',
    feeTreasury: process.env.NEXT_PUBLIC_FEE_TREASURY_ADDRESS || '0x9C20316Ba669e762Fb43dbb6d3Ff63062b89945D',
    
    // Infrastructure
    poolFactory: process.env.NEXT_PUBLIC_POOL_FACTORY_ADDRESS || '0x563e95673d4210148eD59eDb6310AC7d488F5Ec0',
    oracleRouter: process.env.NEXT_PUBLIC_ORACLE_ROUTER_ADDRESS || '0x5d83444EBa6899f1B7abD34eF04dDF7Dd7b38a37',
    oraklPriceFeed: process.env.NEXT_PUBLIC_ORAKL_PRICE_FEED_ADDRESS || '0x1320682DCe0b0A52A09937d19b404901d32D5f68',
    dinoOracle: process.env.NEXT_PUBLIC_DINO_ORACLE_ADDRESS || '0x2480108C0dA6F7563a887D7d9d969630529340dD',
    
    // Tokens
    usdtToken: process.env.NEXT_PUBLIC_USDT_ADDRESS || '0x53232164780a589dfAe08fB16D1962bD78591Aa0',
    dinToken: process.env.NEXT_PUBLIC_DIN_TOKEN_ADDRESS || '0x01200e08D6C522C288bE660eb7E8c82d5f095a42',
  }
} as const;

// Active network configuration based on environment
export const ACTIVE_NETWORK = isTestnet ? KAIA_TESTNET : KAIA_MAINNET;

// Alternative RPC endpoints for failover (only verified working endpoints)
export const KAIA_RPC_ENDPOINTS = isTestnet 
  ? [
      'https://rpc.ankr.com/klaytn_testnet',
      'https://public-en-kairos.node.kaia.io',
    ] as const
  : [
      'https://rpc.ankr.com/klaytn',
      'https://public-en.node.kaia.io',
      'https://archive-en.node.kaia.io', 
    ] as const;

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
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetNetwork.chainIdHex }],
    });
  } catch (switchError: any) {
    // Network not added, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: targetNetwork.chainIdHex,
          chainName: targetNetwork.name,
          nativeCurrency: targetNetwork.currency,
          rpcUrls: [targetNetwork.rpcUrl],
          blockExplorerUrls: [targetNetwork.blockExplorer],
        }],
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
    asset: 'BTC',
    name: 'Bitcoin Price Protection',
    description: 'DIN Bitcoin Price Protection Insurance - Protect against BTC price movements',
    metadata: 'DINBTCPriceProtection2025',
    tranches: [
      {
        id: 1, // On-chain tranche ID
        name: 'Conservative Downside',
        triggerType: 'PRICE_BELOW',
        triggerPrice: 110000, // $110,000
        triggerLevel: -5, // Approximate percentage from current price
        premium: 3, // 3% premium rate
        premiumRateBps: 300, // 300 basis points
        capacity: '50000', // $50K total capacity
        perAccountMin: '100',
        perAccountMax: '5000',
        filled: '0', // Will be updated from contract
        available: '50000',
        expiry: 30, // 30 days maturity
        maturityDays: 30,
        oracleRouteId: 1,
        riskLevel: 'LOW' as const,
        roundState: 'ANNOUNCED' as const, // Will be updated from contract
      },
      {
        id: 2,
        name: 'Moderate Downside', 
        triggerType: 'PRICE_BELOW',
        triggerPrice: 100000, // $100,000
        triggerLevel: -10,
        premium: 5,
        premiumRateBps: 500,
        capacity: '100000', // $100K total capacity
        perAccountMin: '100',
        perAccountMax: '10000',
        filled: '0',
        available: '100000',
        expiry: 30,
        maturityDays: 30,
        oracleRouteId: 1,
        riskLevel: 'MEDIUM' as const,
        roundState: 'ANNOUNCED' as const,
      },
      {
        id: 3,
        name: 'Aggressive Downside',
        triggerType: 'PRICE_BELOW',
        triggerPrice: 90000, // $90,000
        triggerLevel: -15,
        premium: 8,
        premiumRateBps: 800,
        capacity: '200000', // $200K total capacity
        perAccountMin: '100',
        perAccountMax: '20000',
        filled: '0',
        available: '200000',
        expiry: 30,
        maturityDays: 30,
        oracleRouteId: 1,
        riskLevel: 'HIGH' as const,
        roundState: 'ANNOUNCED' as const,
      },
      {
        id: 4,
        name: 'Bull Market Protection',
        triggerType: 'PRICE_ABOVE',
        triggerPrice: 130000, // $130,000
        triggerLevel: 20, // Upside protection
        premium: 4,
        premiumRateBps: 400,
        capacity: '75000', // $75K total capacity
        perAccountMin: '100',
        perAccountMax: '8000',
        filled: '0',
        available: '75000',
        expiry: 30,
        maturityDays: 30,
        oracleRouteId: 1,
        riskLevel: 'MEDIUM' as const,
        roundState: 'ANNOUNCED' as const,
      }
    ]
  }
];

// Round states from ProductCatalog contract
export const ROUND_STATES = {
  ANNOUNCED: 'ANNOUNCED',
  OPEN: 'OPEN',
  MATCHED: 'MATCHED',
  ACTIVE: 'ACTIVE',
  MATURED: 'MATURED',
  SETTLED: 'SETTLED',
  CANCELED: 'CANCELED'
} as const;

// Trigger types from ProductCatalog contract
export const TRIGGER_TYPES = {
  PRICE_BELOW: 0,
  PRICE_ABOVE: 1,
  RELATIVE: 2,
  BOOLEAN: 3,
  CUSTOM: 4
} as const;

// Mock insurance products data (DEPRECATED - use INSURANCE_PRODUCTS above)
export const MOCK_INSURANCE_PRODUCTS = [
  {
    id: 1,
    asset: 'BTC',
    name: 'BTC Price Protection',
    description: 'Protect against BTC price drops',
    tranches: [
      {
        id: 'btc-5',
        triggerLevel: -5,
        premium: 2,
        capacity: '100000',
        filled: '60000',
        available: '40000',
        expiry: 7,
        riskLevel: 'LOW' as const,
      },
      {
        id: 'btc-10', 
        triggerLevel: -10,
        premium: 5,
        capacity: '50000',
        filled: '40000',
        available: '10000',
        expiry: 7,
        riskLevel: 'MEDIUM' as const,
      },
      {
        id: 'btc-15',
        triggerLevel: -15,
        premium: 10,
        capacity: '25000',
        filled: '7500',
        available: '17500',
        expiry: 7,
        riskLevel: 'HIGH' as const,
      }
    ]
  },
  {
    id: 2,
    asset: 'ETH',
    name: 'ETH Price Protection',
    description: 'Protect against ETH price drops',
    tranches: [
      {
        id: 'eth-5',
        triggerLevel: -5,
        premium: 2.5,
        capacity: '80000',
        filled: '50000',
        available: '30000',
        expiry: 14,
        riskLevel: 'LOW' as const,
      },
      {
        id: 'eth-10',
        triggerLevel: -10,
        premium: 6,
        capacity: '40000',
        filled: '35000',
        available: '5000',
        expiry: 14,
        riskLevel: 'MEDIUM' as const,
      },
      {
        id: 'eth-15',
        triggerLevel: -15,
        premium: 12,
        capacity: '20000',
        filled: '5000',
        available: '15000',
        expiry: 14,
        riskLevel: 'HIGH' as const,
      }
    ]
  },
  {
    id: 3,
    asset: 'KAIA',
    name: 'KAIA Price Protection',
    description: 'Protect against KAIA price drops',
    tranches: [
      {
        id: 'kaia-10',
        triggerLevel: -10,
        premium: 4,
        capacity: '30000',
        filled: '15000',
        available: '15000',
        expiry: 30,
        riskLevel: 'MEDIUM' as const,
      },
      {
        id: 'kaia-20',
        triggerLevel: -20,
        premium: 12,
        capacity: '15000',
        filled: '3000',
        available: '12000',
        expiry: 30,
        riskLevel: 'HIGH' as const,
      }
    ]
  }
] as const;

// Mock user positions
export const MOCK_USER_POSITIONS = [
  {
    id: '1234',
    asset: 'BTC',
    type: 'insurance' as const,
    tranche: 'BTC -10%',
    coverage: '1000',
    premiumPaid: '50',
    status: 'active' as const,
    expiresIn: 5,
    currentPrice: 44500,
    triggerPrice: 40500,
    baseline: 45000,
  },
  {
    id: '1235',
    asset: 'ETH', 
    type: 'insurance' as const,
    tranche: 'ETH -15%',
    coverage: '500',
    premiumPaid: '40',
    status: 'claimable' as const,
    payout: '500',
    currentPrice: 2100,
    triggerPrice: 2125,
    baseline: 2500,
  }
] as const;

// Mock LP positions
export const MOCK_LP_POSITIONS = [
  {
    id: 'lp-1',
    asset: 'BTC',
    type: 'liquidity' as const,
    tranche: 'BTC -10% Tranche',
    deposited: '5000',
    currentValue: '5087',
    earnedPremium: '250',
    stakingRewards: '87',
    roundStatus: 'active' as const,
    daysLeft: 2,
  },
  {
    id: 'lp-2',
    asset: 'ETH',
    type: 'liquidity' as const,
    tranche: 'ETH -5% Tranche', 
    deposited: '3000',
    currentValue: '3045',
    earnedPremium: '60',
    stakingRewards: '45',
    roundStatus: 'settlement' as const,
    daysLeft: 0,
  }
] as const;

// Risk levels
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export const RISK_COLORS = {
  LOW: 'text-green-500',
  MEDIUM: 'text-yellow-500', 
  HIGH: 'text-red-500',
} as const;