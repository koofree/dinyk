"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ProductCatalogService } from "@dinsure/contracts";
import type { Product, Tranche } from "@dinsure/contracts";

const PRODUCT_CATALOG_ADDRESS = '0x5c251A3561E47700a9bcbD6ec91e61fB52Eb50d2';

export default function InsuranceV2Page() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        console.log('Creating provider...');
        const provider = new ethers.JsonRpcProvider('https://public-en-kairos.node.kaia.io', {
          chainId: 1001,
          name: 'Kaia Kairos'
        });

        console.log('Creating ProductCatalogService...');
        const service = new ProductCatalogService(PRODUCT_CATALOG_ADDRESS, provider);

        console.log('Fetching products...');
        const allProducts = await service.getAllActiveProducts();
        console.log('Fetched products:', allProducts);

        setProducts(allProducts);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message);
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const formatPrice = (threshold: bigint) => {
    const price = Number(ethers.formatEther(threshold));
    return `$${price.toLocaleString()}`;
  };

  const formatPremium = (bps: number) => {
    return `${bps / 100}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <div className="text-gray-400">Loading insurance products from smart contracts...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-red-900 border border-red-600 rounded-lg p-4">
            <h3 className="text-red-400 font-medium">Error loading products</h3>
            <p className="text-red-300 text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">DIN Insurance Catalog V2</h1>
          <p className="text-gray-400">
            Live products from Kaia Testnet Contract: {PRODUCT_CATALOG_ADDRESS}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Found {products.length} products with {products.reduce((sum, p) => sum + p.tranches.length, 0)} tranches
          </p>
        </div>

        {products.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <div className="text-yellow-400 text-4xl mb-4">📋</div>
            <div className="text-gray-300 text-lg font-medium mb-2">No Products Found</div>
            <p className="text-gray-400 text-sm">
              No active products in the smart contract.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {products.map((product) => (
              <div key={product.productId} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-white mb-2">
                    {product.metadata?.name || `Product ${product.productId}`}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {product.metadata?.description || 'Parametric insurance product'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs">
                      {product.metadata?.underlyingAsset || 'CRYPTO'}
                    </span>
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                      {product.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300">Available Tranches:</h3>
                  {product.tranches.map((tranche) => (
                    <div 
                      key={tranche.trancheId}
                      className="border border-gray-600 rounded-lg p-4 hover:border-blue-500 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-white font-medium">
                            Tranche {tranche.trancheId}
                          </div>
                          <div className="text-xs text-gray-400">
                            {tranche.triggerType === 0 ? 'Price Below' : 
                             tranche.triggerType === 1 ? 'Price Above' : 
                             'Custom'} {formatPrice(tranche.threshold)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-400 font-medium">
                            {formatPremium(tranche.premiumRateBps)}
                          </div>
                          <div className="text-xs text-gray-400">Premium</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Maturity: {tranche.maturityDays || 0} days</span>
                        <span>
                          {tranche.currentRound ? 
                            `Round ${tranche.currentRound.roundId} (${tranche.currentRound.state})` : 
                            'No active round'}
                        </span>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button 
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                          onClick={() => alert(`Buy insurance for Tranche ${tranche.trancheId}`)}
                        >
                          Buy Insurance
                        </button>
                        <button 
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
                          onClick={() => alert(`Provide liquidity for Tranche ${tranche.trancheId}`)}
                        >
                          Provide Liquidity
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}