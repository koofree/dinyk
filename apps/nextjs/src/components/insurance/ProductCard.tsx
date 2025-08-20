"use client";

import React from "react";
import { InsuranceProduct, InsuranceTranche } from "@/lib/types";
import { RISK_COLORS } from "@/lib/constants";

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
                    Tranche {tranche.triggerLevel}%
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${RISK_COLORS[tranche.riskLevel]} bg-gray-600`}>
                    {tranche.riskLevel}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">Premium: {tranche.premium}%</div>
                  <div className="text-gray-400 text-sm">Expiry: {tranche.expiry} days</div>
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

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  Trigger: {product.asset} drops {Math.abs(tranche.triggerLevel)}% or more
                </div>
                <button
                  onClick={() => onTrancheSelect(product, tranche)}
                  disabled={isLowCapacity}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isLowCapacity
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isLowCapacity ? 'Low Capacity' : 'Buy Insurance'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};