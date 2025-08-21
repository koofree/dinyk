"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InsuranceSummaryCard } from "@/components/insurance/InsuranceSummaryCard";
import { useWeb3 } from "@/context/Web3Provider";
import { useContracts, useContractFactory, useProducts } from "@dinsure/contracts";
import { KAIA_TESTNET } from "@/lib/constants";
import { getProductName, getUnderlyingAsset } from "@/utils/productHelpers";
import type { Product } from "@dinsure/contracts";

export default function InsurancePage() {
  const { isConnected } = useWeb3();
  const { isInitialized, error: contractError } = useContracts();
  const factory = useContractFactory();
  const { products, tranches, loading: productsLoading, error: productsError } = useProducts(factory);
  const router = useRouter();

  const handleViewTranches = (productId: number) => {
    // Navigate to tranche tab with product filter
    const product = products.find(p => p.productId === productId);
    if (product) {
      // Get product name for URL parameter using helper
      const productName = getProductName(product);
      if (productName && productName !== `Product ${productId}`) {
        const urlName = productName.toLowerCase().replace(/\s+/g, '-');
        router.push(`/tranche?insurance=${urlName}&productId=${productId}`);
      } else {
        router.push(`/tranche?productId=${productId}`);
      }
    } else {
      router.push('/tranche');
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('Insurance Page Debug:', {
      isConnected,
      isInitialized,
      contractError,
      productsLoading,
      productsError,
      productsCount: products.length,
      products,
      tranchesCount: tranches.length
    });
  }, [isConnected, isInitialized, contractError, productsLoading, productsError, products, tranches]);

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Debug Info */}
        <div className="mb-4 p-2 bg-gray-800 rounded text-xs text-gray-400">
          Debug: isInitialized={String(isInitialized)} | 
          productsLoading={String(productsLoading)} | 
          products={products.length} | 
          tranches={tranches.length} |
          error={productsError ? 'Yes' : 'No'}
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Insurance Products</h1>
          <p className="text-gray-400">
            Overview of all available insurance products with aggregated statistics from all tranches
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-green-400">● Connected to {KAIA_TESTNET.name}</span>
            <a 
              href={`${KAIA_TESTNET.blockExplorer}/address/${KAIA_TESTNET.contracts.productCatalog}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              View Contracts ↗
            </a>
          </div>
        </div>

        {/* Contract Error */}
        {contractError && (
          <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="text-red-400 text-xl">⚠️</div>
              <div>
                <h3 className="text-red-400 font-medium">Contract Error</h3>
                <p className="text-red-300 text-sm">
                  {contractError.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {productsLoading && isInitialized && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <div className="text-gray-400">Loading insurance products...</div>
          </div>
        )}

        {/* Products Grid */}
        {!productsLoading && isInitialized && !contractError && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {products.map((product) => (
                <InsuranceSummaryCard
                  key={product.productId}
                  product={product}
                  tranches={tranches.filter(t => t.productId === product.productId)}
                  onViewTranches={() => handleViewTranches(product.productId)}
                />
              ))}
            </div>

            {products.length === 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
                <div className="text-yellow-400 text-4xl mb-4">📋</div>
                <div className="text-gray-300 text-lg font-medium mb-2">No Insurance Products Available</div>
                <p className="text-gray-400 text-sm mb-4">
                  There are currently no active insurance products on the smart contracts.
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Contract: {KAIA_TESTNET.contracts.productCatalog}</p>
                  <p>Network: Kaia Testnet (Chain ID: 1001)</p>
                </div>
                {productsError && (
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-600 rounded text-red-400 text-xs">
                    Error: {productsError?.message || 'Failed to fetch products'}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}