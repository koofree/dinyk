import { ethers } from 'ethers';
import ProductCatalogABI from '../abis/ProductCatalog.json';
import TranchePoolCoreABI from '../abis/TranchePoolCore.json';
import TranchePoolFactoryABI from '../abis/TranchePoolFactory.json';
import { Product, Tranche, Round, RoundState, TriggerType } from '../types/products';
import { KAIA_TESTNET_ADDRESSES } from '../config/addresses';

export class ProductCatalogService {
  public readonly contract: ethers.Contract;
  private readonly poolFactory: ethers.Contract;
  
  constructor(
    private contractAddress: string,
    private provider: ethers.Provider
  ) {
    this.contract = new ethers.Contract(contractAddress, ProductCatalogABI as any, provider);
    this.poolFactory = new ethers.Contract(
      KAIA_TESTNET_ADDRESSES.TranchePoolFactory,
      TranchePoolFactoryABI as any,
      provider
    );
  }

  // Get all active product IDs
  async getActiveProductIds(): Promise<number[]> {
    try {
      const getActiveProducts = this.contract.getActiveProducts as () => Promise<bigint[]>;
      const ids = await getActiveProducts();
      return ids.map((id: bigint) => Number(id));
    } catch (error) {
      console.error('Failed to get active products:', error);
      return [];
    }
  }

  // Get all active tranche IDs
  async getActiveTrancheIds(): Promise<number[]> {
    try {
      const getActiveTranches = this.contract.getActiveTranches as () => Promise<bigint[]>;
      const ids = await getActiveTranches();
      return ids.map((id: bigint) => Number(id));
    } catch (error) {
      console.error('Failed to get active tranches:', error);
      return [];
    }
  }

  // Get product details with proper struct handling
  async getProduct(productId: number): Promise<Product | null> {
    try {
      const getProduct = this.contract.getProduct as (id: number) => Promise<any>;
      const productData = await getProduct(productId);
      
      // Product struct includes trancheIds array
      const trancheIds = productData.trancheIds || [];
      
      // Fetch all tranches for this product
      const tranches = await Promise.all(
        trancheIds.map((id: bigint) => this.getTranche(Number(id)))
      );
      
      return {
        productId: Number(productData.productId),
        metadataHash: productData.metadataHash,
        active: productData.active,
        createdAt: Number(productData.createdAt),
        updatedAt: Number(productData.updatedAt),
        tranches: tranches.filter(t => t !== null) as Tranche[],
        metadata: this.parseMetadata(productData.metadataHash)
      };
    } catch (error) {
      console.error(`Failed to get product ${productId}:`, error);
      return null;
    }
  }

  // Get tranche details with TrancheSpec structure
  async getTranche(trancheId: number): Promise<Tranche | null> {
    try {
      const getTranche = this.contract.getTranche as (id: number) => Promise<any>;
      const trancheData = await getTranche(trancheId);
      
      // Get current round for this tranche if it has rounds
      let currentRound: Round | undefined;
      const roundIds = trancheData.roundIds || [];
      
      if (roundIds.length > 0) {
        // Get the latest round (assuming last in array is most recent)
        const latestRoundId = roundIds[roundIds.length - 1];
        try {
          const getRound = this.contract.getRound as (id: number) => Promise<any>;
          const roundData = await getRound(Number(latestRoundId));
          currentRound = this.parseRound(roundData);
        } catch (e) {
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
        maturityDays: Math.max(0, Math.floor((maturityTimestamp - now) / 86400)),
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
        utilizationRate: poolData.utilizationRate
      };
    } catch (error) {
      console.error(`Failed to get tranche ${trancheId}:`, error);
      return null;
    }
  }

  // Get round details
  async getRound(roundId: number): Promise<Round | null> {
    try {
      const getRound = this.contract.getRound as (id: number) => Promise<any>;
      const roundData = await getRound(roundId);
      return this.parseRound(roundData);
    } catch (error) {
      console.error(`Failed to get round ${roundId}:`, error);
      return null;
    }
  }

  // Get all products with their tranches
  async getAllActiveProducts(): Promise<Product[]> {
    try {
      console.log('ProductCatalogService: Getting active products from', this.contractAddress);
      const productIds = await this.getActiveProductIds();
      console.log('Active product IDs from contract:', productIds);
      
      if (productIds.length === 0) {
        console.log('No active product IDs returned from contract');
        // Try to get product 1 directly since we know it exists
        console.log('Attempting to fetch product 1 directly...');
        const product1 = await this.getProduct(1);
        if (product1) {
          console.log('Successfully fetched product 1 directly');
          return [product1];
        }
      }
      
      const products = await Promise.all(
        productIds.map(id => this.getProduct(id))
      );
      
      const validProducts = products.filter(p => p !== null) as Product[];
      console.log(`Fetched ${validProducts.length} valid products with tranches`);
      console.log('Products:', validProducts);
      
      return validProducts;
    } catch (error) {
      console.error('Failed to get all active products:', error);
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
      const getTranchePool = this.poolFactory.getTranchePool as (trancheId: number) => Promise<string>;
      const poolAddress = await getTranchePool(trancheId);
      
      if (poolAddress === ethers.ZeroAddress) {
        console.log(`No pool found for tranche ${trancheId}`);
        return {
          poolAddress: ethers.ZeroAddress,
          availableCapacity: 0n,
          utilizationRate: 0
        };
      }

      // Get pool contract
      const pool = new ethers.Contract(poolAddress, TranchePoolCoreABI as any, this.provider);
      
      // Get pool accounting data
      const getPoolAccounting = pool.poolAccounting as () => Promise<any>;
      const poolAccounting = await getPoolAccounting();
      
      // Calculate metrics
      const totalAssets = BigInt(poolAccounting.totalAssets);
      const lockedAssets = BigInt(poolAccounting.lockedAssets);
      const availableCapacity = totalAssets - lockedAssets;
      
      const utilizationRate = totalAssets > 0 
        ? Number(lockedAssets * 10000n / totalAssets) / 100 // Convert to percentage with 2 decimal precision
        : 0;

      console.log(`Pool ${trancheId}: Total=${ethers.formatUnits(totalAssets, 6)} USDT, Locked=${ethers.formatUnits(lockedAssets, 6)} USDT, Available=${ethers.formatUnits(availableCapacity, 6)} USDT, Utilization=${utilizationRate.toFixed(2)}%`);

      return {
        poolAddress,
        availableCapacity,
        utilizationRate
      };
    } catch (error) {
      console.warn(`Failed to get pool data for tranche ${trancheId}:`, error);
      return {
        poolAddress: ethers.ZeroAddress,
        availableCapacity: 0n,
        utilizationRate: 0
      };
    }
  }

  // Parse round data from contract
  private parseRound(roundData: any): Round {
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
      totalBuyerPurchases: BigInt(roundData.totalBuyerPurchases),
      totalSellerCollateral: BigInt(roundData.totalSellerCollateral),
      totalBuyerOrders: BigInt(roundData.totalBuyerPurchases),
      matchedAmount: BigInt(roundData.matchedAmount),
      createdAt: Number(roundData.createdAt),
      stateChangedAt: Number(roundData.stateChangedAt),
      isOpen: state === RoundState.OPEN && salesEndTime > now && salesStartTime <= now,
      startTime: salesStartTime,
      endTime: salesEndTime
    };
  }

  // Parse metadata hash to readable format
  private parseMetadata(metadataHash: string): any {
    try {
      // Remove 0x prefix and trailing zeros
      const cleanHash = metadataHash.replace(/^0x/, '').replace(/0+$/, '');
      
      // Try to convert hex to ASCII string
      let metadataString = '';
      for (let i = 0; i < cleanHash.length; i += 2) {
        const byte = parseInt(cleanHash.substr(i, 2), 16);
        if (byte === 0) break;
        if (byte >= 32 && byte <= 126) { // Printable ASCII
          metadataString += String.fromCharCode(byte);
        }
      }
      
      console.log('Parsed metadata string:', metadataString);
      
      // Check for known metadata patterns
      if (metadataString.includes('BTC') || metadataString.includes('Bitcoin')) {
        return {
          name: 'Bitcoin Price Protection',
          description: 'Parametric insurance for BTC price movements',
          category: 'Crypto',
          underlyingAsset: 'BTC',
          riskLevel: 'MEDIUM' as const,
          tags: ['crypto', 'btc', 'price-protection']
        };
      }
      
      if (metadataString.includes('ETH') || metadataString.includes('Ethereum')) {
        return {
          name: 'Ethereum Price Protection',
          description: 'Parametric insurance for ETH price movements',
          category: 'Crypto',
          underlyingAsset: 'ETH',
          riskLevel: 'MEDIUM' as const,
          tags: ['crypto', 'eth', 'price-protection']
        };
      }
      
      // Default metadata
      return {
        name: metadataString || 'Insurance Product',
        description: 'Parametric insurance product on Kaia',
        category: 'General',
        underlyingAsset: 'CRYPTO',
        riskLevel: 'MEDIUM' as const,
        tags: ['insurance', 'parametric']
      };
    } catch (error) {
      console.error('Error parsing metadata:', error);
      return {
        name: 'Insurance Product',
        description: 'Parametric insurance product',
        category: 'General',
        underlyingAsset: 'UNKNOWN',
        riskLevel: 'MEDIUM' as const,
        tags: ['insurance']
      };
    }
  }

  // Helper to format threshold price for display
  formatThresholdPrice(threshold: bigint, decimals: number = 18): string {
    try {
      return ethers.formatUnits(threshold, decimals);
    } catch {
      return '0';
    }
  }
}