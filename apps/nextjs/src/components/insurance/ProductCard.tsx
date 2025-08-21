"use client";

import React from "react";
import { Product, Tranche, RoundState, TriggerType, formatCurrency, formatPercentage, formatTimeRemaining } from "@dinsure/contracts";

const RISK_COLORS = {
  LOW: 'text-green-400',
  MEDIUM: 'text-yellow-400', 
  HIGH: 'text-red-400'
};

const ROUND_STATE_COLORS = {
  [RoundState.ANNOUNCED]: 'text-gray-400',
  [RoundState.OPEN]: 'text-green-400',
  [RoundState.MATCHED]: 'text-blue-400',
  [RoundState.ACTIVE]: 'text-yellow-400',
  [RoundState.MATURED]: 'text-orange-400',
  [RoundState.SETTLED]: 'text-purple-400',
  [RoundState.CANCELED]: 'text-red-400'
};

const ROUND_STATE_LABELS = {
  [RoundState.ANNOUNCED]: 'Announced',
  [RoundState.OPEN]: 'Open',
  [RoundState.MATCHED]: 'Matched',
  [RoundState.ACTIVE]: 'Active',
  [RoundState.MATURED]: 'Matured',
  [RoundState.SETTLED]: 'Settled',
  [RoundState.CANCELED]: 'Canceled'
};

interface ProductCardProps {
  product: Product;
  onTrancheSelect: (product: Product, tranche: Tranche) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onTrancheSelect }) => {
  // For now, we'll show a simplified product name since metadata might not be loaded
  const productName = product.metadata?.name || `Insurance Product #${product.productId}`;
  const productDescription = product.metadata?.description || "Parametric insurance protection";

  const getRiskLevel = (premiumRateBps: number): 'LOW' | 'MEDIUM' | 'HIGH' => {
    if (premiumRateBps <= 300) return 'LOW';    // <= 3%
    if (premiumRateBps <= 700) return 'MEDIUM'; // <= 7%
    return 'HIGH';                              // > 7%
  };

  const getTriggerText = (tranche: Tranche): string => {
    switch (tranche.triggerType) {
      case TriggerType.PRICE_BELOW:
        return `Price < $${formatCurrency(tranche.threshold, '$', 8, 0).replace('$ ', '')}`;
      case TriggerType.PRICE_ABOVE:
        return `Price > $${formatCurrency(tranche.threshold, '$', 8, 0).replace('$ ', '')}`;
      case TriggerType.RELATIVE:
        return 'Relative Change';
      case TriggerType.BOOLEAN:
        return 'Boolean Event';
      case TriggerType.CUSTOM:
        return 'Custom Trigger';
      default:
        return 'Unknown Trigger';
    }
  };

  const getButtonState = (tranche: Tranche) => {
    const currentRound = tranche.currentRound;
    if (!currentRound) return { disabled: true, text: 'No Active Round', className: 'bg-gray-600 text-gray-400 cursor-not-allowed' };

    const isExpired = tranche.isExpired;
    if (isExpired) return { disabled: true, text: 'Expired', className: 'bg-gray-600 text-gray-400 cursor-not-allowed' };

    const isOpen = currentRound.isOpen;
    const state = currentRound.state;

    switch (state) {
      case RoundState.ANNOUNCED:
        return { disabled: true, text: 'Coming Soon', className: 'bg-gray-600 text-gray-400 cursor-not-allowed' };
      case RoundState.OPEN:
        if (!isOpen) return { disabled: true, text: 'Round Closed', className: 'bg-gray-600 text-gray-400 cursor-not-allowed' };
        return { disabled: false, text: 'Buy Insurance', className: 'bg-blue-600 hover:bg-blue-700 text-white' };
      case RoundState.MATCHED:
        return { disabled: true, text: 'Round Matched', className: 'bg-blue-600 text-blue-200 cursor-not-allowed' };
      case RoundState.ACTIVE:
        return { disabled: true, text: 'Round Active', className: 'bg-yellow-600 text-yellow-200 cursor-not-allowed' };
      case RoundState.MATURED:
        return { disabled: true, text: 'Matured', className: 'bg-orange-600 text-orange-200 cursor-not-allowed' };
      case RoundState.SETTLED:
        return { disabled: true, text: 'Settled', className: 'bg-purple-600 text-purple-200 cursor-not-allowed' };
      case RoundState.CANCELED:
        return { disabled: true, text: 'Canceled', className: 'bg-red-600 text-red-200 cursor-not-allowed' };
      default:
        return { disabled: true, text: 'Not Available', className: 'bg-gray-600 text-gray-400 cursor-not-allowed' };
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{productName}</h3>
          <p className="text-gray-400 text-sm mt-1">{productDescription}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-500">Product ID: #{product.productId}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">Oracle: Orakl Price Feed</span>
          </div>
        </div>
        <div className="text-2xl font-bold text-blue-400">BTC</div>
      </div>

      <div className="space-y-3">
        {product.tranches.map((tranche) => {
          const riskLevel = getRiskLevel(tranche.premiumRateBps);
          const triggerText = getTriggerText(tranche);
          const buttonState = getButtonState(tranche);
          const currentRound = tranche.currentRound;

          return (
            <div 
              key={tranche.trancheId}
              className="bg-gray-700 rounded-lg p-4 border border-gray-600"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">
                    Tranche {String.fromCharCode(65 + (tranche.trancheId % 26))}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${RISK_COLORS[riskLevel]} bg-gray-600`}>
                    {riskLevel}
                  </span>
                  {currentRound && (
                    <span className={`text-xs px-2 py-1 rounded bg-gray-600 ${ROUND_STATE_COLORS[currentRound.state]}`}>
                      {ROUND_STATE_LABELS[currentRound.state]}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">Premium: {formatPercentage(tranche.premiumRateBps)}</div>
                  <div className="text-gray-400 text-sm">
                    Expires: {tranche.isExpired ? 'Expired' : formatTimeRemaining(tranche.maturityTimestamp)}
                  </div>
                  <div className="text-gray-400 text-xs">Tranche #{tranche.trancheId}</div>
                </div>
              </div>

              {/* Capacity information - simplified since we don't have real-time data */}
              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Capacity</span>
                  <span>{tranche.utilizationRate.toFixed(1)}% utilized</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(tranche.utilizationRate, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Available: {formatCurrency(tranche.availableCapacity, 'USDT', 6)}</span>
                  <span>Total: {formatCurrency(tranche.trancheCap, 'USDT', 6)}</span>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">
                  <span className="text-gray-500">Min Purchase:</span> {formatCurrency(tranche.perAccountMin, 'USDT', 6)}
                </div>
                <div className="text-gray-400">
                  <span className="text-gray-500">Max Purchase:</span> {formatCurrency(tranche.perAccountMax, 'USDT', 6)}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Trigger: {triggerText}
                </div>
                <button
                  onClick={() => onTrancheSelect(product, tranche)}
                  disabled={buttonState.disabled}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${buttonState.className}`}
                >
                  {buttonState.text}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};