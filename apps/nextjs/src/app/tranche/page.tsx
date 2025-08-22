"use client";

import React, { useState, useEffect, Suspense } from "react";
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

function TrancheContent() {
  const { isConnected } = useWeb3();
  const { isInitialized, error: contractError } = useContracts();
  const factory = useContractFactory();
  const { products, tranches, loading: productsLoading, error: productsError } = useProducts(factory);
  
  // Get real contract data
  const { price: btcPrice, loading: priceLoading, error: priceError } = useBTCPrice({ factory });
  
  const searchParams = useSearchParams();
  const productIdParam = searchParams.get('productId');
  const trancheIdParam = searchParams.get('trancheId');
  
  const [filters, setFilters] = useState<TrancheFilters>({
    insuranceProduct: productIdParam ? parseInt(productIdParam) : null,
    status: 'all'
  });
  
  const [selectedTranche, setSelectedTranche] = useState<TrancheDetails | null>(null);
  const [selectedTrancheContract, setSelectedTrancheContract] = useState<Tranche | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showLiquidityModal, setShowLiquidityModal] = useState(false);
  
  // Get detailed tranche data
  const { tranches: tranchesData, loading: trancheLoading, error: trancheError, refetch } = useTrancheData({
    factory,
    currentBTCPrice: btcPrice || undefined
  });
  
  // Open modals based on URL params
  useEffect(() => {
    if (trancheIdParam && tranchesData && !showPurchaseModal && !showLiquidityModal) {
      const targetTranche = tranchesData.find(t => t.trancheId === parseInt(trancheIdParam));
      if (targetTranche) {
        setSelectedTranche(targetTranche);
        if (targetTranche.rounds.length > 0) {
          const openRound = targetTranche.rounds.find((r: any) => r.state === 1);
          if (openRound) {
            setSelectedRoundId(openRound.roundId);
          }
        }
      }
    }
  }, [trancheIdParam, tranchesData, showPurchaseModal, showLiquidityModal]);
  
  const handleFilterChange = (newFilters: TrancheFilters) => {
    setFilters(newFilters);
  };
  
  const handleBuyInsurance = (tranche: Tranche, product: Product) => {
    // Convert to TrancheDetails format for the modal
    const trancheDetails: TrancheDetails = {
      trancheId: tranche.trancheId,
      triggerType: 0, // PRICE_BELOW
      threshold: tranche.threshold,
      premiumRateBps: tranche.premiumRateBps,
      maturityTimestamp: Math.floor(Date.now() / 1000) + (tranche.maturityDays || 30) * 86400,
      trancheCap: tranche.trancheCap,
      poolAddress: tranche.poolAddress || '',
      rounds: []
    };
    
    setSelectedTranche(trancheDetails);
    setSelectedTrancheContract(tranche);
    setSelectedProduct(product);
    
    // Find the current open round
    if (tranche.currentRound && tranche.currentRound.state === 1) {
      setSelectedRoundId(tranche.currentRound.roundId);
    }
    
    setShowPurchaseModal(true);
  };
  
  const handleProvideLiquidity = (tranche: Tranche, product: Product) => {
    // Convert to TrancheDetails format for the modal
    const trancheDetails: TrancheDetails = {
      trancheId: tranche.trancheId,
      triggerType: 0, // PRICE_BELOW
      threshold: tranche.threshold,
      premiumRateBps: tranche.premiumRateBps,
      maturityTimestamp: Math.floor(Date.now() / 1000) + (tranche.maturityDays || 30) * 86400,
      trancheCap: tranche.trancheCap,
      poolAddress: tranche.poolAddress || '',
      rounds: []
    };
    
    setSelectedTranche(trancheDetails);
    setSelectedTrancheContract(tranche);
    setSelectedProduct(product);
    
    // Find the current open round
    if (tranche.currentRound && tranche.currentRound.state === 1) {
      setSelectedRoundId(tranche.currentRound.roundId);
    }
    
    setShowLiquidityModal(true);
  };
  
  // Filter tranches
  const filteredTranches = tranches.filter(tranche => {
    // Product filter
    if (filters.insuranceProduct !== null && tranche.productId !== filters.insuranceProduct) {
      return false;
    }
    
    // Status filter
    if (filters.status !== 'all') {
      const roundState = tranche.currentRound?.state;
      switch (filters.status) {
        case 'active':
          return roundState === 3; // ACTIVE
        case 'open':
          return roundState === 1; // OPEN
        case 'settling':
          return roundState === 4 || roundState === 5; // MATURED or SETTLED
        default:
          return true;
      }
    }
    
    return true;
  });
  
  // Get unique products for filter options
  const uniqueProducts = Array.from(new Set(products.map(p => p.productId)))
    .map(id => products.find(p => p.productId === id)!)
    .filter(Boolean);
  
  const loading = productsLoading || trancheLoading || priceLoading;
  const error = contractError || productsError || trancheError || priceError;
  
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Initializing contracts...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">Error: {error.message}</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Insurance Tranches</h1>
          <p className="text-gray-400">
            Choose your risk level and earn premiums by providing liquidity
          </p>
          {btcPrice && (
            <div className="mt-4 text-sm text-gray-400">
              BTC Price: ${btcPrice.toLocaleString()}
            </div>
          )}
        </div>
        
        {/* Filters */}
        <TrancheFilters
          products={uniqueProducts}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
        
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-white">Loading tranches...</div>
          </div>
        )}
        
        {/* Empty State */}
        {!loading && filteredTranches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400">No tranches available matching your filters</div>
          </div>
        )}
        
        {/* Tranches Grid */}
        {!loading && filteredTranches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTranches.map(tranche => {
              const product = products.find(p => p.productId === tranche.productId);
              if (!product) return null;
              
              return (
                <TrancheCard
                  key={tranche.trancheId}
                  product={product}
                  tranche={tranche}
                  onBuyInsurance={() => handleBuyInsurance(tranche, product)}
                  onProvideLiquidity={() => handleProvideLiquidity(tranche, product)}
                />
              );
            })}
          </div>
        )}
        
        {/* Purchase Modal */}
        <EnhancedPurchaseModal
          trancheData={selectedTranche}
          roundId={selectedRoundId}
          isOpen={showPurchaseModal}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedTranche(null);
            setSelectedTrancheContract(null);
            setSelectedProduct(null);
            setSelectedRoundId(null);
          }}
          onSuccess={() => {
            setShowPurchaseModal(false);
            setSelectedTranche(null);
            setSelectedTrancheContract(null);
            setSelectedProduct(null);
            setSelectedRoundId(null);
            refetch();
          }}
        />
        
        {/* Liquidity Modal */}
        <LiquidityModal
          product={selectedProduct}
          tranche={selectedTrancheContract}
          isOpen={showLiquidityModal}
          onClose={() => {
            setShowLiquidityModal(false);
            setSelectedTranche(null);
            setSelectedTrancheContract(null);
            setSelectedProduct(null);
            setSelectedRoundId(null);
          }}
        />
      </div>
    </div>
  );
}

export default function TranchePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <TrancheContent />
    </Suspense>
  );
}