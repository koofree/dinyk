"use client";

import React, { useState } from "react";
import { ProductCard } from "@/components/insurance/ProductCard";
import { PurchaseModal } from "@/components/insurance/PurchaseModal";
import { useWeb3 } from "@/context/Web3Provider";
import { MOCK_INSURANCE_PRODUCTS } from "@/lib/constants";
import type { InsuranceProduct, InsuranceTranche } from "@/lib/types";

export default function InsurancePage() {
  const { isConnected } = useWeb3();
  const [selectedProduct, setSelectedProduct] = useState<InsuranceProduct | null>(null);
  const [selectedTranche, setSelectedTranche] = useState<InsuranceTranche | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState({
    asset: 'All',
    trigger: 'All',
    duration: 'All'
  });

  const handleTrancheSelect = (product: InsuranceProduct, tranche: InsuranceTranche) => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    setSelectedProduct(product);
    setSelectedTranche(tranche);
    setIsModalOpen(true);
  };

  const handlePurchase = async (amount: string) => {
    // Mock purchase transaction
    console.log(`Purchasing ${amount} USDT coverage for ${selectedProduct?.name} - ${selectedTranche?.id}`);
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock success
    alert(`Successfully purchased ${amount} USDT coverage!`);
  };

  const assets = ['All', ...new Set(MOCK_INSURANCE_PRODUCTS.map(p => p.asset))];
  const triggers = ['All', '-5%', '-10%', '-15%', '-20%'];
  const durations = ['All', '7 days', '14 days', '30 days'];

  const filteredProducts = MOCK_INSURANCE_PRODUCTS.filter(product => {
    if (filter.asset !== 'All' && product.asset !== filter.asset) return false;
    
    if (filter.trigger !== 'All') {
      const triggerValue = parseInt(filter.trigger.replace('%', ''));
      const hasTrigger = product.tranches.some(t => t.triggerLevel === triggerValue);
      if (!hasTrigger) return false;
    }
    
    if (filter.duration !== 'All') {
      const durationDays = parseInt(filter.duration.split(' ')[0]);
      const hasDuration = product.tranches.some(t => t.expiry === durationDays);
      if (!hasDuration) return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Insurance Catalog</h1>
          <p className="text-gray-400">
            Choose from our parametric insurance products to protect your crypto assets
          </p>
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

        {/* Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onTrancheSelect={handleTrancheSelect}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No products match your filters</div>
            <button
              onClick={() => setFilter({ asset: 'All', trigger: 'All', duration: 'All' })}
              className="mt-4 text-blue-400 hover:text-blue-300 transition-colors"
            >
              Clear filters to see all products
            </button>
          </div>
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