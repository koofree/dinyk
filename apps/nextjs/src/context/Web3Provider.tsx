"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { Web3Provider as KaiaWeb3Provider } from "@kaiachain/ethers-ext/v6";
import { ethers } from "ethers";
import { KAIA_MAINNET, switchToKaiaNetwork, STORAGE_KEYS, ProviderType } from "@/lib/constants";

// Context type
interface Web3ContextType {
  // State
  provider: KaiaWeb3Provider | undefined;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  balance: string;
  
  // Actions
  connectWallet: (type?: ProviderType) => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
  
  // Utilities
  getSigner: () => Promise<ethers.JsonRpcSigner | null>;
  getBalance: () => Promise<string>;
  refreshBalance: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<KaiaWeb3Provider>();
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [balance, setBalance] = useState<string>("0");

  // Initialize from session storage
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const storedAccount = sessionStorage.getItem(STORAGE_KEYS.ACCOUNT);
    const storedConnected = sessionStorage.getItem(STORAGE_KEYS.CONNECTED);
    const storedProviderType = sessionStorage.getItem(STORAGE_KEYS.PROVIDER_TYPE);
    
    if (storedAccount && storedConnected === "true" && window.ethereum) {
      reconnectWallet(storedProviderType as ProviderType);
    }
  }, []);

  // Listen for account and network changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        sessionStorage.setItem(STORAGE_KEYS.ACCOUNT, accounts[0]);
        refreshBalance();
      }
    };

    const handleChainChanged = (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      setChainId(newChainId);
      
      // Update provider if we're on the correct network
      if (newChainId === KAIA_MAINNET.chainId && provider && account) {
        const storedProviderType = sessionStorage.getItem(STORAGE_KEYS.PROVIDER_TYPE) as ProviderType;
        const detectedProvider = detectProvider(storedProviderType);
        if (detectedProvider) {
          const newProvider = new KaiaWeb3Provider(detectedProvider);
          setProvider(newProvider);
          updateBalance(newProvider, account);
        }
      } else if (newChainId !== KAIA_MAINNET.chainId) {
        setError(new Error(`Please switch to ${KAIA_MAINNET.name} network`));
      }
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    // Get the current provider based on what's stored
    const storedProviderType = sessionStorage.getItem(STORAGE_KEYS.PROVIDER_TYPE) as ProviderType;
    let targetProvider: any;
    
    if (storedProviderType === ProviderType.KAIA && window.klaytn) {
      targetProvider = window.klaytn;
    } else if (window.ethereum) {
      targetProvider = window.ethereum;
    }

    if (targetProvider) {
      targetProvider.on("accountsChanged", handleAccountsChanged);
      targetProvider.on("chainChanged", handleChainChanged);
      targetProvider.on("disconnect", handleDisconnect);

      return () => {
        if (targetProvider?.removeListener) {
          targetProvider.removeListener("accountsChanged", handleAccountsChanged);
          targetProvider.removeListener("chainChanged", handleChainChanged);
          targetProvider.removeListener("disconnect", handleDisconnect);
        }
      };
    }
  }, [account, provider]);

  const detectProvider = (type?: ProviderType): any => {
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
        setAccount(accounts[0].address);
        setChainId(Number(network.chainId));
        setIsConnected(true);
        await updateBalance(web3Provider, accounts[0].address);
      }
    } catch (err) {
      console.error("Failed to reconnect wallet:", err);
      disconnectWallet();
    }
  };

  const updateBalance = async (provider: KaiaWeb3Provider, account: string) => {
    try {
      const balance = await provider.getBalance(account);
      setBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      setBalance("0");
    }
  };

  const connectWallet = async (type: ProviderType = ProviderType.METAMASK) => {
    setIsConnecting(true);
    setError(null);

    try {
      const detectedProvider = detectProvider(type);
      
      if (!detectedProvider) {
        const walletName = type === ProviderType.KAIA ? "Kaia Wallet" : "MetaMask";
        throw new Error(`${walletName} not detected. Please install ${walletName}.`);
      }

      // First check and switch network if needed BEFORE creating provider
      const currentChainIdHex = await detectedProvider.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(currentChainIdHex, 16);
      
      if (currentChainId !== KAIA_MAINNET.chainId) {
        await switchToKaiaNetwork();
        // Wait for network switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
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
      
      if (finalChainId !== KAIA_MAINNET.chainId) {
        throw new Error(`Please switch to ${KAIA_MAINNET.name} network (Chain ID: ${KAIA_MAINNET.chainId})`);
      }

      // Set state
      setChainId(finalChainId);
      setProvider(web3Provider);
      setAccount(accounts[0]);
      setIsConnected(true);
      await updateBalance(web3Provider, accounts[0]);

      // Persist to session
      sessionStorage.setItem(STORAGE_KEYS.ACCOUNT, accounts[0]);
      sessionStorage.setItem(STORAGE_KEYS.CONNECTED, "true");
      sessionStorage.setItem(STORAGE_KEYS.PROVIDER_TYPE, type);

    } catch (err: any) {
      setError(err);
      console.error("Failed to connect wallet:", err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(undefined);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setError(null);
    setBalance("0");

    // Clear session storage
    Object.values(STORAGE_KEYS).forEach(key => {
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
    if (!provider || !account) return null;
    return provider.getSigner(0);
  };

  const getBalance = async (): Promise<string> => {
    if (!provider || !account) return "0";
    const balance = await provider.getBalance(account);
    return ethers.formatEther(balance);
  };

  const refreshBalance = useCallback(async () => {
    if (provider && account) {
      await updateBalance(provider, account);
    }
  }, [provider, account]);

  const value: Web3ContextType = {
    provider,
    account,
    chainId,
    isConnected,
    isConnecting,
    error,
    balance,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getSigner,
    getBalance,
    refreshBalance,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};