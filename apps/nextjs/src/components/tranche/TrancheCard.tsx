"use client";

import React from "react";
import type { Product, Tranche } from "@dinsure/contracts";

interface TrancheCardProps {
  product: Product;
  tranche: Tranche;
  onBuyInsurance: () => void;
  onProvideLiquidity: () => void;
}

export const TrancheCard: React.FC<TrancheCardProps> = ({ 
  product, 
  tranche,
  onBuyInsurance,
  onProvideLiquidity 
}) => {
  // Mock data - in real implementation, this would come from contract calls
  const trancheName = tranche.name || tranche.trancheId?.toString() || 'Unknown';
  const triggerMatch = trancheName.match(/-(\d+)%/);
  const mockData = {
    premiumRate: (triggerMatch ? parseInt(triggerMatch[1]) : 10) / 2, // Simplified calculation
    poolTVL: 650000 + Math.random() * 400000, // Mock TVL between 650K-1M
    capacity: 100000 - Math.random() * 50000, // Mock capacity
    utilization: Math.random() * 80 + 20, // Mock utilization 20-100%
    roundStatus: tranche.currentRound?.state || 'OPEN',
    startDate: new Date('2025-01-15'),
    endDate: new Date('2025-01-22')
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'text-green-400';
      case 'ACTIVE': return 'text-blue-400';
      case 'SETTLED': return 'text-gray-400';
      case 'MATCHED': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN': return 'OPEN (2 days left)';
      case 'ACTIVE': return 'ACTIVE';
      case 'SETTLED': return 'SETTLED';
      case 'MATCHED': return 'MATCHED';
      default: return status;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const daysLeft = Math.ceil((mockData.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">
          {(product.name || 'Unknown Product').replace('Protection', `${trancheName} Protection`)}
        </h3>
        <div className="text-sm text-gray-400">
          ID: {tranche.trancheId}
        </div>
      </div>
      
      {/* Details Grid */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Premium Rate</div>
            <div className="text-white font-medium">{mockData.premiumRate}%</div>
          </div>
          <div>
            <div className="text-gray-400">Pool TVL</div>
            <div className="text-white font-medium">
              {(mockData.poolTVL / 1000).toFixed(0)}K USDT
            </div>
          </div>
          <div>
            <div className="text-gray-400">Capacity</div>
            <div className="text-white font-medium">
              {(mockData.capacity / 1000).toFixed(0)}K USDT
            </div>
          </div>
          <div>
            <div className="text-gray-400">Utilization</div>
            <div className="text-white font-medium">{mockData.utilization.toFixed(0)}% filled</div>
          </div>
          <div>
            <div className="text-gray-400">Round Status</div>
            <div className={`font-medium ${getStatusColor(mockData.roundStatus)}`}>
              {getStatusText(mockData.roundStatus)}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Timeline</div>
            <div className="text-white font-medium">
              {formatDate(mockData.startDate)} - {formatDate(mockData.endDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Pool Utilization</span>
          <span>{mockData.utilization.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full" 
            style={{ width: `${Math.min(mockData.utilization, 100)}%` }}
          ></div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        {mockData.roundStatus === 'OPEN' ? (
          <>
            <button
              onClick={onBuyInsurance}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Buy Insurance
            </button>
            <button
              onClick={onProvideLiquidity}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Provide Liquidity
            </button>
          </>
        ) : (
          <button
            className="w-full bg-gray-600 text-gray-300 font-medium py-3 px-4 rounded-lg cursor-not-allowed"
            disabled
          >
            View Details
          </button>
        )}
      </div>
      
      {/* Debug Info */}
      <div className="mt-4 text-xs text-gray-500">
        Product: {product.productId} | Tranche: {tranche.trancheId} | 
        Round: {tranche.currentRound?.roundId || 'N/A'} | 
        State: {tranche.currentRound?.state || 'Unknown'}
      </div>
    </div>
  );
};