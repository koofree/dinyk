import { ethers } from "ethers";

import type { ProductCatalog, TranchePoolFactory } from "../types/generated";
import type {
  Product,
  ProductMetadata,
  Round,
  Tranche,
  TriggerType,
} from "../types/products";
import { ACTIVE_NETWORK } from "../config/constants";
import {
  ProductCatalog__factory,
  TranchePoolCore__factory,
  TranchePoolFactory__factory,
} from "../types/generated";
import { RoundState } from "../types/products";

export class ProductCatalogService {
  public readonly contract: ProductCatalog;
  private readonly poolFactory: TranchePoolFactory;
  private isProviderHealthy = true;

  constructor(
    private contractAddress: string,
    private provider: ethers.Provider,
  ) {
    this.contract = ProductCatalog__factory.connect(contractAddress, provider);
    this.poolFactory = TranchePoolFactory__factory.connect(
      ACTIVE_NETWORK.contracts.TranchePoolFactory,
      provider,
    );

    // Test provider health on construction
    void this.checkProviderHealth();
  }

  private async checkProviderHealth(): Promise<boolean> {
    try {
      // Simple health check - try to get the network
      await this.provider.getNetwork();
      this.isProviderHealthy = true;
      return true;
    } catch (error) {
      console.warn(
        "[ProductCatalogService] Provider health check failed:",
        error,
      );
      this.isProviderHealthy = false;
      return false;
    }
  }

  // Get all active product IDs
  async getActiveProductIds(): Promise<number[]> {
    try {
      // Check provider health before making calls
      if (!this.isProviderHealthy) {
        const healthy = await this.checkProviderHealth();
        if (!healthy) {
          console.warn(
            "[ProductCatalogService] Provider not healthy, returning empty array",
          );
          return [];
        }
      }

      const getActiveProducts = this.contract
        .getActiveProducts as () => Promise<bigint[]>;
      const ids = await getActiveProducts();

      console.log(
        "Raw product IDs from contract:",
        ids.map((id) => Number(id)),
      );

      return ids.map((id: bigint) => Number(id));
    } catch (error) {
      console.error("Failed to get active products:", error);
      this.isProviderHealthy = false;
      return [];
    }
  }

  // Get all active tranche IDs
  async getActiveTrancheIds(): Promise<number[]> {
    try {
      const getActiveTranches = this.contract
        .getActiveTranches as () => Promise<bigint[]>;
      const ids = await getActiveTranches();
      return ids.map((id: bigint) => Number(id));
    } catch (error) {
      console.error("Failed to get active tranches:", error);
      return [];
    }
  }

  // Get product details with proper struct handling
  async getProduct(productId: number): Promise<Product | null> {
    try {
      const productData = await this.contract.getProduct(productId);

      // Check if the product data is valid (productId should match and not be 0)
      if (
        Number(productData.productId) === 0 ||
        Number(productData.productId) !== productId
      ) {
        console.warn(`Product ${productId} does not exist on-chain`);
        return null;
      }

      // Product struct includes trancheIds array
      const trancheIds = productData.trancheIds;

      // Fetch all tranches for this product
      const tranches = await Promise.all(
        trancheIds.map((id: bigint) => this.getTranche(Number(id))),
      );

      return {
        productId: Number(productData.productId),
        metadataHash: productData.metadataHash,
        active: productData.active,
        createdAt: Number(productData.createdAt),
        updatedAt: Number(productData.updatedAt),
        tranches: tranches as Tranche[],
        metadata: this.parseMetadata(
          productData.metadataHash,
          Number(productData.productId),
        ),
      };
    } catch (error) {
      // Check if it's a contract revert error (product doesn't exist)
      const errorWithCode = error as { code?: string; message?: string };
      if (
        errorWithCode.code === "CALL_EXCEPTION" ||
        errorWithCode.message?.includes("revert")
      ) {
        console.warn(`Product ${productId} does not exist on contract`);
      } else {
        console.error(
          `Error fetching product ${productId}:`,
          errorWithCode.message ?? error,
        );
      }
      return null;
    }
  }

  // Get tranche details with TrancheSpec structure
  async getTranche(trancheId: number): Promise<Tranche | null> {
    try {
      const trancheData = await this.contract.getTranche(trancheId);

      // Get current round for this tranche if it has rounds
      let currentRound: Round | undefined;
      const roundIds = trancheData.roundIds;

      if (roundIds.length > 0) {
        // Get the latest round (assuming last in array is most recent)
        const latestRoundId = roundIds[roundIds.length - 1];
        try {
          const roundData = await this.contract.getRound(Number(latestRoundId));
          currentRound = this.parseRound(roundData);
        } catch {
          console.log(`No round data for round ${latestRoundId}`);
        }
      }

      const now = Math.floor(Date.now() / 1000);
      const maturityTimestamp = Number(trancheData.maturityTimestamp);
      const isExpired = maturityTimestamp <= now;

      // Parse amounts - handle USDT with 6 decimals
      const perAccountMin = BigInt(trancheData.perAccountMin);
      const perAccountMax = BigInt(trancheData.perAccountMax);
      const trancheCap = BigInt(trancheData.trancheCap);

      // Get real pool data for utilization and availability
      const poolData = await this.getPoolData(Number(trancheData.trancheId));

      return {
        trancheId: Number(trancheData.trancheId),
        productId: Number(trancheData.productId),
        triggerType: Number(trancheData.triggerType) as TriggerType,
        threshold: BigInt(trancheData.threshold), // Price threshold in wei
        maturityTimestamp: maturityTimestamp,
        maturityDays: Math.max(
          0,
          Math.floor((maturityTimestamp - now) / 86400),
        ),
        premiumRateBps: Number(trancheData.premiumRateBps),
        perAccountMin: perAccountMin,
        perAccountMax: perAccountMax,
        trancheCap: trancheCap,
        oracleRouteId: Number(trancheData.oracleRouteId),
        poolAddress: poolData.poolAddress,
        active: trancheData.active,
        createdAt: Number(trancheData.createdAt),
        updatedAt: Number(trancheData.updatedAt),
        rounds: roundIds.map((id: bigint) => Number(id)),
        currentRound,
        isExpired,
        availableCapacity: poolData.availableCapacity,
        utilizationRate: poolData.utilizationRate,
      };
    } catch (error) {
      console.error(`Failed to get tranche ${trancheId}:`, error);
      return null;
    }
  }

  // Get round details
  async getRound(roundId: number): Promise<Round | null> {
    try {
      const roundData = await this.contract.getRound(roundId);
      return this.parseRound(roundData);
    } catch (error) {
      console.error(`Failed to get round ${roundId}:`, error);
      return null;
    }
  }

  // Get all products with their tranches
  async getAllActiveProducts(): Promise<Product[]> {
    try {
      console.log(
        "ProductCatalogService: Getting active products from",
        this.contractAddress,
      );
      const productIds = await this.getActiveProductIds();
      console.log("Valid product IDs to fetch:", productIds);

      if (productIds.length === 0) {
        console.log("No valid active product IDs found");
        // Try to fetch known products directly (1-5 are typically registered)
        const knownProductIds = [1, 2, 3, 4, 5];
        console.log("Attempting to fetch known products:", knownProductIds);

        const knownProducts = await Promise.all(
          knownProductIds.map((id) => this.getProduct(id)),
        );

        const validKnownProducts = knownProducts.filter(
          (p): p is Product => p !== null,
        );
        if (validKnownProducts.length > 0) {
          console.log(`Found ${validKnownProducts.length} known products`);
          return validKnownProducts;
        }
      }

      // Fetch products in parallel with error handling for each
      const productResults = await Promise.all(
        productIds.map(async (id) => {
          try {
            return await this.getProduct(id);
          } catch (error) {
            console.warn(`Skipping product ${id} due to error:`, error);
            return null;
          }
        }),
      );

      const products = productResults.filter((p): p is Product => p !== null);

      console.log(`Successfully fetched ${products.length} products`);

      // If no products found through getActiveProducts, try known IDs as fallback
      if (products.length === 0) {
        console.log(
          "No products found through active IDs, trying known product IDs as fallback",
        );
        const fallbackIds = [1, 2, 3, 4, 5];
        const fallbackProductResults = await Promise.all(
          fallbackIds.map((id) => this.getProduct(id)),
        );
        const fallbackProducts = fallbackProductResults.filter(
          (p): p is Product => p !== null,
        );
        return fallbackProducts;
      }

      return products;
    } catch (error) {
      console.error("Failed to get all active products:", error);
      // Return empty array instead of crashing
      return [];
    }
  }

  // Get pool data for a tranche
  private async getPoolData(trancheId: number): Promise<{
    poolAddress: string;
    availableCapacity: bigint;
    utilizationRate: number;
  }> {
    try {
      // Get pool address from factory
      const getTranchePool = this.poolFactory.getTranchePool as (
        trancheId: number,
      ) => Promise<string>;
      const poolAddress = await getTranchePool(trancheId);

      if (poolAddress === ethers.ZeroAddress) {
        console.log(`No pool found for tranche ${trancheId}`);
        return {
          poolAddress: ethers.ZeroAddress,
          availableCapacity: 0n,
          utilizationRate: 0,
        };
      }

      // Get pool contract
      const pool = TranchePoolCore__factory.connect(poolAddress, this.provider);

      // Get pool accounting data
      const poolAccounting = await pool.getPoolAccounting();

      // Calculate metrics
      const totalAssets = poolAccounting.totalAssets;
      const lockedAssets = poolAccounting.lockedAssets;
      const availableCapacity = totalAssets - lockedAssets;

      const utilizationRate =
        totalAssets > 0
          ? Number((lockedAssets * 10000n) / totalAssets) / 100 // Convert to percentage with 2 decimal precision
          : 0;

      // Only log pool data in debug mode or remove entirely to reduce console spam
      // console.log(`Pool ${trancheId}: Total=${ethers.formatUnits(totalAssets, 6)} USDT, Locked=${ethers.formatUnits(lockedAssets, 6)} USDT, Available=${ethers.formatUnits(availableCapacity, 6)} USDT, Utilization=${utilizationRate.toFixed(2)}%`);

      return {
        poolAddress,
        availableCapacity,
        utilizationRate,
      };
    } catch (error) {
      console.warn(`Failed to get pool data for tranche ${trancheId}:`, error);
      return {
        poolAddress: ethers.ZeroAddress,
        availableCapacity: 0n,
        utilizationRate: 0,
      };
    }
  }

  // Parse round data from contract
  private parseRound(roundData: ProductCatalog.RoundStructOutput): Round {
    const now = Math.floor(Date.now() / 1000);
    const state = Number(roundData.state) as RoundState;
    const salesEndTime = Number(roundData.salesEndTime);
    const salesStartTime = Number(roundData.salesStartTime);

    return {
      roundId: Number(roundData.roundId),
      trancheId: Number(roundData.trancheId),
      salesStartTime: salesStartTime,
      salesEndTime: salesEndTime,
      state,
      totalBuyerPurchases: roundData.totalBuyerPurchases,
      totalSellerCollateral: roundData.totalSellerCollateral,
      matchedAmount: roundData.matchedAmount,
      createdAt: Number(roundData.createdAt),
      stateChangedAt: Number(roundData.stateChangedAt),
      isOpen:
        state === RoundState.OPEN &&
        salesEndTime > now &&
        salesStartTime <= now,
      startTime: salesStartTime,
      endTime: salesEndTime,
    };
  }

  // Parse metadata hash to readable format
  private parseMetadata(
    metadataHash: string,
    productId?: number,
  ): ProductMetadata {
    try {
      // Remove 0x prefix and trailing zeros
      const cleanHash = metadataHash.replace(/^0x/, "").replace(/0+$/, "");

      // Try to convert hex to ASCII string
      let metadataString = "";
      for (let i = 0; i < cleanHash.length; i += 2) {
        const byte = parseInt(cleanHash.substring(i, i + 2), 16);
        if (byte === 0) break;
        if (byte >= 32 && byte <= 126) {
          // Printable ASCII
          metadataString += String.fromCharCode(byte);
        }
      }

      console.log("Parsed metadata string:", metadataString);

      // Check for known metadata patterns or use productId-based defaults
      if (
        metadataString.includes("BTC") ||
        metadataString.includes("Bitcoin") ||
        productId === 1
      ) {
        return {
          name: "Bitcoin Price Protection",
          description: "Parametric insurance for BTC price movements",
          category: "Crypto",
          underlyingAsset: "BTC",
          riskLevel: "MEDIUM" as const,
          tags: ["crypto", "btc", "price-protection"],
        };
      }

      if (
        metadataString.includes("ETH") ||
        metadataString.includes("Ethereum") ||
        productId === 2
      ) {
        return {
          name: "Ethereum Price Protection",
          description: "Parametric insurance for ETH price movements",
          category: "Crypto",
          underlyingAsset: "ETH",
          riskLevel: "MEDIUM" as const,
          tags: ["crypto", "eth", "price-protection"],
        };
      }

      // Product ID based defaults for common insurance types
      const productDefaults: Record<number, ProductMetadata> = {
        3: {
          name: "Solana Price Protection",
          description: "Parametric insurance for SOL price movements",
          category: "Crypto",
          underlyingAsset: "SOL",
          riskLevel: "HIGH" as const,
          tags: ["crypto", "sol", "price-protection"],
        },
        4: {
          name: "KAIA Price Protection",
          description: "Parametric insurance for KAIA price movements",
          category: "Crypto",
          underlyingAsset: "KAIA",
          riskLevel: "MEDIUM" as const,
          tags: ["crypto", "kaia", "price-protection"],
        },
        5: {
          name: "DeFi Protocol Coverage",
          description: "Smart contract risk insurance for DeFi protocols",
          category: "DeFi",
          underlyingAsset: "DEFI",
          riskLevel: "HIGH" as const,
          tags: ["defi", "smart-contract", "protocol-coverage"],
        },
      };

      if (productId && productDefaults[productId]) {
        return productDefaults[productId];
      }

      // If metadata string is gibberish but we have a productId, generate a clean name
      if (
        productId &&
        (!metadataString || metadataString.match(/[^a-zA-Z0-9\s-]/g))
      ) {
        return {
          name: `Crypto Insurance #${productId}`,
          description:
            "Parametric insurance for cryptocurrency price protection",
          category: "Crypto",
          underlyingAsset: "CRYPTO",
          riskLevel: "MEDIUM" as const,
          tags: ["insurance", "parametric", "crypto"],
        };
      }

      // Default metadata
      return {
        name:
          metadataString && !metadataString.match(/[^a-zA-Z0-9\s-]/g)
            ? metadataString
            : "Crypto Price Insurance",
        description: "Parametric insurance product on Kaia",
        category: "General",
        underlyingAsset: "CRYPTO",
        riskLevel: "MEDIUM" as const,
        tags: ["insurance", "parametric"],
      };
    } catch (error) {
      console.error("Error parsing metadata:", error);
      return {
        name: productId
          ? `Crypto Insurance #${productId}`
          : "Crypto Price Insurance",
        description: "Parametric insurance product",
        category: "General",
        underlyingAsset: "UNKNOWN",
        riskLevel: "MEDIUM" as const,
        tags: ["insurance"],
      };
    }
  }

  // Helper to format threshold price for display
  formatThresholdPrice(threshold: bigint, decimals = 18): string {
    try {
      return ethers.formatUnits(threshold, decimals);
    } catch {
      return "0";
    }
  }
}
