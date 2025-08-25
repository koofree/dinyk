"use client";

import React, { useState } from "react";
import { useWeb3 } from "@/context/Web3Provider";
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

interface WithdrawModalProps {
  pool: LiquidityPool | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  pool,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !pool) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    
    try {
      await onConfirm();
      onClose();
      resetModal();
    } catch (error) {
      console.error("Withdraw failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setIsProcessing(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetModal, 300);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {isProcessing ? 'Processing...' : 'Withdraw from Pool'}
            </h2>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-gray-900 transition-colors"
            >
              ✕
            </button>
          </div>

          {!isProcessing ? (
            <>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <h3 className="text-gray-900 font-bold mb-2">
                  {pool.asset} {pool.tranche} Tranche
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk Level:</span>
                    <span className={`text-xs px-2 py-1 rounded text-white font-bold inline-block ${
                      pool.riskLevel === 'LOW' ? 'bg-green-500/70' :
                      pool.riskLevel === 'MEDIUM' ? 'bg-yellow-500/70' :
                      'bg-red-500/70'
                    }`}>
                      {pool.riskLevel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Your Share:</span>
                    <span className="text-gray-900 font-bold">${parseInt(pool.userShare).toLocaleString()} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pool Size:</span>
                    <span className="text-gray-900 font-bold">${parseInt(pool.poolSize).toLocaleString()} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Utilization:</span>
                    <span className="text-gray-900 font-bold">{pool.utilization}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="text-yellow-800 font-medium mb-2">⚠️ Withdrawal Notice</h4>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Withdrawal will remove your liquidity from this pool</li>
                  <li>• You will lose access to premium and staking rewards</li>
                  <li>• Withdrawal is irreversible once confirmed</li>
                  <li>• Transaction may take a few minutes to process</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <input type="checkbox" id="withdraw-terms" className="rounded" />
                <label htmlFor="withdraw-terms" className="text-gray-900 text-sm">
                  I understand the withdrawal terms and confirm my decision
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isProcessing}
                  className="flex-1 py-3 relative bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white rounded-lg transition-all duration-300 hover:scale-98 hover:shadow-lg group overflow-hidden disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  <span className="font-outfit">Confirm Withdrawal</span>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <h3 className="text-gray-900 font-medium mb-2">Processing Withdrawal</h3>
              <p className="text-gray-600 mb-4">Confirming your withdrawal request...</p>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-gray-600 text-sm">
                  Withdrawing ${parseInt(pool.userShare).toLocaleString()} USDT from {pool.asset} {pool.tranche}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
