"use client";

import { EnhancedPurchaseModal } from "@/components/insurance/EnhancedPurchaseModal";
import { LiquidityModal } from "@/components/liquidity/LiquidityModal";
import { TrancheCard } from "@/components/tranche/TrancheCard";
import { TrancheFilters } from "@/components/tranche/TrancheFilters";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import type { TrancheDetails } from "@/hooks/useTrancheData";
import { useTrancheData } from "@/hooks/useTrancheData";
import { INSURANCE_PRODUCTS } from "@/lib/constants";
import type { Product, Tranche } from "@dinsure/contracts";
import { useContractFactory, useContracts, useProductManagement, useWeb3 } from "@dinsure/contracts";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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
  
  // Update filters when URL params change
  useEffect(() => {
    if (productIdParam) {
      setFilters(prev => ({
        ...prev,
        insuranceProduct: parseInt(productIdParam)
      }));
    }
  }, [productIdParam]);
  
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
        let fetchedProducts: Product[] = [];
        try {
          fetchedProducts = await getProducts() as Product[];
          console.log("[Tranche Page] Raw products fetched:", fetchedProducts);
          setProducts(fetchedProducts);
        } catch (productError) {
          console.error("[Tranche Page] Error fetching products:", productError);
          // Use configured products as fallback
          fetchedProducts = INSURANCE_PRODUCTS.map(p => ({
            productId: p.productId,
            metadataHash: p.metadata,
            active: true,
            createdAt: Date.now() / 1000,
            updatedAt: Date.now() / 1000,
            tranches: [],
            metadata: {
              name: p.name,
              description: p.description,
              category: 'Price Protection',
              tags: [p.asset],
              riskLevel: 'MEDIUM',
              underlyingAsset: p.asset,
            }
          } as Product));
          setProducts(fetchedProducts);
        }
        
        // Build list of potential tranche IDs to check
        console.log("[Tranche Page] Building tranche IDs to check...");
        let activeTrancheIds: number[] = [];
        
        // First, try the getActiveTranches function if available
        try {
          const activeTranches = await getActiveTranches();
          if (activeTranches && activeTranches.length > 0) {
            console.log("[Tranche Page] Got active tranches from contract:", activeTranches);
            activeTrancheIds = activeTranches;
          }
        } catch (err) {
          console.log("[Tranche Page] getActiveTranches failed, falling back to product-based generation:", err);
          // Don't throw here, just log and continue with fallback
        }
        
        // If no active tranches found, generate IDs based on products
        if (activeTrancheIds.length === 0 && fetchedProducts.length > 0) {
          console.log("[Tranche Page] Generating tranche IDs from products...");
          for (const product of fetchedProducts) {
            // Check first 5 tranches for each product (0-4)
            for (let i = 0; i < 5; i++) {
              const trancheId = product.productId * 10 + i;
              activeTrancheIds.push(trancheId);
            }
          }
        }
        
        // If still no IDs and no products, use configured tranche IDs from constants
        if (activeTrancheIds.length === 0) {
          console.log("[Tranche Page] No products found, using configured tranche IDs from constants...");
          // Product 1 (BTC) has 4 tranches (indices 0-3)
          activeTrancheIds = [10, 11, 12, 13]; // Product 1, tranches 0-3
        }
        
        console.log("[Tranche Page] Will check tranche IDs:", activeTrancheIds);
        
        const trancheDetailsPromises = activeTrancheIds.map(async (id) => {
          try {
            console.log(`[Tranche Page] Fetching tranche ${id}...`);
            // Try different methods to fetch tranche data
            let tranche: any;
            try {
              tranche = await (productCatalog as any).getTranche(id);
            } catch (getTrancheErr) {
              // Fallback to tranches mapping
              try {
                tranche = await (productCatalog as any).tranches(id);
              } catch (tranchesErr) {
                console.log(`[Tranche Page] Tranche ${id} not found`);
                return null;
              }
            }
            
            // Check if tranche actually exists (not just default values)
            // Also check for BigInt 0 values
            const hasValidData = tranche && (
              (tranche.productId && Number(tranche.productId) > 0) ||
              (tranche.premiumRateBps && Number(tranche.premiumRateBps) > 0) ||
              (tranche.threshold && tranche.threshold.toString() !== '0') ||
              (tranche.trancheCap && tranche.trancheCap.toString() !== '0')
            );
            
            if (!hasValidData) {
              console.log(`[Tranche Page] Tranche ${id} is empty or doesn't exist:`, tranche);
              return null;
            }
            
            console.log(`[Tranche Page] Tranche ${id} fetched:`, tranche);
            
            // Extract product ID and tranche index from the ID
            const productId = Math.floor(id / 10);
            const trancheIndex = id % 10;
            
            // Convert BigInt values to regular numbers for display
            return {
              trancheId: id,
              productId: productId,
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
              active: tranche.active === true,
              isExpired: false,
              availableCapacity: BigInt(0),
              utilizationRate: 0,
              name: tranche.name || `Tranche ${String.fromCharCode(65 + trancheIndex)}`,
            } as Tranche;
          } catch (err) {
            console.error(`[Tranche Page] Error fetching tranche ${id}:`, err);
            return null;
          }
        });
        
        const fetchedTranches = await Promise.all(trancheDetailsPromises);
        let validTranches = fetchedTranches.filter((t: any) => t !== null) as Tranche[];
        
        // If no tranches fetched from contract, use configured data as fallback
        if (validTranches.length === 0) {
          console.log("[Tranche Page] No tranches from contract, using configured data...");
          const configuredTranches: Tranche[] = [];
          
          for (const product of INSURANCE_PRODUCTS) {
            for (let i = 0; i < product.tranches.length && i < 4; i++) {
              const configTranche = product.tranches[i];
              const trancheId = product.productId * 10 + i;
              
              configuredTranches.push({
                trancheId: trancheId,
                productId: product.productId,
                triggerType: configTranche.triggerType === 'PRICE_BELOW' ? 0 : 1,
                threshold: BigInt(configTranche.triggerPrice * 1e18), // Convert to wei
                premiumRateBps: configTranche.premiumRateBps,
                maturityDays: configTranche.maturityDays,
                maturityTimestamp: Math.floor(Date.now() / 1000) + (configTranche.maturityDays * 86400),
                trancheCap: BigInt(Number(configTranche.capacity) * 1e6), // USDT has 6 decimals
                perAccountMin: BigInt(Number(configTranche.perAccountMin) * 1e6),
                perAccountMax: BigInt(Number(configTranche.perAccountMax) * 1e6),
                oracleRouteId: configTranche.oracleRouteId,
                poolAddress: "",
                active: true,
                isExpired: false,
                availableCapacity: BigInt(Number(configTranche.available) * 1e6),
                utilizationRate: 0,
                name: configTranche.name,
              } as Tranche);
            }
          }
          
          validTranches = configuredTranches;
        }
        
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
          <h1 className="text-4xl font-bold text-white mb-4">
            Insurance Tranches
            {filters.insuranceProduct !== null && (
              <span className="ml-2 text-2xl text-gray-400">
                - Product #{filters.insuranceProduct}
              </span>
            )}
          </h1>
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
                const trancheIndex = tranche.trancheId % 10;
                return (
                  <div key={tranche.trancheId} className="bg-gray-800 rounded-lg p-6 border border-gray-700 relative">
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
                    <div className="mt-4">
                      <Link 
                        href={`/insurance/tranches/${tranche.productId}/${trancheIndex}`}
                        className="block w-full text-center rounded bg-blue-600 px-4 py-3 text-white font-medium transition-colors hover:bg-blue-700"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              }
              
              return (
                <TrancheCard
                  key={tranche.trancheId}
                  product={product}
                  tranche={tranche}
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