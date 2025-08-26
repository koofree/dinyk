import { useCallback } from "react";

import { useContracts } from "./useContracts";

export interface ProductSpec {
  productId: number;
  name: string;
  metadataHash: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  trancheIds: number[];
  [key: string]: string | number | boolean | number[]; // for additional fields
}

export interface RegisterProductParams {
  name: string;
  description: string;
}

export interface RegisterTrancheParams {
  productId: number;
  name: string;
  triggerType: 0 | 1; // 0: PRICE_BELOW, 1: PRICE_ABOVE
  threshold: string; // Price in USD
  premiumRateBps: number; // Basis points (e.g., 200 = 2%)
  trancheCap: string; // Max capacity in USDT
  maturityDays: number; // Days until maturity
  perAccountMin: string; // Min purchase in USDT
  perAccountMax: string; // Max purchase in USDT
  oracleRouteId?: number; // 1: BTC, 2: ETH, 3: KAIA
}

export function useProductManagement() {
  const { productCatalog } = useContracts();

  // Get all products
  const getProducts = useCallback(async (): Promise<ProductSpec[]> => {
    if (!productCatalog) throw new Error("Product catalog not initialized");

    // Get active product IDs using the correct function
    console.log("[useProductManagement] Getting active product IDs");
    let activeProductIds: bigint[] = [];
    try {
      activeProductIds = await productCatalog.getActiveProducts();
    } catch (error) {
      console.error("Error fetching active products:", error);
      // If getActiveProducts fails, try known product IDs
      console.log("[useProductManagement] Falling back to known product IDs");
      activeProductIds = [1n, 2n, 3n, 4n, 5n];
    }

    console.log(
      "[useProductManagement] Product IDs to fetch:",
      activeProductIds.map((id) => Number(id)),
    );

    const products: any[] = [];

    // Fetch each product with better error handling
    for (const productId of activeProductIds) {
      try {
        let product;

        try {
          // Try getProduct function
          product = await productCatalog.getProduct(Number(productId));
          console.log(
            `[useProductManagement] getProduct(${productId}) succeeded`,
          );
        } catch (getProductError: unknown) {
          // Check if it's a contract revert (product doesn't exist)
          if (
            (getProductError as any)?.code === "CALL_EXCEPTION" ||
            (getProductError as any)?.message?.includes("revert")
          ) {
            console.log(
              `[useProductManagement] Product ${productId} does not exist on-chain, skipping`,
            );
            continue;
          }

          // Try fallback to products mapping
          console.log(
            `[useProductManagement] Trying products mapping for ${productId}`,
          );
          try {
            product = await productCatalog.products(Number(productId));
            console.log(
              `[useProductManagement] products(${productId}) succeeded as fallback`,
            );
          } catch (mappingError: unknown) {
            if (mappingError instanceof Error) {
              console.log(
                `[useProductManagement] Both methods failed for product ${productId}, skipping`,
              );
              continue;
            }
          }
        }

        // Validate product data
        if (product.productId && Number(product.productId) !== 0) {
          console.log(
            `[useProductManagement] Valid product ${productId} found`,
          );

          // Define a type for processed product

          // Map the product to the ProcessedProduct type
          const processedProduct: ProductSpec = {
            productId: Number(product.productId),
            name: `Product ${Number(product.productId)}`,
            metadataHash: product.metadataHash || "",
            active: product.active !== false,
            createdAt: product.createdAt ? Number(product.createdAt) : 0,
            updatedAt: product.updatedAt ? Number(product.updatedAt) : 0,
            trancheIds: Array.isArray(product.trancheIds)
              ? product.trancheIds.map((id: bigint) => Number(id))
              : [],
          };

          // Map any additional fields (excluding the known ones)
          Object.entries(product).forEach(([key, value]) => {
            if (
              ![
                "productId",
                "metadataHash",
                "active",
                "createdAt",
                "updatedAt",
                "trancheIds",
              ].includes(key)
            ) {
              if (typeof value === "bigint") {
                processedProduct[key] = value.toString();
              } else {
                processedProduct[key] = value;
              }
            }
          });
          products.push(processedProduct);
        }
      } catch (productError: unknown) {
        if (productError instanceof Error) {
          console.warn(
            `[useProductManagement] Unexpected error fetching product ${productId}:`,
            productError.message,
          );
        }
        // Continue with next product
      }
    }

    console.log(
      `[useProductManagement] Successfully fetched ${products.length} products`,
    );
    return products;
  }, [productCatalog]);

  // Get tranches for a product
  const getProductTranches = useCallback(
    async (productId: number) => {
      if (!productCatalog) throw new Error("Product catalog not initialized");

      try {
        const tranches = await productCatalog.getProductTranches(productId);
        return tranches.map((id) => Number(id));
      } catch (error) {
        console.error("Error fetching product tranches:", error);
        throw error;
      }
    },
    [productCatalog],
  );

  // Get all active tranches
  const getActiveTranches = useCallback(async () => {
    if (!productCatalog) throw new Error("Product catalog not initialized");

    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `[useProductManagement] Attempt ${attempt}/${maxRetries}: Calling getActiveTranches on contract:`,
          productCatalog.getAddress(),
        );

        const tranches = await productCatalog.getActiveTranches();
        console.log(`[useProductManagement] Raw tranches result:`, tranches);

        const mappedTranches = tranches.map((id) => Number(id));
        console.log(`[useProductManagement] Mapped tranches:`, mappedTranches);

        return mappedTranches;
      } catch (error) {
        console.error(
          `[useProductManagement] Attempt ${attempt} failed:`,
          error,
        );

        // If this is the last attempt, return empty array instead of throwing
        if (attempt === maxRetries) {
          console.warn(
            "[useProductManagement] All attempts failed, returning empty array as fallback",
          );
          return [];
        }

        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }

    console.warn("[useProductManagement] Returning empty array as fallback");
    return [];
  }, [productCatalog]);

  return {
    // Product operations
    getProducts,

    // Tranche operations
    getProductTranches,
    getActiveTranches,
  };
}
