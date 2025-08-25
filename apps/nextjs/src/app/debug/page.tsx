"use client";

import { useEffect } from "react";
import { useWeb3, useContracts, CONTRACT_ADDRESSES } from "@dinsure/contracts";

export default function DebugPage() {
  const web3Context = useWeb3();
  const contractsContext = useContracts();

  useEffect(() => {
    console.log("=== DEBUG PAGE ===");
    console.log("Web3 Context:", {
      provider: !!web3Context?.provider,
      signer: !!web3Context?.signer,
      account: web3Context?.account,
      chainId: web3Context?.chainId,
      isConnected: web3Context?.isConnected,
    });
    console.log("Contracts Context:", {
      isInitialized: contractsContext?.isInitialized,
      error: contractsContext?.error?.message,
      productCatalog: !!contractsContext?.productCatalog,
      tranchePoolFactory: !!contractsContext?.tranchePoolFactory,
    });
    console.log("Contract Addresses:", CONTRACT_ADDRESSES);
  }, [web3Context, contractsContext]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-3xl font-bold font-display text-gray-900">Debug Information</h1>
        
        <div className="space-y-6">
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
            <h2 className="mb-4 text-xl font-semibold text-[#00B1B8]">Web3 Context</h2>
            <pre className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 overflow-auto">
              {JSON.stringify(
                {
                  provider: !!web3Context?.provider,
                  signer: !!web3Context?.signer,
                  account: web3Context?.account,
                  chainId: web3Context?.chainId,
                  isConnected: web3Context?.isConnected,
                  balance: web3Context?.balance,
                  usdtBalance: web3Context?.usdtBalance,
                },
                null,
                2
              )}
            </pre>
          </div>

          <div className="rounded-lg bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold text-red-400">Contracts Context</h2>
            <pre className="text-sm text-gray-300">
              {JSON.stringify(
                {
                  isInitialized: contractsContext?.isInitialized,
                  error: contractsContext?.error?.message,
                  errorStack: contractsContext?.error?.stack,
                  productCatalog: !!contractsContext?.productCatalog,
                  tranchePoolFactory: !!contractsContext?.tranchePoolFactory,
                  insuranceToken: !!contractsContext?.insuranceToken,
                  settlementEngine: !!contractsContext?.settlementEngine,
                  oracleRouter: !!contractsContext?.oracleRouter,
                  usdt: !!contractsContext?.usdt,
                  registry: !!contractsContext?.registry,
                  feeTreasury: !!contractsContext?.feeTreasury,
                },
                null,
                2
              )}
            </pre>
          </div>

          <div className="rounded-lg bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-semibold text-green-400">
              Contract Addresses
            </h2>
            <pre className="text-sm text-gray-300">
              {JSON.stringify(CONTRACT_ADDRESSES, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => web3Context?.connectWallet()}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}