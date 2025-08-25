"use client";

import React, { useState } from "react";
import { useWeb3 } from "@dinsure/contracts";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface LiquidityPool {
  id: string;
  asset: string;
  tranche: string;
  triggerLevel: number;
  expectedPremium: number;
  stakingAPY: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  poolSize: string;
  userShare: string;
  utilization: number;
  roundEndsIn: number;
}

interface DepositModalProps {
  pool: LiquidityPool | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: string) => Promise<void>;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  pool,
  isOpen,
  onClose,
  onConfirm
}) => {
  const { balance } = useWeb3();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !pool) return null;

  const calculateExpectedReturns = (depositAmount: string) => {
    if (!depositAmount || isNaN(parseFloat(depositAmount))) return { premium: 0, staking: 0, total: 0 };
    
    const amount = parseFloat(depositAmount);
    const premium = amount * pool.expectedPremium / 100;
    const staking = amount * pool.stakingAPY / 100;
    const total = premium + staking;
    
    return { premium, staking, total };
  };

  const handleConfirm = async () => {
    if (!amount) return;
    
    setIsProcessing(true);
    
    try {
      await onConfirm(amount);
      onClose();
      resetModal();
    } catch (error) {
      console.error("Deposit failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setAmount("");
    setIsProcessing(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetModal, 300);
  };

  const maxAmount = parseFloat(balance) * 1000; // Mock USDT conversion
  const returns = calculateExpectedReturns(amount);
  const riskChance = pool.triggerLevel === -5 ? 5 : pool.triggerLevel === -10 ? 10 : 15;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {isProcessing ? 'Processing...' : 'Provide Liquidity to Pool'}
            </h2>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {!isProcessing ? (
            <>
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-white font-medium mb-2">
                  {pool.asset} {pool.tranche} Tranche
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk Level:</span>
                    <span className="text-white">{pool.riskLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected Premium:</span>
                    <span className="text-green-400">{pool.expectedPremium}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Staking APY:</span>
                    <span className="text-blue-400">{pool.stakingAPY}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Round Ends:</span>
                    <span className="text-white">{pool.roundEndsIn} days</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Deposit Amount
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
                  <span>Available: {parseFloat(balance).toFixed(4)} KLAY</span>
                  <span>Max: ${maxAmount.toLocaleString()}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[25, 50, 75, 100].map(percentage => (
                    <button
                      key={percentage}
                      onClick={() => setAmount((maxAmount * percentage / 100).toString())}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded transition-colors"
                    >
                      {percentage}%
                    </button>
                  ))}
                </div>
              </div>

              {amount && parseFloat(amount) > 0 && (
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <h4 className="text-white font-medium mb-3">Expected Returns</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Premium Income ({pool.expectedPremium}%):</span>
                      <span className="text-green-400">~${returns.premium.toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Staking Rewards ({pool.stakingAPY}%):</span>
                      <span className="text-blue-400">~${returns.staking.toFixed(2)} USDT</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <span className="text-white">Total Expected:</span>
                        <span className="text-yellow-400">~${returns.total.toFixed(2)} USDT</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-6">
                <h4 className="text-yellow-400 font-medium mb-2">⚠️ Risk Disclosure</h4>
                <ul className="text-yellow-300 text-sm space-y-1">
                  <li>• ~{riskChance}% chance of trigger event occurring</li>
                  <li>• Funds locked until round completion</li>
                  <li>• Potential loss if insurance claims are triggered</li>
                  <li>• Returns are estimates, not guaranteed</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <input type="checkbox" id="risk-terms" className="rounded" />
                <label htmlFor="risk-terms" className="text-white text-sm">
                  I understand the risks and terms of liquidity provision
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount || isProcessing}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Confirm Deposit
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Processing Deposit</h3>
              <p className="text-gray-400 mb-4">Confirming your liquidity deposit...</p>
              <div className="bg-gray-700 rounded-lg p-3">
                <p className="text-gray-400 text-sm">
                  Depositing ${parseFloat(amount).toLocaleString()} USDT to {pool.asset} {pool.tranche}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};