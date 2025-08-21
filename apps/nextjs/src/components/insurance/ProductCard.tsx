"use client";

import React from "react";
import { InsuranceProduct, InsuranceTranche } from "@/lib/types";
import { KAIA_TESTNET } from "@/lib/constants";

const RISK_COLORS = {
  LOW: 'text-green-400',
  MEDIUM: 'text-yellow-400', 
  HIGH: 'text-red-400'
};

const ROUND_STATE_COLORS = {
  ANNOUNCED: 'text-gray-400',
  OPEN: 'text-green-400',
  MATCHED: 'text-blue-400',
  ACTIVE: 'text-yellow-400',
  MATURED: 'text-orange-400',
  SETTLED: 'text-purple-400',
  CANCELED: 'text-red-400'
};

interface ProductCardProps {
  product: InsuranceProduct;
  onTrancheSelect: (product: InsuranceProduct, tranche: InsuranceTranche) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onTrancheSelect }) => {
  const formatNumber = (num: string) => {
    return parseInt(num).toLocaleString();
  };

  const getFilledPercentage = (filled: string, capacity: string) => {
    return Math.round((parseInt(filled) / parseInt(capacity)) * 100);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{product.name}</h3>
          <p className="text-gray-400 text-sm mt-1">{product.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-500">Product ID: #{product.productId}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">Oracle: Orakl Price Feed</span>
          </div>
        </div>
        <div className="text-2xl font-bold text-blue-400">{product.asset}</div>
      </div>

      <div className="space-y-3">
        {product.tranches.map((tranche) => {
          const filledPercentage = getFilledPercentage(tranche.filled, tranche.capacity);
          const isLowCapacity = parseInt(tranche.available) < 5000;

          return (
            <div 
              key={tranche.id}
              className="bg-gray-700 rounded-lg p-4 border border-gray-600"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">
                    {tranche.name}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${RISK_COLORS[tranche.riskLevel]} bg-gray-600`}>
                    {tranche.riskLevel}
                  </span>
                  {tranche.roundState && (
                    <span className={`text-xs px-2 py-1 rounded bg-gray-600 ${ROUND_STATE_COLORS[tranche.roundState]}`}>
                      {tranche.roundState}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">Premium: {tranche.premium}%</div>
                  <div className="text-gray-400 text-sm">Maturity: {tranche.maturityDays} days</div>
                  <div className="text-gray-400 text-xs">Tranche #{tranche.id}</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Capacity</span>
                  <span>{filledPercentage}% filled</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${filledPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Available: ${formatNumber(tranche.available)} USDT</span>
                  <span>Total: ${formatNumber(tranche.capacity)} USDT</span>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">
                  <span className="text-gray-500">Min Purchase:</span> ${formatNumber(tranche.perAccountMin)}
                </div>
                <div className="text-gray-400">
                  <span className="text-gray-500">Max Purchase:</span> ${formatNumber(tranche.perAccountMax)}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Trigger: {tranche.triggerType === 'PRICE_BELOW' ? 'Price <' : 'Price >'} ${formatNumber(tranche.triggerPrice.toString())}
                </div>
                <button
                  onClick={() => onTrancheSelect(product, tranche)}
                  disabled={isLowCapacity || tranche.roundState !== 'OPEN'}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    tranche.roundState !== 'OPEN'
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : isLowCapacity
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {tranche.roundState === 'ANNOUNCED' ? 'Coming Soon' :
                   tranche.roundState === 'OPEN' ? (isLowCapacity ? 'Low Capacity' : 'Buy Insurance') :
                   tranche.roundState === 'ACTIVE' ? 'Round Active' :
                   tranche.roundState === 'SETTLED' ? 'Round Settled' :
                   'Not Available'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};