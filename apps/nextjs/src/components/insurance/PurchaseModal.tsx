"use client";

import React, { useState } from "react";
import { InsuranceProduct, InsuranceTranche } from "@/lib/types";
import { useWeb3 } from "@/context/Web3Provider";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface PurchaseModalProps {
  product: InsuranceProduct | null;
  tranche: InsuranceTranche | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: string) => Promise<void>;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  product,
  tranche,
  isOpen,
  onClose,
  onConfirm
}) => {
  const { isConnected, balance } = useWeb3();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'review' | 'processing'>('input');

  if (!isOpen || !product || !tranche) return null;

  const calculatePremium = (coverageAmount: string) => {
    if (!coverageAmount || isNaN(parseFloat(coverageAmount))) return "0";
    return (parseFloat(coverageAmount) * tranche.premium / 100).toFixed(2);
  };

  const calculateTotal = (coverageAmount: string) => {
    const premium = calculatePremium(coverageAmount);
    const protocolFee = parseFloat(premium) * 0.05; // 5% protocol fee
    return (parseFloat(premium) + protocolFee).toFixed(2);
  };

  const handleContinue = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setStep('review');
  };

  const handleConfirm = async () => {
    if (!amount) return;
    
    setIsProcessing(true);
    setStep('processing');
    
    try {
      await onConfirm(amount);
      onClose();
      resetModal();
    } catch (error) {
      console.error("Purchase failed:", error);
      setStep('review');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setAmount("");
    setStep('input');
    setIsProcessing(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetModal, 300);
  };

  const premium = calculatePremium(amount);
  const total = calculateTotal(amount);
  const maxAmount = Math.min(parseInt(tranche.available), parseFloat(balance) * 100); // Assuming USDT conversion

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {step === 'input' ? 'Buy Insurance' : step === 'review' ? 'Review Purchase' : 'Processing...'}
            </h2>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {step === 'input' && (
            <>
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-white font-medium mb-2">{product.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trigger:</span>
                    <span className="text-white">{product.asset} drops {Math.abs(tranche.triggerLevel)}% or more</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Premium:</span>
                    <span className="text-white">{tranche.premium}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expiry:</span>
                    <span className="text-white">{tranche.expiry} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Available:</span>
                    <span className="text-white">${parseInt(tranche.available).toLocaleString()} USDT</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Coverage Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    max={maxAmount}
                    min="1"
                  />
                  <span className="absolute right-3 top-3 text-gray-400">USDT</span>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-400">
                  <span>Your balance: {parseFloat(balance).toFixed(4)} KLAY</span>
                  <span>Max: ${maxAmount.toLocaleString()}</span>
                </div>
              </div>

              {amount && parseFloat(amount) > 0 && (
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Coverage:</span>
                      <span className="text-white">${parseFloat(amount).toLocaleString()} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Premium ({tranche.premium}%):</span>
                      <span className="text-white">${premium} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Protocol Fee (5%):</span>
                      <span className="text-white">${(parseFloat(premium) * 0.05).toFixed(2)} USDT</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <span className="text-white">Total Payment:</span>
                        <span className="text-white">${total} USDT</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinue}
                  disabled={!isConnected || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 'review' && (
            <>
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-white font-medium mb-4">Review Your Insurance</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Product:</span>
                    <span className="text-white">{product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Coverage:</span>
                    <span className="text-white">${parseFloat(amount).toLocaleString()} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Premium:</span>
                    <span className="text-white">${premium} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expiry:</span>
                    <span className="text-white">{tranche.expiry} days</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-6">
                <h4 className="text-yellow-400 font-medium mb-2">⚠️ Important</h4>
                <ul className="text-yellow-300 text-sm space-y-1">
                  <li>• Payout is automatic upon trigger</li>
                  <li>• No manual claims needed</li>
                  <li>• Non-refundable after purchase</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <input type="checkbox" id="terms" className="rounded" />
                <label htmlFor="terms" className="text-white text-sm">
                  I understand the terms and conditions
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('input')}
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-600"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Transaction in Progress</h3>
              <p className="text-gray-400 mb-4">Waiting for wallet confirmation...</p>
              <div className="bg-gray-700 rounded-lg p-3">
                <p className="text-gray-400 text-sm">This may take a few moments...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};