"use client";

import { BuyInsuranceForm } from "@/components/insurance/BuyInsuranceForm";
import { ProvideLiquidityForm } from "@/components/insurance/ProvideLiquidityForm";
import { getRoundStatusColor, getRoundStatusText } from "@/lib/utils/insurance";
import { useContracts, useProductManagement, useSellerOperations, useWeb3 } from "@dinsure/contracts";
import { Badge } from "@dinsure/ui/badge";
import { Button } from "@dinsure/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@dinsure/ui/card";
import { ScrollArea } from "@dinsure/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@dinsure/ui/tabs";
import { formatUnits } from "ethers";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Loader2, XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function TrancheDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.productId as string;
  const trancheId = params?.trancheId as string;
  
  const { isConnected } = useWeb3();
  const { getProducts } = useProductManagement();
  const { getPoolAccounting } = useSellerOperations();
  const contracts = useContracts();
  const { productCatalog, tranchePoolFactory, isInitialized } = contracts;
  
  const [product, setProduct] = useState<any>(null);
  const [tranche, setTranche] = useState<TrancheData | null>(null);
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [poolInfo, setPoolInfo] = useState<any>(null);
  const [navInfo, setNavInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRound, setSelectedRound] = useState<RoundData | null>(null);

  useEffect(() => {
    loadData();
  }, [productId, trancheId, isConnected, productCatalog, tranchePoolFactory, isInitialized]);

  const loadData = async () => {
    if (!productId || !trancheId || !productCatalog || !tranchePoolFactory || !isInitialized) {
      console.log("Contracts not ready:", {
        productId,
        trancheId,
        hasProductCatalog: !!productCatalog,
        hasTranchePoolFactory: !!tranchePoolFactory,
        isInitialized
      });
      return;
    }
    
    console.log("Contracts are ready, starting loadData");
    
    setLoading(true);
    try {
      // Get all products and find the one we need
      const products = await getProducts();
      const productData = products.find(p => p.productId === Number(productId));
      setProduct(productData);
      
      // Get tranche data directly from contract
      let trancheData: any;
        trancheData = await (productCatalog as any).tranches(Number(trancheId));
      
      
      setTranche({
        productId: BigInt(productId),
        trancheId: Number(trancheId),
        trigger: trancheData?.threshold || trancheData?.triggerThreshold || 0n,
        premiumBps: trancheData?.premiumRateBps || trancheData?.premiumBps || 0n,
        poolAddress: trancheData?.poolAddress || "0x0000000000000000000000000000000000000000"
      });
      
      // Get pool address from factory using tranche ID
      try {
        const poolAddress = await (tranchePoolFactory as any).getTranchePool(Number(trancheId));
        console.log(`Pool address for tranche ${trancheId}:`, poolAddress);
        
        if (poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000") {
          // Add a small delay to ensure contracts are fully ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
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
                totalActiveCoverage: poolAccounting.lockedAssets || 0n
              });
              setNavInfo({
                totalAssets: poolAccounting.totalAssets || 0n,
                sharePrice: poolAccounting.navPerShare || 0n
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
            const roundsData = await (productCatalog as any).getTrancheRounds(Number(trancheId));
            console.log("Rounds data for tranche", trancheId, ":", roundsData);
            
            // Fetch detailed round information for each round
            const formattedRounds = await Promise.all(
              roundsData?.map(async (roundId: any) => {
                try {
                  const roundInfo = await (productCatalog as any).getRound(roundId);
                  return {
                    id: roundId,
                    state: Number(roundInfo.state),
                    startTime: roundInfo.salesStartTime,
                    endTime: roundInfo.salesEndTime,
                    maturityTime: roundInfo.salesEndTime, // Using end time as maturity for now
                    totalBuyerOrders: roundInfo.totalBuyerPurchases,
                    totalSellerCollateral: roundInfo.totalSellerCollateral,
                    matchedAmount: roundInfo.matchedAmount
                  };
                } catch (err) {
                  console.error(`Error fetching round ${roundId}:`, err);
                  return {
                    id: roundId,
                    state: 1, // Default state
                    startTime: 0n,
                    endTime: 0n,
                    maturityTime: 0n,
                    totalBuyerOrders: 0n,
                    totalSellerCollateral: 0n,
                    matchedAmount: 0n
                  };
                }
              }) || []
            );
            
            setRounds(formattedRounds);
            
            const activeRound = formattedRounds.find((r: RoundData) => r.state === 1 || r.state === 2);
            if (activeRound) setSelectedRound(activeRound);
          } catch (err) {
            console.error("Error fetching rounds:", err);
            setRounds([]);
          }
        } else {
          console.log(`No pool found for tranche ${trancheId}`);
          setPoolInfo(null);
          setNavInfo(null);
          setRounds([]);
        }
      } catch (err) {
        console.error("Error fetching pool data:", err);
        setPoolInfo(null);
        setNavInfo(null);
        setRounds([]);
      }
    } catch (error) {
      console.error("Error loading tranche data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrancheName = (index: number) => {
    const names = ["A", "B", "C", "D", "E"];
    return names[index] || `Tranche ${index + 1}`;
  };

  const getTriggerDisplay = (trigger: bigint) => {
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
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/insurance")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {product.name} - Tranche {getTrancheName(tranche.index)}
          </h1>
          <p className="text-muted-foreground mt-1">
            {product.description}
          </p>
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
              ${navInfo ? Number(formatUnits(navInfo.totalAssets, 6)).toLocaleString() : "0"}
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
            <div className="text-2xl font-bold">
              {rounds.filter(r => r.state === 1 || r.state === 2).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="buy">Buy Insurance</TabsTrigger>
          <TabsTrigger value="provide">Provide Liquidity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active & Upcoming Rounds</CardTitle>
              <CardDescription>
                View and participate in insurance rounds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {rounds.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
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
                            selectedRound?.id === round.id ? "ring-2 ring-primary" : ""
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
                                <p className="text-muted-foreground">Total Orders</p>
                                <p className="font-medium">
                                  ${Number(formatUnits(round.totalBuyerOrders, 6)).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total Collateral</p>
                                <p className="font-medium">
                                  ${Number(formatUnits(round.totalSellerCollateral, 6)).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Matched Amount</p>
                                <p className="font-medium">
                                  ${Number(formatUnits(round.matchedAmount, 6)).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">End Time</p>
                                <p className="font-medium">
                                  {new Date(Number(round.endTime) * 1000).toLocaleDateString()}
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

          {poolInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Pool Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Shares</p>
                    <p className="text-lg font-semibold">
                      {Number(formatUnits(poolInfo.totalShares || 0n, 18)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Share Price</p>
                    <p className="text-lg font-semibold">
                      ${navInfo ? Number(formatUnits(navInfo.sharePrice || 0n, 6)).toFixed(4) : "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available Liquidity</p>
                    <p className="text-lg font-semibold">
                      ${poolInfo ? Number(formatUnits(poolInfo.availableLiquidity || 0n, 6)).toLocaleString() : "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Coverage</p>
                    <p className="text-lg font-semibold">
                      ${poolInfo ? Number(formatUnits(poolInfo.totalActiveCoverage || 0n, 6)).toLocaleString() : "0"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="buy" className="space-y-6">
          {selectedRound && selectedRound.state === 1 ? (
            <BuyInsuranceForm
              productId={BigInt(productId)}
              trancheId={tranche.trancheId}
              roundId={selectedRound.id}
              tranche={tranche}
              onSuccess={() => loadData()}
            />
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <AlertCircle className="h-12 w-12 mx-auto text-yellow-500" />
                  <h3 className="text-lg font-semibold">No Active Round</h3>
                  <p className="text-muted-foreground">
                    Please wait for an active round to buy insurance.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="provide" className="space-y-6">
          {tranche.poolAddress && tranche.poolAddress !== "0x0000000000000000000000000000000000000000" ? (
            <ProvideLiquidityForm
              poolAddress={tranche.poolAddress}
              tranche={tranche}
              onSuccess={() => loadData()}
            />
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <AlertCircle className="h-12 w-12 mx-auto text-yellow-500" />
                  <h3 className="text-lg font-semibold">Pool Not Available</h3>
                  <p className="text-muted-foreground">
                    This tranche pool has not been deployed yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}