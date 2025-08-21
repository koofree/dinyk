"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/context/Web3Provider";
import { useBuyInsurance } from "@/hooks/useBuyInsurance";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { TrancheDetails, RoundDetails } from "@/hooks/useTrancheData";

interface EnhancedPurchaseModalProps {
  trancheData: TrancheDetails | null;
  roundId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EnhancedPurchaseModal: React.FC<EnhancedPurchaseModalProps> = ({
  trancheData,
  roundId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { isConnected, account } = useWeb3();
  const { 
    buyInsurance, 
    calculatePremium, 
    checkBalance,
    loading,
    approving,
    error 
  } = useBuyInsurance();

  const [amount, setAmount] = useState("");
  const [usdtBalance, setUsdtBalance] = useState<string>("0");
  const [step, setStep] = useState<'input' | 'review' | 'approving' | 'processing' | 'success'>('input');
  const [txHash, setTxHash] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Find the selected round
  const selectedRound = trancheData?.rounds.find(r => r.roundId === roundId);

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

  if (!isOpen || !trancheData || !selectedRound) return null;

  // Calculate premium and total
  const premium = amount && !isNaN(parseFloat(amount)) 
    ? calculatePremium(amount, trancheData.premiumRateBps)
    : null;

  const premiumDisplay = premium 
    ? ethers.formatUnits(premium.premiumAmount, 6)
    : "0";
  
  const totalDisplay = premium 
    ? ethers.formatUnits(premium.totalCost, 6)
    : "0";

  const handleContinue = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (parseFloat(amount) > parseFloat(usdtBalance)) {
      alert("Insufficient USDT balance");
      return;
    }
    setStep('review');
  };

  const handleConfirm = async () => {
    if (!amount || !selectedRound || !termsAccepted) return;
    
    setStep('processing');
    
    try {
      const result = await buyInsurance({
        tranche: trancheData,
        round: selectedRound,
        amount
      });
      
      setTxHash(result.txHash);
      setStep('success');
      
      // Call success callback after a delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 3000);
    } catch (err) {
      console.error("Purchase failed:", err);
      setStep('review');
      alert(`Purchase failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Format trigger price for display
  const triggerPrice = Number(ethers.formatEther(trancheData.threshold));
  const triggerType = trancheData.triggerType === 0 ? "Price Below" : 
                     trancheData.triggerType === 1 ? "Price Above" : "Custom";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {step === 'input' ? 'Buy Insurance' : 
               step === 'review' ? 'Review Purchase' : 
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
                  Tranche {trancheData.trancheId} - Round #{selectedRound.roundId}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white">{selectedRound.stateName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trigger:</span>
                    <span className="text-white">
                      {triggerType} ${triggerPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Premium Rate:</span>
                    <span className="text-white">{trancheData.premiumRateBps / 100}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Maturity:</span>
                    <span className="text-white">
                      {new Date(trancheData.maturityTimestamp * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedRound.economics && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pool Size:</span>
                      <span className="text-white">
                        ${Number(ethers.formatUnits(selectedRound.economics.totalSellerCollateral, 6)).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-white font-medium mb-2">
                  Coverage Amount (USDT)
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

              {amount && parseFloat(amount) > 0 && (
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Coverage:</span>
                      <span className="text-white">{parseFloat(amount).toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Premium ({trancheData.premiumRateBps / 100}%):</span>
                      <span className="text-white">{parseFloat(premiumDisplay).toFixed(2)} USDT</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <span className="text-white">Total Payment:</span>
                        <span className="text-white">{parseFloat(totalDisplay).toFixed(2)} USDT</span>
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

          {step === 'review' && (
            <>
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-white font-medium mb-4">Review Your Insurance Purchase</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tranche:</span>
                    <span className="text-white">#{trancheData.trancheId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Round:</span>
                    <span className="text-white">#{selectedRound.roundId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Coverage Amount:</span>
                    <span className="text-white">{parseFloat(amount).toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Premium:</span>
                    <span className="text-white">{parseFloat(premiumDisplay).toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Payment:</span>
                    <span className="text-white font-medium">{parseFloat(totalDisplay).toFixed(2)} USDT</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-6">
                <h4 className="text-yellow-400 font-medium mb-2">⚠️ Important</h4>
                <ul className="text-yellow-300 text-sm space-y-1">
                  <li>• Insurance coverage begins when round becomes ACTIVE</li>
                  <li>• Payout is automatic if trigger condition is met</li>
                  <li>• Premium is non-refundable once paid</li>
                  <li>• You will receive an NFT token as proof of insurance</li>
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
                  I understand and accept the terms and conditions
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
                  Confirm Purchase
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
              <h3 className="text-white font-medium text-xl mb-2">Purchase Successful!</h3>
              <p className="text-gray-400 mb-4">
                Your insurance coverage has been purchased successfully.
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
                You will receive an insurance NFT token shortly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};