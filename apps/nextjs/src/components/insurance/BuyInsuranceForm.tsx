"use client";

import { calculatePremium } from "@/lib/utils/insurance";
import { formatUnits, parseUnits } from "ethers";
import {
    AlertCircle,
    Calculator,
    CheckCircle,
    Loader2,
    Shield,
} from "lucide-react";
import { useEffect, useState } from "react";

import { ErrorAlert } from "@/components/common/ErrorAlert";
import type { ErrorHandlingResult } from "@dinsure/contracts";
import {
    useBuyerOperations,
    useContracts,
    useWeb3,
    Web3ErrorHandler
} from "@dinsure/contracts";
import { Slider } from "@dinsure/ui/slider";

interface BuyInsuranceFormProps {
  productId: bigint;
  trancheId: number;
  roundId: bigint;
  tranche: {
    trigger: bigint;
    premiumBps: bigint;
    poolAddress: string;
  };
  onSuccess?: () => void;
}

export function BuyInsuranceForm({
  productId,
  trancheId,
  roundId,
  tranche,
  onSuccess,
}: BuyInsuranceFormProps) {
  const {
    account,
    isConnected,
    usdtBalance: usdtBalanceStr,
    refreshUSDTBalance,
  } = useWeb3();
  const { buyInsurance } = useBuyerOperations();
  const { usdtContract, isInitialized } = useContracts();

  // Convert string balance to bigint
  const usdtBalance = usdtBalanceStr ? parseUnits(usdtBalanceStr, 6) : 0n;

  // Debug logging
  useEffect(() => {
    console.log("BuyInsuranceForm state:", {
      isConnected,
      account,
      isInitialized,
      hasUsdtContract: !!usdtContract,
    });
  }, [isConnected, account, isInitialized, usdtContract]);

  const [coverageAmount, setCoverageAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorHandlingResult | null>(null);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState("");

  const premiumAmount = coverageAmount
    ? calculatePremium(coverageAmount, tranche.premiumBps)
    : "0";
  const totalCost = coverageAmount
    ? (parseFloat(coverageAmount) + parseFloat(premiumAmount)).toFixed(2)
    : "0";

  // Refresh USDT balance when component mounts or when connection changes
  useEffect(() => {
    if (isConnected && refreshUSDTBalance) {
      void refreshUSDTBalance();
    }
  }, [isConnected, refreshUSDTBalance]);

  const handleBuyInsurance = async () => {
    console.log("Buy Insurance clicked - Connection state:", {
      isConnected,
      account,
      hasUsdtContract: !!usdtContract,
      isInitialized,
      roundId,
    });

    if (!isConnected) {
      setError({
        userMessage: "Please connect your wallet",
        action: 'none',
        severity: 'warning'
      });
      return;
    }

    if (typeof account !== "string") {
      setError({
        userMessage: "No wallet address found",
        action: 'none',
        severity: 'error'
      });
      return;
    }

    if (!isInitialized || !usdtContract) {
      setError({
        userMessage: "Contracts are still loading. Please try again.",
        action: 'retry',
        severity: 'warning'
      });
      return;
    }

    if (roundId === 0n) {
      setError({
        userMessage: "No active round available for this tranche",
        action: 'none',
        severity: 'warning'
      });
      return;
    }

    if (!coverageAmount || parseFloat(coverageAmount) <= 0) {
      setError({
        userMessage: "Please enter a valid coverage amount",
        action: 'none',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // buyInsurance already waits for the transaction and returns the receipt
      const receipt = await buyInsurance({
        productId,
        trancheId,
        roundId,
        coverageAmount: coverageAmount, // Pass as string, not bigint
      });

      if (receipt) {
        setTxHash(receipt.hash);
        setSuccess(true);
        setCoverageAmount("");

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      console.error("Error buying insurance:", err);
      const result = Web3ErrorHandler.handle(err);
      setError(result);
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (value: number[]) => {
    setCoverageAmount(value[0]?.toString() ?? "0");
  };

  const maxCoverage = usdtBalance
    ? Math.min(Number(formatUnits(usdtBalance, 6)), 100000)
    : 100000;

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5">
        <h3 className="text-2xl font-semibold leading-none tracking-tight text-white flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Buy Insurance Coverage
        </h3>
        <p className="text-sm text-gray-400">
          Underwrite insurances using USDT to earn premiums and yields
        </p>
      </div>
      <div className="space-y-6">
        {roundId === 0n && (
          <div className="relative w-full rounded-lg border p-4 border-gray-600 bg-gray-700">
            <AlertCircle className="absolute left-4 top-4 h-4 w-4 text-yellow-400" />
            <div className="pl-7 text-sm text-yellow-400">
              No active insurance round available. Please check back later or
              select a different tranche.
            </div>
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="coverage" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white">
              Coverage Amount (USDT)
            </label>
            <input
              id="coverage"
              type="number"
              placeholder="Enter coverage amount"
              value={coverageAmount}
              onChange={(e) => setCoverageAmount(e.target.value)}
              disabled={loading || !isConnected}
              className="flex h-9 w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                          />
            <div className="h-2"></div>
            <Slider
              value={[parseFloat(coverageAmount) ?? 0]}
              onValueChange={handleSliderChange}
              max={maxCoverage}
              step={100}
              className="mt-2"
              disabled={loading || !isConnected}
            />
            <p className="text-sm text-gray-400">
              {isConnected
                ? `Available: $${usdtBalance ? Number(formatUnits(usdtBalance, 6)).toLocaleString() : "0"} USDT`
                : "Connect wallet to view balance"}
            </p>
            {usdtBalance === 0n && isConnected && (
              <p className="mt-1 text-sm text-yellow-600">
                No test USDT detected. The contract may not be deployed on this
                network or you need test tokens.
              </p>
            )}
          </div>

          <div className="space-y-3 rounded-lg bg-gray-700 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Coverage Amount:
              </span>
              <span className="font-medium text-white">
                ${parseFloat(coverageAmount || "0").toLocaleString()} USDT
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Premium ({Number(tranche.premiumBps) / 100}%):
              </span>
              <span className="font-medium text-green-400">
                ${parseFloat(premiumAmount).toLocaleString()} USDT
              </span>
            </div>
            <div className="border-t border-gray-600 pt-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">Total Cost:</span>
                <span className="text-lg font-bold text-white">
                  ${parseFloat(totalCost).toLocaleString()} USDT
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-600 p-3">
              <div className="mb-1 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-white">Trigger Price</span>
              </div>
              <p className="text-lg font-bold text-red-500">
                ${tranche.trigger / BigInt(1e18)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-600 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-white">Max Payout</span>
              </div>
              <p className="text-lg font-bold text-blue-500">
                ${parseFloat(coverageAmount || "0").toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <ErrorAlert 
            error={error}
            onRetry={handleBuyInsurance}
            onClose={() => setError(null)}
          />
        )}

        {success && (
          <div className="relative w-full rounded-lg border p-4 border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="absolute left-4 top-4 h-4 w-4 text-green-600" />
            <div className="pl-7 text-sm text-green-600">
              Insurance purchased successfully!
              {txHash && (
                <a
                  href={`https://kairos.kaiascope.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block underline"
                >
                  View transaction
                </a>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleBuyInsurance}
          disabled={
            loading ||
            !isConnected ||
            !isInitialized ||
            roundId === 0n ||
            (!coverageAmount && isConnected)
          }
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white shadow hover:from-[#00B1B8] hover:to-[#86D99C] disabled:bg-gray-600 disabled:hover:from-gray-600 disabled:hover:to-gray-600 h-10 rounded-xl px-8 w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : !isConnected ? (
            "Connect Wallet to Buy Insurance"
          ) : roundId === 0n ? (
            "No Active Round Available"
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Buy Insurance
            </>
          )}
        </button>

        {!isConnected && (
          <p className="text-center text-sm text-gray-400">
            Connect your wallet to purchase insurance coverage
          </p>
        )}

        {isConnected && !isInitialized && (
          <p className="text-center text-sm text-gray-400">
            Loading contracts...
          </p>
        )}
      </div>
    </div>
  );
}
