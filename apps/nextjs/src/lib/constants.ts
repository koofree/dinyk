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

// Kaia Testnet (Kairos) configuration
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
  contracts: {
    insurance: process.env.NEXT_PUBLIC_TESTNET_INSURANCE_CONTRACT || '0xTestInsuranceContract123456789012345678',
    treasury: process.env.NEXT_PUBLIC_TESTNET_TREASURY_CONTRACT || '0xTestTreasuryContract1234567890123456789',
    tranchePool: process.env.NEXT_PUBLIC_TESTNET_TRANCHE_POOL_CONTRACT || '0xTestTranchePool12345678901234567890123',
  }
} as const;

// Active network configuration based on environment
export const ACTIVE_NETWORK = isTestnet ? KAIA_TESTNET : KAIA_MAINNET;

// Alternative RPC endpoints for failover
export const KAIA_RPC_ENDPOINTS = isTestnet 
  ? [
      'https://public-en-kairos.node.kaia.io',
      'https://rpc.ankr.com/klaytn_testnet',
    ] as const
  : [
      'https://public-en.node.kaia.io',
      'https://archive-en.node.kaia.io',
      'https://rpc.ankr.com/klaytn',
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

// Mock insurance products data
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