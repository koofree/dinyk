"use client";

import React, { useState } from "react";
import { ProductCard } from "@/components/insurance/ProductCard";
import { PurchaseModal } from "@/components/insurance/PurchaseModal";
import { useWeb3 } from "@/context/Web3Provider";
import { MOCK_INSURANCE_PRODUCTS } from "@/lib/constants";
import type { InsuranceProduct, InsuranceTranche } from "@/lib/types";
import { Navbar } from "@/components/common/Navbar";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-15 pb-15 mt-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[30px] font-bold text-gray-900 mb-4 font-display">Insurance Catalog</h1>
          <p className="text-gray-600">
            Choose from our parametric insurance products to protect your crypto assets
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex gap-4 items-end w-full">
            <div className="flex-1">
              <label className="block text-gray-800 font-medium mb-2">Asset</label>
              <select
                value={filter.asset}
                onChange={(e) => setFilter(prev => ({ ...prev, asset: e.target.value }))}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 pr-12 text-gray-800 focus:border-[#86D99C] focus:outline-none appearance-none"
                style={{ 
                  borderRadius: '8px',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 12px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '20px'
                }}
              >
                {assets.map(asset => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-gray-800 font-medium mb-2">Trigger</label>
              <select
                value={filter.trigger}
                onChange={(e) => setFilter(prev => ({ ...prev, trigger: e.target.value }))}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 pr-12 text-gray-800 focus:border-[#86D99C] focus:outline-none appearance-none"
                style={{ 
                  borderRadius: '8px',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 16px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '20px'
                }}
              >
                {triggers.map(trigger => (
                  <option key={trigger} value={trigger}>{trigger}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-gray-800 font-medium mb-2">Duration</label>
              <select
                value={filter.duration}
                onChange={(e) => setFilter(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 pr-12 text-gray-800 focus:border-[#86D99C] focus:outline-none appearance-none"
                style={{ 
                  borderRadius: '8px',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 16px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '20px'
                }}
              >
                {durations.map(duration => (
                  <option key={duration} value={duration}>{duration}</option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={() => setFilter({ asset: 'All', trigger: 'All', duration: 'All' })}
                className="bg-transparent border border-gray-300 text-gray-600 hover:border-[#86D99C] hover:text-[#86D99C] hover:scale-95 px-3 py-2 transition-all duration-300 flex items-center justify-center"
                style={{ borderRadius: '8px', height: '42px' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.51 15A9 9 0 1 0 6 5L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Connection Notice */}
        {!isConnected && (
          <div className="bg-[#F3FEF6] p-6 rounded-2xl" style={{ marginBottom: '60px' }}>
            <div className="flex items-center gap-3">
              <div className="text-[#00B1B8] text-xl">💡</div>
              <div>
                <h3 className="text-gray-800 font-medium">Connect Your Wallet</h3>
                <p className="text-gray-800 text-sm">
                  Connect your wallet to purchase insurance products
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Products List */}
        <div>
          {filteredProducts.map((product, index) => (
            <div key={product.id} style={{ marginTop: index > 0 ? '60px' : '0' }}>
              <ProductCard
                product={product}
                onTrancheSelect={handleTrancheSelect}
              />
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No products match your filters</div>
            <button
              onClick={() => setFilter({ asset: 'All', trigger: 'All', duration: 'All' })}
              className="mt-4 text-[#00B1B8] hover:text-[#86D99C] transition-colors font-medium"
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

      {/* Footer Section */}
      <div className="text-center pb-20" style={{ paddingTop: '60px' }}>
        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-6">
            <div className="rounded-lg p-6">
              <p className="text-gray-400 mb-4">
                Connect your wallet to start using DIN insurance platform
              </p>
              <p className="text-gray-400 text-sm">
                Supports MetaMask, Kaikas, and other Web3 wallets
              </p>
            </div>
          </div>
        )}
        
        {/* Footer Logo */}
        <img src="/images/bi-symbol.svg" alt="DIN Logo" className="h-12 w-auto mx-auto" style={{ filter: 'brightness(0) saturate(100%) invert(80%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)' }} />
      </div>
    </div>
  );
}