"use client";

import React, { useState } from "react";
import type { Product, Tranche } from "@dinsure/contracts";

interface LiquidityModalProps {
  product: Product | null;
  tranche: Tranche | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: string) => Promise<void>;
}

export const LiquidityModal: React.FC<LiquidityModalProps> = ({
  product,
  tranche,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product || !tranche) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      await onConfirm(amount);
      setAmount('');
    } catch (error) {
      console.error('Liquidity provision failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Provide Liquidity</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {/* Product Info */}
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <div className="text-white font-medium mb-2">{product.name}</div>
          <div className="text-gray-400 text-sm mb-2">{tranche.name}</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Expected Premium</div>
              <div className="text-green-400 font-medium">~5% APY</div>
            </div>
            <div>
              <div className="text-gray-400">Risk Level</div>
              <div className="text-yellow-400 font-medium">MEDIUM</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">
              Deposit Amount (USDT)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              step="0.01"
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
            <div className="mt-2 text-sm text-gray-400">
              Minimum deposit: 100 USDT
            </div>
          </div>

          {/* Expected Returns */}
          {amount && parseFloat(amount) > 0 && (
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
              <div className="text-white font-medium mb-2">Expected Returns</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Premium Income</div>
                  <div className="text-green-400 font-medium">
                    ~{(parseFloat(amount) * 0.05).toFixed(2)} USDT (5%)
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Staking Rewards</div>
                  <div className="text-blue-400 font-medium">
                    ~{(parseFloat(amount) * 0.035).toFixed(2)} USDT (3.5%)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Depositing...' : 'Confirm Deposit'}
            </button>
          </div>
        </form>

        {/* Disclaimer */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          Note: This is a simplified mock interface. Actual implementation would include 
          USDT approval steps and real contract interactions.
        </div>
      </div>
    </div>
  );
};