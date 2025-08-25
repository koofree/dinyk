"use client";

import React, { ReactNode } from "react";
import { Web3Provider, useWeb3 } from "@dinsure/contracts";
import { ContractProvider } from "@dinsure/contracts";

// Inner component that has access to Web3Context
function ContractProviderWrapper({ children }: { children: ReactNode }) {
  const { provider, chainId } = useWeb3();
  
  return (
    <ContractProvider provider={provider} chainId={chainId || undefined}>
      {children}
    </ContractProvider>
  );
}

// Main component that combines both providers
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <Web3Provider>
      <ContractProviderWrapper>
        {children}
      </ContractProviderWrapper>
    </Web3Provider>
  );
}