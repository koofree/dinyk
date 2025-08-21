'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { ethers } from 'ethers';

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

  const initialize = async () => {
    if (isInitialized || isInitializing) return;
    
    setIsInitializing(true);
    setError(null);
    
    try {
      // Create default provider for Kaia Testnet if none provided
      const defaultProvider = new ethers.JsonRpcProvider('https://public-en-kairos.node.kaia.io', {
        chainId: 1001,
        name: 'Kaia Kairos'
      });
      
      const contractFactory: ContractFactory = {
        provider: provider || defaultProvider,
        chainId: chainId || 1001
      };
      
      setFactory(contractFactory);
      setIsInitialized(true);
      console.log('ContractProvider initialized with factory:', contractFactory);
    } catch (err) {
      console.error('Failed to initialize ContractProvider:', err);
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

  // Auto-initialize on mount
  useEffect(() => {
    initialize();
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

export function useContracts() {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContracts must be used within a ContractProvider');
  }
  return context;
}

export function useContractFactory() {
  const { factory, isInitialized } = useContracts();
  return isInitialized ? factory : null;
}