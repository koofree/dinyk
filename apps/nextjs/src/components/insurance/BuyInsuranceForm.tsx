"use client";

import { calculatePremium } from "@/lib/utils/insurance";
import { useBuyerOperations, useContracts, useWeb3 } from "@dinsure/contracts";
import { Alert, AlertDescription } from "@dinsure/ui/alert";
import { Button } from "@dinsure/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@dinsure/ui/card";
import { Input } from "@dinsure/ui/input";
import { Label } from "@dinsure/ui/label";
import { Slider } from "@dinsure/ui/slider";
import { formatUnits, parseUnits } from "ethers";
import { AlertCircle, Calculator, CheckCircle, Loader2, Shield } from "lucide-react";
import { useEffect, useState } from "react";

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
  onSuccess
}: BuyInsuranceFormProps) {
  const { account, isConnected, usdtBalance: usdtBalanceStr, refreshUSDTBalance } = useWeb3();
  const { buyInsurance, calculatePurchase } = useBuyerOperations();
  const { usdtContract, isInitialized } = useContracts();
  
  // Convert string balance to bigint
  const usdtBalance = usdtBalanceStr ? parseUnits(usdtBalanceStr, 6) : 0n;
  
  // Debug logging
  useEffect(() => {
    console.log("BuyInsuranceForm state:", {
      isConnected,
      account,
      isInitialized,
      hasUsdtContract: !!usdtContract
    });
  }, [isConnected, account, isInitialized, usdtContract]);
  
  const [coverageAmount, setCoverageAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState("");

  const premiumAmount = coverageAmount ? calculatePremium(coverageAmount, tranche.premiumBps) : "0";
  const totalCost = coverageAmount ? 
    (parseFloat(coverageAmount) + parseFloat(premiumAmount)).toFixed(2) : "0";

  // Refresh USDT balance when component mounts or when connection changes
  useEffect(() => {
    if (isConnected && refreshUSDTBalance) {
      refreshUSDTBalance();
    }
  }, [isConnected, refreshUSDTBalance]);

  const handleBuyInsurance = async () => {
    console.log("Buy Insurance clicked - Connection state:", {
      isConnected,
      account,
      hasUsdtContract: !!usdtContract,
      isInitialized,
      roundId
    });
    
    if (!isConnected) {
      setError("Please connect your wallet");
      return;
    }
    
    if (!account) {
      setError("No wallet address found");
      return;
    }
    
    if (!isInitialized || !usdtContract) {
      setError("Contracts are still loading. Please try again.");
      return;
    }

    if (roundId === 0n) {
      setError("No active round available for this tranche");
      return;
    }

    if (!coverageAmount || parseFloat(coverageAmount) <= 0) {
      setError("Please enter a valid coverage amount");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // buyInsurance already waits for the transaction and returns the receipt
      const receipt = await buyInsurance({
        productId,
        trancheId,
        roundId,
        coverageAmount: coverageAmount  // Pass as string, not bigint
      });
      
      setTxHash(receipt.hash);
      setSuccess(true);
      setCoverageAmount("");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Error buying insurance:", err);
      setError(err.message || "Failed to buy insurance");
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (value: number[]) => {
    setCoverageAmount(value[0]?.toString() || "0");
  };

  const maxCoverage = usdtBalance ? 
    Math.min(Number(formatUnits(usdtBalance, 6)), 100000) : 100000;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Buy Insurance Coverage
        </CardTitle>
        <CardDescription>
          Purchase insurance protection for your assets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {roundId === 0n && (
          <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-600">
              No active insurance round available. Please check back later or select a different tranche.
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coverage">Coverage Amount (USDT)</Label>
            <Input
              id="coverage"
              type="number"
              placeholder="Enter coverage amount"
              value={coverageAmount}
              onChange={(e) => setCoverageAmount(e.target.value)}
              disabled={loading || !isConnected}
            />
            <Slider
              value={[parseFloat(coverageAmount) || 0]}
              onValueChange={handleSliderChange}
              max={maxCoverage}
              step={100}
              className="mt-2"
              disabled={loading || !isConnected}
            />
            <p className="text-sm text-muted-foreground">
              {isConnected ? (
                `Available: $${usdtBalance ? Number(formatUnits(usdtBalance, 6)).toLocaleString() : "0"} USDT`
              ) : (
                "Connect wallet to view balance"
              )}
            </p>
            {usdtBalance === 0n && isConnected && (
              <p className="text-xs text-yellow-600 mt-1">
                No test USDT detected. The contract may not be deployed on this network or you need test tokens.
              </p>
            )}
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Coverage Amount:</span>
              <span className="font-medium">
                ${parseFloat(coverageAmount || "0").toLocaleString()} USDT
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Premium ({Number(tranche.premiumBps) / 100}%):
              </span>
              <span className="font-medium text-green-600">
                ${parseFloat(premiumAmount).toLocaleString()} USDT
              </span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Cost:</span>
                <span className="text-lg font-bold">
                  ${parseFloat(totalCost).toLocaleString()} USDT
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Trigger Level</span>
              </div>
              <p className="text-lg font-bold text-red-600">
                -{Number(tranche.trigger) / 100}%
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Max Payout</span>
              </div>
              <p className="text-lg font-bold text-blue-600">
                ${parseFloat(coverageAmount || "0").toLocaleString()}
              </p>
            </div>
          </div>
        </div>

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
              Insurance purchased successfully!
              {txHash && (
                <a
                  href={`https://kairos.kaiascope.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-1 underline"
                >
                  View transaction
                </a>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleBuyInsurance}
          disabled={loading || !isConnected || !isInitialized || roundId === 0n || (!coverageAmount && isConnected)}
          className="w-full"
          size="lg"
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
        </Button>

        {!isConnected && (
          <p className="text-center text-sm text-muted-foreground">
            Connect your wallet to purchase insurance coverage
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