"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@dinsure/ui/card";
import { Button } from "@dinsure/ui/button";
import { Input } from "@dinsure/ui/input";
import { Label } from "@dinsure/ui/label";
import { Alert, AlertDescription } from "@dinsure/ui/alert";
import { Slider } from "@dinsure/ui/slider";
import { Badge } from "@dinsure/ui/badge";
import { Shield, AlertCircle, CheckCircle, Loader2, Calculator } from "lucide-react";
import { useWeb3, useBuyerOperations, useContracts } from "@dinsure/contracts";
import { formatUnits, parseUnits } from "ethers";
import { calculatePremium } from "@/lib/utils/insurance";

interface BuyInsuranceFormProps {
  productId: bigint;
  trancheIndex: number;
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
  trancheIndex,
  roundId,
  tranche,
  onSuccess
}: BuyInsuranceFormProps) {
  const { address, isConnected } = useWeb3();
  const { buyInsurance, calculatePurchase } = useBuyerOperations();
  const { usdtContract } = useContracts();
  const [usdtBalance, setUsdtBalance] = useState<bigint>(0n);
  
  const [coverageAmount, setCoverageAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState("");

  const premiumAmount = coverageAmount ? calculatePremium(coverageAmount, tranche.premiumBps) : "0";
  const totalCost = coverageAmount ? 
    (parseFloat(coverageAmount) + parseFloat(premiumAmount)).toFixed(2) : "0";

  // Load USDT balance
  useEffect(() => {
    const loadBalance = async () => {
      if (isConnected && address && usdtContract) {
        try {
          const balance = await usdtContract.balanceOf(address);
          setUsdtBalance(balance);
        } catch (err) {
          console.error("Error loading balance:", err);
        }
      }
    };
    loadBalance();
  }, [isConnected, address, usdtContract]);

  const handleBuyInsurance = async () => {
    if (!isConnected || !address || !usdtContract) {
      setError("Please connect your wallet");
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
      const coverageAmountWei = parseUnits(coverageAmount, 6);
      
      const tx = await buyInsurance({
        productId,
        trancheIndex,
        roundId,
        coverageAmount: coverageAmountWei
      });
      
      const receipt = await tx.wait();
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
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coverage">Coverage Amount (USDT)</Label>
            <Input
              id="coverage"
              type="number"
              placeholder="Enter coverage amount"
              value={coverageAmount}
              onChange={(e) => setCoverageAmount(e.target.value)}
              disabled={loading}
            />
            <Slider
              value={[parseFloat(coverageAmount) || 0]}
              onValueChange={handleSliderChange}
              max={maxCoverage}
              step={100}
              className="mt-2"
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Available: ${usdtBalance ? Number(formatUnits(usdtBalance, 6)).toLocaleString() : "0"} USDT
            </p>
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
          disabled={loading || !isConnected || !coverageAmount}
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
              <Shield className="mr-2 h-4 w-4" />
              Buy Insurance
            </>
          )}
        </Button>

        {!isConnected && (
          <p className="text-center text-sm text-muted-foreground">
            Please connect your wallet to buy insurance
          </p>
        )}
      </CardContent>
    </Card>
  );
}