'use client';

import { ethers } from 'ethers';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { ACTIVE_NETWORK, KAIA_RPC_ENDPOINTS } from '../config/constants';

interface ContractProviderProps {
  children: ReactNode;
  provider?: any;
  chainId?: number;
}

interface ContractFactory {
  provider: ethers.Provider;
  chainId: number;
}

interface ContractState {
  factory: ContractFactory | null;
  isInitializing: boolean;
  isInitialized: boolean;
  error: any;
  initialize: () => Promise<void>;
  clearError: () => void;
  clearCache: () => void;
}

const ContractContext = createContext<ContractState | undefined>(undefined);

export function ContractProvider({ children, provider, chainId }: ContractProviderProps) {
  const [factory, setFactory] = useState<ContractFactory | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<any>(null);

  const createProviderWithFallback = async (): Promise<ethers.JsonRpcProvider> => {
    // Try each RPC endpoint in order until one works
    for (const rpcUrl of KAIA_RPC_ENDPOINTS) {
      try {
        const jsonRpcProvider = new ethers.JsonRpcProvider(rpcUrl, {
          chainId: ACTIVE_NETWORK.chainId,
          name: ACTIVE_NETWORK.name,
        });

        // Test the connection with a timeout
        const blockNumberPromise = jsonRpcProvider.getBlockNumber();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 5000),
        );

        await Promise.race([blockNumberPromise, timeoutPromise]);
        console.log(`[ContractProvider] Successfully connected to RPC: ${rpcUrl}`);
        return jsonRpcProvider;
      } catch (error) {
        console.warn(`[ContractProvider] RPC endpoint ${rpcUrl} failed, trying next...`);
      }
    }

    throw new Error('[ContractProvider] All RPC endpoints failed');
  };

  const initialize = async () => {
    if (isInitialized || isInitializing) return;
    
    setIsInitializing(true);
    setError(null);
    
    try {
      // Create default provider with fallback mechanism if none provided
      const defaultProvider = await createProviderWithFallback();
      
      const contractFactory: ContractFactory = {
        provider: provider || defaultProvider,
        chainId: chainId || ACTIVE_NETWORK.chainId
      };
      
      setFactory(contractFactory);
      setIsInitialized(true);
      console.log('[ContractProvider] Initialized with factory:', contractFactory);
    } catch (err) {
      console.error('[ContractProvider] Failed to initialize:', err);
      setError(err);
    } finally {
      setIsInitializing(false);
    }
  };

  const clearError = () => setError(null);
  const clearCache = () => {
    // Reset state if needed
    setFactory(null);
    setIsInitialized(false);
  };

  // Auto-initialize on mount with retry logic
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 2000;

    const tryInitialize = async () => {
      if (!mounted) return;
      
      try {
        await initialize();
      } catch (error) {
        if (mounted && retryCount < maxRetries) {
          retryCount++;
          console.log(`[ContractProvider] Retrying initialization (${retryCount}/${maxRetries})...`);
          setTimeout(tryInitialize, retryDelay);
        }
      }
    };

    tryInitialize();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  const contractState: ContractState = {
    factory,
    isInitializing,
    isInitialized,
    error,
    initialize,
    clearError,
    clearCache,
  };

  return (
    <ContractContext.Provider value={contractState}>
      {children}
    </ContractContext.Provider>
  );
}

export const useContracts = (): ContractState => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContracts must be used within a ContractProvider');
  }
  return context;
};

export const useContractFactory = (): ContractFactory | null => {
  const { factory, isInitialized } = useContracts();
  return isInitialized ? factory : null;
};