"use client";

import React from "react";
import type { Product, Tranche } from "@dinsure/contracts";
import { 
  getProductName, 
  getProductDescription, 
  getProductIcon, 
  isBTCProduct,
  isETHProduct 
} from "@/utils/productHelpers";

interface InsuranceSummaryCardProps {
  product: Product;
  tranches: Tranche[];
  onViewTranches: () => void;
}

export const InsuranceSummaryCard: React.FC<InsuranceSummaryCardProps> = ({ 
  product, 
  tranches,
  onViewTranches 
}) => {
  // Get product info using helpers
  const productName = getProductName(product);
  const productDescription = getProductDescription(product);
  const productIcon = getProductIcon(product);
  
  // Calculate aggregated statistics
  const activeTranches = tranches.length;
  const totalTVL = tranches.reduce((sum, tranche) => {
    // For now, use mock data - in real implementation, this would come from pool contracts
    return sum + 850000; // Mock TVL per tranche
  }, 0);
  
  // Calculate premium range from actual tranche data
  const premiumRates = tranches.map(tranche => {
    return tranche.premiumRateBps / 100; // Convert basis points to percentage
  });
  
  const minPremium = premiumRates.length > 0 ? Math.min(...premiumRates) : 2;
  const maxPremium = premiumRates.length > 0 ? Math.max(...premiumRates) : 10;
  
  // Mock current price and change - in real app this would come from oracle
  const currentPrice = isBTCProduct(product) ? 45234 : isETHProduct(product) ? 2456 : 1000;
  const priceChange = isBTCProduct(product) ? 2.3 : isETHProduct(product) ? -1.2 : 0;
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">{productIcon}</div>
        <div>
          <h3 className="text-xl font-semibold text-white">{productName}</h3>
          <p className="text-gray-400 text-sm">{productDescription}</p>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <h4 className="text-white font-medium mb-3">Summary Stats:</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Active Tranches</div>
            <div className="text-white font-medium">{activeTranches}</div>
          </div>
          <div>
            <div className="text-gray-400">Total TVL</div>
            <div className="text-white font-medium">
              ${(totalTVL / 1000000).toFixed(1)}M USDT
            </div>
          </div>
          <div>
            <div className="text-gray-400">Premium Range</div>
            <div className="text-white font-medium">
              {minPremium}% - {maxPremium}%
            </div>
          </div>
          <div>
            <div className="text-gray-400">Current Price</div>
            <div className="text-white font-medium">
              ${currentPrice.toLocaleString()}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-400">24h Change</div>
            <div className={`font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Button */}
      <button
        onClick={onViewTranches}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        View Tranches
        <span>→</span>
      </button>
      
      {/* Debug Info */}
      <div className="mt-4 text-xs text-gray-500">
        Product ID: {product.productId} | Tranches: {tranches.map(t => t.trancheId).join(', ')}
      </div>
    </div>
  );
};