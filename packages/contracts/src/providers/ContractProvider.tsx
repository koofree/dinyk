'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface ContractProviderProps {
  children: ReactNode;
  provider?: any;
  chainId?: number;
}

const ContractContext = createContext<any>(undefined);

export function ContractProvider({ children, provider, chainId }: ContractProviderProps) {
  // Simple stub implementation
  const contractState = {
    factory: null,
    isInitializing: false,
    isInitialized: false,
    error: null,
    initialize: async () => {},
    clearError: () => {},
    clearCache: () => {},
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