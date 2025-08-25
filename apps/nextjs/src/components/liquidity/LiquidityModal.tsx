"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Product, Tranche, formatCurrency, formatPercentage, formatTimeRemaining, TriggerType } from "@dinsure/contracts";
import { useWeb3 } from "@dinsure/contracts";
import { useProvideLiquidity } from "@/hooks/useProvideLiquidity";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface LiquidityModalProps {
  product: Product | null;
  tranche: Tranche | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (amount: string) => void;
}

export const LiquidityModal: React.FC<LiquidityModalProps> = ({
  product,
  tranche,
  isOpen,
  onClose,
  onConfirm
}) => {
  const { isConnected, account } = useWeb3();
  const { 
    provideLiquidity,
    calculateYield,
    checkBalance,
    loading,
    approving,
    error 
  } = useProvideLiquidity();

  const [amount, setAmount] = useState("");
  const [usdtBalance, setUsdtBalance] = useState<string>("0");
  const [step, setStep] = useState<'input' | 'review' | 'approving' | 'processing' | 'success'>('input');
  const [txHash, setTxHash] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Load USDT balance
  useEffect(() => {
    if (isOpen && isConnected) {
      checkBalance().then(balance => {
        setUsdtBalance(ethers.formatUnits(balance, 6));
      });
    }
  }, [isOpen, isConnected, checkBalance]);

  // Reset modal when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setAmount("");
        setStep('input');
        setTermsAccepted(false);
        setTxHash("");
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen || !product || !tranche) return null;

  // For the modal, we need to get the active round
  const activeRound = tranche.rounds?.find(r => 
    r.stateName === 'OPEN' || r.stateName === 'ANNOUNCED' || r.stateName === 'ACTIVE'
  );

  if (!activeRound) return null;

  // Calculate yield info
  const yieldInfo = amount && !isNaN(parseFloat(amount)) 
    ? calculateYield(amount, tranche.premiumRateBps, tranche.maturityTimestamp)
    : null;

  const handleContinue = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (parseFloat(amount) > parseFloat(usdtBalance)) {
      alert("Insufficient USDT balance");
      return;
    }
    setStep('review');
  };

  const handleConfirm = async () => {
    if (!amount || !activeRound || !termsAccepted) return;
    
    setStep('processing');
    
    try {
      const result = await provideLiquidity({
        tranche: {
          trancheId: tranche.trancheId,
          poolAddress: tranche.poolAddress || ethers.ZeroAddress,
          premiumRateBps: tranche.premiumRateBps,
          threshold: tranche.threshold,
          triggerType: tranche.triggerType,
          maturityTimestamp: tranche.maturityTimestamp,
          rounds: tranche.rounds || []
        },
        round: activeRound,
        amount
      });
      
      setTxHash(result.txHash);
      setStep('success');
      
      // Call success callback after a delay
      setTimeout(() => {
        onConfirm?.(amount);
        onClose();
      }, 3000);
    } catch (err) {
      console.error("Liquidity provision failed:", err);
      setStep('review');
      alert(`Liquidity provision failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Format trigger price for display
  const triggerPrice = Number(ethers.formatEther(tranche.threshold));
  const triggerType = tranche.triggerType === TriggerType.PRICE_BELOW ? "Price Below" : 
                     tranche.triggerType === TriggerType.PRICE_ABOVE ? "Price Above" : "Custom";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {step === 'input' ? 'Provide Liquidity' : 
               step === 'review' ? 'Review Liquidity' : 
               step === 'approving' ? 'Approving USDT...' :
               step === 'processing' ? 'Processing...' : 
               'Success!'}
            </h2>
            <button
              onClick={onClose}
              disabled={step === 'processing' || step === 'approving'}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {step === 'input' && (
            <>
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-white font-medium mb-2">
                  {product.metadata?.name || `Product #${product.productId}`} - Round #{activeRound.roundId}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white">{activeRound.stateName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trigger:</span>
                    <span className="text-white">
                      {triggerType} ${triggerPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Premium Rate:</span>
                    <span className="text-white">{tranche.premiumRateBps / 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Maturity:</span>
                    <span className="text-white">
                      {new Date(tranche.maturityTimestamp * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  {activeRound.economics && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Demand:</span>
                      <span className="text-white">
                        ${Number(ethers.formatUnits(activeRound.economics.totalBuyerPurchases, 6)).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Collateral Amount (USDT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    min="1"
                    step="0.01"
                  />
                  <span className="absolute right-3 top-3 text-gray-400">USDT</span>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-400">
                  <span>Your balance: {parseFloat(usdtBalance).toFixed(2)} USDT</span>
                  <button
                    onClick={() => setAmount(usdtBalance)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Max
                  </button>
                </div>
              </div>

              {yieldInfo && parseFloat(amount) > 0 && (
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <h4 className="text-white font-medium mb-3">Yield Analysis</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Collateral:</span>
                      <span className="text-white">{parseFloat(amount).toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Premium Rate:</span>
                      <span className="text-white">{yieldInfo.premiumRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Days to Maturity:</span>
                      <span className="text-white">{yieldInfo.daysToMaturity.toFixed(0)} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Annualized Yield:</span>
                      <span className="text-green-400">{yieldInfo.annualizedYield.toFixed(2)}% APR</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <span className="text-white">Potential Earnings:</span>
                        <span className="text-green-400">
                          +{ethers.formatUnits(yieldInfo.potentialEarnings, 6)} USDT
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinue}
                  disabled={!isConnected || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(usdtBalance)}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 'review' && yieldInfo && (
            <>
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-white font-medium mb-4">Review Your Liquidity Provision</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tranche:</span>
                    <span className="text-white">#{tranche.trancheId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Round:</span>
                    <span className="text-white">#{activeRound.roundId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Collateral Amount:</span>
                    <span className="text-white">{parseFloat(amount).toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected Premium:</span>
                    <span className="text-green-400">
                      +{ethers.formatUnits(yieldInfo.potentialEarnings, 6)} USDT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Annualized Yield:</span>
                    <span className="text-green-400">{yieldInfo.annualizedYield.toFixed(2)}% APR</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-6">
                <h4 className="text-yellow-400 font-medium mb-2">⚠️ Risk Disclosure</h4>
                <ul className="text-yellow-300 text-sm space-y-1">
                  <li>• Your collateral is at risk if the trigger condition is met</li>
                  <li>• You will pay out insurance claims from your collateral</li>
                  <li>• Funds are locked until round settlement</li>
                  <li>• You will receive pool shares representing your position</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="terms" className="text-white text-sm">
                  I understand the risks and accept the terms
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('input')}
                  disabled={loading}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || !termsAccepted}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-600"
                >
                  Confirm Liquidity
                </button>
              </div>
            </>
          )}

          {(step === 'approving' || step === 'processing') && (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">
                {step === 'approving' ? 'Approving USDT...' : 'Processing Transaction...'}
              </h3>
              <p className="text-gray-400 mb-4">
                {step === 'approving' 
                  ? 'Please approve the USDT spending in your wallet'
                  : 'Please confirm the transaction in your wallet'}
              </p>
              <div className="bg-gray-700 rounded-lg p-3">
                <p className="text-gray-400 text-sm">This may take a few moments...</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="text-green-400 text-6xl mb-4">✓</div>
              <h3 className="text-white font-medium text-xl mb-2">Liquidity Provided!</h3>
              <p className="text-gray-400 mb-4">
                Your liquidity has been successfully added to the pool.
              </p>
              {txHash && (
                <div className="bg-gray-700 rounded-lg p-3 mb-4">
                  <p className="text-gray-400 text-sm mb-2">Transaction Hash:</p>
                  <a 
                    href={`https://kairos.kaiascan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs break-all"
                  >
                    {txHash}
                  </a>
                </div>
              )}
              <p className="text-gray-400 text-sm">
                You will receive pool shares representing your position.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};