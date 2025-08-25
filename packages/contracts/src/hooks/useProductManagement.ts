import { ethers } from 'ethers';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useWeb3 } from '../providers/Web3Provider';
import type { TrancheSpec } from '../types';
import { useContracts } from './useContracts';

export interface ProductSpec {
  productId: number;
  name: string;
  description: string;
  active: boolean;
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
  const { signer } = useWeb3();
  const { productCatalog, tranchePoolFactory, insuranceToken } = useContracts();
  const [isLoading, setIsLoading] = useState(false);

  // Get all products
  const getProducts = useCallback(async (): Promise<any[]> => {
    if (!productCatalog) throw new Error('Product catalog not initialized');
    
    // Get active product IDs using the correct function
    console.log('[useProductManagement] Getting active product IDs');
    let activeProductIds: any[] = [];
    try {
      activeProductIds = await productCatalog.getActiveProducts();
    } catch (error) {
      console.error('Error fetching active products:', error);
      // If getActiveProducts fails, try known product IDs
      console.log('[useProductManagement] Falling back to known product IDs');
      activeProductIds = [1n, 2n, 3n, 4n, 5n];
    }
    
    console.log('[useProductManagement] Product IDs to fetch:', activeProductIds.map(id => Number(id)));
    
    const products: any[] = [];
    
    // Fetch each product with better error handling
    for (const productId of activeProductIds) {
      try {
        let product;
        
        try {
          // Try getProduct function
          product = await productCatalog.getProduct(Number(productId));
          console.log(`[useProductManagement] getProduct(${productId}) succeeded`);
        } catch (getProductError: any) {
          // Check if it's a contract revert (product doesn't exist)
          if (getProductError?.code === 'CALL_EXCEPTION' || getProductError?.message?.includes('revert')) {
            console.log(`[useProductManagement] Product ${productId} does not exist on-chain, skipping`);
            continue;
          }
          
          // Try fallback to products mapping
          console.log(`[useProductManagement] Trying products mapping for ${productId}`);
          try {
            product = await productCatalog.products(Number(productId));
            console.log(`[useProductManagement] products(${productId}) succeeded as fallback`);
          } catch (mappingError: any) {
            console.log(`[useProductManagement] Both methods failed for product ${productId}, skipping`);
            continue;
          }
        }
        
        // Validate product data
        if (product?.productId && Number(product.productId) !== 0) {
          console.log(`[useProductManagement] Valid product ${productId} found`);
          
          const processedProduct = {
            productId: Number(product.productId),
            name: `Product ${Number(product.productId)}`,
            metadataHash: product.metadataHash || '',
            active: product.active !== false,
            createdAt: product.createdAt ? Number(product.createdAt) : 0,
            updatedAt: product.updatedAt ? Number(product.updatedAt) : 0,
            trancheIds: product.trancheIds ? product.trancheIds.map((id: any) => Number(id)) : [],
            // Include any other fields that exist on the product
            ...Object.entries(product).reduce((acc, [key, value]) => {
              if (!['productId', 'metadataHash', 'active', 'createdAt', 'updatedAt', 'trancheIds'].includes(key)) {
                // Handle BigInt conversion
                if (typeof value === 'bigint') {
                  acc[key] = value.toString();
                } else {
                  acc[key] = value;
                }
              }
              return acc;
            }, {} as any)
          };
          products.push(processedProduct);
        }
      } catch (productError: any) {
        console.warn(`[useProductManagement] Unexpected error fetching product ${productId}:`, productError.message);
        // Continue with next product
      }
    }
    
    console.log(`[useProductManagement] Successfully fetched ${products.length} products`);
    return products;
    
  }, [productCatalog]);

  // Register new product
  const registerProduct = useCallback(async (params: RegisterProductParams) => {
    if (!productCatalog || !signer) throw new Error('Not initialized');
    
    setIsLoading(true);
    try {
      const contract = productCatalog.connect(signer);
      
      // Check if we have OPERATOR_ROLE
      const OPERATOR_ROLE = await contract.OPERATOR_ROLE();
      const signerAddress = await signer.getAddress();
      const hasRole = await contract.hasRole(OPERATOR_ROLE, signerAddress);
      
      if (!hasRole) {
        throw new Error('Account does not have OPERATOR_ROLE');
      }
      
      console.log('Registering product:', params);
      const tx = await contract.registerProduct(params.name, params.description);
      
      toast.promise(tx.wait(), {
        loading: 'Registering product...',
        success: (receipt) => {
          // Extract product ID from events
          const event = receipt.logs.find(log => {
            try {
              const parsed = contract.interface.parseLog({
                topics: log.topics as string[],
                data: log.data,
              });
              return parsed?.name === 'ProductRegistered';
            } catch {
              return false;
            }
          });
          
          const productId = event ? 
            Number(contract.interface.parseLog({
              topics: event.topics as string[],
              data: event.data,
            })?.args.productId) : 
            'Unknown';
            
          return `Product registered! ID: ${productId}`;
        },
        error: 'Failed to register product',
      });
      
      const receipt = await tx.wait();
      return receipt;
      
    } catch (error: any) {
      console.error('Error registering product:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [productCatalog, signer]);

  // Register tranche
  const registerTranche = useCallback(async (params: RegisterTrancheParams) => {
    if (!productCatalog || !signer) throw new Error('Not initialized');
    
    setIsLoading(true);
    try {
      const contract = productCatalog.connect(signer);
      
      // Check OPERATOR_ROLE
      const OPERATOR_ROLE = await contract.OPERATOR_ROLE();
      const signerAddress = await signer.getAddress();
      const hasRole = await contract.hasRole(OPERATOR_ROLE, signerAddress);
      
      if (!hasRole) {
        throw new Error('Account does not have OPERATOR_ROLE');
      }
      
      // Convert values to contract format
      const threshold = ethers.parseEther(params.threshold); // Price in 18 decimals
      const trancheCap = ethers.parseUnits(params.trancheCap, 6); // USDT has 6 decimals
      const perAccountMin = ethers.parseUnits(params.perAccountMin, 6);
      const perAccountMax = ethers.parseUnits(params.perAccountMax, 6);
      
      // Calculate maturity timestamp
      const now = Math.floor(Date.now() / 1000);
      const maturityTimestamp = now + (params.maturityDays * 24 * 60 * 60);
      
      const trancheSpec: TrancheSpec = {
        productId: params.productId,
        name: params.name,
        triggerType: params.triggerType,
        threshold,
        premiumRateBps: params.premiumRateBps,
        trancheCap,
        maturityTimestamp,
        perAccountMin,
        perAccountMax,
        active: true,
        oracleRouteId: params.oracleRouteId || 1,
      };
      
      console.log('Registering tranche:', trancheSpec);
      const tx = await contract.registerTranche(trancheSpec);
      
      toast.promise(tx.wait(), {
        loading: 'Registering tranche...',
        success: (receipt) => {
          // Extract tranche ID from events
          const event = receipt.logs.find(log => {
            try {
              const parsed = contract.interface.parseLog({
                topics: log.topics as string[],
                data: log.data,
              });
              return parsed?.name === 'TrancheRegistered';
            } catch {
              return false;
            }
          });
          
          const trancheId = event ? 
            Number(contract.interface.parseLog({
              topics: event.topics as string[],
              data: event.data,
            })?.args.trancheId) : 
            'Unknown';
            
          return `Tranche registered! ID: ${trancheId}`;
        },
        error: 'Failed to register tranche',
      });
      
      const receipt = await tx.wait();
      return receipt;
      
    } catch (error: any) {
      console.error('Error registering tranche:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [productCatalog, signer]);

  // Create pool for tranche
  const createTranchePool = useCallback(async (trancheId: number) => {
    if (!tranchePoolFactory || !insuranceToken || !signer) {
      throw new Error('Not initialized');
    }
    
    setIsLoading(true);
    try {
      const factory = tranchePoolFactory.connect(signer);
      const token = insuranceToken.connect(signer);
      
      // Check if pool already exists
      const existingPool = await factory.getTranchePool(trancheId);
      if (existingPool !== ethers.ZeroAddress) {
        toast.info('Pool already exists for this tranche');
        return { poolAddress: existingPool, alreadyExists: true };
      }
      
      // Create pool
      console.log('Creating pool for tranche:', trancheId);
      const tx = await factory.createTranchePool(trancheId);
      
      const receipt = await tx.wait();
      
      // Get the new pool address
      const newPoolAddress = await factory.getTranchePool(trancheId);
      
      // Authorize pool for insurance token minting
      console.log('Authorizing pool:', newPoolAddress);
      const authTx = await token.setPoolAuthorization(newPoolAddress, true);
      await authTx.wait();
      
      toast.success(`Pool created: ${newPoolAddress.slice(0, 6)}...${newPoolAddress.slice(-4)}`);
      
      return { poolAddress: newPoolAddress, alreadyExists: false };
      
    } catch (error: any) {
      console.error('Error creating pool:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [tranchePoolFactory, insuranceToken, signer]);

  // Get tranches for a product
  const getProductTranches = useCallback(async (productId: number) => {
    if (!productCatalog) throw new Error('Product catalog not initialized');
    
    try {
      const tranches = await productCatalog.getProductTranches(productId);
      return tranches.map(id => Number(id));
    } catch (error) {
      console.error('Error fetching product tranches:', error);
      throw error;
    }
  }, [productCatalog]);

  // Get all active tranches
  const getActiveTranches = useCallback(async () => {
    if (!productCatalog) throw new Error('Product catalog not initialized');
    
    // Check if the contract has the required function
    if (!productCatalog.getActiveTranches) {
      console.warn('[useProductManagement] getActiveTranches function not available on contract');
      return [];
    }
    
    // Check if the contract is properly connected
    if (!productCatalog.provider) {
      console.warn('[useProductManagement] Contract provider not initialized');
      return [];
    }
    
    const maxRetries = 3;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[useProductManagement] Attempt ${attempt}/${maxRetries}: Calling getActiveTranches on contract:`, productCatalog.address);
        console.log(`[useProductManagement] Contract provider:`, productCatalog.provider?.connection?.url);
        
        const tranches = await productCatalog.getActiveTranches();
        console.log(`[useProductManagement] Raw tranches result:`, tranches);
        
        const mappedTranches = tranches.map(id => Number(id));
        console.log(`[useProductManagement] Mapped tranches:`, mappedTranches);
        
        return mappedTranches;
      } catch (error) {
        lastError = error;
        console.error(`[useProductManagement] Attempt ${attempt} failed:`, error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          data: error.data,
          transaction: error.transaction,
          contractAddress: productCatalog.address,
          provider: productCatalog.provider?.connection?.url
        });
        
        // If this is the last attempt, return empty array instead of throwing
        if (attempt === maxRetries) {
          console.warn('[useProductManagement] All attempts failed, returning empty array as fallback');
          return [];
        }
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    console.warn('[useProductManagement] Returning empty array as fallback');
    return [];
  }, [productCatalog]);

  // Update product status
  const updateProductStatus = useCallback(async (productId: number, active: boolean) => {
    if (!productCatalog || !signer) throw new Error('Not initialized');
    
    setIsLoading(true);
    try {
      const contract = productCatalog.connect(signer);
      
      const tx = await contract.updateProductStatus(productId, active);
      
      toast.promise(tx.wait(), {
        loading: `${active ? 'Activating' : 'Deactivating'} product...`,
        success: `Product ${active ? 'activated' : 'deactivated'}!`,
        error: 'Failed to update product status',
      });
      
      await tx.wait();
      
    } catch (error: any) {
      console.error('Error updating product status:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [productCatalog, signer]);

  // Update tranche status  
  const updateTrancheStatus = useCallback(async (trancheId: number, active: boolean) => {
    if (!productCatalog || !signer) throw new Error('Not initialized');
    
    setIsLoading(true);
    try {
      const contract = productCatalog.connect(signer);
      
      const tx = await contract.updateTrancheStatus(trancheId, active);
      
      toast.promise(tx.wait(), {
        loading: `${active ? 'Activating' : 'Deactivating'} tranche...`,
        success: `Tranche ${active ? 'activated' : 'deactivated'}!`,
        error: 'Failed to update tranche status',
      });
      
      await tx.wait();
      
    } catch (error: any) {
      console.error('Error updating tranche status:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [productCatalog, signer]);

  return {
    // State
    isLoading,
    
    // Product operations
    getProducts,
    registerProduct,
    updateProductStatus,
    
    // Tranche operations
    registerTranche,
    createTranchePool,
    getProductTranches,
    getActiveTranches,
    updateTrancheStatus,
  };
}