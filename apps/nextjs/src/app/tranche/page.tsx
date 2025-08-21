"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TrancheCard } from "@/components/tranche/TrancheCard";
import { TrancheFilters } from "@/components/tranche/TrancheFilters";
import { PurchaseModal } from "@/components/insurance/PurchaseModal";
import { LiquidityModal } from "@/components/liquidity/LiquidityModal";
import { useWeb3 } from "@/context/Web3Provider";
import { useContracts, useContractFactory, useProducts, useBuyInsurance } from "@dinsure/contracts";
import { KAIA_TESTNET } from "@/lib/constants";
import type { Product, Tranche } from "@dinsure/contracts";
import { ethers } from "ethers";

interface TrancheFilters {
  insuranceProduct: number | null;
  status: 'all' | 'active' | 'open' | 'settling';
}

export default function TranchePage() {
  const { isConnected } = useWeb3();
  const { isInitialized, error: contractError } = useContracts();
  const factory = useContractFactory();
  const { products, tranches, loading: productsLoading, error: productsError } = useProducts(factory);
  const { buyInsurance, loading: purchaseLoading, error: purchaseError } = useBuyInsurance(factory);
  const searchParams = useSearchParams();
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTranche, setSelectedTranche] = useState<Tranche | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isLiquidityModalOpen, setIsLiquidityModalOpen] = useState(false);
  const [filters, setFilters] = useState<TrancheFilters>({
    insuranceProduct: null,
    status: 'all'
  });

  // Initialize filters from URL params
  useEffect(() => {
    const productIdParam = searchParams.get('productId');
    const insuranceParam = searchParams.get('insurance');
    const statusParam = searchParams.get('status');
    
    if (productIdParam) {
      setFilters(prev => ({ 
        ...prev, 
        insuranceProduct: parseInt(productIdParam) 
      }));
    }
    
    if (statusParam) {
      setFilters(prev => ({ 
        ...prev, 
        status: statusParam as 'all' | 'active' | 'open' | 'settling'
      }));
    }
  }, [searchParams]);

  const handleBuyInsurance = (product: Product, tranche: Tranche) => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    setSelectedProduct(product);
    setSelectedTranche(tranche);
    setIsPurchaseModalOpen(true);
  };

  const handleProvideLiquidity = (product: Product, tranche: Tranche) => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    setSelectedProduct(product);
    setSelectedTranche(tranche);
    setIsLiquidityModalOpen(true);
  };

  const handlePurchase = async (amount: string) => {
    if (!selectedTranche || !selectedProduct) return;
    
    try {
      const result = await buyInsurance({
        trancheId: BigInt(selectedTranche.trancheId),
        roundId: BigInt(selectedTranche.currentRound?.roundId || 1),
        amount: ethers.parseUnits(amount, 6), // USDT has 6 decimals
      });
      
      alert(`Successfully purchased ${amount} USDT coverage! Token ID: ${result.tokenId?.toString()}`);
      setIsPurchaseModalOpen(false);
    } catch (error) {
      console.error('Purchase failed:', error);
      alert(`Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLiquidityDeposit = async (amount: string) => {
    // TODO: Implement liquidity deposit logic
    alert(`Liquidity deposit of ${amount} USDT would be processed here`);
    setIsLiquidityModalOpen(false);
  };

  // Filter tranches based on current filters
  const filteredTranches = tranches.filter(tranche => {
    // Filter by insurance product
    if (filters.insuranceProduct && tranche.productId !== filters.insuranceProduct) {
      return false;
    }
    
    // Filter by status - for now, simplified logic
    if (filters.status === 'active') {
      return tranche.currentRound?.state === 'ACTIVE' || tranche.currentRound?.state === 'OPEN';
    }
    
    return true; // Show all for 'all' status
  });

  // Debug logging
  useEffect(() => {
    console.log('Tranche Page Debug:', {
      isConnected,
      isInitialized,
      contractError,
      productsLoading,
      productsError,
      productsCount: products.length,
      tranchesCount: tranches.length,
      filteredTranchesCount: filteredTranches.length,
      filters,
      searchParams: Object.fromEntries(searchParams.entries())
    });
  }, [isConnected, isInitialized, contractError, productsLoading, productsError, products, tranches, filteredTranches, filters, searchParams]);

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Debug Info */}
        <div className="mb-4 p-2 bg-gray-800 rounded text-xs text-gray-400">
          Debug: isInitialized={String(isInitialized)} | 
          productsLoading={String(productsLoading)} | 
          products={products.length} | 
          tranches={tranches.length} |
          filtered={filteredTranches.length} |
          error={productsError ? 'Yes' : 'No'}
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">All Tranches</h1>
          <p className="text-gray-400">
            Detailed view of all insurance tranches with individual pool information and trading options
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

        {/* Filters */}
        <TrancheFilters
          filters={filters}
          products={products}
          onFilterChange={setFilters}
        />

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
            <div className="text-gray-400">Loading tranches...</div>
          </div>
        )}

        {/* Tranches Grid */}
        {!productsLoading && isInitialized && !contractError && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredTranches.map((tranche) => {
                const product = products.find(p => p.productId === tranche.productId);
                return product ? (
                  <TrancheCard
                    key={tranche.trancheId}
                    product={product}
                    tranche={tranche}
                    onBuyInsurance={() => handleBuyInsurance(product, tranche)}
                    onProvideLiquidity={() => handleProvideLiquidity(product, tranche)}
                  />
                ) : null;
              })}
            </div>

            {filteredTranches.length === 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
                <div className="text-yellow-400 text-4xl mb-4">🔍</div>
                <div className="text-gray-300 text-lg font-medium mb-2">No Tranches Found</div>
                <p className="text-gray-400 text-sm mb-4">
                  No tranches match your current filter criteria. Try adjusting the filters above.
                </p>
                <button
                  onClick={() => setFilters({ insuranceProduct: null, status: 'all' })}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </>
        )}

        {/* Purchase Modal */}
        <PurchaseModal
          product={selectedProduct}
          tranche={selectedTranche}
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          onConfirm={handlePurchase}
        />

        {/* Liquidity Modal */}
        <LiquidityModal
          product={selectedProduct}
          tranche={selectedTranche}
          isOpen={isLiquidityModalOpen}
          onClose={() => setIsLiquidityModalOpen(false)}
          onConfirm={handleLiquidityDeposit}
        />
      </div>
    </div>
  );
}