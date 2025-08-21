export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  wsUrl?: string;
  blockExplorer: string;
  isTestnet: boolean;
}

export const KAIA_TESTNET: NetworkConfig = {
  chainId: 1001,
  chainIdHex: '0x3E9',
  name: 'Kaia Testnet',
  currency: {
    name: 'Test KLAY',
    symbol: 'KLAY',
    decimals: 18,
  },
  rpcUrl: 'https://public-en-kairos.node.kaia.io',
  wsUrl: 'wss://public-en-kairos.node.kaia.io/ws',
  blockExplorer: 'https://kairos.kaiascope.com',
  isTestnet: true,
};

export const KAIA_MAINNET: NetworkConfig = {
  chainId: 8217,
  chainIdHex: '0x2019',
  name: 'Kaia Mainnet',
  currency: {
    name: 'KLAY',
    symbol: 'KLAY',
    decimals: 18,
  },
  rpcUrl: 'https://public-en-cypress.klaytn.net',
  wsUrl: 'wss://public-en-cypress.klaytn.net/ws',
  blockExplorer: 'https://kaiascope.com',
  isTestnet: false,
};

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  [KAIA_TESTNET.chainId]: KAIA_TESTNET,
  [KAIA_MAINNET.chainId]: KAIA_MAINNET,
};

export function getNetworkConfig(chainId: number): NetworkConfig {
  const network = SUPPORTED_NETWORKS[chainId];
  if (!network) {
    throw new Error(`Unsupported network with chain ID: ${chainId}`);
  }
  return network;
}

export function isTestnet(chainId: number): boolean {
  const network = getNetworkConfig(chainId);
  return network.isTestnet;
}

export function getDefaultNetwork(): NetworkConfig {
  // Default to testnet for development
  return KAIA_TESTNET;
}