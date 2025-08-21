export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    insurance?: string;
    treasury?: string;
    tranchePool?: string;
    oracleRouter?: string;
  };
}

export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  mainnet: {
    chainId: 8217,
    chainIdHex: "0x2019",
    name: "Kaia Mainnet",
    rpcUrl: "https://public-en.node.kaia.io",
    blockExplorer: "https://kaiascope.com",
    nativeCurrency: {
      name: "KLAY",
      symbol: "KLAY",
      decimals: 18,
    },
    contracts: {
      insurance: process.env.NEXT_PUBLIC_MAINNET_INSURANCE_CONTRACT,
      treasury: process.env.NEXT_PUBLIC_MAINNET_TREASURY_CONTRACT,
      tranchePool: process.env.NEXT_PUBLIC_MAINNET_TRANCHE_POOL_CONTRACT,
      oracleRouter: process.env.NEXT_PUBLIC_MAINNET_ORACLE_ROUTER_CONTRACT,
    },
  },
  testnet: {
    chainId: 1001,
    chainIdHex: "0x3e9",
    name: "Kaia Kairos Testnet",
    rpcUrl: "https://public-en-kairos.node.kaia.io",
    blockExplorer: "https://kairos.kaiascope.com",
    nativeCurrency: {
      name: "KLAY",
      symbol: "KLAY",
      decimals: 18,
    },
    contracts: {
      insurance: "0x147f4660515aE91c81FdB43Cf743C6faCACa9903",
      treasury: "0x9C20316Ba669e762Fb43dbb6d3Ff63062b89945D",
      tranchePool: "0x563e95673d4210148eD59eDb6310AC7d488F5Ec0",
      oracleRouter: "0x5d83444EBa6899f1B7abD34eF04dDF7Dd7b38a37",
    },
  },
};

export function getNetworkConfig(): NetworkConfig {
  const networkEnv = process.env.NEXT_PUBLIC_NETWORK_ENV || "mainnet";
  const config = NETWORK_CONFIGS[networkEnv];

  if (!config) {
    console.warn(
      `Invalid network environment: ${networkEnv}. Falling back to mainnet.`,
    );
    return NETWORK_CONFIGS.mainnet;
  }

  // Allow overrides from environment variables
  const overrideChainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  const overrideRpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

  if (overrideChainId) {
    config.chainId = parseInt(overrideChainId, 10);
    config.chainIdHex = `0x${config.chainId.toString(16)}`;
  }

  if (overrideRpcUrl) {
    config.rpcUrl = overrideRpcUrl;
  }

  return config;
}

export function isTestnet(): boolean {
  const networkEnv = process.env.NEXT_PUBLIC_NETWORK_ENV || "mainnet";
  return networkEnv === "testnet";
}

export function getContractAddress(
  contractName: keyof NetworkConfig["contracts"],
): string | undefined {
  const config = getNetworkConfig();
  return config.contracts[contractName];
}

export async function switchNetwork(
  provider: any,
  targetNetwork?: "mainnet" | "testnet",
): Promise<boolean> {
  try {
    const networkEnv = targetNetwork || process.env.NEXT_PUBLIC_NETWORK_ENV || "mainnet";
    const config = NETWORK_CONFIGS[networkEnv];

    if (!config) {
      throw new Error(`Invalid network: ${networkEnv}`);
    }

    try {
      // Try to switch to the network
      await provider.send("wallet_switchEthereumChain", [
        { chainId: config.chainIdHex },
      ]);
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await provider.send("wallet_addEthereumChain", [
            {
              chainId: config.chainIdHex,
              chainName: config.name,
              nativeCurrency: config.nativeCurrency,
              rpcUrls: [config.rpcUrl],
              blockExplorerUrls: [config.blockExplorer],
            },
          ]);
          return true;
        } catch (addError) {
          console.error("Failed to add network:", addError);
          return false;
        }
      }
      console.error("Failed to switch network:", switchError);
      return false;
    }
  } catch (error) {
    console.error("Network switch error:", error);
    return false;
  }
}