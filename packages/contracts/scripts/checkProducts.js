#!/usr/bin/env node

import { ethers } from 'ethers';
import { ProductCatalogService } from '../dist/index.js';

const KAIA_TESTNET_RPC = 'https://public-en-kairos.node.kaia.io';
const PRODUCT_CATALOG_ADDRESS = '0x5c251A3561E47700a9bcbD6ec91e61fB52Eb50d2';

async function main() {
  console.log('Connecting to Kaia Testnet...');
  
  const provider = new ethers.JsonRpcProvider(KAIA_TESTNET_RPC, {
    chainId: 1001,
    name: 'Kaia Kairos'
  });
  
  const service = new ProductCatalogService(PRODUCT_CATALOG_ADDRESS, provider);
  
  console.log('Fetching active products from contract:', PRODUCT_CATALOG_ADDRESS);
  
  try {
    // Get raw product IDs first
    const productIds = await service.getActiveProductIds();
    console.log('Active Product IDs:', productIds);
    
    if (productIds.length === 0) {
      console.log('\n❌ No products registered on the contract yet.');
      console.log('Products need to be registered using the din-contract scripts.');
      return;
    }
    
    // Get raw data to debug
    for (const productId of productIds) {
      console.log(`\n=== Fetching Product #${productId} ===`);
      
      // Call contract directly
      const contract = service.contract;
      const productData = await contract.getProduct(productId);
      console.log('Raw Product Data:', {
        productId: productData.productId?.toString(),
        metadataHash: productData.metadataHash,
        active: productData.active,
        createdAt: productData.createdAt?.toString(),
        updatedAt: productData.updatedAt?.toString()
      });
      
      // Get tranches for this product
      const trancheIds = await contract.getProductTranches(productId);
      console.log('Tranche IDs for product:', trancheIds.map(id => id.toString()));
      
      // Get each tranche data
      for (const trancheId of trancheIds) {
        const trancheData = await contract.getTranche(trancheId);
        console.log(`\n  Tranche #${trancheId}:`, {
          trancheId: trancheData.trancheId?.toString(),
          productId: trancheData.productId?.toString(),
          triggerType: trancheData.triggerType,
          threshold: trancheData.threshold?.toString(),
          maturityTimestamp: trancheData.maturityTimestamp?.toString(),
          premiumRateBps: trancheData.premiumRateBps?.toString(),
          perAccountMin: trancheData.perAccountMin?.toString(),
          perAccountMax: trancheData.perAccountMax?.toString(),
          trancheCap: trancheData.trancheCap?.toString(),
          oracleRouteId: trancheData.oracleRouteId?.toString(),
          poolAddress: trancheData.poolAddress,
          active: trancheData.active
        });
      }
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

main().catch(console.error);