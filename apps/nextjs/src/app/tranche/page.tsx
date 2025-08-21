"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TrancheCard } from "@/components/tranche/TrancheCard";
import { EnhancedTrancheCard } from "@/components/tranche/EnhancedTrancheCard";
import { TrancheFilters } from "@/components/tranche/TrancheFilters";
import { EnhancedPurchaseModal } from "@/components/insurance/EnhancedPurchaseModal";
import { LiquidityModal } from "@/components/liquidity/LiquidityModal";
import { useWeb3 } from "@/context/Web3Provider";
import { useContracts, useContractFactory, useProducts } from "@dinsure/contracts";
import { useTrancheData, type TrancheDetails } from "@/hooks/useTrancheData";
import { useBTCPrice } from "@/hooks/useBTCPrice";
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
  
  // Get real contract data
  const { price: btcPrice, loading: priceLoading, error: priceError } = useBTCPrice({ factory });
  const { tranches: trancheData, loading: trancheLoading, error: trancheError } = useTrancheData({ 
    factory, 
    currentBTCPrice: btcPrice || undefined 
  });
  
  const searchParams = useSearchParams();
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTranche, setSelectedTranche] = useState<{trancheData: TrancheDetails, roundId: number} | null>(null);
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

  const handleBuyInsurance = (roundId: number) => {
    console.log('Buy Insurance clicked for round:', roundId);
    console.log('Is connected:', isConnected);
    console.log('Available tranches:', trancheData);
    
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    // Find the tranche data for this round
    const trancheWithRound = trancheData.find(t => t.rounds.some(r => r.roundId === roundId));
    console.log('Found tranche:', trancheWithRound);
    
    if (trancheWithRound) {
      // Find the product for this tranche
      const product = products.find(p => p.productId === 1); // For now, assuming productId 1
      
      // Create a mock product if not found
      const selectedProductData = product || {
        productId: 1,
        name: "Bitcoin Price Protection",
        metadata: {
          name: "Bitcoin Price Protection",
          description: "Parametric insurance for BTC price movements",
          underlyingAsset: "BTC",
          baseToken: "USDT"
        }
      } as Product;
      
      console.log('Setting selected product:', selectedProductData);
      setSelectedProduct(selectedProductData);
      
      // Store the real tranche data and round ID for the modal
      const selectedData = {
        trancheData: trancheWithRound,
        roundId
      };
      console.log('Setting selected tranche:', selectedData);
      setSelectedTranche(selectedData);
      console.log('Opening purchase modal...');
      setIsPurchaseModalOpen(true);
    } else {
      console.error('No tranche found for round:', roundId);
      alert('Error: Could not find tranche data for this round');
    }
  };

  const handleProvideLiquidity = (roundId: number) => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    // Find the tranche data for this round
    const trancheWithRound = trancheData.find(t => t.rounds.some(r => r.roundId === roundId));
    if (trancheWithRound) {
      // Find the product for this tranche
      const product = products.find(p => p.productId === 1); // For now, assuming productId 1
      
      // Create a mock product if not found
      const selectedProductData = product || {
        productId: 1,
        name: "Bitcoin Price Protection",
        metadata: {
          name: "Bitcoin Price Protection",
          description: "Parametric insurance for BTC price movements",
          underlyingAsset: "BTC",
          baseToken: "USDT"
        }
      } as Product;
      
      setSelectedProduct(selectedProductData);
      
      // Store the real tranche data and round ID for the modal
      setSelectedTranche({
        trancheData: trancheWithRound,
        roundId
      });
      setIsLiquidityModalOpen(true);
    }
  };

  const handlePurchase = async (amount: string) => {
    if (!selectedTranche?.trancheData || !selectedTranche?.roundId) return;
    
    try {
      const result = await buyInsurance({
        trancheId: BigInt(selectedTranche.trancheData.trancheId),
        roundId: BigInt(selectedTranche.roundId),
        amount: ethers.parseUnits(amount, 6), // USDT has 6 decimals
      });
      
      alert(`Successfully purchased ${amount} USDT coverage! Token ID: ${result.tokenId?.toString()}`);
      setIsPurchaseModalOpen(false);
      
      // Refresh tranche data after purchase
      // The useTrancheData hook will automatically refetch
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

  // Filter real tranche data based on current filters
  const filteredTrancheData = trancheData.filter(tranche => {
    // Skip tranches with no rounds - they shouldn't appear
    if (!tranche.rounds || tranche.rounds.length === 0) {
      return false;
    }
    
    // Filter by insurance product - for now we don't have productId in trancheData
    // This would need to be enhanced when we have product-to-tranche mapping
    if (filters.insuranceProduct) {
      // Skip filtering by product for now since we don't have the mapping
    }
    
    // Filter by status
    if (filters.status === 'active') {
      // "Active" includes both OPEN (can buy/sell) and ACTIVE (insurance running)
      return tranche.rounds.some(r => r.stateName === 'OPEN' || r.stateName === 'ACTIVE');
    } else if (filters.status === 'open') {
      // "Open" also includes both OPEN (can buy/sell) and ACTIVE (insurance running)
      return tranche.rounds.some(r => r.stateName === 'OPEN' || r.stateName === 'ACTIVE');
    } else if (filters.status === 'settling') {
      return tranche.rounds.some(r => r.stateName === 'MATURED');
    }
    
    return true; // Show all for 'all' status (but still must have rounds)
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
      trancheDataCount: trancheData.length,
      filteredTrancheDataCount: filteredTrancheData.length,
      btcPrice,
      filters,
      searchParams: Object.fromEntries(searchParams.entries())
    });
  }, [isConnected, isInitialized, contractError, productsLoading, productsError, products, tranches, trancheData, filteredTrancheData, btcPrice, filters, searchParams]);

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Debug Info */}
        <div className="mb-4 p-2 bg-gray-800 rounded text-xs text-gray-400">
          Debug: isInitialized={String(isInitialized)} | 
          productsLoading={String(productsLoading)} | 
          trancheLoading={String(trancheLoading)} |
          products={products.length} | 
          tranches={tranches.length} |
          trancheData={trancheData.length} |
          filtered={filteredTrancheData.length} |
          btcPrice={btcPrice ? `$${btcPrice.toLocaleString()}` : 'loading'} |
          errors={JSON.stringify({
            products: !!productsError,
            tranche: !!trancheError,
            price: !!priceError,
            contract: !!contractError
          })}
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">All Tranches</h1>
          <p className="text-gray-400">
            Live contract data showing all insurance tranches with real-time round information and oracle prices
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-green-400">● Connected to {KAIA_TESTNET.name}</span>
            {btcPrice && (
              <span className="text-blue-400">💰 BTC: ${btcPrice.toLocaleString()}</span>
            )}
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

        {/* Tranche Data Error */}
        {trancheError && (
          <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="text-red-400 text-xl">⚠️</div>
              <div>
                <h3 className="text-red-400 font-medium">Tranche Data Error</h3>
                <p className="text-red-300 text-sm">
                  {trancheError.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Price Error */}
        {priceError && (
          <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="text-yellow-400 text-xl">⚠️</div>
              <div>
                <h3 className="text-yellow-400 font-medium">Price Feed Error</h3>
                <p className="text-yellow-300 text-sm">
                  {priceError.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Initialization Loading State */}
        {!isInitialized && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <div className="text-gray-400">Initializing contracts...</div>
          </div>
        )}

        {/* Loading State */}
        {(trancheLoading || priceLoading) && isInitialized && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <div className="text-gray-400">Loading contract data...</div>
          </div>
        )}

        {/* Tranches Grid - Using Real Contract Data */}
        {!trancheLoading && isInitialized && !contractError && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredTrancheData.map((trancheData) => (
                <EnhancedTrancheCard
                  key={trancheData.trancheId}
                  trancheData={trancheData}
                  currentBTCPrice={btcPrice || undefined}
                  onBuyInsurance={handleBuyInsurance}
                  onProvideLiquidity={handleProvideLiquidity}
                />
              ))}
            </div>

            {filteredTrancheData.length === 0 && trancheData.length > 0 && (
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

            {trancheData.length === 0 && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
                <div className="text-blue-400 text-4xl mb-4">📊</div>
                <div className="text-gray-300 text-lg font-medium mb-2">No Active Tranches</div>
                <p className="text-gray-400 text-sm mb-4">
                  There are currently no active tranches with rounds on the smart contracts.
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Contract: {KAIA_TESTNET.contracts.productCatalog}</p>
                  <p>Network: Kaia Testnet (Chain ID: 1001)</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Purchase Modal */}
        {console.log('Modal state - isPurchaseModalOpen:', isPurchaseModalOpen, 'selectedTranche:', selectedTranche)}
        <EnhancedPurchaseModal
          trancheData={selectedTranche?.trancheData || null}
          roundId={selectedTranche?.roundId || null}
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          onSuccess={() => {
            console.log('Purchase successful!');
            // Optionally refresh data here
          }}
        />

        {/* Liquidity Modal */}
        <LiquidityModal
          product={selectedProduct}
          tranche={selectedTranche ? {
            trancheId: selectedTranche.trancheData.trancheId,
            productId: 1, // TODO: Get from product mapping
            triggerType: selectedTranche.trancheData.triggerType,
            threshold: selectedTranche.trancheData.threshold,
            maturityTimestamp: selectedTranche.trancheData.maturityTimestamp,
            premiumRateBps: selectedTranche.trancheData.premiumRateBps,
            perAccountMin: 0n,
            perAccountMax: 0n,
            trancheCap: selectedTranche.trancheData.trancheCap,
            oracleRouteId: 1,
            isExpired: false,
            poolAddress: selectedTranche.trancheData.poolAddress,
            rounds: selectedTranche.trancheData.rounds,
            availableCapacity: (() => {
              const round = selectedTranche.trancheData.rounds.find(r => r.roundId === selectedTranche.roundId);
              if (round?.economics) {
                return selectedTranche.trancheData.trancheCap - round.economics.matchedAmount;
              }
              return selectedTranche.trancheData.trancheCap;
            })(),
            utilizationRate: 0,
            currentRound: selectedTranche.trancheData.rounds.find(r => r.roundId === selectedTranche.roundId) ? {
              roundId: selectedTranche.roundId,
              totalSellerCollateral: selectedTranche.trancheData.rounds.find(r => r.roundId === selectedTranche.roundId)?.economics?.totalSellerCollateral || 0n,
              matchedAmount: selectedTranche.trancheData.rounds.find(r => r.roundId === selectedTranche.roundId)?.economics?.matchedAmount || 0n,
              isOpen: selectedTranche.trancheData.rounds.find(r => r.roundId === selectedTranche.roundId)?.stateName === 'OPEN'
            } : undefined
          } as any : null}
          isOpen={isLiquidityModalOpen}
          onClose={() => setIsLiquidityModalOpen(false)}
          onConfirm={handleLiquidityDeposit}
        />
      </div>
    </div>
  );
}