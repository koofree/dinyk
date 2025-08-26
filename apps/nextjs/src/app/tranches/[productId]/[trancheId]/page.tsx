"use client";

import { BuyInsuranceForm } from "@/components/insurance/BuyInsuranceForm";
import { ProvideLiquidityForm } from "@/components/insurance/ProvideLiquidityForm";
import { getRoundStatusColor, getRoundStatusText } from "@/lib/utils/insurance";
import { formatUnits } from "ethers";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Loader2, XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { ProductCatalog } from "@dinsure/contracts";


import {
  useContracts,
  useProductManagement,
  useSellerOperations,
  useWeb3
} from "@dinsure/contracts";
import { Badge } from "@dinsure/ui/badge";
import { Button } from "@dinsure/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@dinsure/ui/card";
import { ScrollArea } from "@dinsure/ui/scroll-area";

interface TrancheData {
  productId: bigint;
  trancheId: number;
  trigger: bigint;
  premiumBps: bigint;
  poolAddress: string;
}

interface RoundData {
  id: bigint;
  startTime: bigint;
  endTime: bigint;
  maturityTime: bigint;
  state: number;
  totalBuyerOrders: bigint;
  totalSellerCollateral: bigint;
  matchedAmount: bigint;
}

interface ProductData {
  productId: number;
  name: string;
  description: string;
}

interface PoolInfo {
  totalAssets: bigint;
  totalShares: bigint;
  availableLiquidity: bigint;
  totalActiveCoverage: bigint;
}

interface NavInfo {
  totalAssets: bigint;
  sharePrice: bigint;
}

export default function TrancheDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  const trancheId = params.trancheId as string;

  const { isConnected } = useWeb3();
  const { getProducts } = useProductManagement();
  const { getPoolAccounting } = useSellerOperations();
  const contracts = useContracts();
  const { productCatalog, tranchePoolFactory, isInitialized } = contracts;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [tranche, setTranche] = useState<TrancheData | null>(null);
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [navInfo, setNavInfo] = useState<NavInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<RoundData | null>(null);

  

  const loadData = useCallback(async () => {
    if (
      !productId ||
      !trancheId ||
      !productCatalog ||
      !tranchePoolFactory ||
      !isInitialized
    ) {
      console.log("Contracts not ready:", {
        productId,
        trancheId,
        hasProductCatalog: !!productCatalog,
        hasTranchePoolFactory: !!tranchePoolFactory,
        isInitialized,
      });
      return;
    }

    console.log("Contracts are ready, starting loadData");

    setLoading(true);
    try {
      // Get all products and find the one we need
      const products = await getProducts();
      const productData = products.find(
        (p) => p.productId === Number(productId),
      );
      if (productData) {
        setProduct(productData);
      }

      // Get tranche data directly from contract
      // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
      let trancheData: ProductCatalog.TrancheSpecStructOutput | null;
      try {
        trancheData = await productCatalog.getTranche(
          Number(trancheId),
        );
        console.log("Raw tranche data from contract:", trancheData);

        // Validate that the tranche exists and belongs to the correct product
        if (
          !trancheData ||
          Number(trancheData.productId) !== Number(productId)
        ) {
          console.warn(
            `Tranche ${trancheId} doesn't exist or doesn't belong to product ${productId}`,
          );
          // Still try to use the data if tranche exists but product mismatch
          if (!trancheData) {
            trancheData = null;
          }
        }
      } catch (err) {
        console.error("Error getting tranche data:", err);
        // Try alternative approach if getTranche fails
        trancheData = null;
      }

      // Get pool address from factory first
      let poolAddress = "0x0000000000000000000000000000000000000000";
      try {
        const factoryPoolAddress = await tranchePoolFactory.getTranchePool(Number(trancheId));
        console.log(
          `Factory pool address for tranche ${trancheId}:`,
          factoryPoolAddress,
        );
        if (
          factoryPoolAddress &&
          factoryPoolAddress !== "0x0000000000000000000000000000000000000000"
        ) {
          poolAddress = factoryPoolAddress;
        }
      } catch (err) {
        console.error("Error getting pool address from factory:", err);
      }

      // Use pool address from tranche data if factory didn't have it
      if (
        poolAddress === "0x0000000000000000000000000000000000000000" &&
        trancheData?.poolAddress
      ) {
        poolAddress = trancheData.poolAddress;
      }

      // Handle the tranche data carefully - it might be null or have different field names
      const trancheInfo = {
        productId: BigInt(trancheData.productId || productId),
        trancheId: Number(trancheId),
        trigger: BigInt(
          trancheData?.threshold ||
            trancheData?.trigger ||
            trancheData?.triggerThreshold ||
            0,
        ),
        premiumBps: BigInt(
          trancheData?.premiumRateBps || trancheData?.premiumBps || 0,
        ),
        poolAddress: poolAddress,
      };

      setTranche(trancheInfo);

      // Continue with pool data if we have a valid pool address
      if (
        poolAddress &&
        poolAddress !== "0x0000000000000000000000000000000000000000"
      ) {
        try {
          // Add a small delay to ensure contracts are fully ready
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Get pool accounting data using the correct pool address
          try {
            console.log("Calling getPoolAccounting for tranche:", trancheId);
            const poolAccounting = await getPoolAccounting(Number(trancheId));
            console.log("Pool accounting result:", poolAccounting);

            if (poolAccounting) {
              setPoolInfo({
                totalAssets: poolAccounting.totalAssets || 0n,
                totalShares: poolAccounting.totalShares || 0n,
                availableLiquidity: poolAccounting.totalAssets || 0n,
                totalActiveCoverage: poolAccounting.lockedAssets || 0n,
              });
              setNavInfo({
                totalAssets: poolAccounting.totalAssets || 0n,
                sharePrice: poolAccounting.navPerShare || 0n,
              });
            }
          } catch (poolError) {
            console.error("Error fetching pool accounting:", poolError);
            // Continue without pool data
            setPoolInfo(null);
            setNavInfo(null);
          }

          // Get rounds for this tranche using the correct API
          try {
            const roundsData = await (productCatalog).getTrancheRounds(
              Number(trancheId),
            );
            console.log("Rounds data for tranche", trancheId, ":", roundsData);

            // Fetch detailed round information for each round
            const formattedRounds = await Promise.all(
              roundsData.map(async (roundId: bigint) => {
                try {
                  const roundInfo = await (productCatalog).getRound(
                    roundId,
                  );
                  return {
                    id: roundId,
                    state: Number(roundInfo.state),
                    startTime: roundInfo.salesStartTime,
                    endTime: roundInfo.salesEndTime,
                    maturityTime: roundInfo.salesEndTime, // Using end time as maturity for now
                    totalBuyerOrders: roundInfo.totalBuyerPurchases,
                    totalSellerCollateral: roundInfo.totalSellerCollateral,
                    matchedAmount: roundInfo.matchedAmount,
                  };
                } catch (err: any) {
                  console.error(`Error fetching round ${roundId}:`, err);
                  // If the round doesn't exist, return null to filter it out
                  if (err.code === "CALL_EXCEPTION") {
                    console.warn(
                      `Round ${roundId} does not exist on-chain, skipping`,
                    );
                    return null;
                  }
                  // For other errors, return a disabled state
                  return {
                    id: roundId,
                    state: 6, // CANCELED state - cannot deposit
                    startTime: 0n,
                    endTime: 0n,
                    maturityTime: 0n,
                    totalBuyerOrders: 0n,
                    totalSellerCollateral: 0n,
                    matchedAmount: 0n,
                    error: true,
                  };
                }
              }) || [],
            );

            // Use all rounds without filtering
            const validRounds = formattedRounds;

            setRounds(validRounds);

            // Find the most recent OPEN or MATCHED round from valid rounds
            const activeRound = validRounds.find(
              (r: RoundData) => r.state === 1 || r.state === 2,
            );

            console.log("Rounds loaded:", {
              totalRounds: validRounds.length,
              validRounds: validRounds.length,
              filteredOut: formattedRounds.length - validRounds.length,
              roundStates: validRounds.map((r: RoundData) => ({
                id: r.id.toString(),
                state: r.state,
              })),
              activeRound: activeRound ? activeRound.id.toString() : null,
            });

            if (activeRound) {
              setSelectedRound(activeRound);
              console.log("Selected active round:", activeRound);
            } else if (validRounds.length > 0) {
              // If no active round, select the first valid round
              setSelectedRound(validRounds[0]);
              console.log(
                "No active round, selected first valid round:",
                validRounds[0],
              );
            }
          } catch (err) {
            console.error("Error fetching rounds:", err);
            setRounds([]);
          }
        } catch (err) {
          console.error("Error processing pool data:", err);
          setPoolInfo(null);
          setNavInfo(null);
          setRounds([]);
        }
      } else {
        console.log(`No valid pool address for tranche ${trancheId}`);
        setPoolInfo(null);
        setNavInfo(null);
        setRounds([]);
      }
    } catch (error) {
      console.error("Error loading tranche data:", error);
    } finally {
      setLoading(false);
    }
  }, [productCatalog, getProducts, getPoolAccounting, tranchePoolFactory, isInitialized, productId, trancheId]);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productId,
    trancheId,
    isConnected,
    productCatalog,
    tranchePoolFactory,
    isInitialized,
  ]);

  const getTrancheName = (trancheId: number) => {
    // Convert trancheId to index (assuming sequential IDs starting from 0 or 1)
    const index = trancheId % 5; // Adjust based on your actual tranche numbering
    const names = ["A", "B", "C", "D", "E"];
    return names[index] ?? `Tranche ${trancheId}`;
  };

  const getTriggerDisplay = (trigger: bigint) => {
    // If trigger is in wei (1e18), convert to percentage
    if (trigger > 1000000n) {
      const percentage = Number(trigger / BigInt(1e16)); // Convert from 1e18 to percentage with 2 decimals
      return `-${percentage / 100}%`;
    }
    // Otherwise assume it's already in basis points
    return `-${Number(trigger) / 100}%`;
  };

  const getPremiumDisplay = (premiumBps: bigint) => {
    return `${Number(premiumBps) / 100}%`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tranche || !product) {
    return (
      <div className="container mx-auto py-8">
        <Card className="bg-red-50 dark:bg-red-950/20">
          <CardContent className="py-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="h-5 w-5" />
              <p>Tranche not found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/insurance")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {product.name} - Tranche {getTrancheName(tranche.trancheId)}
          </h1>
          <p className="mt-1 text-muted-foreground">{product.description}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trigger Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {getTriggerDisplay(tranche.trigger)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Premium Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getPremiumDisplay(tranche.premiumBps)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value Locked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {navInfo
                ? Number(formatUnits(navInfo.totalAssets, 6)).toLocaleString()
                : "0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Rounds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rounds.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Round Actions - Show forms based on availability */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BuyInsuranceForm
          productId={BigInt(productId)}
          trancheId={tranche.trancheId}
          roundId={selectedRound?.id || 0n}
          tranche={tranche}
          onSuccess={() => loadData()}
        />
        {tranche.poolAddress &&
        tranche.poolAddress !== "0x0000000000000000000000000000000000000000" ? (
          <ProvideLiquidityForm
            poolAddress={tranche.poolAddress}
            trancheId={tranche.trancheId}
            roundId={
              selectedRound && selectedRound.state === 1
                ? selectedRound.id
                : undefined
            }
            onSuccess={() => loadData()}
          />
        ) : (
          <Card className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
            <CardHeader>
              <CardTitle>Liquidity Pool</CardTitle>
              <CardDescription>
                Pool not yet deployed for this tranche
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  The liquidity pool for this tranche has not been deployed yet.
                </p>
                <p>
                  Pool deployment is required before liquidity can be provided.
                </p>
                {process.env.NODE_ENV === "development" && (
                  <div className="mt-4 rounded bg-gray-100 p-2 font-mono text-xs dark:bg-gray-800">
                    <p>Debug Info:</p>
                    <p>Tranche ID: {trancheId}</p>
                    <p>Pool Address: {tranche.poolAddress || "null"}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* No Active Round Message */}
      {!selectedRound && rounds.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Select a Round
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  Please select a round from the list below. Only rounds with
                  "OPEN" status (highlighted in green) can accept new deposits.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {!selectedRound && rounds.length === 0 && (
        <Card className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  No Rounds Available
                </h3>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  There are no rounds available for this tranche yet. Please
                  check back later.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rounds List */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Rounds</CardTitle>
          <CardDescription>View all rounds for this tranche</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {rounds.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No rounds available
                </div>
              ) : (
                rounds.map((round) => (
                  <motion.div
                    key={round.id.toString()}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedRound?.id === round.id
                          ? "ring-2 ring-primary"
                          : ""
                      } ${
                        round.state === 1
                          ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                          : ""
                      }`}
                      onClick={() => setSelectedRound(round)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Round #{round.id.toString()}
                          </CardTitle>
                          <Badge className={getRoundStatusColor(round.state)}>
                            {getRoundStatusText(round.state)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              Total Orders
                            </p>
                            <p className="font-medium">
                              $
                              {Number(
                                formatUnits(round.totalBuyerOrders, 6),
                              ).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Total Collateral
                            </p>
                            <p className="font-medium">
                              $
                              {Number(
                                formatUnits(round.totalSellerCollateral, 6),
                              ).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Matched Amount
                            </p>
                            <p className="font-medium">
                              $
                              {Number(
                                formatUnits(round.matchedAmount, 6),
                              ).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">End Time</p>
                            <p className="font-medium">
                              {new Date(
                                Number(round.endTime) * 1000,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pool Statistics */}
      {poolInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Pool Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Shares</p>
                <p className="text-lg font-semibold">
                  {Number(formatUnits(poolInfo.totalShares ?? 0n, 18)).toFixed(
                    2,
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Share Price</p>
                <p className="text-lg font-semibold">
                  $
                  {navInfo
                    ? Number(formatUnits(navInfo.sharePrice ?? 0n, 6)).toFixed(
                        4,
                      )
                    : "0"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Available Liquidity
                </p>
                <p className="text-lg font-semibold">
                  $
                  {poolInfo
                    ? Number(
                        formatUnits(poolInfo.availableLiquidity ?? 0n, 6),
                      ).toLocaleString()
                    : "0"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Coverage</p>
                <p className="text-lg font-semibold">
                  $
                  {poolInfo
                    ? Number(
                        formatUnits(poolInfo.totalActiveCoverage ?? 0n, 6),
                      ).toLocaleString()
                    : "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
