"use client";

import { EnhancedPurchaseModal } from "@/components/insurance/EnhancedPurchaseModal";
import { LiquidityPoolCard } from "@/components/insurance/LiquidityPoolCard";
import { LiquidityModal } from "@/components/liquidity/LiquidityModal";
import { TrancheCard } from "@/components/tranche/TrancheCard";
import { TrancheFilters } from "@/components/tranche/TrancheFilters";
import { useBTCPrice } from "@/hooks/useBTCPrice";
import type { TrancheDetails } from "@/hooks/useTrancheData";
import { useTrancheData } from "@/hooks/useTrancheData";
import { INSURANCE_PRODUCTS } from "@/lib/constants";
import { useContractFactory, useContracts, useProductManagement, useUserPortfolio, useWeb3 } from "@dinsure/contracts";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// Product and Tranche types
interface Product {
  productId: number;
  metadataHash: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  tranches: Tranche[];
  metadata?: {
    name: string;
    description: string;
    category: string;
    tags: string[];
    riskLevel: string;
    underlyingAsset: string;
  };
}

interface Tranche {
  trancheId: number;
  productId: number;
  triggerType: number;
  threshold: bigint;
  premiumRateBps: number;
  maturityDays?: number;
  maturityTimestamp: number;
  trancheCap: bigint;
  perAccountMin: bigint;
  perAccountMax: bigint;
  oracleRouteId: number;
  poolAddress: string;
  active: boolean;
  isExpired: boolean;
  availableCapacity: bigint;
  utilizationRate: number;
  name: string;
}

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
  
  // Get user's liquidity positions
  const { liquidityPositions, insurancePositions, isLoading: portfolioLoading, refetch: refetchPortfolio } = useUserPortfolio();
  
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
        
        // Fetch products - only get valid ones from contract
        console.log("[Tranche Page] Fetching products from contract...");
        const fetchedProducts: Product[] = [];
        
        try {
          // Get active products from contract
          const activeProductIds = await (productCatalog as any).getActiveProducts();
          console.log("[Tranche Page] Active product IDs from contract:", activeProductIds.map(id => Number(id)));
          
          // Fetch each product
          for (const productId of activeProductIds) {
            try {
              const productInfo = await (productCatalog as any).getProduct(Number(productId));
              
              if (productInfo && Number(productInfo.productId) !== 0) {
                console.log(`[Tranche Page] Product ${productId} from contract:`, {
                  exists: !!productInfo,
                  productId: productInfo?.productId,
                  active: productInfo?.active,
                  metadataHash: productInfo?.metadataHash
                });
                
                // Get tranches for this product
                const trancheIds = productInfo.trancheIds || [];
                const productTranches: any[] = [];
                
                for (const trancheId of trancheIds) {
                  try {
                    const tranche = await (productCatalog as any).getTranche(Number(trancheId));
                    if (tranche && Number(tranche.productId) > 0) {
                      productTranches.push({
                        trancheId: Number(trancheId),
                        productId: Number(tranche.productId),
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
                        active: true,
                        isExpired: false,
                        availableCapacity: BigInt(0),
                        utilizationRate: 0,
                        name: `Tranche ${trancheId}`,
                      });
                    }
                  } catch (err) {
                    console.log(`[Tranche Page] Could not fetch tranche ${trancheId}`);
                  }
                }
                
                // Find matching config for metadata
                const configProduct = INSURANCE_PRODUCTS.find(p => p.productId === Number(productId));
                
                // Create product entry with actual data from contract
                fetchedProducts.push({
                  productId: Number(productId),
                  metadataHash: productInfo?.metadataHash || "",
                  active: productInfo?.active || false,
                  createdAt: Number(productInfo?.createdAt || Date.now() / 1000),
                  updatedAt: Number(productInfo?.updatedAt || Date.now() / 1000),
                  tranches: productTranches,
                  metadata: {
                    name: configProduct?.name || `Product ${productId}`,
                    description: configProduct?.description || `Insurance Product ${productId}`,
                    category: 'Price Protection',
                    tags: [configProduct?.asset || 'BTC'],
                    riskLevel: 'MEDIUM',
                    underlyingAsset: configProduct?.asset || 'BTC',
                  }
                } as Product);
              }
            } catch (err) {
              console.log(`[Tranche Page] Could not fetch product ${productId} from contract`);
            }
          }
        } catch (err) {
          console.error("[Tranche Page] Error fetching products from contract:", err);
        }
        
        console.log("[Tranche Page] Products fetched from contract:", fetchedProducts);
        setProducts(fetchedProducts);
        
        // Use tranches from products we already fetched
        console.log("[Tranche Page] Extracting tranches from products...");
        const allTranches: Tranche[] = [];
        
        for (const product of fetchedProducts) {
          if (product.tranches && product.tranches.length > 0) {
            allTranches.push(...product.tranches);
          }
        }
        
        console.log(`[Tranche Page] Found ${allTranches.length} tranches from ${fetchedProducts.length} products`);
        
        // If no products/tranches found in contract, try direct tranche query as fallback
        if (allTranches.length === 0) {
          console.log("[Tranche Page] No products found, trying direct tranche query...");
          
          try {
            // Get active tranches from contract
            const activeTrancheIds = await (productCatalog as any).getActiveTranches();
            console.log("[Tranche Page] Active tranche IDs from contract:", activeTrancheIds.map(id => Number(id)));
            
            for (const trancheId of activeTrancheIds) {
              try {
                const tranche = await (productCatalog as any).getTranche(Number(trancheId));
                
                // Validate tranche data
                if (tranche && Number(tranche.productId) > 0 && Number(tranche.premiumRateBps) > 0) {
                  console.log(`[Tranche Page] Found standalone tranche ${trancheId}:`, tranche);
                  
                  allTranches.push({
                    trancheId: Number(trancheId),
                    productId: Number(tranche.productId),
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
                    active: true,
                    isExpired: false,
                    availableCapacity: BigInt(0),
                    utilizationRate: 0,
                    name: `Tranche ${trancheId}`,
                  } as Tranche);
                  
                  // Also ensure we have the product for this tranche
                  const productId = Number(tranche.productId);
                  if (!fetchedProducts.find(p => p.productId === productId)) {
                    const configProduct = INSURANCE_PRODUCTS.find(p => p.productId === productId);
                    fetchedProducts.push({
                      productId: productId,
                      metadataHash: "",
                      active: true,
                      createdAt: Date.now() / 1000,
                      updatedAt: Date.now() / 1000,
                      tranches: [],
                      metadata: {
                        name: configProduct?.name || `Product ${productId}`,
                        description: configProduct?.description || `Insurance Product ${productId}`,
                        category: 'Price Protection',
                        tags: [configProduct?.asset || 'BTC'],
                        riskLevel: 'MEDIUM',
                        underlyingAsset: configProduct?.asset || 'BTC',
                      }
                    } as Product);
                    setProducts([...fetchedProducts]);
                  }
                }
              } catch (err) {
                // Tranche doesn't exist, continue
              }
            }
          } catch (err) {
            console.error("[Tranche Page] Error fetching active tranches:", err);
          }
        }
        
        console.log(`[Tranche Page] Final: ${allTranches.length} tranches`);
        setTranches(allTranches);
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
  
  // Filter tranches - combine contract data with round data
  const filteredTranches = tranches.filter(tranche => {
    // Filter by insurance product
    if (filters.insuranceProduct !== null && tranche.productId !== filters.insuranceProduct) {
      return false;
    }
    
    // Filter by status (based on tranche data if available)
    if (filters.status !== 'all') {
      const trancheData = tranchesData?.find(t => t.trancheId === tranche.trancheId);
      
      if (filters.status === 'open') {
        // Check if any round is open (state === 1)
        if (!trancheData?.rounds.some(r => r.state === 1)) {
          return false;
        }
      } else if (filters.status === 'active') {
        // Check if any round is active (state === 3)
        if (!trancheData?.rounds.some(r => r.state === 3)) {
          return false;
        }
      } else if (filters.status === 'settling') {
        // Check if any round is settling (state === 4 or 5)
        if (!trancheData?.rounds.some(r => r.state === 4 || r.state === 5)) {
          return false;
        }
      }
    }
    
    return true;
  });
  
  // Transform liquidity positions to LiquidityPoolCard format
  const transformedUserPools = liquidityPositions.map((position) => {
    // Find the corresponding tranche and product data
    const tranche = tranches.find(t => t.trancheId === position.trancheId);
    const product = products.find(p => p.productId === tranche?.productId);
    const trancheData = tranchesData?.find(t => t.trancheId === position.trancheId);
    
    // Calculate trigger price based on threshold
    const triggerLevel = tranche ? Number(tranche.threshold) / 1000000 : 5; // Default 5%
    const currentPrice = btcPrice || 90000;
    const triggerPrice = currentPrice * (100 - triggerLevel) / 100;
    
    // Get round state
    const roundState = position.roundState || 'OPEN';
    const daysLeft = position.daysLeft || 7;

    // TODO: how to determine the asset type?
    let asset: 'BTC' | 'KAIA' | 'ETH';
    if (position.asset === 'BTC' || position.asset === 'KAIA' || position.asset === 'ETH') {
      asset = position.asset;
    } else {
      asset = 'BTC'; // default to KAIA if not one of the types
    }
    
    return {
      id: position.trancheId,
      productId: tranche?.productId || 0,
      asset: asset,
      trancheName: position.tranche.split(' -')[0] || `Tranche ${position.trancheId}`,
      triggerPrice: triggerPrice,
      triggerType: 'PRICE_BELOW',
      expectedPremium: tranche ? Number(tranche.premiumRateBps) / 100 : 5,
      premiumRateBps: tranche?.premiumRateBps || 500,
      stakingAPY: 2.5, // TODO: Get from yield router
      riskLevel: triggerLevel <= 5 ? 'LOW' : triggerLevel <= 10 ? 'MEDIUM' : 'HIGH' as 'LOW' | 'MEDIUM' | 'HIGH',
      poolSize: trancheData?.poolDetails?.totalCapacity || '10000000',
      totalLiquidity: position.deposited,
      userShare: position.currentValue,
      utilization: trancheData?.poolDetails?.utilizationRate || 0,
      roundState: roundState,
      roundEndsIn: daysLeft,
      navPerShare: trancheData?.poolDetails?.navPerShare || '1.00'
    };
  });
  
  // Group user pools by asset
  const groupedUserPools = transformedUserPools.reduce((acc: any[], pool) => {
    const existingGroup = acc.find(g => g.asset === pool.asset);
    if (existingGroup) {
      existingGroup.pools.push(pool);
    } else {
      acc.push({ asset: pool.asset, pools: [pool] });
    }
    return acc;
  }, []);
  
  // Handlers for liquidity operations
  const handleDeposit = (pool: any) => {
    const tranche = tranchesData?.find(t => t.trancheId === pool.id);
    if (tranche) {
      setSelectedTranche(tranche);
      const openRound = tranche.rounds.find((r: any) => r.state === 1);
      if (openRound) {
        setSelectedRoundId(openRound.roundId);
      }
      setShowLiquidityModal(true);
    }
  };
  
  const handleWithdraw = (pool: any) => {
    // TODO: Implement withdrawal logic
    console.log('Withdraw from pool:', pool);
  };
  
  const handleAddMore = (pool: any) => {
    handleDeposit(pool); // Same as deposit for now
  };
  
  // Get unique products for filter options
  const uniqueProducts = Array.from(new Set(products.map(p => p.productId)))
    .map(id => products.find(p => p.productId === id)!);
  
  const loading = productsLoading || trancheLoading || priceLoading || portfolioLoading;
  const error = contractError || productsError || trancheError || priceError;
  
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Initializing contracts...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 pt-20 pb-10">
      
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-[40px] mobile:text-[42px] font-bold text-gray-900 mb-4 font-display break-words leading-tight">
            Become a <span className="bg-gradient-to-r from-[#86D99C] to-[#00B1B8] bg-clip-text text-transparent">Depositor(Seller)</span><br />and provide liquidity<br />to the insurance market.
          </h1>
          <p className="text-gray-600 text-[18px] mobile:text-[20px] mb-8 break-words leading-tight">
            By depositing USDT into the insurance pool,<br /><span className="font-bold bg-gradient-to-r from-[#86D99C] to-[#00B1B8] bg-clip-text text-transparent">you can earn premium rewards</span> whenever buyers purchase coverage.
          </p>
        </div>


        {/* Dashboard Section */}
        <div className="mb-8">
          <h2 className="text-[30px] font-bold text-gray-900 mb-4 font-display">Liquidity Provider Dashboard</h2>
          <div className="w-full h-px bg-gray-200 mb-8"></div>
          <p className="text-gray-600 mb-8">
            Provide liquidity to insurance pools and earn premiums + staking rewards
          </p>
          
          {/* User Statistics Cards */}
          {isConnected && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col justify-between h-full">
                <div className="text-gray-600 text-sm mb-2">Available Tranches</div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredTranches.length}
                </div>
                <div className="text-blue-600 text-sm mt-auto">
                  across {uniqueProducts.length} products
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col justify-between h-full">
                <div className="text-gray-600 text-sm mb-2">Open for Deposits</div>
                <div className="text-2xl font-bold text-gray-900">
                  {tranchesData?.filter(t => t.rounds.some(r => r.state === 1)).length || 0}
                </div>
                <div className="text-green-600 text-sm mt-auto">
                  accepting liquidity now
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col justify-between h-full">
                <div className="text-gray-600 text-sm mb-2">Active Rounds</div>
                <div className="text-2xl font-bold text-gray-900">
                  {tranchesData?.filter(t => t.rounds.some(r => r.state === 3)).length || 0}
                </div>
                <div className="text-yellow-600 text-sm mt-auto">
                  coverage in progress
                </div>
              </div>
            </div>
          )}
          
          {/* Filters */}
          <TrancheFilters
            products={uniqueProducts}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
          
          <div className="w-full h-px bg-gray-200 mt-8"></div>
        </div>
        
        {/* Connection Notice */}
        {!isConnected && (
          <div className="bg-[#F3FEF6] p-6 mb-8 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="text-[#00B1B8] text-xl">💡</div>
              <div>
                <h3 className="text-gray-800 font-medium">Connect Your Wallet</h3>
                <p className="text-gray-800 text-sm">
                  Connect your wallet to provide liquidity and earn rewards
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Your Pools Section */}
        {isConnected && liquidityPositions.length > 0 && (
          <div className="mb-12">
            <h2 className="text-[30px] font-bold text-gray-900 mb-4 font-display">Your Liquidity Positions</h2>
            {groupedUserPools.map(({ asset, pools }, index) => (
              <div key={asset} style={{ marginTop: index > 0 ? '60px' : '0' }}>
                <div className={`flex items-center mb-4 ${asset === 'KAIA' ? 'gap-4' : 'gap-2'}`}>
                  <img
                    src={`/images/${asset}.svg`}
                    alt={asset}
                    className={`${asset === 'KAIA' ? 'w-6 h-6' : 'w-10 h-10'}`}
                    style={{ filter: 'brightness(0) invert(0.2)' }}
                  />
                  <h3 className="text-[24px] font-bold text-gray-900 font-display">{asset} Pools</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pools.map((pool) => (
                    <LiquidityPoolCard
                      key={pool.id}
                      pool={pool}
                      onDeposit={handleDeposit}
                      onWithdraw={handleWithdraw}
                      onAddMore={handleAddMore}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Available Pools Section Title */}
        <div className="mb-6">
          <h2 className="text-[30px] font-bold text-gray-900 font-display">Available Tranche Pools</h2>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading tranches...</div>
          </div>
        )}
        
        {/* Debug Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 overflow-x-auto border border-gray-100">
          <div className="whitespace-nowrap">
            Debug: Products={products.length} | Contract Tranches={tranches.length} | 
            Tranches with Data={tranchesData?.length || 0} | Filtered={filteredTranches.length} | 
            Filter Product={filters.insuranceProduct ?? 'all'} | Filter Status={filters.status} | Loading={String(loading)}
          </div>
          {tranchesData && tranchesData.length > 0 && (
            <div className="mt-1 whitespace-nowrap">
              Round States: {tranchesData.map(t => `T${t.trancheId}: ${t.rounds.map(r => r.state).join(',')}`).join(' | ')}
            </div>
          )}
        </div>
        
        {/* Empty State */}
        {!loading && filteredTranches.length === 0 && tranches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No tranches available</div>
          </div>
        )}
        
        {!loading && filteredTranches.length === 0 && tranches.length > 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No tranches matching your filters (Total: {tranches.length})</div>
          </div>
        )}
        
        {/* Tranches Grid */}
        {!loading && filteredTranches.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTranches.map(tranche => {
              const product = products.find(p => p.productId === tranche.productId);
              
              // Show tranche even without product
              if (!product) {
                return (
                  <div key={tranche.trancheId} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 relative">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Tranche #{tranche.trancheId}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600">
                        Product ID: <span className="text-gray-900 font-medium">{tranche.productId}</span>
                      </p>
                      <p className="text-gray-600">
                        Premium: <span className="text-gray-900 font-medium">{tranche.premiumRateBps / 100}%</span>
                      </p>
                      <p className="text-gray-600">
                        Trigger: <span className="text-gray-900 font-medium">
                          {tranche.triggerType === 0 ? "Price Below" : "Price Above"} ${tranche.threshold.toString()}
                        </span>
                      </p>
                      <p className="text-gray-600">
                        Cap: <span className="text-gray-900 font-medium">${Number(tranche.trancheCap) / 1e6} USDT</span>
                      </p>
                    </div>
                    <div className="mt-4">
                      <Link 
                        href={`/tranches/${tranche.productId}/${tranche.trancheId}`}
                        className="block w-full text-center rounded-xl bg-gradient-to-br from-[#86D99C] to-[#00B1B8] px-4 py-3 text-white font-semibold transition-all duration-300 hover:scale-95 hover:shadow-md"
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
  );
}

export default function TranchePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <TrancheContent />
    </Suspense>
  );
}