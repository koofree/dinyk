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
  const getProducts = useCallback(async (): Promise<ProductSpec[]> => {
    if (!productCatalog) throw new Error('Product catalog not initialized');
    
    try {
      const nextProductId = await productCatalog.nextProductId();
      const products: ProductSpec[] = [];
      
      for (let i = 1; i < Number(nextProductId); i++) {
        const product = await productCatalog.getProduct(i);
        if (product.productId !== 0n) {
          products.push({
            productId: Number(product.productId),
            name: product.name,
            description: product.description,
            active: product.active,
          });
        }
      }
      
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
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
    
    try {
      const tranches = await productCatalog.getActiveTranches();
      return tranches.map(id => Number(id));
    } catch (error) {
      console.error('Error fetching active tranches:', error);
      throw error;
    }
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