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
import { Alert, AlertDescription } from "@dinsure/ui/alert";
import { Button } from "@dinsure/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@dinsure/ui/card";
import { Input } from "@dinsure/ui/input";
import { Label } from "@dinsure/ui/label";
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Liquidity Management
        </CardTitle>
        <CardDescription>
          Provide liquidity to earn premiums and rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3">
            <div className="mb-1 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Your Position</span>
            </div>
            <p className="text-lg font-bold">
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
              <p className="text-sm text-muted-foreground">
                {Number(formatUnits(userShares, 18)).toFixed(4)} shares
              </p>
            )}
          </div>
          <div className="rounded-lg border p-3">
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Share Price</span>
            </div>
            <p className="text-lg font-bold">
              $
              {navInfo
                ? (Number(navInfo.sharePrice) / 1e18).toFixed(4)
                : "1.0000"}
            </p>
            <p className="text-sm text-muted-foreground">Per share value</p>
          </div>
        </div>

        {/* Only show deposit component, no tabs */}
        {!roundId ? (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              Deposits require an OPEN round. Please select a round with
              "OPEN" status from the rounds list below to provide liquidity.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Deposit Amount (USDT)</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="Enter amount to deposit"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
              <Slider
                value={[parseFloat(amount) || 0]}
                onValueChange={handleSliderChange}
                max={maxDeposit}
                step={10}
                className="mt-2"
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Available: $
                {usdtBalance
                  ? Number(formatUnits(usdtBalance, 6)).toLocaleString()
                  : "0"}{" "}
                USDT
              </p>
            </div>

            <div className="space-y-2 rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  You will deposit:
                </span>
                <span className="font-medium">
                  {parseFloat(amount || "0").toLocaleString()} USDT
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Estimated shares:
                </span>
                <span className="font-medium text-green-600">
                  {estimatedShares} shares
                </span>
              </div>
            </div>

            <Button
              onClick={handleDeposit}
              disabled={
                loading ||
                !isConnected ||
                !isInitialized ||
                !amount ||
                !signer
              }
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  Deposit USDT
                </>
              )}
            </Button>
          </>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              {activeTab === "deposit" ? "Deposit" : "Withdrawal"} successful!
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
            </AlertDescription>
          </Alert>
        )}

        {!isConnected && (
          <p className="text-center text-sm text-muted-foreground">
            Please connect your wallet to manage liquidity
          </p>
        )}

        {isConnected && !isInitialized && (
          <p className="text-center text-sm text-muted-foreground">
            Loading contracts...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
