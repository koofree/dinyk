"use client";

import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import type { TrancheDetails } from "@/hooks/useTrancheData";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";

import { useBuyerOperations, useContracts, useWeb3 } from "@dinsure/contracts";

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
  onSuccess,
}) => {
  const { isConnected, account } = useWeb3();
  const { usdt } = useContracts();
  const {
    buyInsurance,
    calculatePremium: calcPremium,
    isLoading: loading,
    isPreparing: approving,
  } = useBuyerOperations();

  const [amount, setAmount] = useState("");
  const [usdtBalance, setUsdtBalance] = useState<string>("0");
  const [step, setStep] = useState<
    "input" | "review" | "approving" | "processing" | "success"
  >("input");
  const [txHash, setTxHash] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find the selected round
  const selectedRound = trancheData?.rounds.find((r) => r.roundId === roundId);

  // Load USDT balance
  useEffect(() => {
    if (isOpen && isConnected && account && usdt) {
      usdt
        .balanceOf(account)
        .then((balance) => {
          setUsdtBalance(ethers.formatUnits(balance, 6));
        })
        .catch((err) => {
          console.error("Failed to fetch balance:", err);
          setUsdtBalance("0");
        });
    }
  }, [isOpen, isConnected, account, usdt]);

  // Reset modal when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setAmount("");
        setStep("input");
        setTermsAccepted(false);
        setTxHash("");
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen || !trancheData || !selectedRound) return null;

  // Calculate premium and total
  const calculatePremium = (amt: string, premiumBps: number) => {
    if (!amt || isNaN(parseFloat(amt))) return null;
    const amountWei = ethers.parseUnits(amt, 6);
    const premiumAmount = (amountWei * BigInt(premiumBps)) / 10000n;
    const totalCost = amountWei + premiumAmount;
    return { premiumAmount, totalCost };
  };

  const premium =
    amount && !isNaN(parseFloat(amount))
      ? calculatePremium(amount, trancheData.premiumRateBps)
      : null;

  const premiumDisplay = premium
    ? ethers.formatUnits(premium.premiumAmount, 6)
    : "0";

  const totalDisplay = premium ? ethers.formatUnits(premium.totalCost, 6) : "0";

  const handleContinue = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (parseFloat(amount) > parseFloat(usdtBalance)) {
      alert("Insufficient USDT balance");
      return;
    }
    setStep("review");
  };

  const handleConfirm = async () => {
    if (!amount || !selectedRound || !termsAccepted) return;

    setStep("processing");

    try {
      const result = await buyInsurance({
        roundId: selectedRound.roundId,
        coverageAmount: amount,
      });

      setTxHash(result.transactionHash || "");
      setStep("success");

      // Call success callback after a delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 3000);
    } catch (err) {
      console.error("Purchase failed:", err);
      setStep("review");
      alert(
        `Purchase failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  // Format trigger price for display
  const triggerPrice = Number(ethers.formatEther(trancheData.threshold));
  const triggerType =
    trancheData.triggerType === 0
      ? "Price Below"
      : trancheData.triggerType === 1
        ? "Price Above"
        : "Custom";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-gray-800">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {step === "input"
                ? "Buy Insurance"
                : step === "review"
                  ? "Review Purchase"
                  : step === "approving"
                    ? "Approving USDT..."
                    : step === "processing"
                      ? "Processing..."
                      : "Success!"}
            </h2>
            <button
              onClick={onClose}
              disabled={step === "processing" || step === "approving"}
              className="text-gray-400 transition-colors hover:text-white"
            >
              ✕
            </button>
          </div>

          {step === "input" && (
            <>
              <div className="mb-6 rounded-lg bg-gray-700 p-4">
                <h3 className="mb-2 font-medium text-white">
                  Tranche {trancheData.trancheId} - Round #
                  {selectedRound.roundId}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white">
                      {selectedRound.stateName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trigger:</span>
                    <span className="text-white">
                      {triggerType} ${triggerPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Premium Rate:</span>
                    <span className="text-white">
                      {trancheData.premiumRateBps / 100}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Maturity:</span>
                    <span className="text-white">
                      {new Date(
                        trancheData.maturityTimestamp * 1000,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedRound.economics && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pool Size:</span>
                      <span className="text-white">
                        $
                        {Number(
                          ethers.formatUnits(
                            selectedRound.economics.totalSellerCollateral,
                            6,
                          ),
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="mb-2 block font-medium text-white">
                  Coverage Amount (USDT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                    min="1"
                    step="0.01"
                  />
                  <span className="absolute right-3 top-3 text-gray-400">
                    USDT
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-gray-400">
                  <span>
                    Your balance: {parseFloat(usdtBalance).toFixed(2)} USDT
                  </span>
                  <button
                    onClick={() => setAmount(usdtBalance)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Max
                  </button>
                </div>
              </div>

              {amount && parseFloat(amount) > 0 && (
                <div className="mb-6 rounded-lg bg-gray-700 p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Coverage:</span>
                      <span className="text-white">
                        {parseFloat(amount).toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">
                        Premium ({trancheData.premiumRateBps / 100}%):
                      </span>
                      <span className="text-white">
                        {parseFloat(premiumDisplay).toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="mt-2 border-t border-gray-600 pt-2">
                      <div className="flex justify-between font-medium">
                        <span className="text-white">Total Payment:</span>
                        <span className="text-white">
                          {parseFloat(totalDisplay).toFixed(2)} USDT
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg bg-gray-700 py-3 text-white transition-colors hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContinue}
                  disabled={
                    !isConnected ||
                    !amount ||
                    parseFloat(amount) <= 0 ||
                    parseFloat(amount) > parseFloat(usdtBalance)
                  }
                  className="flex-1 rounded-lg bg-blue-600 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-600"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === "review" && (
            <>
              <div className="mb-6 rounded-lg bg-gray-700 p-4">
                <h3 className="mb-4 font-medium text-white">
                  Review Your Insurance Purchase
                </h3>
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
                    <span className="text-white">
                      {parseFloat(amount).toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Premium:</span>
                    <span className="text-white">
                      {parseFloat(premiumDisplay).toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Payment:</span>
                    <span className="font-medium text-white">
                      {parseFloat(totalDisplay).toFixed(2)} USDT
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6 rounded-lg border border-yellow-600 bg-yellow-900/20 p-4">
                <h4 className="mb-2 font-medium text-yellow-400">
                  ⚠️ Important
                </h4>
                <ul className="space-y-1 text-sm text-yellow-300">
                  <li>• Insurance coverage begins when round becomes ACTIVE</li>
                  <li>• Payout is automatic if trigger condition is met</li>
                  <li>• Premium is non-refundable once paid</li>
                  <li>• You will receive an NFT token as proof of insurance</li>
                </ul>
              </div>

              <div className="mb-6 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="terms" className="text-sm text-white">
                  I understand and accept the terms and conditions
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("input")}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-gray-700 py-3 text-white transition-colors hover:bg-gray-600"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || !termsAccepted}
                  className="flex-1 rounded-lg bg-blue-600 py-3 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-600"
                >
                  Confirm Purchase
                </button>
              </div>
            </>
          )}

          {(step === "approving" || step === "processing") && (
            <div className="py-8 text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <h3 className="mb-2 font-medium text-white">
                {step === "approving"
                  ? "Approving USDT..."
                  : "Processing Transaction..."}
              </h3>
              <p className="mb-4 text-gray-400">
                {step === "approving"
                  ? "Please approve the USDT spending in your wallet"
                  : "Please confirm the transaction in your wallet"}
              </p>
              <div className="rounded-lg bg-gray-700 p-3">
                <p className="text-sm text-gray-400">
                  This may take a few moments...
                </p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-8 text-center">
              <div className="mb-4 text-6xl text-green-400">✓</div>
              <h3 className="mb-2 text-xl font-medium text-white">
                Purchase Successful!
              </h3>
              <p className="mb-4 text-gray-400">
                Your insurance coverage has been purchased successfully.
              </p>
              {txHash && (
                <div className="mb-4 rounded-lg bg-gray-700 p-3">
                  <p className="mb-2 text-sm text-gray-400">
                    Transaction Hash:
                  </p>
                  <a
                    href={`https://kairos.kaiascan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm text-blue-400 hover:text-blue-300"
                  >
                    {txHash}
                  </a>
                </div>
              )}
              <p className="text-sm text-gray-400">
                You will receive an insurance NFT token shortly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
