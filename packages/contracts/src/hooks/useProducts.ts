import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { Product, Tranche, PremiumCalculation } from '../types/products';
import { ProductCatalogService } from '../services/ProductCatalogService';
import { KAIA_TESTNET_ADDRESSES } from '../config/addresses';

export interface UseProductsState {
  products: Product[];
  tranches: Tranche[];
  loading: boolean;
  error: any;
}

export interface UseProductsActions {
  fetchProducts: () => Promise<void>;
  fetchTranches: () => Promise<void>;
  calculatePremium: (trancheId: bigint, amount: bigint) => Promise<PremiumCalculation>;
  clearError: () => void;
}

export type UseProductsReturn = UseProductsState & UseProductsActions;

// Create a default provider for Kaia Testnet
const createDefaultProvider = () => {
  return new ethers.JsonRpcProvider('https://public-en-kairos.node.kaia.io', {
    chainId: 1001,
    name: 'Kaia Kairos'
  });
};

export function useProducts(factory: any): UseProductsReturn {
  const [state, setState] = useState<UseProductsState>({
    products: [],
    tranches: [],
    loading: true, // Start with loading true
    error: null,
  });

  const [service, setService] = useState<ProductCatalogService | null>(null);

  // Initialize service
  useEffect(() => {
    try {
      // Use factory provider if available, otherwise create default
      const provider = factory?.provider || createDefaultProvider();
      const catalogService = new ProductCatalogService(
        KAIA_TESTNET_ADDRESSES.ProductCatalog,
        provider
      );
      setService(catalogService);
      console.log('ProductCatalogService initialized with address:', KAIA_TESTNET_ADDRESSES.ProductCatalog);
    } catch (error) {
      console.error('Failed to initialize ProductCatalogService:', error);
      setState(prev => ({ ...prev, loading: false, error }));
    }
  }, [factory]);

  // Fetch products on service initialization
  useEffect(() => {
    if (service) {
      fetchProducts();
    }
  }, [service]);

  const fetchProducts = useCallback(async () => {
    if (!service) {
      console.error('ProductCatalogService not initialized');
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: new Error('Contract service not initialized. Please connect to Kaia Testnet.') 
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('Fetching products from ProductCatalog contract...');
      const products = await service.getAllActiveProducts();
      console.log(`Fetched ${products.length} products from contract:`, products);
      
      const allTranches = products.flatMap(p => p.tranches);
      console.log(`Total tranches: ${allTranches.length}`);
      
      setState({
        products,
        tranches: allTranches,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to fetch products from contract:', error);
      setState(prev => ({
        ...prev,
        products: [],
        tranches: [],
        loading: false,
        error
      }));
    }
  }, [service]);

  const fetchTranches = useCallback(async () => {
    // Tranches are fetched with products
    await fetchProducts();
  }, [fetchProducts]);

  const calculatePremium = useCallback(async (
    trancheId: bigint, 
    amount: bigint
  ): Promise<PremiumCalculation> => {
    // Find the tranche to get the actual premium rate
    const tranche = state.tranches.find(t => BigInt(t.trancheId) === trancheId);
    const premiumRateBps = tranche?.premiumRateBps || 500;
    const premium = (amount * BigInt(premiumRateBps)) / 10000n;
    
    return {
      purchaseAmount: amount,
      premium: premium,
      premiumRate: premiumRateBps,
      totalPayment: amount + premium,
    };
  }, [state.tranches]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    fetchProducts,
    fetchTranches,
    calculatePremium,
    clearError,
  };
}