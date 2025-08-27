/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import { KAIA_TESTNET, TestFaucet__factory, useWeb3 } from "@dinsure/contracts";
import { Alert, AlertDescription, AlertTitle } from "@dinsure/ui/alert";
import { Button } from "@dinsure/ui/button";
import { Card } from "@dinsure/ui/card";
import { Input } from "@dinsure/ui/input";
import { Label } from "@dinsure/ui/label";
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Droplets,
    Loader2,
    XCircle
} from "lucide-react";
import { useEffect, useState } from "react";

export default function FaucetPage() {
  const { account, provider, connectWallet, getSigner } = useWeb3();
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastClaimTime, setLastClaimTime] = useState<number | null>(null);
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState<string | null>(null);

  useEffect(() => {
    if (typeof account === "string") {
      setRecipientAddress(account);
    }
  }, [account]);

  useEffect(() => {
    const checkLastClaimTime = async () => {
      if (!provider || !recipientAddress) return;

      try {
        const faucet = TestFaucet__factory.connect(
          KAIA_TESTNET.contracts.TestFaucet,
          provider
        );

        const lastClaim = await faucet.lastClaimAt(recipientAddress);
        if (lastClaim > 0n) {
          setLastClaimTime(Number(lastClaim));
        }
      } catch (error) {
        console.error("Error checking last claim time:", error);
      }
    };

    void checkLastClaimTime();
  }, [provider, recipientAddress]);

  useEffect(() => {
    if (!lastClaimTime) {
      setTimeUntilNextClaim(null);
      return;
    }

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const nextClaimTime = lastClaimTime + 3600; // 1 hour cooldown
      const remaining = nextClaimTime - now;

      if (remaining <= 0) {
        setTimeUntilNextClaim(null);
      } else {
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        setTimeUntilNextClaim(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastClaimTime]);

  const handleClaim = async () => {
    if (!provider || !recipientAddress) {
      setError("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setTxHash(null);

    try {
      // Get signer directly from useWeb3 hook
      const signer = await getSigner();
      if (!signer) {
        throw new Error("Failed to get signer. Please reconnect your wallet.");
      }
      
      const faucet = TestFaucet__factory.connect(
        KAIA_TESTNET.contracts.TestFaucet,
        signer
      );

      // Check if we're on the right network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== KAIA_TESTNET.chainId) {
        throw new Error(`Please switch to ${KAIA_TESTNET.name} network`);
      }

      // Send the claim transaction
      const tx = await faucet.claim();

      setTxHash(tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();

      if (receipt?.status === 1) {
        setSuccess(`Successfully claimed 100 DIN and 1000 USDT to ${recipientAddress}`);
        setLastClaimTime(Math.floor(Date.now() / 1000));
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Claim error:", error);

      if (error instanceof Error) {
        if (error.message.includes("CooldownNotPassed")) {
          setError("Please wait 1 hour between claims");
        } else if (error.message.includes("InsufficientFaucetBalance")) {
          setError("Faucet is empty. Please contact administrators");
        } else if (error.message.includes("user rejected")) {
          setError("Transaction cancelled by user");
        } else if (error.message.includes("switch to")) {
          setError(error.message);
        } else {
          setError(error.message || "Failed to claim tokens");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
          <Droplets className="h-8 w-8 text-blue-500" />
          Test Token Faucet
        </h1>
        <p className="text-muted-foreground">
          Claim test DIN and USDT tokens for testing on Kaia Kairos Testnet
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">What you'll receive:</h3>
            <ul className="space-y-1 text-sm">
              <li>• 100 DIN tokens (governance token)</li>
              <li>• 1000 USDT tokens (test stablecoin)</li>
              <li>• Can claim once per hour per address</li>
            </ul>
          </div>

          {typeof account !== "string" ? (
            <Alert className="border-orange-200 dark:border-orange-800">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wallet Not Connected</AlertTitle>
              <AlertDescription>
                Please connect your wallet to claim test tokens
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="address">Recipient Address</Label>
                <Input
                  id="address"
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Defaults to your connected wallet address. You can specify a different address if needed.
                </p>
              </div>

              {timeUntilNextClaim && (
                <Alert className="border-yellow-200 dark:border-yellow-800">
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Cooldown Active</AlertTitle>
                  <AlertDescription>
                    Next claim available in: {timeUntilNextClaim}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="border-red-200 dark:border-red-800">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {txHash && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Transaction: </span>
                  <a
                    href={`${KAIA_TESTNET.blockExplorer}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline font-mono"
                  >
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </a>
                </div>
              )}

              <Button
                onClick={account ? handleClaim : () => void connectWallet()}
                disabled={isLoading || !!timeUntilNextClaim}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Claiming...
                  </>
                ) : account ? (
                  timeUntilNextClaim ? (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Cooldown Active
                    </>
                  ) : (
                    <>
                      <Droplets className="mr-2 h-4 w-4" />
                      Claim Test Tokens
                    </>
                  )
                ) : (
                  "Connect Wallet"
                )}
              </Button>
            </>
          )}

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2 text-sm">Faucet Contract:</h4>
            <a
              href={`${KAIA_TESTNET.blockExplorer}/address/${KAIA_TESTNET.contracts.TestFaucet}`}
              target="_blank"
              rel="noopener noreferrer"
                              className="text-sm font-mono text-blue-500 hover:underline break-all"
            >
              {KAIA_TESTNET.contracts.TestFaucet}
            </a>
          </div>

                      <div className="text-sm text-muted-foreground space-y-1">
            <p>• Make sure you're connected to Kaia Kairos Testnet</p>
            <p>• The faucet has a 1-hour cooldown per address</p>
            <p>• These are test tokens with no real value</p>
          </div>
        </div>
      </Card>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="mx-auto max-w-7xl px-4 pt-0 pb-16 sm:px-6 lg:px-8">
      </div>
    </div>
  );
}