 
 
"use client";

import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { BuyInsuranceForm } from "@/components/insurance/BuyInsuranceForm";
import { ProvideLiquidityForm } from "@/components/insurance/ProvideLiquidityForm";
import { getRoundStatusColor, getRoundStatusText } from "@/lib/utils/insurance";
import { formatUnits } from "ethers";
import { motion } from "framer-motion";
import { AlertCircle, Loader2, XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type {
  ProductCatalog
} from "@dinsure/contracts";
import {
  ORACLE_ROUTE_ID_TO_TYPE,
  useContracts,
  useProductManagement,
  useSellerOperations,
  useWeb3
} from "@dinsure/contracts";

import type { ProductSpec } from "@dinsure/contracts/hooks";

import {
  Card,
  CardContent
} from "@dinsure/ui/card";
import { ScrollArea } from "@dinsure/ui/scroll-area";

interface TrancheData {
  productId: bigint;
  trancheId: number;
  trigger: bigint;
  premiumBps: bigint;
  poolAddress: string;
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
  const { productCatalog, tranchePoolFactory, isInitialized } = useContracts();

  const [product, setProduct] = useState<ProductSpec | null>(null);
  const [tranche, setTranche] = useState<TrancheData | null>(null);
  const [rounds, setRounds] = useState<ProductCatalog.RoundStructOutput[]>([]);
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [navInfo, setNavInfo] = useState<NavInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<ProductCatalog.RoundStructOutput | null>(null);
  const [activeTab, setActiveTab] = useState<"insurance" | "liquidity">("insurance");

  

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
      const trancheData = await productCatalog.getTranche(Number(trancheId));
      const poolAddress: string = await tranchePoolFactory.getTranchePool(Number(trancheId));
      
      

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
         
        asset: ORACLE_ROUTE_ID_TO_TYPE[String(trancheData.oracleRouteId) as unknown as keyof typeof ORACLE_ROUTE_ID_TO_TYPE]?.split("-")[0],
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
            const roundIds = await productCatalog.getTrancheRounds(Number(trancheId));
            console.log("Rounds data for tranche", trancheId, ":", roundIds);

            // Fetch detailed round information for each round
            const formattedRounds = await Promise.all(
              roundIds.map(async (roundId: bigint) => {
                  return await productCatalog.getRound(roundId);
              }),
            );

            // Use all rounds without filtering
            const validRounds = formattedRounds;

            setRounds(validRounds);

            // Find the most recent OPEN or MATCHED round from valid rounds
            const activeRound = validRounds.find(
              (r: ProductCatalog.RoundStructOutput) => r.state === 1n || r.state === 2n,
            );

            console.log("Rounds loaded:", {
              totalRounds: validRounds.length,
              validRounds: validRounds.length,
              filteredOut: formattedRounds.length - validRounds.length,
              roundStates: validRounds.map((r: ProductCatalog.RoundStructOutput) => ({
                id: r.roundId.toString(),
                state: Number(r.state),
              })),
              activeRound: activeRound?.roundId.toString() ?? "",
            });

            if (activeRound) {
              setSelectedRound(activeRound);
              console.log("Selected active round:", activeRound);
            } else if (validRounds.length > 0) {
              // If no active round, select the first valid round
              const lastRound = validRounds[validRounds.length - 1];
              setSelectedRound(lastRound as unknown as ProductCatalog.RoundStructOutput);
              console.log(
                "No active round, selected first valid round:",
                lastRound,
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

  const getTriggerDisplay = (trigger: bigint) => {
    return `$${Number(trigger / BigInt(1e18))}`;
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-16">
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: "Insurance", href: "/insurance" },
              { label: "Tranches", href: "/tranches" },
              { label: `Product ${productId}`, href: `/tranches/${productId}` },
              { label: `Tranche ${trancheId}` }
            ]}
          />
        </div>
        <h1 className="mobile:text-[42px] font-display mb-4 break-words text-[40px] font-bold leading-tight text-gray-900">
          {tranche.asset} - Tranche #{tranche.trancheId}
        </h1>
        <p className="mobile:text-[20px] mb-8 break-words text-[18px] leading-tight text-gray-600">
          {product.description}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex h-full flex-col justify-between p-4">
            <div className="mb-2 text-sm text-gray-600">Trigger Price</div>
            <div className="text-2xl font-bold text-red-600">
              {getTriggerDisplay(tranche.trigger)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex h-full flex-col justify-between p-4">
            <div className="mb-2 text-sm text-gray-600">Premium Rate</div>
            <div className="text-2xl font-bold text-green-600">
              {getPremiumDisplay(tranche.premiumBps)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex h-full flex-col justify-between p-4">
            <div className="mb-2 text-sm text-gray-600">Total Value Locked</div>
            <div className="text-2xl font-bold">
              $
              {navInfo
                ? Number(formatUnits(navInfo.totalAssets, 6)).toLocaleString()
                : "0"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex h-full flex-col justify-between p-4">
            <div className="mb-2 text-sm text-gray-600">Active Rounds</div>
            <div className="text-2xl font-bold">{rounds.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Round Actions - Show forms based on availability */}
      <div className="mb-8 mt-10 w-full" style={{ 
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        <h2 className="font-display mb-5 text-[30px] font-bold text-gray-900">
          Actions
        </h2>
        <div className="mb-5 h-px w-full bg-gray-200"></div>
        
        {/* Tab Navigation */}
        <div className="mb-5 flex space-x-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm" style={{
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          position: 'relative',
          boxSizing: 'border-box'
        }}>
          <button
            onClick={() => setActiveTab("insurance")}
            className={`flex-1 px-4 py-3 text-base font-bold transition-colors ${
              activeTab === "insurance"
                ? "bg-[#374151] text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={{ 
              borderRadius: activeTab === "insurance" ? "12px" : "0px",
              minWidth: '0',
              flexShrink: 0
            }}
          >
            Buy Insurance Coverage
          </button>
          <button
            onClick={() => setActiveTab("liquidity")}
            className={`flex-1 px-4 py-3 text-base font-bold transition-colors ${
              activeTab === "liquidity"
                ? "bg-[#374151] text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={{ 
              borderRadius: activeTab === "liquidity" ? "12px" : "0px",
              minWidth: '0',
              flexShrink: 0
            }}
          >
            Deposit(Sell) Insurance
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]" style={{ 
          scrollbarGutter: 'stable',
          overflowY: 'scroll',
          overflowX: 'hidden',
          width: '100%',
          maxWidth: '100%',
          position: 'relative',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            position: 'relative',
            boxSizing: 'border-box',
            minWidth: '100%'
          }}>
            {activeTab === "insurance" && (
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 transition-colors hover:border-gray-600" style={{ 
                width: '100%', 
                maxWidth: '100%', 
                overflow: 'hidden',
                position: 'relative',
                boxSizing: 'border-box',
                minHeight: '600px',
                minWidth: '100%'
              }}>
                <BuyInsuranceForm
                  productId={BigInt(productId)}
                  trancheId={tranche.trancheId}
                  roundId={selectedRound?.roundId ?? 0n}
                  tranche={tranche}
                  onSuccess={() => loadData()}
                />
              </div>
            )}

            {activeTab === "liquidity" && (
              <>
                {tranche.poolAddress &&
                tranche.poolAddress !== "0x0000000000000000000000000000000000000000" ? (
                  <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 transition-colors hover:border-gray-600" style={{ 
                    width: '100%', 
                    maxWidth: '100%', 
                    overflow: 'hidden',
                    position: 'relative',
                    boxSizing: 'border-box',
                    minHeight: '600px',
                    minWidth: '100%'
                  }}>
                    <ProvideLiquidityForm
                      poolAddress={tranche.poolAddress}
                      trancheId={tranche.trancheId}
                      roundId={
                        selectedRound && selectedRound.state === 1n
                          ? selectedRound.roundId
                          : undefined
                      }
                      
                      onSuccess={() => loadData()}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 transition-colors hover:border-gray-600" style={{ 
                    width: '100%', 
                    maxWidth: '100%', 
                    overflow: 'hidden',
                    position: 'relative',
                    boxSizing: 'border-box',
                    minHeight: '600px',
                    minWidth: '100%'
                  }}>
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-white">Liquidity Pool</h3>
                      <p className="text-sm text-gray-400">
                        Pool not yet deployed for this tranche
                      </p>
                    </div>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>
                        The liquidity pool for this tranche has not been deployed yet.
                      </p>
                      <p>
                        Pool deployment is required before liquidity can be provided.
                      </p>
                      {process.env.NODE_ENV === "development" && (
                        <div className="mt-4 rounded bg-gray-900 p-2 font-mono text-sm text-gray-400">
                          <p>Debug Info:</p>
                          <p>Tranche ID: {trancheId}</p>
                          <p>Pool Address: {tranche.poolAddress || "null"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* No Active Round Message */}
      {!selectedRound && rounds.length > 0 && (
        <div className="mb-8">
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
        </div>
      )}
      {!selectedRound && rounds.length === 0 && (
        <div className="mb-8">
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
        </div>
      )}

      {/* Rounds List */}
      <div className="mb-8">
        <h2 className="font-display mb-5 text-[30px] font-bold text-gray-900">
          Insurance Rounds
        </h2>
        <div className="mb-5 h-px w-full bg-gray-200"></div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">View all rounds for this tranche</h3>
          </div>
          <ScrollArea className="h-fit">
            <div className="space-y-4">
              {rounds.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No rounds available
                </div>
              ) : (
                rounds.map((round) => (
                  <motion.div
                    key={round.roundId.toString()}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`rounded-lg p-3 ${
                        selectedRound?.id === round.roundId
                          ? "ring-2 ring-primary bg-blue-50"
                          : "bg-gray-50"
                      } ${
                        round.state === 1
                          ? "bg-green-50/50"
                          : ""
                      }`}
                      onClick={() => setSelectedRound(round)}
                    >
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold text-gray-900">
                            Round #{round.roundId.toString()}
                          </h4>
                          <div className={getRoundStatusColor(round.state)}>
                            {getRoundStatusText(round.state)}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              Total Orders
                            </p>
                            <p className="font-medium">
                              $
                              {Number(
                                formatUnits(round.totalBuyerPurchases, 6),
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
                                Number(round.salesEndTime) * 1000,
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

            {/* Pool Statistics */}
      {poolInfo && (
        <div className="mb-8">
          <h2 className="font-display mb-5 text-[30px] font-bold text-gray-900">
            Pool Statistics
          </h2>
          <div className="mb-5 h-px w-full bg-gray-200"></div>
                    <Card>
            <CardContent className="p-6">
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
                    ? Number(formatUnits(navInfo.sharePrice ?? 0n, 18)).toFixed(
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
        </div>
      )}
        </div>
      </div>

      {/* Main Content Section */}
      <div className="mx-auto max-w-7xl px-4 pt-0 pb-16 sm:px-6 lg:px-8">
      </div>
    </div>
  );
}
