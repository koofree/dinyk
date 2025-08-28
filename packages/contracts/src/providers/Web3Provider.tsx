"use client";

import { Web3Provider as KaiaWeb3Provider } from "@kaiachain/ethers-ext/v6";
import { ethers } from "ethers";
import type { ReactNode } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { ACTIVE_NETWORK, KAIA_RPC_ENDPOINTS, ProviderType, STORAGE_KEYS, switchToKaiaNetwork } from "../config/constants";
import { DinUSDT__factory } from "../types/generated";

// Ethereum provider interface
type ProviderEventHandler = (...args: unknown[]) => void;

interface EthereumProvider {
  isMetaMask?: boolean;
  isKaikas?: boolean;
  request: (request: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: ProviderEventHandler) => void;
  removeListener?: (event: string, handler: ProviderEventHandler) => void;
}

// Global window type extensions
declare global {
  interface Window {
    ethereum?: EthereumProvider;
    klaytn?: EthereumProvider;
  }
}

// Context type
export interface Web3ContextType {
  // State
  provider: KaiaWeb3Provider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  balance: string;
  usdtBalance: string;

  // Actions
  connectWallet: (type?: ProviderType) => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;

  // Utilities
  getSigner: () => Promise<ethers.JsonRpcSigner | null>;
  getBalance: () => Promise<string>;
  refreshBalance: () => Promise<void>;
  getUSDTBalance: () => Promise<string>;
  refreshUSDTBalance: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [provider, setProvider] = useState<KaiaWeb3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(ACTIVE_NETWORK.chainId);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [usdtBalance, setUsdtBalance] = useState<string>("0");

  // Debug logging
  if (typeof window !== "undefined" && process.env.DEBUG) {
    console.log(
      "[Web3Provider] Component rendered, provider:",
      !!provider,
      "account:",
      account,
    );
  }

  // Initialize public provider and session storage
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Always initialize public provider for read-only operations
    const initPublicProvider = async () => {
      try {
        const provider = await createJsonRpcProviderWithFallback();
        setProvider(provider as unknown as KaiaWeb3Provider);
      } catch (err) {
        console.error("Failed to initialize public provider:", err);
      }
    };
    void initPublicProvider();

    const storedAccount = sessionStorage.getItem(STORAGE_KEYS.ACCOUNT);
    const storedConnected = sessionStorage.getItem(STORAGE_KEYS.CONNECTED);
    const storedProviderType = sessionStorage.getItem(
      STORAGE_KEYS.PROVIDER_TYPE,
    );

    if (storedAccount && storedConnected === "true" && window.ethereum) {
      void reconnectWallet(storedProviderType as ProviderType);
    }
  }, []);

  // Listen for account and network changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAccountsChanged: ProviderEventHandler = (...args) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] && accounts[0] !== account) {
        setAccount(accounts[0]);
        sessionStorage.setItem(STORAGE_KEYS.ACCOUNT, accounts[0]);
        void refreshBalance();
        void refreshUSDTBalance();
      }
    };

    const handleChainChanged: ProviderEventHandler = (...args) => {
      const chainId = args[0] as string;
      const newChainId = parseInt(chainId, 16);
      setChainId(newChainId);

      // Update provider if we're on the correct network
      if (newChainId === ACTIVE_NETWORK.chainId && provider && account) {
        const storedProviderType = sessionStorage.getItem(
          STORAGE_KEYS.PROVIDER_TYPE,
        ) as ProviderType;
        const detectedProvider = detectProvider(storedProviderType);
        if (detectedProvider) {
          const newProvider = new KaiaWeb3Provider(detectedProvider);
          setProvider(newProvider);
          void updateBalance(newProvider, account);
          void updateUSDTBalance(newProvider, account);
        }
      } else if (newChainId !== ACTIVE_NETWORK.chainId) {
        setError(new Error(`Please switch to ${ACTIVE_NETWORK.name} network`));
      }
    };

    const handleDisconnect: ProviderEventHandler = () => {
      disconnectWallet();
    };

    // Get the current provider based on what's stored
    const storedProviderType = sessionStorage.getItem(
      STORAGE_KEYS.PROVIDER_TYPE,
    ) as ProviderType;
    let targetProvider: EthereumProvider | undefined;

    if (storedProviderType === ProviderType.KAIA && window.klaytn) {
      targetProvider = window.klaytn;
    } else if (window.ethereum) {
      targetProvider = window.ethereum;
    }

    if (targetProvider?.on) {
      targetProvider.on("accountsChanged", handleAccountsChanged);
      targetProvider.on("chainChanged", handleChainChanged);
      targetProvider.on("disconnect", handleDisconnect);

      return () => {
        if (targetProvider?.removeListener) {
          targetProvider.removeListener(
            "accountsChanged",
            handleAccountsChanged,
          );
          targetProvider.removeListener("chainChanged", handleChainChanged);
          targetProvider.removeListener("disconnect", handleDisconnect);
        }
      };
    }
  }, [account, provider]);

  const detectProvider = (type?: ProviderType): EthereumProvider | null => {
    if (typeof window === "undefined") return null;

    // If specific type is requested
    if (type === ProviderType.KAIA) {
      return window.klaytn || null;
    } else if (type === ProviderType.METAMASK) {
      return window.ethereum || null;
    }

    // Default: check for any available provider
    // Check for Kaia Wallet first (Kaia native wallet)
    if (window.klaytn) return window.klaytn;

    // Check for MetaMask or other ethereum wallets
    if (window.ethereum) return window.ethereum;

    return null;
  };

  const reconnectWallet = async (providerType: ProviderType) => {
    try {
      const detectedProvider = detectProvider(providerType);
      if (!detectedProvider) return;

      const web3Provider = new KaiaWeb3Provider(detectedProvider);
      const accounts = await web3Provider.listAccounts();

      if (accounts.length > 0) {
        const network = await web3Provider.getNetwork();

        setProvider(web3Provider);
        if (accounts[0]?.address) {
          // Create and set the signer - this was missing!
          const newSigner = await web3Provider.getSigner(0);
          setSigner(newSigner);
          console.log("Signer set during reconnect:", !!newSigner);
          
          setAccount(accounts[0].address);
          setChainId(Number(network.chainId));
          setIsConnected(true);
          await updateBalance(web3Provider, accounts[0].address);
          await updateUSDTBalance(web3Provider, accounts[0].address);
        }
      }
    } catch (err) {
      console.error("Failed to reconnect wallet:", err);
      disconnectWallet();
    }
  };

  // Helper function to create a reliable JSON RPC provider
  const createJsonRpcProviderWithFallback =
    async (): Promise<ethers.JsonRpcProvider> => {
      // Try RPC endpoints in order until one works
      for (const rpcUrl of KAIA_RPC_ENDPOINTS) {
        try {
          const jsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl, {
            chainId: ACTIVE_NETWORK.chainId,
            name: ACTIVE_NETWORK.name,
          });

          // Test the connection with a timeout
          const blockNumberPromise = jsonRpcProvider.getBlockNumber();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Connection timeout")), 5000),
          );

          await Promise.race([blockNumberPromise, timeoutPromise]);
          console.log(`Successfully connected to RPC: ${rpcUrl}`);
          return jsonRpcProvider;
        } catch (error) {
          console.warn(`RPC endpoint ${rpcUrl} failed, trying next...`, error);
        }
      }

      throw new Error("All RPC endpoints failed");
    };

  const updateBalance = async (
    _providerInstance: KaiaWeb3Provider,
    accountAddress: string,
  ) => {
    try {
      const reliableProvider = await createJsonRpcProviderWithFallback();
      const balance = await reliableProvider.getBalance(accountAddress);
      setBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      setBalance("0");
    }
  };

  const updateUSDTBalance = async (
    _providerInstance: KaiaWeb3Provider,
    accountAddress: string,
  ) => {
    try {
      const reliableProvider = await createJsonRpcProviderWithFallback();
      const usdtContract = DinUSDT__factory.connect(
        ACTIVE_NETWORK.contracts.DinUSDT,
        reliableProvider,
      );
      const balanceOf = usdtContract.balanceOf as (
        address: string,
      ) => Promise<bigint>;
      const balance = await balanceOf(accountAddress);
      setUsdtBalance(ethers.formatUnits(balance, 6));
    } catch (err) {
      console.error("Failed to fetch USDT balance:", err);
      setUsdtBalance("0");
    }
  };

  const connectWallet = async (type: ProviderType = ProviderType.METAMASK) => {
    setIsConnecting(true);
    setError(null);

    try {
      const detectedProvider = detectProvider(type);

      if (!detectedProvider) {
        const walletName =
          type === ProviderType.KAIA ? "Kaia Wallet" : "MetaMask";
        throw new Error(
          `${walletName} not detected. Please install ${walletName}.`,
        );
      }

      // First check and switch network if needed BEFORE creating provider
      const currentChainIdHex = (await detectedProvider.request({
        method: "eth_chainId",
      })) as string;
      const currentChainId = parseInt(currentChainIdHex, 16);

      if (currentChainId !== ACTIVE_NETWORK.chainId) {
        await switchToKaiaNetwork();
        // Wait for network switch to complete
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Now create provider after ensuring we're on the right network
      const web3Provider = new KaiaWeb3Provider(detectedProvider);

      // Request accounts
      const accounts = await web3Provider.send("eth_requestAccounts", []);

      if (accounts.length === 0) {
        throw new Error("No accounts found. Please unlock your wallet.");
      }

      // Verify network one more time
      const network = await web3Provider.getNetwork();
      const finalChainId = Number(network.chainId);

      if (finalChainId !== ACTIVE_NETWORK.chainId) {
        throw new Error(
          `Please switch to ${ACTIVE_NETWORK.name} network (Chain ID: ${ACTIVE_NETWORK.chainId})`,
        );
      }

      // Set state
      setChainId(finalChainId);
      setProvider(web3Provider);
      const newSigner = await web3Provider.getSigner(0);
      setSigner(newSigner);
      setAccount(accounts[0]);
      setIsConnected(true);
      await updateBalance(web3Provider, accounts[0]);
      await updateUSDTBalance(web3Provider, accounts[0]);

      // Persist to session
      sessionStorage.setItem(STORAGE_KEYS.ACCOUNT, accounts[0]);
      sessionStorage.setItem(STORAGE_KEYS.CONNECTED, "true");
      sessionStorage.setItem(STORAGE_KEYS.PROVIDER_TYPE, type);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to connect wallet");
      setError(error);
      console.error("Failed to connect wallet:", err);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setError(null);
    setBalance("0");
    setUsdtBalance("0");

    // Clear session storage
    Object.values(STORAGE_KEYS).forEach((key) => {
      sessionStorage.removeItem(key);
    });
  };

  const switchNetwork = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("No wallet detected");
    }
    await switchToKaiaNetwork();
  };

  const getSigner = async (): Promise<ethers.JsonRpcSigner | null> => {
    if (!provider || typeof account !== "string") return null;
    return provider.getSigner(0);
  };

  const getBalance = async (): Promise<string> => {
    if (typeof account !== "string" || !provider) return "0";
    // Always use reliable RPC endpoints for balance queries
    try {
      const balance = await provider.getBalance(account);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error("Failed to get balance from reliable RPC endpoints:", err);
      return "0";
    }
  };

  const refreshBalance = useCallback(async () => {
    if (provider && account) {
      await updateBalance(provider, account);
    }
  }, [provider, account]);

  const refreshUSDTBalance = useCallback(async () => {
    if (provider && account) {
      await updateUSDTBalance(provider, account);
    }
  }, [provider, account]);

  const getUSDTBalance = async (): Promise<string> => {
    if (typeof account !== "string") return "0";
    try {
      const usdtContract = DinUSDT__factory.connect(
        ACTIVE_NETWORK.contracts.DinUSDT,
        provider,
      );
      const balance = await usdtContract.balanceOf(account);
      setUsdtBalance(ethers.formatUnits(balance, 6));
      return ethers.formatUnits(balance, 6);
    } catch (err) {
      console.error("Failed to get USDT balance:", err);
      return "0";
    }
  };

  const value: Web3ContextType = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    isConnecting,
    error,
    balance,
    usdtBalance,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getSigner,
    getBalance,
    refreshBalance,
    getUSDTBalance,
    refreshUSDTBalance,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};
