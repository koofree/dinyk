"use client";

import React from "react";
import type { Product, Tranche } from "@dinsure/contracts";
import { getTrancheName, getTrancheShortName } from "@/utils/productHelpers";
import { getRoundStateColor, getRoundStateTextColor, getRoundStateLabel, getRiskLevel } from "@/utils/statusMappings";
import { formatPercentage, formatUSDT } from "@/utils/calculations";

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
  // Get names using helpers
  const trancheName = getTrancheName(tranche, product);
  const shortName = getTrancheShortName(tranche, product);
  const riskLevel = getRiskLevel(Number(tranche.threshold) / 100);
  
  // Use actual data from tranche/round
  const currentRound = tranche.currentRound;
  const roundState = currentRound?.state || 1; // Default to OPEN
  const premiumRate = formatPercentage(tranche.premiumRateBps);
  
  // Calculate days left if round is open
  const daysLeft = currentRound?.endTime 
    ? Math.max(0, Math.ceil((currentRound.endTime * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
    
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate utilization
  const utilization = currentRound && currentRound.totalSellerCollateral && tranche.trancheCap
    ? Math.min((Number(currentRound.totalSellerCollateral) / Number(tranche.trancheCap)) * 100, 100)
    : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">{trancheName}</h3>
          <p className="text-gray-400 mt-1">Trigger: -{formatPercentage(Number(tranche.threshold) / 100)}</p>
        </div>
        <div className={`text-xs px-2 py-1 rounded-full ${getRoundStateColor(roundState)}`}>
          {shortName}
        </div>
      </div>
      
      {/* Details Grid */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Premium Rate</div>
            <div className="text-white font-medium">{premiumRate}/period</div>
          </div>
          <div>
            <div className="text-gray-400">Risk Level</div>
            <div className={`font-medium ${riskLevel.color}`}>
              {riskLevel.label}
            </div>
          </div>
          {currentRound && (
            <>
              <div>
                <div className="text-gray-400">Round Status</div>
                <div className={`font-medium ${getRoundStateTextColor(roundState)}`}>
                  {getRoundStateLabel(roundState)}
                  {roundState === 1 && daysLeft > 0 && ` (${daysLeft}d left)`}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Matched Amount</div>
                <div className="text-white font-medium">
                  {formatUSDT(currentRound.matchedAmount || '0')} USDT
                </div>
              </div>
              {currentRound.startTime && currentRound.endTime && (
                <div className="col-span-2">
                  <div className="text-gray-400">Sales Period</div>
                  <div className="text-white font-medium">
                    {formatDate(currentRound.startTime)} - {formatDate(currentRound.endTime)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Capacity Progress Bar */}
      {currentRound && currentRound.totalSellerCollateral && tranche.trancheCap && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Pool Capacity</span>
            <span>{formatUSDT(currentRound.totalSellerCollateral)} / {formatUSDT(tranche.trancheCap)}</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${utilization}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        {roundState === 1 ? (
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
            {getRoundStateLabel(roundState)}
          </button>
        )}
      </div>
    </div>
  );
};