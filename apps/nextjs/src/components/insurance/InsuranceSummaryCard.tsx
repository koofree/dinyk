"use client";

import { formatPercentage, formatUSDT } from "@/utils/calculations";
import {
    getProductDescription,
    getProductIcon,
    getProductName
} from "@/utils/productHelpers";
import type { Product, Tranche } from "@dinsure/contracts";
import React from "react";

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
  
  // Calculate aggregated statistics from actual data
  const totalTranches = tranches.length;
  
  // Calculate total TVL from actual round data
  const totalTVL = tranches.reduce((sum, tranche) => {
    const deposits = tranche.currentRound?.totalSellerCollateral || 0;
    return sum + Number(deposits);
  }, 0);
  
  // Calculate premium range from actual tranche data
  const premiumRates = tranches.map(tranche => tranche.premiumRateBps);
  const minPremium = premiumRates.length > 0 ? Math.min(...premiumRates) : 0;
  const maxPremium = premiumRates.length > 0 ? Math.max(...premiumRates) : 0;
  
  // Calculate trigger range from actual tranche data  
  // Assuming threshold represents trigger level in basis points
  const triggerLevels = tranches.map(tranche => Number(tranche.threshold) / 100);
  const minTrigger = triggerLevels.length > 0 ? Math.min(...triggerLevels) : 0;
  const maxTrigger = triggerLevels.length > 0 ? Math.max(...triggerLevels) : 0;
  
  // Check if any rounds are open
  const hasOpenRounds = tranches.some(t => t.currentRound?.state === 1);
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{productIcon}</div>
          <div>
            <h3 className="text-xl font-bold text-white">{productName}</h3>
            <p className="text-gray-400 text-sm mt-1">{productDescription}</p>
          </div>
        </div>
        {hasOpenRounds && (
          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
            Open
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <div className="text-gray-400 text-xs">Active Tranches</div>
          <div className="text-white font-semibold text-lg">
            {totalTranches}
          </div>
        </div>
        {totalTVL > 0 && (
          <div>
            <div className="text-gray-400 text-xs">Total TVL</div>
            <div className="text-white font-semibold text-lg">
              ${formatUSDT(totalTVL.toString())}
            </div>
          </div>
        )}
        <div>
          <div className="text-gray-400 text-xs">Premium Range</div>
          <div className="text-white font-semibold text-lg">
            {formatPercentage(minPremium)}-{formatPercentage(maxPremium)}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs">Trigger Range</div>
          <div className="text-white font-semibold text-lg">
            -{formatPercentage(minTrigger)} to -{formatPercentage(maxTrigger)}
          </div>
        </div>
      </div>

      {/* Tranche Summary */}
      <div className="border-t border-gray-700 pt-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Available Tranches</span>
          <span className="text-gray-400 text-sm">{totalTranches} active</span>
        </div>
        <div className="flex gap-2">
          {tranches.slice(0, 3).map((tranche, idx) => (
            <div
              key={tranche.trancheId}
              className={`flex-1 px-3 py-2 rounded-lg text-center text-sm ${
                tranche.active && tranche.currentRound?.state === 1
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-gray-700 text-gray-400 border border-gray-600'
              }`}
            >
              <div className="font-medium">Tranche {String.fromCharCode(65 + idx)}</div>
              <div className="text-xs mt-1">
                -{formatPercentage(Number(tranche.threshold) / 100)} / {formatPercentage(tranche.premiumRateBps)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onViewTranches}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
      >
        View All Tranches
      </button>
    </div>
  );
};