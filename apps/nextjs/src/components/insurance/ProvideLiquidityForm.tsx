"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@dinsure/ui/card";
import { Button } from "@dinsure/ui/button";
import { Input } from "@dinsure/ui/input";
import { Label } from "@dinsure/ui/label";
import { Alert, AlertDescription } from "@dinsure/ui/alert";
import { Slider } from "@dinsure/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@dinsure/ui/tabs";
import { TrendingUp, AlertCircle, CheckCircle, Loader2, Wallet, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useWeb3, useSellerOperations, useContracts } from "@dinsure/contracts";
import { formatUnits, parseUnits } from "ethers";

interface ProvideLiquidityFormProps {
  poolAddress: string;
  tranche: {
    trigger: bigint;
    premiumBps: bigint;
  };
  onSuccess?: () => void;
}

export function ProvideLiquidityForm({
  poolAddress,
  tranche,
  onSuccess
}: ProvideLiquidityFormProps) {
  const { address, isConnected } = useWeb3();
  const { depositCollateral, withdrawCollateral, getSellerPosition, getPoolAccounting } = useSellerOperations();
  const { usdtContract } = useContracts();
  const [usdtBalance, setUsdtBalance] = useState<bigint>(0n);
  
  const [activeTab, setActiveTab] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [shares, setShares] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [userShares, setUserShares] = useState<bigint>(0n);
  const [navInfo, setNavInfo] = useState<any>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (isConnected && address && poolAddress) {
        try {
          const [position, poolAccounting] = await Promise.all([
            getSellerPosition(poolAddress, address),
            getPoolAccounting(poolAddress)
          ]);
          setUserShares(position.shares);
          setNavInfo({
            totalAssets: poolAccounting.totalAssets,
            sharePrice: poolAccounting.sharePrice
          });
          
          if (usdtContract) {
            const balance = await usdtContract.balanceOf(address);
            setUsdtBalance(balance);
          }
        } catch (err) {
          console.error("Error loading user data:", err);
        }
      }
    };
    loadUserData();
  }, [isConnected, address, poolAddress, usdtContract]);

  const handleDeposit = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const amountWei = parseUnits(amount, 6);

      const tx = await depositCollateral({
        poolAddress,
        amount: amountWei
      });
      const receipt = await tx.wait();
      
      setTxHash(receipt.hash);
      setSuccess(true);
      setAmount("");
      
      if (onSuccess) {
        onSuccess();
      }

      const [position, poolAccounting] = await Promise.all([
        getSellerPosition(poolAddress, address),
        getPoolAccounting(poolAddress)
      ]);
      setUserShares(position.shares);
      setNavInfo({
        totalAssets: poolAccounting.totalAssets,
        sharePrice: poolAccounting.sharePrice
      });
    } catch (err: any) {
      console.error("Error depositing:", err);
      setError(err.message || "Failed to deposit");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet");
      return;
    }

    if (!shares || parseFloat(shares) <= 0) {
      setError("Please enter a valid share amount");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const sharesWei = parseUnits(shares, 18);

      const tx = await withdrawCollateral({
        poolAddress,
        shares: sharesWei
      });
      const receipt = await tx.wait();
      
      setTxHash(receipt.hash);
      setSuccess(true);
      setShares("");
      
      if (onSuccess) {
        onSuccess();
      }

      const [position, poolAccounting] = await Promise.all([
        getSellerPosition(poolAddress, address),
        getPoolAccounting(poolAddress)
      ]);
      setUserShares(position.shares);
      setNavInfo({
        totalAssets: poolAccounting.totalAssets,
        sharePrice: poolAccounting.sharePrice
      });
    } catch (err: any) {
      console.error("Error withdrawing:", err);
      setError(err.message || "Failed to withdraw");
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (activeTab === "deposit") {
      setAmount(value[0]?.toString() || "0");
    } else {
      setShares(value[0]?.toString() || "0");
    }
  };

  const maxDeposit = usdtBalance ? 
    Math.min(Number(formatUnits(usdtBalance, 6)), 100000) : 100000;
  
  const maxWithdraw = userShares ? 
    Number(formatUnits(userShares, 18)) : 0;

  const estimatedShares = amount && navInfo?.sharePrice ? 
    (parseFloat(amount) * 1e6 / Number(navInfo.sharePrice)).toFixed(4) : "0";
  
  const estimatedUsdt = shares && navInfo?.sharePrice ? 
    (parseFloat(shares) * Number(navInfo.sharePrice) / 1e6).toFixed(2) : "0";

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
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Your Shares</span>
            </div>
            <p className="text-lg font-bold">
              {Number(formatUnits(userShares, 18)).toFixed(4)}
            </p>
            {navInfo && userShares > 0n && (
              <p className="text-sm text-muted-foreground">
                ≈ ${(Number(formatUnits(userShares, 18)) * Number(navInfo.sharePrice) / 1e6).toFixed(2)} USDT
              </p>
            )}
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Share Price</span>
            </div>
            <p className="text-lg font-bold">
              ${navInfo ? (Number(navInfo.sharePrice) / 1e6).toFixed(4) : "1.0000"}
            </p>
            <p className="text-sm text-muted-foreground">
              Per share value
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw">
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              Withdraw
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
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
                Available: ${usdtBalance ? Number(formatUnits(usdtBalance, 6)).toLocaleString() : "0"} USDT
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">You will deposit:</span>
                <span className="font-medium">
                  {parseFloat(amount || "0").toLocaleString()} USDT
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estimated shares:</span>
                <span className="font-medium text-green-600">
                  {estimatedShares} shares
                </span>
              </div>
            </div>

            <Button
              onClick={handleDeposit}
              disabled={loading || !isConnected || !amount}
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
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-shares">Withdraw Shares</Label>
              <Input
                id="withdraw-shares"
                type="number"
                placeholder="Enter shares to withdraw"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                disabled={loading}
              />
              <Slider
                value={[parseFloat(shares) || 0]}
                onValueChange={handleSliderChange}
                max={maxWithdraw}
                step={0.01}
                className="mt-2"
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                Available: {Number(formatUnits(userShares, 18)).toFixed(4)} shares
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">You will withdraw:</span>
                <span className="font-medium">
                  {parseFloat(shares || "0").toFixed(4)} shares
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estimated USDT:</span>
                <span className="font-medium text-green-600">
                  ${parseFloat(estimatedUsdt).toLocaleString()} USDT
                </span>
              </div>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={loading || !isConnected || !shares || userShares === 0n}
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
                  <ArrowUpFromLine className="mr-2 h-4 w-4" />
                  Withdraw
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

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
                  className="block mt-1 underline"
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
      </CardContent>
    </Card>
  );
}