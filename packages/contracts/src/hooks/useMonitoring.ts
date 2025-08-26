import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";

import { useWeb3 } from "../providers/Web3Provider";
import { TranchePoolCore__factory } from "../types/generated";
import { useContracts } from "./useContracts";

export interface PoolHealth {
  poolAddress: string;
  trancheId: number;
  totalAssets: bigint;
  lockedAssets: bigint;
  availableLiquidity: bigint;
  totalShares: bigint;
  navPerShare: bigint;
  utilization: number; // percentage
  usdtBalance: bigint;
  healthStatus: "healthy" | "warning" | "critical";
}

export interface TrancheRiskAnalysis {
  trancheId: number;
  triggerPrice: bigint;
  triggerType: "BELOW" | "ABOVE" | "OTHER";
  currentPrice: number;
  distanceToTrigger: number; // percentage
  riskLevel: "low" | "medium" | "high" | "triggered";
  premiumRate: number;
  trancheCap: bigint;
  maturityTime: bigint;
  daysToMaturity: number;
  annualizedYield: number;
  poolAddress: string;
  utilizationRate: number;
}

export interface RoundMonitoring {
  roundId: number;
  trancheId: number;
  state: string;
  salesStartTime: bigint;
  salesEndTime: bigint;
  totalBuyerPurchases: bigint;
  totalSellerCollateral: bigint;
  matchedAmount: bigint;
  lockedCollateral: bigint;
  premiumPool: bigint;
  isTriggered?: boolean;
  needsAction?: string;
  timeToMaturity?: number;
}

export interface SystemMetrics {
  totalTVL: bigint;
  totalAssets: bigint;
  totalLockedAssets: bigint;
  totalAvailable: bigint;
  overallUtilization: number;
  activeRounds: number;
  activeTranches: number;
  totalPools: number;
  healthStatus: "healthy" | "warning" | "critical";
}

export function useMonitoring() {
  const { productCatalog, tranchePoolFactory, oracleRouter, usdt } =
    useContracts();
  const { provider } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});

  // Fetch current market prices
  const fetchMarketPrices = useCallback(async () => {
    if (!oracleRouter) return {};

    try {
      const symbols = ["BTC-USDT", "ETH-USDT", "KAIA-USDT"];
      const prices: Record<string, number> = {};

      for (const symbol of symbols) {
        try {
          const identifier = ethers.keccak256(ethers.toUtf8Bytes(symbol));
          const priceResult = await oracleRouter.getPrice(identifier);
          prices[symbol] = Number(ethers.formatUnits(priceResult.price, 8));
        } catch {
          prices[symbol] = 0;
        }
      }

      setMarketPrices(prices);
      return prices;
    } catch (error) {
      console.error("Error fetching market prices:", error);
      return {};
    }
  }, [oracleRouter]);

  // Monitor pool health
  const monitorPoolHealth = useCallback(async (): Promise<PoolHealth[]> => {
    if (!tranchePoolFactory || !usdt) {
      throw new Error("Contracts not initialized");
    }

    setIsLoading(true);
    try {
      const poolCount = await tranchePoolFactory.getPoolCount();
      const pools: PoolHealth[] = [];

      for (let i = 0; i < Number(poolCount); i++) {
        try {
          const poolAddress = await tranchePoolFactory.allPools(i);
          const pool = TranchePoolCore__factory.connect(poolAddress, provider);

          const trancheInfo = await pool.getTrancheInfo();
          const accounting = await pool.getPoolAccounting();
          const usdtBalance = await usdt.balanceOf(poolAddress);

          const utilization =
            accounting.totalAssets > 0n
              ? Number(
                  (accounting.lockedAssets * 10000n) / accounting.totalAssets,
                ) / 100
              : 0;

          // Determine health status
          let healthStatus: "healthy" | "warning" | "critical" = "healthy";
          const balanceMismatch = accounting.totalAssets - usdtBalance;

          if (balanceMismatch !== 0n) {
            healthStatus = "warning";
          }
          if (utilization > 90) {
            healthStatus = "critical";
          }
          if (
            accounting.navPerShare < ethers.parseEther("0.5") ||
            accounting.navPerShare > ethers.parseEther("2.0")
          ) {
            healthStatus = "warning";
          }

          pools.push({
            poolAddress,
            trancheId: Number(trancheInfo.trancheId),
            totalAssets: accounting.totalAssets,
            lockedAssets: accounting.lockedAssets,
            availableLiquidity:
              BigInt(accounting.totalAssets) - BigInt(accounting.lockedAssets),
            totalShares: accounting.totalShares,
            navPerShare: accounting.navPerShare,
            utilization,
            usdtBalance,
            healthStatus,
          });
        } catch (error) {
          console.error(`Error monitoring pool ${i}:`, error);
        }
      }

      return pools;
    } catch (error) {
      console.error("Error monitoring pools:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [tranchePoolFactory, usdt, provider]);

  // Analyze tranche risk
  const analyzeTranchesRisk = useCallback(async (): Promise<
    TrancheRiskAnalysis[]
  > => {
    if (!productCatalog || !tranchePoolFactory) {
      throw new Error("Contracts not initialized");
    }

    setIsLoading(true);
    try {
      // Get current prices
      const prices = await fetchMarketPrices();

      const activeTranches = await productCatalog.getActiveTranches();
      const analyses: TrancheRiskAnalysis[] = [];

      for (const trancheId of activeTranches) {
        try {
          const trancheSpec = await productCatalog.getTranche(trancheId);
          const poolAddress =
            await tranchePoolFactory.getTranchePool(trancheId);

          const triggerPrice = Number(
            ethers.formatEther(trancheSpec.threshold),
          );
          const triggerType = Number(trancheSpec.triggerType);
          const oracleRouteId = Number(trancheSpec.oracleRouteId || 1);

          // Map oracle route to symbol
          const routeMapping: Record<number, string> = {
            1: "BTC-USDT",
            2: "ETH-USDT",
            3: "KAIA-USDT",
          };

          const targetSymbol = routeMapping[oracleRouteId] ?? "BTC-USDT";
          const currentPrice = prices[targetSymbol] ?? 0;

          // Calculate distance to trigger
          let distanceToTrigger = 0;
          let riskLevel: "low" | "medium" | "high" | "triggered" = "low";

          if (currentPrice > 0) {
            if (triggerType === 0) {
              // PRICE_BELOW
              distanceToTrigger =
                ((currentPrice - triggerPrice) / currentPrice) * 100;
            } else if (triggerType === 1) {
              // PRICE_ABOVE
              distanceToTrigger =
                ((triggerPrice - currentPrice) / currentPrice) * 100;
            }

            if (distanceToTrigger <= 0) {
              riskLevel = "triggered";
            } else if (distanceToTrigger < 5) {
              riskLevel = "high";
            } else if (distanceToTrigger < 15) {
              riskLevel = "medium";
            } else {
              riskLevel = "low";
            }
          }

          // Calculate yields
          const now = Math.floor(Date.now() / 1000);
          const maturityTime = Number(trancheSpec.maturityTimestamp);
          const daysToMaturity = Math.max(
            (maturityTime - now) / (24 * 60 * 60),
            1,
          );
          const premiumRate = Number(trancheSpec.premiumRateBps) / 100;
          const annualizedYield = premiumRate * (365 / daysToMaturity);

          // Get utilization if pool exists
          let utilizationRate = 0;
          if (poolAddress !== ethers.ZeroAddress) {
            try {
              const pool = TranchePoolCore__factory.connect(
                poolAddress,
                provider,
              );
              const accounting = await pool.getPoolAccounting();
              const trancheCap = trancheSpec.trancheCap;
              utilizationRate =
                trancheCap > 0n
                  ? Number((accounting.totalAssets * 10000n) / trancheCap) / 100
                  : 0;
            } catch (error) {
              console.error(
                `Error getting utilization for pool ${poolAddress}:`,
                error,
              );
            }
          }

          analyses.push({
            trancheId: Number(trancheId),
            triggerPrice: trancheSpec.threshold,
            triggerType:
              triggerType === 0
                ? "BELOW"
                : triggerType === 1
                  ? "ABOVE"
                  : "OTHER",
            currentPrice,
            distanceToTrigger,
            riskLevel,
            premiumRate,
            trancheCap: trancheSpec.trancheCap,
            maturityTime: BigInt(maturityTime),
            daysToMaturity,
            annualizedYield,
            poolAddress,
            utilizationRate,
          });
        } catch (error) {
          console.error(`Error analyzing tranche ${trancheId}:`, error);
        }
      }

      return analyses;
    } catch (error) {
      console.error("Error analyzing tranches:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [productCatalog, tranchePoolFactory, fetchMarketPrices, provider]);

  // Monitor active rounds
  const monitorActiveRounds = useCallback(async (): Promise<
    RoundMonitoring[]
  > => {
    if (!productCatalog || !tranchePoolFactory) {
      throw new Error("Contracts not initialized");
    }

    setIsLoading(true);
    try {
      const prices = await fetchMarketPrices();
      const activeTranches = await productCatalog.getActiveTranches();
      const rounds: RoundMonitoring[] = [];
      const now = Math.floor(Date.now() / 1000);

      for (const trancheId of activeTranches) {
        const trancheRounds = await productCatalog.getTrancheRounds(trancheId);
        const trancheSpec = await productCatalog.getTranche(trancheId);

        for (const roundId of trancheRounds) {
          try {
            const roundInfo = await productCatalog.getRound(roundId);
            const state = Number(roundInfo.state);

            // Skip settled/canceled rounds
            if (state >= 5) continue;

            const stateNames = [
              "ANNOUNCED",
              "OPEN",
              "MATCHED",
              "ACTIVE",
              "MATURED",
              "SETTLED",
              "CANCELED",
            ];

            // Get pool economics
            let economics = {
              totalBuyerPurchases: 0n,
              totalSellerCollateral: 0n,
              matchedAmount: 0n,
              lockedCollateral: 0n,
              premiumPool: 0n,
            };

            const poolAddress = await tranchePoolFactory.getTranchePool(
              Number(trancheId),
            );
            if (poolAddress !== ethers.ZeroAddress) {
              const pool = TranchePoolCore__factory.connect(
                poolAddress,
                provider,
              );
              const poolEconomics = await pool.getRoundEconomics(roundId);
              economics = {
                totalBuyerPurchases: poolEconomics[0],
                totalSellerCollateral: poolEconomics[1],
                matchedAmount: poolEconomics[2],
                lockedCollateral: poolEconomics[3],
                premiumPool: poolEconomics[4],
              };
            }

            // Check trigger status for active rounds
            let isTriggered = false;
            if (state >= 2 && state <= 4) {
              const triggerPrice = Number(
                ethers.formatEther(trancheSpec.threshold),
              );
              const triggerType = Number(trancheSpec.triggerType);
              const oracleRouteId = Number(trancheSpec.oracleRouteId || 1);

              const routeMapping: Record<number, string> = {
                1: "BTC-USDT",
                2: "ETH-USDT",
                3: "KAIA-USDT",
              };

              const targetSymbol = routeMapping[oracleRouteId];
              const currentPrice = targetSymbol
                ? (prices[targetSymbol] ?? 0)
                : 0;

              if (currentPrice > 0) {
                if (triggerType === 0) {
                  // PRICE_BELOW
                  isTriggered = currentPrice <= triggerPrice;
                } else if (triggerType === 1) {
                  // PRICE_ABOVE
                  isTriggered = currentPrice >= triggerPrice;
                }
              }
            }

            // Determine if action is needed
            let needsAction: string | undefined;
            if (state === 1 && now > Number(roundInfo.salesEndTime)) {
              needsAction = "NEEDS_CLOSURE";
            } else if (state >= 2 && state <= 3) {
              const maturityTime = Number(trancheSpec.maturityTimestamp);
              if (now >= maturityTime) {
                needsAction = "NEEDS_SETTLEMENT";
              }
            }

            // Calculate time to maturity
            const maturityTime = Number(trancheSpec.maturityTimestamp);
            const timeToMaturity = maturityTime - now;

            rounds.push({
              roundId: Number(roundId),
              trancheId: Number(trancheId),
              state: stateNames[state] ?? "unknown",
              salesStartTime: roundInfo.salesStartTime,
              salesEndTime: roundInfo.salesEndTime,
              ...economics,
              isTriggered,
              needsAction,
              timeToMaturity: timeToMaturity > 0 ? timeToMaturity : undefined,
            });
          } catch (error) {
            console.error(`Error monitoring round ${roundId}:`, error);
          }
        }
      }

      return rounds;
    } catch (error) {
      console.error("Error monitoring rounds:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [productCatalog, tranchePoolFactory, fetchMarketPrices, provider]);

  // Get system-wide metrics
  const getSystemMetrics = useCallback(async (): Promise<SystemMetrics> => {
    if (!tranchePoolFactory || !productCatalog || !usdt) {
      throw new Error("Contracts not initialized");
    }

    setIsLoading(true);
    try {
      const poolCount = await tranchePoolFactory.getPoolCount();
      let totalTVL = 0n;
      let totalAssets = 0n;
      let totalLockedAssets = 0n;

      for (let i = 0; i < Number(poolCount); i++) {
        try {
          const poolAddress = await tranchePoolFactory.allPools(i);
          const pool = TranchePoolCore__factory.connect(poolAddress, provider);
          const accounting = await pool.getPoolAccounting();
          const usdtBalance = await usdt.balanceOf(poolAddress);

          totalTVL += usdtBalance;
          totalAssets += accounting.totalAssets;
          totalLockedAssets += accounting.lockedAssets;
        } catch (error) {
          console.error(`Error getting system metrics for pool ${i}:`, error);
        }
      }

      const totalAvailable = totalAssets - totalLockedAssets;
      const overallUtilization =
        totalAssets > 0n
          ? Number((totalLockedAssets * 10000n) / totalAssets) / 100
          : 0;

      // Count active rounds and tranches
      const activeTranches = await productCatalog.getActiveTranches();
      let activeRounds = 0;

      for (const trancheId of activeTranches) {
        const rounds = await productCatalog.getTrancheRounds(trancheId);
        for (const roundId of rounds) {
          const roundInfo = await productCatalog.getRound(roundId);
          const state = Number(roundInfo.state);
          if (state >= 0 && state <= 4) {
            activeRounds++;
          }
        }
      }

      // Determine overall health
      let healthStatus: "healthy" | "warning" | "critical" = "healthy";
      if (overallUtilization > 80) {
        healthStatus = "warning";
      }
      if (overallUtilization > 95) {
        healthStatus = "critical";
      }
      if (overallUtilization < 10 && totalAssets > 0n) {
        healthStatus = "warning"; // Under-utilized
      }

      return {
        totalTVL,
        totalAssets,
        totalLockedAssets,
        totalAvailable,
        overallUtilization,
        activeRounds,
        activeTranches: activeTranches.length,
        totalPools: Number(poolCount),
        healthStatus,
      };
    } catch (error) {
      console.error("Error getting system metrics:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [tranchePoolFactory, productCatalog, usdt, provider]);

  // Auto-refresh market prices
  useEffect(() => {
    if (oracleRouter) {
      const result = fetchMarketPrices();
      console.log("Market prices fetched", result);

      const interval = setInterval(() => void fetchMarketPrices(), 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [oracleRouter, fetchMarketPrices]);

  return {
    // Monitoring functions
    monitorPoolHealth,
    analyzeTranchesRisk,
    monitorActiveRounds,
    getSystemMetrics,
    fetchMarketPrices,

    // Data
    marketPrices,

    // State
    isLoading,
  };
}
