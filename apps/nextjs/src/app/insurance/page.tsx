"use client";

import { SimpleProductCard } from "@/components/insurance/SimpleProductCard";
import { KAIA_TESTNET } from "@/lib/constants";
import {
  useContractFactory,
  useContracts,
  useProductManagement,
  useWeb3,
} from "@dinsure/contracts";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Using any types to avoid TypeScript conflicts
type Product = any;
type Tranche = any;

export default function InsurancePage() {
  const { isConnected } = useWeb3();
  const { isInitialized, error: contractError } = useContracts();
  const factory = useContractFactory();
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
      if (!isInitialized || !productCatalog) {
        console.log("Waiting for initialization:", {
          isInitialized,
          productCatalog: !!productCatalog,
        });
        return;
      }

      setProductsLoading(true);
      setProductsError(null);

      try {
        console.log("Starting data fetch...");

        // Fetch products
        console.log("Fetching products...");
        try {
          const fetchedProducts = await getProducts();
          console.log("Raw products fetched:", fetchedProducts);
          
          // For each product, fetch its tranches
          const productsWithTranches = await Promise.all(
            fetchedProducts.map(async (product) => {
              try {
                // Get tranches for this product (assuming max 5 tranches per product)
                const productTranches = [];
                for (let i = 0; i < 5; i++) {
                  try {
                    const tranche = await (productCatalog as any).tranches(
                      BigInt(product.productId) * 10n + BigInt(i)
                    );
                    if (tranche?.active) {
                      productTranches.push({
                        trancheId: Number(BigInt(product.productId) * 10n + BigInt(i)),
                        productId: product.productId,
                        index: i,
                        premiumRateBps: Number(tranche.premiumRateBps || 0),
                        threshold: tranche.threshold?.toString() || "0",
                        poolAddress: tranche.poolAddress || "",
                        active: true
                      });
                    }
                  } catch (err) {
                    // No more tranches for this product
                    break;
                  }
                }
                return { ...product, tranches: productTranches };
              } catch (err) {
                console.error(`Error fetching tranches for product ${product.productId}:`, err);
                return { ...product, tranches: [] };
              }
            })
          );
          
          setProducts(productsWithTranches as Product[]);
          
          // Also collect all tranches
          const allTranches = productsWithTranches.flatMap(p => p.tranches || []);
          setTranches(allTranches);
        } catch (productError) {
          console.error("Error fetching products:", productError);
          // Continue to fetch tranches even if products fail
        }

        // Fetch active tranches
        console.log("Fetching active tranches...");
        let activeTrancheIds: number[] = [];
        try {
          activeTrancheIds = await getActiveTranches();
          console.log("Active tranche IDs:", activeTrancheIds);
        } catch (trancheError) {
          console.log("No active tranches found or function not available, using empty array");
          activeTrancheIds = [];
        }

        const trancheDetailsPromises = activeTrancheIds.map(async (id) => {
          try {
            console.log(`Fetching tranche ${id}...`);
            // The tranche ID includes both product and tranche index encoded
            // Try to fetch the tranche by its ID
            const tranche = await (productCatalog as any).tranches(id);
            console.log(`Tranche ${id} fetched:`, tranche);

            // Convert BigInt values to regular numbers for display
            return {
              trancheId: Number(tranche.trancheId || id),
              productId: Number(tranche.productId || 0),
              triggerType: Number(tranche.triggerType || 0),
              threshold: tranche.threshold?.toString() || "0",
              premiumRateBps: Number(tranche.premiumRateBps || 0),
              maturityDays: Number(tranche.maturityDays || 30),
              trancheCap: tranche.trancheCap?.toString() || "0",
              perAccountMin: tranche.perAccountMin?.toString() || "0",
              perAccountMax: tranche.perAccountMax?.toString() || "0",
              oracleRouteId: Number(tranche.oracleRouteId || 0),
              poolAddress: tranche.poolAddress || "",
              active: tranche.active !== false,
              isExpired: false,
              availableCapacity: BigInt(0),
              utilizationRate: 0,
            } as Tranche;
          } catch (err) {
            console.error(`Error fetching tranche ${id}:`, err);
            return null;
          }
        });

        const fetchedTranches = await Promise.all(trancheDetailsPromises);
        const validTranches = fetchedTranches.filter(
          (t: any) => t !== null,
        );
        console.log("Valid tranches:", validTranches);
        setTranches(validTranches);
      } catch (error) {
        console.error("Error in fetchData:", error);
        setProductsError(error as Error);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchData();
  }, [isInitialized, getProducts, getActiveTranches, productCatalog]);

  const handleViewTranches = (productId: number) => {
    // Navigate to tranche page filtered by product
    router.push(`/tranche?productId=${productId}`);
  };
  
  const handleViewTrancheDetail = (productId: number, trancheIndex: number) => {
    // Navigate to specific tranche detail page
    router.push(`/insurance/tranches/${productId}/${trancheIndex}`);
  };
  

  // Debug logging
  useEffect(() => {
    console.log("Insurance Page Debug:", {
      isConnected,
      isInitialized,
      contractError,
      productsLoading,
      productsError,
      productsCount: products.length,
      products,
      tranchesCount: tranches.length,
    });
  }, [
    isConnected,
    isInitialized,
    contractError,
    productsLoading,
    productsError,
    products,
    tranches,
  ]);

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Debug Info */}
        <div className="mb-4 rounded bg-gray-800 p-2 text-xs text-gray-400">
          Debug: isInitialized={String(isInitialized)} | productsLoading=
          {String(productsLoading)} | products={products.length} | tranches=
          {tranches.length} | error={productsError ? "Yes" : "No"}
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-white">
            Insurance Products
          </h1>
          <p className="text-gray-400">
            Overview of all available insurance products with aggregated
            statistics from all tranches
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-green-400">
              ● Connected to {KAIA_TESTNET.name}
            </span>
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
          <div className="mb-8 rounded-lg border border-red-600 bg-red-900 p-4">
            <div className="flex items-center gap-3">
              <div className="text-xl text-red-400">⚠️</div>
              <div>
                <h3 className="font-medium text-red-400">Contract Error</h3>
                <p className="text-sm text-red-300">{(contractError)?.message || "Unknown error"}</p>
                <code>{(contractError)?.stack || ""}</code>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {productsLoading && isInitialized && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-400"></div>
            <div className="text-gray-400">Loading insurance products...</div>
          </div>
        )}

        {/* Products Grid */}
        {!productsLoading && isInitialized && !contractError && (
          <>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {products.map((product: any) => (
                <SimpleProductCard
                  key={product.productId}
                  product={product}
                  tranches={product.tranches || tranches.filter(
                    (t: any) => t.productId === product.productId,
                  )}
                  onViewTranches={() => handleViewTranches(product.productId)}
                />
              ))}
            </div>

            {products.length === 0 && tranches.length > 0 && (
              <div className="space-y-6">
                <div className="rounded-lg border border-yellow-600 bg-yellow-900/20 p-4">
                  <p className="text-sm text-yellow-400">
                    ⚠️ Products not loading, showing {tranches.length} active
                    tranches directly
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {tranches.map((tranche) => (
                    <div
                      key={tranche.trancheId}
                      className="rounded-lg bg-gray-800 p-6"
                    >
                      <h3 className="mb-4 text-lg font-semibold text-white">
                        Tranche #{tranche.trancheId}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-400">
                          Product ID:{" "}
                          <span className="text-white">
                            {tranche.productId}
                          </span>
                        </p>
                        <p className="text-gray-400">
                          Premium Rate:{" "}
                          <span className="text-white">
                            {tranche.premiumRateBps / 100}%
                          </span>
                        </p>
                        <p className="text-gray-400">
                          Trigger:{" "}
                          <span className="text-white">
                            {tranche.triggerType === 0
                              ? "Price Below"
                              : "Price Above"}
                          </span>
                        </p>
                        <p className="text-gray-400">
                          Threshold:{" "}
                          <span className="text-white">
                            ${tranche.threshold}
                          </span>
                        </p>
                        <p className="text-gray-400">
                          Pool:{" "}
                          <span className="text-xs text-blue-400">
                            {tranche.poolAddress || "Not deployed"}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          // If we have productId, navigate to the tranche detail page
                          if (tranche.productId) {
                            // Assuming trancheId encodes the index, we can extract it
                            handleViewTrancheDetail(tranche.productId, tranche.trancheId % 10);
                          } else {
                            router.push(`/tranche?trancheId=${tranche.trancheId}`);
                          }
                        }}
                        className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        View Details
                      </button>
                    </div>
                  ))}
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
                <div className="space-y-1 text-xs text-gray-500">
                  <p>Contract: {KAIA_TESTNET.contracts.productCatalog}</p>
                  <p>Network: Kaia Testnet (Chain ID: 1001)</p>
                </div>
                {productsError && (
                  <div className="mt-4 rounded border border-red-600 bg-red-900/20 p-3 text-xs text-red-400">
                    Error:{" "}
                    {productsError?.message || "Failed to fetch products"}
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
