"use client";

import { SkeletonCardGrid } from "@/components/common/SkeletonCard";
import { EnhancedPurchaseModal } from "@/components/insurance/EnhancedPurchaseModal";
import { LiquidityPoolCard } from "@/components/insurance/LiquidityPoolCard";
import { LiquidityModal } from "@/components/liquidity/LiquidityModal";
import { TrancheFilters } from "@/components/tranche/TrancheFilters";
import type { TrancheDetails } from "@/hooks/useTrancheData";
import { useTrancheData } from "@/hooks/useTrancheData";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import {
  INSURANCE_PRODUCTS,
  ORACLE_ROUTE_ID_TO_TYPE,
  useContractFactory,
  useContracts,
  usePriceStore,
  useProductManagement,
  useUserPortfolio,
  useWeb3,
} from "@dinsure/contracts";
import { useNames } from "~/hooks/useNames";

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
  asset: string;
}

interface TrancheFilters {
  insuranceProduct: number | null;
  status: "all" | "active" | "open" | "settling";
}

function TrancheContent() {
  const { isConnected } = useWeb3();
  const {
    isInitialized,
    error: contractError,
    productCatalog,
  } = useContracts();
  const factory = useContractFactory();
  const { getProducts, getActiveTranches } = useProductManagement();
  const [products, setProducts] = useState<Product[]>([]);
  const [tranches, setTranches] = useState<Tranche[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<Error | null>(null);
  const { getTrancheName } = useNames();

  // Get real contract data
  const btc = usePriceStore((state) => state.btc);
  const btcPrice = btc.value;
  const priceLoading = btc.loading;
  const priceError = btc.error;

  // Get user's liquidity positions
  const {
    liquidityPositions,
    isLoading: portfolioLoading,
  } = useUserPortfolio();

  const searchParams = useSearchParams();
  const productIdParam = searchParams.get("productId");
  const trancheIdParam = searchParams.get("trancheId");

  const [filters, setFilters] = useState<TrancheFilters>({
    insuranceProduct: productIdParam ? parseInt(productIdParam) : null,
    status: "all",
  });

  // Update filters when URL params change
  useEffect(() => {
    if (productIdParam) {
      setFilters((prev) => ({
        ...prev,
        insuranceProduct: parseInt(productIdParam),
      }));
    }
  }, [productIdParam]);

  const [selectedTranche, setSelectedTranche] = useState<TrancheDetails | null>(
    null,
  );
  const [selectedTrancheContract, setSelectedTrancheContract] =
    useState<Tranche | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showLiquidityModal, setShowLiquidityModal] = useState(false);

  // Get detailed tranche data
  const {
    tranches: tranchesData,
    loading: trancheLoading,
    error: trancheError,
    refetch,
  } = useTrancheData({
    factory,
    currentBTCPrice: btcPrice,
  });

  // Fetch products and tranches - optimized to fetch all tranches first
  useEffect(() => {
    const fetchData = async () => {
      if (!isInitialized || !productCatalog) {
        console.log("[Tranche Page] Waiting for initialization:", {
          isInitialized,
          productCatalog: !!productCatalog,
        });
        return;
      }

      setProductsLoading(true);
      setProductsError(null);

      try {
        console.log("[Tranche Page] Starting data fetch...");

        const allTranches: Tranche[] = [];
        const productMap = new Map<number, Product>();

        // Step 1: Fetch all active tranches first
        console.log("[Tranche Page] Fetching all active tranches from contract...");
        const activeTrancheIds = await productCatalog.getActiveTranches();
        console.log(
          "[Tranche Page] Active tranche IDs from contract:",
          activeTrancheIds.map((id) => Number(id)),
        );

        // Step 2: Fetch each tranche data
        for (const trancheId of activeTrancheIds) {
          try {
            const tranche = await productCatalog.getTranche(Number(trancheId));

            // Validate tranche data
            if (
              tranche &&
              Number(tranche.productId) > 0 &&
              Number(tranche.premiumRateBps) > 0
            ) {
              console.log(
                `[Tranche Page] Found tranche ${trancheId} for product ${tranche.productId}`,
              );

              const trancheData: Tranche = {
                trancheId: Number(trancheId),
                productId: Number(tranche.productId),
                triggerType: Number(tranche.triggerType || 0),
                threshold: tranche.threshold
                  ? BigInt(Math.floor(Number(tranche.threshold) / 1e18).toString())
                  : BigInt(0),
                premiumRateBps: Number(tranche.premiumRateBps || 0),
                maturityDays: 30, // Default to 30 days as maturityDays not in contract
                maturityTimestamp: Number(tranche.maturityTimestamp || 0),
                trancheCap: tranche.trancheCap
                  ? BigInt(tranche.trancheCap.toString())
                  : BigInt(0),
                perAccountMin: tranche.perAccountMin
                  ? BigInt(tranche.perAccountMin.toString())
                  : BigInt(0),
                perAccountMax: tranche.perAccountMax
                  ? BigInt(tranche.perAccountMax.toString())
                  : BigInt(0),
                oracleRouteId: Number(tranche.oracleRouteId || 0),
                poolAddress: "", // poolAddress not in TrancheSpec
                active: true,
                isExpired: false,
                availableCapacity: BigInt(0),
                utilizationRate: 0,
                name: `Tranche ${trancheId}`,
                asset: (ORACLE_ROUTE_ID_TO_TYPE[Number(tranche.oracleRouteId) as keyof typeof ORACLE_ROUTE_ID_TO_TYPE]?.split("-")[0] ?? "BTC") as "BTC" | "ETH" | "KAIA",
              };

              allTranches.push(trancheData);
            }
          } catch {
            console.log(`[Tranche Page] Could not fetch tranche ${trancheId}`);
          }
        }

        console.log(
          `[Tranche Page] Fetched ${allTranches.length} active tranches`,
        );

        // Step 3: Get unique product IDs from tranches
        const uniqueProductIds = [...new Set(allTranches.map(t => t.productId))];
        console.log(
          "[Tranche Page] Unique product IDs from tranches:",
          uniqueProductIds,
        );

        // Step 4: Fetch product details for each unique product
        for (const productId of uniqueProductIds.filter(id => id > 1)) {
          try {
            const productInfo = await productCatalog.getProduct(productId);
            
            if (Number(productInfo.productId) !== 0) {
              console.log(
                `[Tranche Page] Product ${productId} from contract:`,
                {
                  exists: !!productInfo,
                  productId: productInfo?.productId,
                  active: productInfo?.active,
                  metadataHash: productInfo?.metadataHash,
                },
              );

              // Find matching config for metadata
              const configProduct = INSURANCE_PRODUCTS.find(
                (p) => p.productId === productId,
              );

              // Get tranches belonging to this product
              const productTranches = allTranches.filter(
                t => t.productId === productId
              );

              // Create product entry
              const product: Product = {
                productId: productId,
                metadataHash: productInfo.metadataHash || "",
                active: productInfo.active || false,
                createdAt: Number(productInfo.createdAt ?? Date.now() / 1000),
                updatedAt: Number(productInfo.updatedAt ?? Date.now() / 1000),
                tranches: productTranches,
                metadata: {
                  name: configProduct?.name ?? `Product ${productId}`,
                  description:
                    configProduct?.description ??
                    `Insurance Product ${productId}`,
                  category: "Price Protection",
                  tags: [configProduct?.asset ?? "BTC"],
                  riskLevel: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
                  underlyingAsset: configProduct?.asset ?? "BTC",
                },
              };

              productMap.set(productId, product);
            }
          } catch {
            console.log(
              `[Tranche Page] Could not fetch product ${productId}, creating placeholder`,
            );
            
            // Create placeholder product for orphaned tranches
            const configProduct = INSURANCE_PRODUCTS.find(
              (p) => p.productId === productId,
            );
            
            const productTranches = allTranches.filter(
              t => t.productId === productId
            );

            const product: Product = {
              productId: productId,
              metadataHash: "",
              active: true,
              createdAt: Date.now() / 1000,
              updatedAt: Date.now() / 1000,
              tranches: productTranches,
              metadata: {
                name: configProduct?.name ?? `Product ${productId}`,
                description:
                  configProduct?.description ??
                  `Insurance Product ${productId}`,
                category: "Price Protection",
                tags: [configProduct?.asset ?? "BTC"],
                riskLevel: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
                underlyingAsset: configProduct?.asset ?? "BTC",
              },
            };

            productMap.set(productId, product);
          }
        }

        // Step 5: Convert map to array and set state
        const fetchedProducts = Array.from(productMap.values());
        
        console.log(
          "[Tranche Page] Final results:",
          {
            products: fetchedProducts.length,
            tranches: allTranches.length,
          }
        );
        
        setProducts(fetchedProducts);
        setTranches(allTranches);
        
      } catch (error) {
        console.error("[Tranche Page] Error in fetchData:", error);
        setProductsError(error as Error);
      } finally {
        setProductsLoading(false);
      }
    };

    void fetchData();
  }, [isInitialized, getProducts, getActiveTranches, productCatalog]);

  // Open modals based on URL params
  useEffect(() => {
    if (
      trancheIdParam &&
      !showPurchaseModal &&
      !showLiquidityModal
    ) {
      const targetTranche = tranchesData.find(
        (t) => t.trancheId === parseInt(trancheIdParam),
      );
      if (targetTranche) {
        setSelectedTranche(targetTranche);
        if (targetTranche.rounds.length > 0) {
          const openRound = targetTranche.rounds.find(
            (r) => r.state === 1,
          );
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
  const filteredTranches = tranches.filter((tranche) => {
    // Filter by insurance product
    if (
      filters.insuranceProduct !== null &&
      tranche.productId !== filters.insuranceProduct
    ) {
      return false;
    }

    // Filter by status (based on tranche data if available)
    if (filters.status !== "all") {
      const trancheData = tranchesData?.find(
        (t) => t.trancheId === tranche.trancheId,
      );

      if (filters.status === "open") {
        // Check if any round is open (state === 1)
        if (!trancheData?.rounds.some((r) => r.state === 1)) {
          return false;
        }
      } else if (filters.status === "active") {
        // Check if any round is active (state === 3)
        if (!trancheData?.rounds.some((r) => r.state === 3)) {
          return false;
        }
      } else if (filters.status === "settling") {
        // Check if any round is settling (state === 4 or 5)
        if (!trancheData?.rounds.some((r) => r.state === 4 || r.state === 5)) {
          return false;
        }
      }
    }

    return true;
  });

  // Transform liquidity positions to LiquidityPoolCard format
  const transformedUserPools = liquidityPositions.map((position) => {
    // Find the corresponding tranche and product data
    const tranche = tranches.find((t) => t.trancheId === position.trancheId);
    const trancheData = tranchesData?.find(
      (t) => t.trancheId === position.trancheId,
    );

    // Calculate trigger price based on threshold
    const triggerLevel = tranche ? Number(tranche.threshold) : 5;
    const currentPrice = btcPrice && btcPrice < 1 ? 110000 : btcPrice;
    console.log("currentPrice", currentPrice);
    console.log("triggerLevel", triggerLevel);
    const triggerRate = ((currentPrice - triggerLevel) / currentPrice) * 100;

    // Get round state
    const roundState = position.roundState;
    const daysLeft = position.daysLeft;

    const asset = tranche?.asset;

    return {
      id: position.trancheId,
      productId: tranche?.productId || 0,
      asset: asset,
      trancheName:
        position.tranche.split(" -")[0] ?? `Tranche ${position.trancheId}`,
      triggerPrice: triggerLevel,
      triggerRate: triggerRate,
      triggerType: tranche?.triggerType === 0 ? "PRICE_BELOW" : "PRICE_ABOVE",
      expectedPremium: tranche ? Number(tranche.premiumRateBps) / 100 : 5,
      premiumRateBps: tranche?.premiumRateBps ?? 500,
      stakingAPY: 2.5, // TODO: Get from yield router
      riskLevel:
      triggerRate <= 5
          ? "LOW"
          : triggerRate <= 10
            ? "MEDIUM"
            : ("HIGH" as "LOW" | "MEDIUM" | "HIGH"),
      poolSize: trancheData?.poolDetails?.totalCapacity || "10000000",
      totalLiquidity: position.deposited,
      userShare: position.currentValue,
      utilization: trancheData?.poolDetails?.utilizationRate || 0,
      roundState: roundState,
      status: position.status,
      roundEndsIn: daysLeft,
      navPerShare: "1.00", // Default NAV per share
    };
  });

  // Group user pools by asset
  const groupedUserPools = transformedUserPools.reduce((acc: any[], pool) => {
    const existingGroup = acc.find((g) => g.asset === pool.asset);
    if (existingGroup) {
      existingGroup.pools.push(pool);
    } else {
      acc.push({ asset: pool.asset, pools: [pool] });
    }
    return acc;
  }, []);

  // Handlers for liquidity operations
  const handleDeposit = (pool: any) => {
    const tranche = tranchesData?.find((t) => t.trancheId === pool.id);
    if (tranche) {
      setSelectedTranche(tranche);
      const openRound = tranche.rounds.find((r: any) => r.state === 1);
      if (openRound) {
        setSelectedRoundId(openRound.roundId);
      }
      setShowLiquidityModal(true);
    }
  };

  // Get unique products for filter options
  const uniqueProducts = Array.from(
    new Set(products.map((p) => p.productId)),
  ).map((id) => products.find((p) => p.productId === id)!);

  const loading =
    productsLoading || trancheLoading || priceLoading || portfolioLoading;
  const error = contractError || productsError || trancheError || priceError;

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-gray-600">Initializing contracts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="w-full py-12 lg:py-24">
          {/* Header */}
          <div className="mb-16">
            <h1 className="mobile:text-[42px] font-display mb-4 break-words text-[40px] font-bold leading-tight text-gray-900">
          Become a{" "}
          <span className="bg-gradient-to-r from-[#86D99C] to-[#00B1B8] bg-clip-text text-transparent">
            Depositor(Seller)
          </span>
          <br />
          and provide liquidity
          <br />
          to the insurance market.
        </h1>
        <p className="mobile:text-[20px] mb-8 break-words text-[18px] leading-tight text-gray-600">
          By depositing USDT into the insurance pool,
          <br />
          <span className="bg-gradient-to-r from-[#86D99C] to-[#00B1B8] bg-clip-text font-bold text-transparent">
            you can earn premium rewards
          </span>{" "}
          whenever buyers purchase coverage.
        </p>
      </div>

      {/* Dashboard Section */}
      <div className="mb-8">
        <h2 className="font-display mb-4 text-[30px] font-bold text-gray-900">
          Liquidity Provider Dashboard
        </h2>
        <div className="mb-8 h-px w-full bg-gray-200"></div>
        <p className="mb-8 text-gray-600">
          Provide liquidity to insurance pools and earn premiums + staking
          rewards
        </p>

        {/* User Statistics Cards */}
        {isConnected && (
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm text-gray-600">
                Available Tranches
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {filteredTranches.length}
              </div>
              <div className="mt-auto text-sm text-blue-600">
                across {uniqueProducts.length} products
              </div>
            </div>

            <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm text-gray-600">
                Open for Deposits
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {tranchesData?.filter((t) =>
                  t.rounds.some((r) => r.state === 1),
                ).length || 0}
              </div>
              <div className="mt-auto text-sm text-green-600">
                accepting liquidity now
              </div>
            </div>

            <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 text-sm text-gray-600">Active Rounds</div>
              <div className="text-2xl font-bold text-gray-900">
                {tranchesData?.filter((t) =>
                  t.rounds.some((r) => r.state === 3),
                ).length || 0}
              </div>
              <div className="mt-auto text-sm text-yellow-600">
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

        <div className="mt-8 h-px w-full bg-gray-200"></div>
      </div>

      {/* Connection Notice */}
      {!isConnected && (
        <div className="mb-8 rounded-2xl bg-[#F3FEF6] p-6">
          <div className="flex items-center gap-3">
            <div className="text-xl text-[#00B1B8]">💡</div>
            <div>
              <h3 className="font-medium text-gray-800">Connect Your Wallet</h3>
              <p className="text-sm text-gray-800">
                Connect your wallet to provide liquidity and earn rewards
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Your Pools Section */}
      {isConnected && liquidityPositions.length > 0 && (
        <div className="mb-12">
          <h2 className="font-display mb-4 text-[30px] font-bold text-gray-900">
            Your Liquidity Positions
          </h2>
          {groupedUserPools.map(({ asset, pools }, index) => (
            <div key={`${asset}-${index}`} style={{ marginTop: index > 0 ? "60px" : "0" }}>
              <div
                className={`mb-4 flex items-center ${asset === "KAIA" ? "gap-4" : "gap-2"}`}
              >
                <img
                  src={`/images/icon/${asset.toLowerCase()}.svg`}
                  alt={asset}
                  className={`${asset === "KAIA" ? "h-6 w-6" : "h-10 w-10"}`}
                  style={{ filter: "brightness(0) invert(0.2)" }}
                />
                <h3 className="font-display text-[24px] font-bold text-gray-900">
                  {asset} Tranches
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {pools.map((pool) => (
                  <LiquidityPoolCard
                    key={pool.id}
                    pool={pool}
                    onDeposit={handleDeposit}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Available Pools Section Title */}
      <div className="mb-6">
        <h2 className="font-display mb-4 text-[30px] font-bold text-gray-900">
          Available Tranche Pools
        </h2>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-12">
          <SkeletonCardGrid />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredTranches.length === 0 && tranches.length === 0 && (
        <div className="py-12 text-center">
          <div className="text-gray-500">No tranches available</div>
        </div>
      )}

      {!loading && filteredTranches.length === 0 && tranches.length > 0 && (
        <div className="py-12 text-center">
          <div className="text-gray-500">
            No tranches matching your filters (Total: {tranches.length})
          </div>
        </div>
      )}

      {/* Tranches Grid */}
      {!loading && filteredTranches.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredTranches.filter(tranche => products.find(
              (p) => p.productId === tranche.productId,
            )).map((tranche, index) => {

            return (
              <div key={tranche.trancheId}>
                <div
                  className="relative rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:bg-gray-750"
                >
                <h3 className="mb-4 flex items-center gap-2 text-[20px] font-bold text-white">
                  <img
                    src={`/images/icon/${tranche.asset.toLowerCase()}.svg`}
                    alt={tranche.asset}
                    className={`${tranche.asset === "KAIA" ? "h-6 w-6" : "h-8 w-8"}`}
                    style={{ filter: "brightness(0) invert(1)" }}
                  />
                  {getTrancheName(tranche.trancheId) ?? `{tranche.asset} Pools`}
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-400">
                    Premium:{" "}
                    <span className="font-medium text-white">
                      {tranche.premiumRateBps / 100}%
                    </span>
                  </p>
                  <p className="text-gray-400">
                    Trigger:{" "}
                    <span className="font-medium text-[#00B1B8] flex items-center gap-2">
                      <span className={`flex items-center gap-1 ${tranche.triggerType === 0 ? "text-red-500" : "text-green-500"}`}>
                        {tranche.triggerType === 0
                          ? "Price Below"
                          : "Price Above"}
                        <svg 
                          className={`h-4 w-4 ${tranche.triggerType === 0 ? "text-red-500" : "text-green-500"}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          {tranche.triggerType === 0 ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          )}
                        </svg>
                      </span>
                      <span className="font-bold text-white">
                        ${Number(tranche.threshold).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </span>
                  </p>
                  <p className="text-gray-400">
                    Cap:{" "}
                    <span className="font-medium text-white">
                      ${(Number(tranche.trancheCap) / 1e6).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                    </span>
                  </p>
                  <p className="text-gray-400">
                    Maturity:{" "}
                    <span className="font-medium text-white">
                      {tranche.maturityDays} days
                    </span>
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/tranches/${tranche.productId}/${tranche.trancheId}`}
                    className="block w-full rounded-xl bg-gradient-to-br from-[#86D99C] to-[#00B1B8] px-4 py-3 text-center font-semibold text-white transition-all duration-300 hover:scale-95 hover:shadow-md"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>);
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
          setSelectedProduct(null as Product | null);
          setSelectedRoundId(null);
        }}
        onSuccess={() => {
          setShowPurchaseModal(false);
          setSelectedTranche(null);
          setSelectedTrancheContract(null);
          setSelectedProduct(null as Product | null);
          setSelectedRoundId(null);
          void refetch();
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
          setSelectedProduct(null as Product | null);
          setSelectedRoundId(null);
        }}
      />
        </div>
      </div>
    </div>
  );
}

export default function TranchePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="text-gray-600">Loading...</div>
        </div>
      }
    >
      <TrancheContent />
    </Suspense>
  );
}
