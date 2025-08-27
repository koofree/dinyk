"use client";

import { SimpleProductCard } from "@/components/insurance/SimpleProductCard";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type {
    ProductMetadata
} from "@dinsure/contracts";
import {
    ACTIVE_NETWORK,
    ORACLE_ROUTE_ID_TO_TYPE,
    useContracts,
    useProductManagement,
    useWeb3
} from "@dinsure/contracts";

// Using any types to avoid TypeScript conflicts
export interface Product {
  productId: number;
  asset: "BTC" | "ETH" | "KAIA";
  tranches: Tranche[];
  metadata: ProductMetadata;
  active: boolean;  
  createdAt: number;
  updatedAt: number;
  trancheIds: number[];
}

export interface Tranche {
  trancheId: number;
  productId: number;
  triggerType?: number;
  premiumRateBps: number;
  threshold: string;
  active: boolean;
  isExpired?: boolean;
  availableCapacity?: bigint;
  utilizationRate?: number;
  maturityDays?: number;
  trancheCap?: string;
  perAccountMin?: string;
  perAccountMax?: string;
  oracleRouteId?: number;
  createdAt?: number;
  updatedAt?: number;
  pairType?: 'BTC-USDT' | 'ETH-USDT' | 'KAIA-USDT';
}

export default function InsurancePage() {
  const { isConnected } = useWeb3();
  const { isInitialized } = useContracts();
  
  const { getProducts, getActiveTranches } = useProductManagement();
  const { productCatalog } = useContracts();
  const [products, setProducts] = useState<Product[]>([]);
  const [tranches, setTranches] = useState<Tranche[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<Error | null>(null);
  const router = useRouter();

  // Fetch products and tranches
  useEffect(() => {
    const fetchData = async () => {
      if (!isInitialized) {
        console.log("Waiting for initialization:", {
          isInitialized,
          productCatalog: !!productCatalog,
        });
        return;
      }

      setProductsLoading(true);
      setProductsError(null);

      try {
        console.log("Starting optimized data fetch...");

        // Step 1: Get all active tranche IDs first
        console.log("Fetching active tranche IDs...");
        const activeTrancheIds = await getActiveTranches();
        console.log("Active tranche IDs:", activeTrancheIds);

        // Step 2: Fetch tranche details in batches of 10
        console.log("Fetching tranche details in batches of 10...");
        const BATCH_SIZE = 10;
        const fetchedTranches: Tranche[] = [];
        
        if (!productCatalog) {
          console.error("Product catalog not available");
          return;
        }
        
        for (let i = 0; i < activeTrancheIds.length; i += BATCH_SIZE) {
          const batch = activeTrancheIds.slice(i, i + BATCH_SIZE);
          console.log(`Fetching batch ${Math.floor(i / BATCH_SIZE) + 1}:`, batch);
          
          const batchPromises = batch.map(async (id) => {
            try {
              console.log(`Fetching tranche ${id}...`);
              const tranche = await productCatalog.getTranche(id);
              console.log(`Tranche ${id} fetched:`, tranche);

              return {
                trancheId: Number(tranche.trancheId),
                productId: Number(tranche.productId),
                triggerType: Number(tranche.triggerType),
                threshold: tranche.threshold.toString(),
                premiumRateBps: Number(tranche.premiumRateBps),
                maturityDays: 30, // Default value since property doesn't exist
                trancheCap: tranche.trancheCap.toString(),
                perAccountMin: tranche.perAccountMin.toString(),
                perAccountMax: tranche.perAccountMax.toString(),
                oracleRouteId: Number(tranche.oracleRouteId),
                active: tranche.active !== false,
                isExpired: false,
                availableCapacity: BigInt(0),
                utilizationRate: 0,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                pairType: ORACLE_ROUTE_ID_TO_TYPE[tranche.oracleRouteId as unknown as keyof typeof ORACLE_ROUTE_ID_TO_TYPE] as unknown as 'BTC-USDT' | 'ETH-USDT' | 'KAIA-USDT',
              } as Tranche;
            } catch (err) {
              console.error(`Error fetching tranche ${id}:`, err);
              return null;
            }
          });

          const batchResults = await Promise.all(batchPromises);
          const validTranches = batchResults.filter(Boolean) as Tranche[];
          fetchedTranches.push(...validTranches);
          
          console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} completed. Fetched ${validTranches.length} tranches.`);
        }
        console.log("All tranches fetched:", fetchedTranches);
        setTranches(fetchedTranches);

        // Step 3: Group tranches by product ID
        const tranchesByProduct = fetchedTranches.reduce((acc, tranche) => {
          const productId = tranche.productId;
          acc[productId] ??= [];
          acc[productId].push(tranche);
          return acc;
        }, {} as Record<number, Tranche[]>);

        console.log("Tranches grouped by product:", tranchesByProduct);

        // Step 4: Fetch products and map them to their tranches
        try {
          const fetchedProducts = await getProducts();
          console.log("Raw products fetched:", fetchedProducts);

          // Map products to their tranches using the grouped data
          const productsWithTranches: Product[] = fetchedProducts.map((product) => {
            const productTranches = tranchesByProduct[product.productId] ?? [];
            const asset = productTranches.map(t => t.pairType)[0]?.split("-")[0] as "BTC" | "ETH" | "KAIA";
            return {
              ...product,
              asset,
              tranches: productTranches,
              trancheIds: productTranches.map(t => t.trancheId),
              metadata: {} as ProductMetadata,
            };
          });

          setProducts(productsWithTranches);
        } catch (productError) {
          console.error("Error fetching products:", productError);
          // If products fail, create product objects from tranche data
          const productIds = [...new Set(fetchedTranches.map(t => t.productId))];
          const productsFromTranches: Product[] = productIds.map(productId => ({
            productId,
             
            asset: tranchesByProduct[productId]?.map(t => t.pairType)[0]?.split("-")[0] as "BTC" | "ETH" | "KAIA",
            tranches: tranchesByProduct[productId] ?? [],
            metadata: {} as ProductMetadata,
            active: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            trancheIds: tranchesByProduct[productId]?.map(t => t.trancheId) ?? []
          }));
          setProducts(productsFromTranches);
        }

      } catch (error) {
        console.error("Error in fetchData:", error);
        setProductsError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        setProductsLoading(false);
      }
    };

    void fetchData();
  }, [isInitialized, getProducts, getActiveTranches, productCatalog]);

  const handleViewTranches = (productId: number) => {
    // Navigate to tranche page filtered by product
    router.push(`/tranches?productId=${productId}`);
  };

  const handleViewTrancheDetail = (productId: number, trancheIndex: number) => {
    // Navigate to specific tranche detail page
    router.push(`/tranches/${productId}/${trancheIndex}`);
  };

  // Debug logging
  useEffect(() => {
    console.log("Insurance Page Debug:", {
      isConnected,
      isInitialized,
      productsLoading,
      productsError,
      productsCount: products.length,
      products,
      tranchesCount: tranches.length,
    });
  }, [
    isConnected,
    isInitialized,
    productsLoading,
    productsError,
    products,
    tranches,
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="w-full py-12 lg:py-24">
        {/* Debug Info */}
                    <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-500">
          Debug: isInitialized={String(isInitialized)} | productsLoading=
          {String(productsLoading)} | products={products.length} | tranches=
          {tranches.length} | error={productsError ? "Yes" : "No"}
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-16">
            <h1 className="mobile:text-[42px] font-display mb-4 break-words text-[40px] font-bold leading-tight text-gray-900">
              Protect Your Assets,
              <br />
              Secure Your Future
            </h1>
            <p className="mobile:text-[20px] mb-8 break-words text-[18px] leading-tight text-gray-600">
              <span className="bg-gradient-to-r from-[#86D99C] to-[#00B1B8] bg-clip-text font-bold text-transparent">
                As an insurance buyer
              </span>
              , you can protect
              <br />
              yourself against the risks of asset price fluctuations.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-600">
              ● Connected to {ACTIVE_NETWORK.name}
            </span>
            <a
              href={`${ACTIVE_NETWORK.blockExplorer}/address/${ACTIVE_NETWORK.contracts.ProductCatalog}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              View Contracts ↗
            </a>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="font-display mb-4 text-[30px] font-bold text-gray-900">
            Insurance Catalog
          </h2>
          <p className="mb-8 text-gray-600">
            Choose from our parametric insurance products to protect your crypto
            assets
          </p>
          <div className="h-px w-full bg-gray-200"></div>
        </div>

        {/* Product Error */}
        {productsError && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <div className="text-xl text-red-500">⚠️</div>
              <div>
                <h3 className="font-medium text-red-700">Loading Error</h3>
                <p className="text-sm text-red-600">
                  {productsError.message ?? "Unknown error"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {productsLoading && isInitialized && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#00B1B8]"></div>
            <div className="text-gray-600">Loading insurance products...</div>
          </div>
        )}

        {/* Products Grid */}
        {!productsLoading && isInitialized  && (
          <>
            <div className="space-y-8">
              {(() => {
                // Group products by asset type
                const groupedProducts = products.reduce((acc, product) => {
                  const asset = product.asset;
                  if (!acc[asset]) {
                    acc[asset] = [];
                  }
                  acc[asset].push(product);
                  return acc;
                }, {} as Record<string, Product[]>);

                return Object.entries(groupedProducts).map(([asset, assetProducts], index) => (
                  <div key={asset}>
                    {/* Asset Section Header */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-900">{asset} Insurance Products</h3>
                    </div>
                    
                    {/* Products Grid for this asset */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {assetProducts.map((product) => (
                        <SimpleProductCard
                          key={product.productId}
                          product={product}
                          tranches={product.tranches ?? tranches}
                          onViewTranches={() => handleViewTranches(product.productId)}
                        />
                      ))}
                    </div>
                    
                    {/* Divider between asset types (except for the last one) */}
                    {index < Object.keys(groupedProducts).length - 1 && (
                      <div className="mt-8 h-px w-full bg-gray-200"></div>
                    )}
                  </div>
                ));
              })()}
            </div>

            {products.length === 0 && tranches.length > 0 && (
              <div className="space-y-6">
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-700">
                    ⚠️ Products not loading, showing {tranches.length} active
                    tranches directly
                  </p>
                </div>
                <div className="space-y-8">
                  {(() => {
                    // Group tranches by asset type
                    const groupedTranches = tranches.reduce((acc, tranche) => {
                      const asset = tranche.pairType?.split("-")[0] || "Unknown";
                      if (!acc[asset]) {
                        acc[asset] = [];
                      }
                      acc[asset].push(tranche);
                      return acc;
                    }, {} as Record<string, Tranche[]>);

                    return Object.entries(groupedTranches).map(([asset, assetTranches], index) => (
                      <div key={asset}>
                        {/* Asset Section Header */}
                        <div className="mb-6">
                          <h3 className="text-2xl font-bold text-gray-900">{asset} Insurance Products</h3>
                        </div>
                        
                        {/* Tranches Grid for this asset */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {assetTranches.map((tranche) => (
                            <div
                              key={tranche.trancheId}
                              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                            >
                              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                Tranche #{tranche.trancheId}
                              </h3>
                              <div className="space-y-2 text-sm">
                                <p className="text-gray-600">
                                  Product ID:{" "}
                                  <span className="font-medium text-gray-900">
                                    {tranche.productId}
                                  </span>
                                </p>
                                <p className="text-gray-600">
                                  Premium Rate:{" "}
                                  <span className="font-medium text-gray-900">
                                    {tranche.premiumRateBps / 100}%
                                  </span>
                                </p>
                                {tranche.triggerType !== undefined && (
                                  <p className="text-gray-600">
                                    Trigger:{" "}
                                    <span className="font-medium text-gray-900">
                                      {tranche.triggerType === 0
                                        ? "Price Below"
                                        : "Price Above"}
                                    </span>
                                  </p>
                                )}
                                <p className="text-gray-600">
                                  Threshold:{" "}
                                  <span className="font-medium text-gray-900">
                                    ${tranche.threshold}
                                  </span>
                                </p>
                                <p className="text-gray-600">
                                  Pool:{" "}
                                  <span className="text-sm text-[#00B1B8]">
                                    {tranche.poolAddress ? tranche.poolAddress : "Not deployed"}
                                  </span>
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  // If we have productId, navigate to the tranche detail page
                                  if (tranche.productId) {
                                    // Assuming trancheId encodes the index, we can extract it
                                    handleViewTrancheDetail(
                                      tranche.productId,
                                      tranche.trancheId % 10,
                                    );
                                  } else {
                                    router.push(
                                      `/tranches?trancheId=${tranche.trancheId}`,
                                    );
                                  }
                                }}
                                className="mt-4 rounded-xl bg-gradient-to-br from-[#86D99C] to-[#00B1B8] px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-95"
                              >
                                View Details
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Divider between asset types (except for the last one) */}
                        {index < Object.keys(groupedTranches).length - 1 && (
                          <div className="mt-8 h-px w-full bg-gray-200"></div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {products.length === 0 && tranches.length === 0 && (
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center">
                <div className="mb-4 text-4xl text-yellow-400">📋</div>
                <div className="mb-2 text-lg font-medium text-gray-300">
                  No Insurance Products Available
                </div>
                <p className="mb-4 text-sm text-gray-400">
                  There are currently no active insurance products on the smart
                  contracts.
                </p>
                <div className="space-y-1 text-sm text-gray-500">
                  <p>Contract: {ACTIVE_NETWORK.contracts.ProductCatalog}</p>
                  <p>Network: Kaia Testnet (Chain ID: 1001)</p>
                </div>
                {productsError && (
                  <div className="mt-4 rounded border border-red-600 bg-red-900/20 p-3 text-sm text-red-400">
                    Error:{" "}
                    {productsError ? productsError.message : "Failed to fetch products"}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
