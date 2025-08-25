"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TrancheCard } from "@/components/tranche/TrancheCard";
import { EnhancedTrancheCard } from "@/components/tranche/EnhancedTrancheCard";
import { TrancheFilters } from "@/components/tranche/TrancheFilters";
import { EnhancedPurchaseModal } from "@/components/insurance/EnhancedPurchaseModal";
import { LiquidityModal } from "@/components/liquidity/LiquidityModal";
import { useWeb3, useContracts, useContractFactory, useProductManagement } from "@dinsure/contracts";
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
  const { isInitialized, error: contractError, productCatalog } = useContracts();
  const factory = useContractFactory();
  const { getProducts, getActiveTranches } = useProductManagement();
  const [products, setProducts] = useState<Product[]>([]);
  const [tranches, setTranches] = useState<Tranche[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<Error | null>(null);
  
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
  
  // Fetch products and tranches
  useEffect(() => {
    const fetchData = async () => {
      if (!isInitialized || !productCatalog) {
        console.log("[Tranche Page] Waiting for initialization:", { isInitialized, productCatalog: !!productCatalog });
        return;
      }
      
      setProductsLoading(true);
      setProductsError(null);
      
      try {
        console.log("[Tranche Page] Starting data fetch...");
        
        // Fetch products
        console.log("[Tranche Page] Fetching products...");
        try {
          const fetchedProducts = await getProducts();
          console.log("[Tranche Page] Raw products fetched:", fetchedProducts);
          setProducts(fetchedProducts as Product[]);
        } catch (productError) {
          console.error("[Tranche Page] Error fetching products:", productError);
          // Continue to fetch tranches even if products fail
        }
        
        // Fetch active tranches
        console.log("[Tranche Page] Fetching active tranches...");
        const activeTrancheIds = await getActiveTranches();
        console.log("[Tranche Page] Active tranche IDs:", activeTrancheIds);
        
        const trancheDetailsPromises = activeTrancheIds.map(async (id) => {
          try {
            console.log(`[Tranche Page] Fetching tranche ${id}...`);
            const tranche = await productCatalog.getTranche(id);
            console.log(`[Tranche Page] Tranche ${id} fetched:`, tranche);
            
            // Convert BigInt values to regular numbers for display
            return {
              trancheId: Number(tranche.trancheId || id),
              productId: Number(tranche.productId || 0),
              triggerType: Number(tranche.triggerType || 0),
              threshold: tranche.threshold ? BigInt(tranche.threshold.toString()) : BigInt(0),
              premiumRateBps: Number(tranche.premiumRateBps || 0),
              maturityDays: Number(tranche.maturityDays || 30),
              maturityTimestamp: Number(tranche.maturityTimestamp || 0),
              trancheCap: tranche.trancheCap ? BigInt(tranche.trancheCap.toString()) : BigInt(0),
              perAccountMin: tranche.perAccountMin ? BigInt(tranche.perAccountMin.toString()) : BigInt(0),
              perAccountMax: tranche.perAccountMax ? BigInt(tranche.perAccountMax.toString()) : BigInt(0),
              oracleRouteId: Number(tranche.oracleRouteId || 0),
              poolAddress: tranche.poolAddress || "",
              active: tranche.active !== false,
              isExpired: false,
              availableCapacity: BigInt(0),
              utilizationRate: 0,
            } as Tranche;
          } catch (err) {
            console.error(`[Tranche Page] Error fetching tranche ${id}:`, err);
            return null;
          }
        });
        
        const fetchedTranches = await Promise.all(trancheDetailsPromises);
        const validTranches = fetchedTranches.filter(t => t !== null) as Tranche[];
        console.log("[Tranche Page] Valid tranches:", validTranches);
        setTranches(validTranches);
      } catch (error) {
        console.error('[Tranche Page] Error in fetchData:', error);
        setProductsError(error as Error);
      } finally {
        setProductsLoading(false);
      }
    };
    
    fetchData();
  }, [isInitialized, getProducts, getActiveTranches, productCatalog]);

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
        
        {/* Debug Info */}
        <div className="mb-4 p-2 bg-gray-800 rounded text-xs text-gray-400">
          Debug: Products={products.length} | Total Tranches={tranches.length} | 
          Filtered={filteredTranches.length} | Loading={String(loading)}
        </div>
        
        {/* Empty State */}
        {!loading && filteredTranches.length === 0 && tranches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400">No tranches available</div>
          </div>
        )}
        
        {!loading && filteredTranches.length === 0 && tranches.length > 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400">No tranches matching your filters (Total: {tranches.length})</div>
          </div>
        )}
        
        {/* Tranches Grid */}
        {!loading && filteredTranches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTranches.map(tranche => {
              const product = products.find(p => p.productId === tranche.productId);
              
              // Show tranche even without product
              if (!product) {
                return (
                  <div key={tranche.trancheId} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Tranche #{tranche.trancheId}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-400">
                        Product ID: <span className="text-white">{tranche.productId}</span>
                      </p>
                      <p className="text-gray-400">
                        Premium: <span className="text-white">{tranche.premiumRateBps / 100}%</span>
                      </p>
                      <p className="text-gray-400">
                        Trigger: <span className="text-white">
                          {tranche.triggerType === 0 ? "Price Below" : "Price Above"} ${tranche.threshold.toString()}
                        </span>
                      </p>
                      <p className="text-gray-400">
                        Cap: <span className="text-white">${Number(tranche.trancheCap) / 1e6} USDT</span>
                      </p>
                    </div>
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => handleBuyInsurance(tranche, { productId: tranche.productId, name: `Product ${tranche.productId}`, description: "", active: true } as Product)}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                      >
                        Buy Insurance
                      </button>
                      <button
                        onClick={() => handleProvideLiquidity(tranche, { productId: tranche.productId, name: `Product ${tranche.productId}`, description: "", active: true } as Product)}
                        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                      >
                        Provide Liquidity
                      </button>
                    </div>
                  </div>
                );
              }
              
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