"use client";

import { formatUnits, parseUnits } from "ethers";
import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle,
  Loader2,
  TrendingUp,
  Wallet
} from "lucide-react";
import { useEffect, useState } from "react";

import { useContracts, useSellerOperations, useWeb3 } from "@dinsure/contracts";
import { Slider } from "@dinsure/ui/slider";

interface ProvideLiquidityFormProps {
  poolAddress: string;
  trancheId: number; // Need tranche ID for operations
  roundId?: number | bigint; // Optional round ID for deposits
  onSuccess?: () => void;
}

export function ProvideLiquidityForm({
  poolAddress,
  trancheId,
  roundId,
  onSuccess,
}: ProvideLiquidityFormProps) {
  const {
    account,
    isConnected,
    usdtBalance: usdtBalanceStr,
    refreshUSDTBalance,
    signer,
  } = useWeb3();
  const {
    depositCollateral,  
    getPoolAccounting,
    getShareBalance,
  } = useSellerOperations();
  const contracts = useContracts();
  
  const { isInitialized } = contracts;

  // Debug Web3 context
  useEffect(() => {
    console.log("Web3 context in ProvideLiquidityForm:", {
      account,
      isConnected,
      hasSigner: !!signer,
      signerType: signer ? typeof signer : "undefined"
    });
  }, [account, isConnected, signer]);

  // Convert string balance to bigint
  const usdtBalance = usdtBalanceStr ? parseUnits(usdtBalanceStr, 6) : 0n;

  
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [userShares, setUserShares] = useState<bigint>(0n);
  const [navInfo, setNavInfo] = useState<{
    totalAssets: bigint;
    sharePrice: bigint;
  } | null>(null);

  // Debug button state
  useEffect(() => {
    console.log("Deposit button state:", {
      loading,
      isConnected,
      isInitialized,
      amount,
      hasSigner: !!signer,
      roundId,
      hasRoundId: !!roundId,
      buttonDisabled:
        loading || !isConnected || !isInitialized || !amount || !signer,
      tabDisabled: !roundId,
    });
  }, [loading, isConnected, isInitialized, amount, signer, roundId]);

  useEffect(() => {
    // Refresh USDT balance
    if (
      isConnected &&
      typeof refreshUSDTBalance === "function"
    ) {
      void refreshUSDTBalance();
    }

    const loadUserData = async () => {
      if (isConnected && account && isInitialized) {
        try {
          // Get pool accounting data
          const poolAccounting = await getPoolAccounting(trancheId);
          if (poolAccounting) {
            setNavInfo({
              totalAssets: poolAccounting.totalAssets ?? 0n,
              sharePrice: poolAccounting.navPerShare ?? 0n,
            });
          } else {
            // No pool or round exists, clear NAV info
            setNavInfo(null);
          }

          // Get user's share balance (will return 0 if no pool)
          const shares = await getShareBalance(trancheId);
          setUserShares(shares);
        } catch (err) {
          console.error("Error loading user data:", err);
          // Clear state on error
          setNavInfo(null);
          setUserShares(0n);
        }
      }
    };
    void loadUserData();
  }, [
    isConnected,
    account,
    isInitialized,
    trancheId,
    getPoolAccounting,
    getShareBalance,
    refreshUSDTBalance,
  ]);

  const handleDeposit = async () => {
    if (!isConnected || typeof account !== "string") {
      setError("Please connect your wallet");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!roundId) {
      setError("No active round available for deposits");
      return;
    }

    if (!isInitialized) {
      setError("Contracts are still initializing. Please wait a moment.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      console.log("Attempting to deposit collateral with:", {
        roundId: Number(roundId),
        amount,
        isInitialized,
        hasProductCatalog: !!contracts.productCatalog,
        hasTranchePoolFactory: !!contracts.tranchePoolFactory,
        hasUsdt: !!contracts.usdt,
        hasSigner: !!signer,
        account,
      });

      // depositCollateral already waits for the transaction and returns the receipt
      const receipt = await depositCollateral({
        roundId: Number(roundId),
        collateralAmount: amount,
      });

      setTxHash(receipt?.hash ?? "");
      setSuccess(true);
      setAmount("");

      if (onSuccess) {
        onSuccess();
      }

      // Update pool accounting and user shares after deposit
      const poolAccounting = await getPoolAccounting(trancheId);
      if (poolAccounting) {
        setNavInfo({
          totalAssets: poolAccounting.totalAssets ?? 0n,
          sharePrice: poolAccounting.navPerShare ?? 0n,
        });
      }

      // Get updated user shares
      const updatedShares = await getShareBalance(trancheId);
      setUserShares(updatedShares);
    } catch (err) {
      console.error("Error depositing:", err);
      const error = err as Error;
      // Show the specific error message to help debug
      setError(error.message || "Failed to deposit");
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (value: number[]) => {
    setAmount(value[0]?.toString() ?? "0");
  };

  const maxDeposit = usdtBalance
    ? Math.min(Number(formatUnits(usdtBalance, 6)), 100000)
    : 100000;

  // Max withdraw in USDT based on user's shares
  const maxWithdraw =
    userShares && navInfo?.sharePrice
      ? (Number(formatUnits(userShares, 18)) * Number(navInfo.sharePrice)) / 1e6
      : 0;

  const estimatedShares =
    amount && navInfo?.sharePrice
      ? ((parseFloat(amount) * 1e6) / Number(navInfo.sharePrice)).toFixed(4)
      : "0";

  return (
    <div className="space-y-6 mobile:min-w-[620px]">
      <div className="flex flex-col space-y-1.5">
        <h3 className="text-2xl font-semibold leading-none tracking-tight text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Deposit(Sell) Insurance
        </h3>
        <p className="text-sm text-gray-400">
          Underwrite insurances using USDT to earn premiums and yields
        </p>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-600 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-white">Your Position</span>
            </div>
            <p className="text-lg font-bold text-white">
              $
              {navInfo && userShares > 0n
                ? (
                    (Number(formatUnits(userShares, 18)) *
                      Number(navInfo.sharePrice)) /
                    1e6
                  ).toFixed(2)
                : "0.00"}{" "}
              USDT
            </p>
            {userShares > 0n && (
              <p className="text-sm text-gray-400">
                {Number(formatUnits(userShares, 18)).toFixed(4)} shares
              </p>
            )}
          </div>
          <div className="rounded-lg border border-gray-600 p-3">
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-white">Share Price</span>
            </div>
            <p className="text-lg font-bold text-white">
              $
              {navInfo
                ? (Number(navInfo.sharePrice) / 1e18).toFixed(4)
                : "1.0000"}
            </p>
            <p className="text-sm text-gray-400">Per share value</p>
          </div>
        </div>

        {/* Only show deposit component, no tabs */}
        {!roundId ? (
          <div className="relative w-full rounded-lg border p-4 border-gray-600 bg-gray-700">
            <AlertCircle className="absolute left-4 top-4 h-4 w-4 text-amber-400" />
            <div className="pl-7 text-sm text-amber-400">
              Deposits require an OPEN round. Please select a round with
              "OPEN" status from the rounds list below to provide liquidity.
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="deposit-amount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white">
                Deposit Amount (USDT)
              </label>
              <input
                id="deposit-amount"
                type="number"
                placeholder="Enter amount to deposit"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                className="flex h-9 w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 text-white"
              />
              <Slider
                value={[parseFloat(amount) || 0]}
                onValueChange={handleSliderChange}
                max={maxDeposit}
                step={10}
                className="mt-2"
                disabled={loading}
              />
              <p className="text-sm text-gray-400">
                Available: $
                {usdtBalance
                  ? Number(formatUnits(usdtBalance, 6)).toLocaleString()
                  : "0"}{" "}
                USDT
              </p>
            </div>

            <div className="space-y-2 rounded-lg bg-gray-700 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  You will deposit:
                </span>
                <span className="font-medium text-white">
                  {parseFloat(amount || "0").toLocaleString()} USDT
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  Estimated shares:
                </span>
                <span className="font-medium text-green-400">
                  {estimatedShares} shares
                </span>
              </div>
            </div>

            <button
              onClick={handleDeposit}
              disabled={
                loading ||
                !isConnected ||
                !isInitialized ||
                !amount ||
                !signer ||
                userShares > 0n
              }
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white shadow hover:from-[#00B1B8] hover:to-[#86D99C] disabled:bg-gray-600 disabled:hover:from-gray-600 disabled:hover:to-gray-600 h-10 rounded-xl px-8 w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  {userShares > 0n ? "You already have position" : "Deposit USDT"}
                </>
              )}
            </button>
          </>
        )}

        {error && (
          <div className="relative w-full rounded-lg border p-4 border-red-200 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="absolute left-4 top-4 h-4 w-4 text-red-600" />
            <div className="pl-7 text-sm text-red-600">
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="relative w-full rounded-lg border p-4 border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="absolute left-4 top-4 h-4 w-4 text-green-600" />
            <div className="pl-7 text-sm text-green-600">
              Deposit successful!
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

        {!isConnected && (
          <p className="text-center text-sm text-gray-400">
            Please connect your wallet to manage liquidity
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
