"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ProductCatalogService } from "@dinsure/contracts";

const PRODUCT_CATALOG_ADDRESS = '0x5c251A3561E47700a9bcbD6ec91e61fB52Eb50d2';

export default function TestProductsPage() {
  const [status, setStatus] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      const logs: string[] = [];
      
      try {
        logs.push("Creating provider...");
        const provider = new ethers.JsonRpcProvider('https://public-en-kairos.node.kaia.io', {
          chainId: 1001,
          name: 'Kaia Kairos'
        });
        
        logs.push(`Provider created: ${provider._network?.name}`);
        
        logs.push("Creating ProductCatalogService...");
        const service = new ProductCatalogService(PRODUCT_CATALOG_ADDRESS, provider);
        
        logs.push("Fetching active product IDs...");
        const productIds = await service.getActiveProductIds();
        logs.push(`Active product IDs: ${JSON.stringify(productIds)}`);
        
        if (productIds.length === 0) {
          logs.push("No active products found. Trying to fetch product 1 directly...");
          const product1 = await service.getProduct(1);
          if (product1) {
            logs.push(`Product 1 found: ${JSON.stringify(product1, null, 2)}`);
            setProducts([product1]);
          } else {
            logs.push("Product 1 not found");
          }
        } else {
          logs.push("Fetching all active products...");
          const allProducts = await service.getAllActiveProducts();
          logs.push(`Fetched ${allProducts.length} products`);
          setProducts(allProducts);
        }
        
        setStatus(logs);
      } catch (err: any) {
        logs.push(`Error: ${err.message}`);
        setStatus(logs);
        setError(err.message);
      }
    }
    
    fetchProducts();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Test Products Fetching</h1>
      
      <div className="bg-gray-900 p-4 rounded-lg mb-4">
        <h2 className="text-lg font-semibold mb-2">Status Log:</h2>
        {status.map((log, i) => (
          <div key={i} className="text-sm text-gray-300 font-mono">{log}</div>
        ))}
      </div>
      
      {error && (
        <div className="bg-red-900 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-2">Error:</h2>
          <div className="text-sm text-red-300">{error}</div>
        </div>
      )}
      
      {products.length > 0 && (
        <div className="bg-green-900 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Products Found:</h2>
          <pre className="text-sm text-green-300 overflow-auto">
            {JSON.stringify(products, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}