"use client";

import React, { useState, useEffect } from "react";
import { ProductCard } from "@/components/insurance/ProductCard";
import { PurchaseModal } from "@/components/insurance/PurchaseModal";
import { useWeb3 } from "@/context/Web3Provider";
import { useContracts, useContractFactory, useProducts, useBuyInsurance } from "@dinsure/contracts";
import { KAIA_TESTNET } from "@/lib/constants";
import type { Product, Tranche } from "@dinsure/contracts";
import { ethers } from "ethers";

export default function InsurancePage() {
  const { isConnected } = useWeb3();
  const { isInitialized, error: contractError } = useContracts();
  const factory = useContractFactory();
  const { products, tranches, loading: productsLoading, error: productsError } = useProducts(factory);
  const { buyInsurance, loading: purchaseLoading, error: purchaseError } = useBuyInsurance(factory);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTranche, setSelectedTranche] = useState<Tranche | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState({
    asset: 'All',
    trigger: 'All',
    duration: 'All'
  });

  const handleTrancheSelect = (product: Product, tranche: Tranche) => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    setSelectedProduct(product);
    setSelectedTranche(tranche);
    setIsModalOpen(true);
  };

  const handlePurchase = async (amount: string) => {
    if (!selectedTranche || !selectedProduct) return;
    
    try {
      const result = await buyInsurance({
        trancheId: BigInt(selectedTranche.trancheId),
        roundId: BigInt(selectedTranche.currentRound?.roundId || 1),
        amount: ethers.parseUnits(amount, 6), // USDT has 6 decimals
      });
      
      alert(`Successfully purchased ${amount} USDT coverage! Token ID: ${result.tokenId?.toString()}`);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Purchase failed:', error);
      alert(`Purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Extract filter options from real contract data
  const assets = ['All', 'BTC']; // For now, we know we have BTC products
  const triggers = ['All', 'Below $110K', 'Below $100K', 'Below $90K', 'Above $130K'];
  const durations = ['All', '30 days'];

  // Filter products based on real contract data
  const filteredProducts = products.filter(product => {
    // For now, simplified filtering - can be enhanced based on product metadata
    return true; // Show all products for now
  });

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">DIN Insurance Catalog</h1>
          <p className="text-gray-400">
            Live on Kaia Testnet - Choose parametric insurance to protect against price movements
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-green-400">● Connected to {KAIA_TESTNET.name}</span>
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

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-white font-medium mb-2">Asset</label>
              <select
                value={filter.asset}
                onChange={(e) => setFilter(prev => ({ ...prev, asset: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {assets.map(asset => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Trigger</label>
              <select
                value={filter.trigger}
                onChange={(e) => setFilter(prev => ({ ...prev, trigger: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {triggers.map(trigger => (
                  <option key={trigger} value={trigger}>{trigger}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Duration</label>
              <select
                value={filter.duration}
                onChange={(e) => setFilter(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {durations.map(duration => (
                  <option key={duration} value={duration}>{duration}</option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={() => setFilter({ asset: 'All', trigger: 'All', duration: 'All' })}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Connection Notice */}
        {!isConnected && (
          <div className="bg-blue-900 border border-blue-600 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="text-blue-400 text-xl">💡</div>
              <div>
                <h3 className="text-blue-400 font-medium">Connect Your Wallet</h3>
                <p className="text-blue-300 text-sm">
                  Connect your wallet to purchase insurance products
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contract Error */}
        {contractError && (
          <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="text-red-400 text-xl">⚠️</div>
              <div>
                <h3 className="text-red-400 font-medium">Contract Error</h3>
                <p className="text-red-300 text-sm">
                  {contractError.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {productsLoading && isInitialized && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <div className="text-gray-400">Loading insurance products...</div>
          </div>
        )}

        {/* Products Grid */}
        {!productsLoading && isInitialized && !contractError && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.productId}
                  product={product}
                  onTrancheSelect={handleTrancheSelect}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">No insurance products available</div>
                <p className="text-gray-500 text-sm mt-2">
                  Products are being loaded from the smart contracts
                </p>
              </div>
            )}
          </>
        )}

        {/* Purchase Modal */}
        <PurchaseModal
          product={selectedProduct}
          tranche={selectedTranche}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handlePurchase}
        />
      </div>
    </div>
  );
}