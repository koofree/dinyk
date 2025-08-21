"use client";

import React from "react";
import type { Product, Tranche } from "@dinsure/contracts";
import { getTrancheName, getTrancheShortName } from "@/utils/productHelpers";
import type { TrancheDetails, RoundDetails } from "@/hooks/useTrancheData";
import { ethers } from "ethers";

interface EnhancedTrancheCardProps {
  product?: Product;
  tranche?: Tranche;
  trancheData: TrancheDetails;
  currentBTCPrice?: number;
  onBuyInsurance: (roundId: number) => void;
  onProvideLiquidity: (roundId: number) => void;
}

export const EnhancedTrancheCard: React.FC<EnhancedTrancheCardProps> = ({ 
  product, 
  tranche,
  trancheData,
  currentBTCPrice,
  onBuyInsurance,
  onProvideLiquidity 
}) => {
  // Get the most relevant round (prefer OPEN, then ACTIVE, then others)
  const activeRound = trancheData.rounds.find(r => r.stateName === 'OPEN') || 
                      trancheData.rounds.find(r => r.stateName === 'ACTIVE') ||
                      trancheData.rounds[0];

  // This shouldn't happen now since we filter out tranches without rounds
  if (!activeRound) {
    return null; // Don't render anything if no rounds
  }

  const getRoundStatusColor = (stateName: string) => {
    switch (stateName) {
      case 'ANNOUNCED': return 'text-yellow-400';
      case 'OPEN': return 'text-green-400';
      case 'ACTIVE': return 'text-blue-400';
      case 'MATURED': return 'text-orange-400';
      case 'SETTLED': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusDescription = (stateName: string) => {
    switch (stateName) {
      case 'ANNOUNCED': return 'Round announced - cannot join yet';
      case 'OPEN': return 'Open for buying insurance & providing liquidity';
      case 'ACTIVE': return 'Insurance active - positions matched & covered';
      case 'MATURED': return 'Insurance ended - awaiting payout distribution';
      case 'SETTLED': return 'Settled - payouts distributed';
      default: return 'Status unknown';
    }
  };

  const getTriggerStatusIcon = (round: RoundDetails) => {
    if (round.isTriggered === true) return '🔴';
    if (round.isTriggered === false) return '🟢';
    return '⚪';
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatTimeToMaturity = (ttm: { days: number; hours: number; isMatured: boolean }) => {
    if (ttm.isMatured) {
      return `Matured (${ttm.days}d ${ttm.hours}h ago)`;
    }
    return `${ttm.days}d ${ttm.hours}h`;
  };

  // Calculate utilization if we have economics data
  const utilization = activeRound.economics ? 
    Number(ethers.formatUnits(activeRound.economics.matchedAmount, 6)) / 
    Number(ethers.formatUnits(trancheData.trancheCap, 6)) * 100 : 0;

  // On testnet, show buttons for all active states for testing
  // OPEN: Can buy/sell
  // ANNOUNCED: Will open soon, allow testing
  // ACTIVE: Insurance is running but allow late entries for testing
  const showActions = activeRound.stateName === 'OPEN' || 
                     activeRound.stateName === 'ANNOUNCED' ||
                     activeRound.stateName === 'ACTIVE';
  
  const showMatching = false; // Don't show the "matched" message when buttons are shown
  const showResults = activeRound.stateName === 'MATURED';
  const showCompleted = activeRound.stateName === 'SETTLED';

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">
          Tranche {trancheData.trancheId}
        </h3>
        <div className="text-sm text-gray-400">
          Round #{activeRound.roundId}
        </div>
      </div>

      {/* Round Status */}
      <div className="mb-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRoundStatusColor(activeRound.stateName)} bg-gray-700`}>
          <span className="w-2 h-2 bg-current rounded-full"></span>
          {activeRound.stateName}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {getStatusDescription(activeRound.stateName)}
        </div>
      </div>

      {/* Key Details */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {/* Premium Rate */}
          <div>
            <div className="text-gray-400">Premium Rate</div>
            <div className="text-white font-medium">{(trancheData.premiumRateBps / 100)}%</div>
          </div>

          {/* Trigger Price */}
          <div>
            <div className="text-gray-400">Trigger</div>
            <div className="text-white font-medium">
              {activeRound.triggerPrice ? 
                `$${activeRound.triggerPrice.toLocaleString()} (${activeRound.triggerDirection})` : 
                'N/A'
              }
            </div>
          </div>

          {/* Current Status */}
          {currentBTCPrice && activeRound.triggerPrice && (
            <div className="col-span-2">
              <div className="text-gray-400">Current Status</div>
              <div className={`font-medium flex items-center gap-2 ${activeRound.isTriggered ? 'text-red-400' : 'text-green-400'}`}>
                {getTriggerStatusIcon(activeRound)}
                {activeRound.isTriggered ? 'TRIGGERED' : 'Safe'} - Current: ${currentBTCPrice.toLocaleString()}
              </div>
            </div>
          )}

          {/* Economics Data */}
          {activeRound.economics && (
            <>
              <div>
                <div className="text-gray-400">Buyers</div>
                <div className="text-white font-medium">
                  ${Number(ethers.formatUnits(activeRound.economics.totalBuyerPurchases, 6)).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-gray-400">Sellers</div>
                <div className="text-white font-medium">
                  ${Number(ethers.formatUnits(activeRound.economics.totalSellerCollateral, 6)).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-gray-400">Premiums</div>
                <div className="text-white font-medium">
                  ${Number(ethers.formatUnits(activeRound.economics.premiumPool, 6)).toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-gray-400">Matched</div>
                <div className="text-white font-medium">
                  ${Number(ethers.formatUnits(activeRound.economics.matchedAmount, 6)).toLocaleString()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="text-white font-medium mb-2">Timeline</div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-400">Sales Period:</span>
            <div className="text-white">
              {formatDateTime(activeRound.salesStartTime)} → {formatDateTime(activeRound.salesEndTime)}
            </div>
          </div>
          {activeRound.timeToMaturity && (
            <div>
              <span className="text-gray-400">Time to Maturity:</span>
              <div className={`font-medium ${activeRound.timeToMaturity.isMatured ? 'text-orange-400' : 'text-white'}`}>
                {formatTimeToMaturity(activeRound.timeToMaturity)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Utilization Progress */}
      {activeRound.economics && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Pool Utilization</span>
            <span>{utilization.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${Math.min(utilization, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Unmatched Display */}
      {activeRound.economics && activeRound.stateName === 'ACTIVE' && (
        <div className="mb-6">
          {(() => {
            const buyerUnmatched = activeRound.economics.totalBuyerPurchases > activeRound.economics.matchedAmount ? 
              (activeRound.economics.totalBuyerPurchases - activeRound.economics.matchedAmount) : 0n;
            const sellerUnmatched = activeRound.economics.totalSellerCollateral > activeRound.economics.matchedAmount ? 
              (activeRound.economics.totalSellerCollateral - activeRound.economics.matchedAmount) : 0n;
            
            if (buyerUnmatched > 0n || sellerUnmatched > 0n) {
              return (
                <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3 text-sm">
                  <div className="text-yellow-400 font-medium mb-1">Unmatched Amounts</div>
                  <div className="text-yellow-300 text-xs mb-2">Automatically refunded when OPEN → ACTIVE</div>
                  {buyerUnmatched > 0n && (
                    <div className="text-white">Buyers: ${Number(ethers.formatUnits(buyerUnmatched, 6)).toLocaleString()}</div>
                  )}
                  {sellerUnmatched > 0n && (
                    <div className="text-white">Sellers: ${Number(ethers.formatUnits(sellerUnmatched, 6)).toLocaleString()}</div>
                  )}
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        {showActions && (
          <>
            <button
              onClick={() => onBuyInsurance(activeRound.roundId)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Buy Insurance
            </button>
            <button
              onClick={() => onProvideLiquidity(activeRound.roundId)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Provide Liquidity
            </button>
          </>
        )}
        
        {/* Only show status messages when buttons are not shown */}
        {!showActions && activeRound.stateName === 'ANNOUNCED' && (
          <div className="w-full bg-yellow-900/20 border border-yellow-600 text-yellow-400 font-medium py-3 px-4 rounded-lg text-center">
            📢 Round Announced - Opens Soon
          </div>
        )}

        {!showActions && showMatching && (
          <div className="w-full bg-blue-900/20 border border-blue-600 text-blue-400 font-medium py-3 px-4 rounded-lg text-center">
            🔄 Insurance Active - Positions Matched & Covered
          </div>
        )}

        {showResults && (
          <div className="w-full bg-orange-900/20 border border-orange-600 text-orange-400 font-medium py-3 px-4 rounded-lg text-center">
            ⏳ Matured - Awaiting Payout Distribution
          </div>
        )}

        {showCompleted && (
          <div className="w-full bg-purple-900/20 border border-purple-600 text-purple-400 font-medium py-3 px-4 rounded-lg text-center">
            ✅ Settled - Payouts Distributed
          </div>
        )}
      </div>
      
      {/* Debug Info */}
      <div className="mt-4 text-xs text-gray-500">
        Tranche: {trancheData.trancheId} | Pool: {trancheData.poolAddress.slice(0, 6)}...{trancheData.poolAddress.slice(-4)} | 
        Rounds: {trancheData.rounds.length}
      </div>
    </div>
  );
};