import { useCallback, useState } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";

import { useWeb3 } from "../providers/Web3Provider";
import { useContracts } from "./useContracts";

export interface SettlementInfo {
  roundId: number;
  triggered: boolean;
  oracleResult: bigint;
  livenessDeadline: bigint;
  settled: boolean;
}

export interface SettlementStatus {
  roundId: number;
  trancheId: number;
  state: string;
  isMatured: boolean;
  canSettle: boolean;
  currentPrice: number;
  triggerPrice: number;
  triggerType: string;
  isTriggered: boolean;
  livenessWindow?: number;
  timeUntilFinalize?: number;
  settled: boolean;
}

export function useSettlement() {
  const { signer } = useWeb3();
  const { productCatalog, tranchePoolFactory, settlementEngine, oracleRouter } =
    useContracts();

  const [isLoading, setIsLoading] = useState(false);

  // Check if a round can be settled
  const checkSettlementStatus = useCallback(
    async (roundId: number): Promise<SettlementStatus | null> => {
      if (!productCatalog || !settlementEngine || !oracleRouter) {
        throw new Error("Contracts not initialized");
      }

      try {
        // Get round info
        const roundInfo = await productCatalog.getRound(roundId);
        const trancheId = Number(roundInfo.trancheId);
        const state = Number(roundInfo.state);
        const stateNames = [
          "ANNOUNCED",
          "OPEN",
          "ACTIVE",
          "MATURED",
          "SETTLED",
          "CANCELED",
        ];

        // Get tranche details
        const trancheSpec = await productCatalog.getTranche(trancheId);
        const triggerPrice = Number(ethers.formatEther(trancheSpec.threshold));
        const triggerType = Number(trancheSpec.triggerType);
        const maturityTime = Number(trancheSpec.maturityTimestamp);

        // Check if matured
        const now = Math.floor(Date.now() / 1000);
        const isMatured = now >= maturityTime;
        const canSettle = isMatured && state >= 2 && state < 5; // ACTIVE or MATURED, not yet SETTLED

        // Get current price from oracle
        const oracleRouteId = Number(trancheSpec.oracleRouteId || 1);
        const routeMapping: Record<number, string> = {
          1: "BTC-USDT",
          2: "ETH-USDT",
          3: "KAIA-USDT",
        };

        const targetSymbol = routeMapping[oracleRouteId] ?? "BTC-USDT";
        const priceIdentifier = ethers.keccak256(
          ethers.toUtf8Bytes(targetSymbol),
        );

        let currentPrice = 0;
        let isTriggered = false;

        try {
          const priceResult = await oracleRouter.getPrice(priceIdentifier);
          currentPrice = Number(ethers.formatUnits(priceResult.price, 8));

          if (triggerType === 0) {
            // PRICE_BELOW
            isTriggered = currentPrice <= triggerPrice;
          } else if (triggerType === 1) {
            // PRICE_ABOVE
            isTriggered = currentPrice >= triggerPrice;
          }
        } catch (error) {
          console.error("Error fetching oracle price:", error);
        }

        // Check settlement engine status
        let livenessWindow: number | undefined;
        let timeUntilFinalize: number | undefined;
        let settled = false;

        try {
          const settlementInfo =
            await settlementEngine.getSettlementInfo(roundId);
          if (settlementInfo.roundId !== 0n) {
            settled = settlementInfo.settled;
            if (!settled && settlementInfo.livenessDeadline > 0n) {
              const deadline = Number(settlementInfo.livenessDeadline);
              timeUntilFinalize = Math.max(deadline - now, 0);
              livenessWindow = Number(await settlementEngine.livenessWindow());
            }
          }
        } catch (error) {
          console.error("Error checking settlement status:", error);
        }

        return {
          roundId,
          trancheId,
          state: stateNames[state] ?? "unknown",
          isMatured,
          canSettle,
          currentPrice,
          triggerPrice,
          triggerType:
            triggerType === 0 ? "BELOW" : triggerType === 1 ? "ABOVE" : "OTHER",
          isTriggered,
          livenessWindow,
          timeUntilFinalize,
          settled,
        };
      } catch (error) {
        console.error("Error checking settlement status:", error);
        return null;
      }
    },
    [productCatalog, settlementEngine, oracleRouter],
  );

  // Request oracle observation and trigger settlement
  const triggerSettlement = useCallback(
    async (roundId: number) => {
      if (
        !productCatalog ||
        !tranchePoolFactory ||
        !settlementEngine ||
        !oracleRouter ||
        !signer
      ) {
        throw new Error("Not initialized");
      }

      setIsLoading(true);
      try {
        // Check settlement status
        const status = await checkSettlementStatus(roundId);
        if (!status) {
          throw new Error("Could not fetch settlement status");
        }

        if (!status.canSettle) {
          if (!status.isMatured) {
            throw new Error("Insurance has not matured yet");
          }
          if (status.settled) {
            throw new Error("Round is already settled");
          }
          throw new Error("Round cannot be settled at this time");
        }

        // Get pool address
        const poolAddress = await tranchePoolFactory.getTranchePool(
          status.trancheId,
        );
        if (poolAddress === ethers.ZeroAddress) {
          throw new Error("No pool found for this tranche");
        }

        // Determine oracle identifier
        const trancheSpec = await productCatalog.getTranche(status.trancheId);
        const oracleRouteId = Number(trancheSpec.oracleRouteId || 1);
        const routeMapping: Record<number, string> = {
          1: "BTC-USDT",
          2: "ETH-USDT",
          3: "KAIA-USDT",
        };

        const targetSymbol = routeMapping[oracleRouteId];
        const priceIdentifier = ethers.keccak256(
          ethers.toUtf8Bytes(targetSymbol ?? "BTC-USDT"),
        );

        console.log("Requesting oracle observation...", {
          roundId,
          poolAddress,
          targetSymbol,
          currentPrice: status.currentPrice,
          triggerPrice: status.triggerPrice,
          isTriggered: status.isTriggered,
        });

        // Request oracle observation
        const settlementContract = settlementEngine.connect(signer);
        const tx = await settlementContract.requestOracleObservation(
          roundId,
          poolAddress,
          priceIdentifier,
        );

        toast.promise(tx.wait(), {
          loading: "Requesting oracle observation...",
          success: status.isTriggered
            ? "Settlement triggered! Insurance will payout."
            : "Settlement triggered! No payout needed.",
          error: "Failed to trigger settlement",
        });

        const receipt = await tx.wait();

        // Check if we need to wait for liveness window
        const settlementInfo =
          await settlementContract.getSettlementInfo(roundId);

        const now = Math.floor(Date.now() / 1000);
        const livenessDeadline = Number(settlementInfo.livenessDeadline);
        const timeUntilFinalize = livenessDeadline - now;

        if (timeUntilFinalize > 0) {
          toast.info(
            `Wait ${Math.floor(timeUntilFinalize / 60)} minutes before finalizing`,
          );
        }

        return receipt;
      } catch (error: unknown) {
        console.error("Error triggering settlement:", error);
        toast.error((error as Error).message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [
      productCatalog,
      tranchePoolFactory,
      settlementEngine,
      oracleRouter,
      signer,
      checkSettlementStatus,
    ],
  );

  // Finalize settlement after liveness window
  const finalizeSettlement = useCallback(
    async (roundId: number) => {
      if (!settlementEngine || !signer) {
        throw new Error("Not initialized");
      }

      setIsLoading(true);
      try {
        const settlementContract = settlementEngine.connect(signer);

        // Get settlement info
        const settlementInfo =
          await settlementContract.getSettlementInfo(roundId);
        if (settlementInfo.roundId === 0n) {
          throw new Error("No settlement info found for this round");
        }

        if (settlementInfo.settled) {
          toast.info("Settlement already finalized");
          return;
        }

        // Check if liveness window has passed
        const now = Math.floor(Date.now() / 1000);
        const timeUntilFinalize = Number(settlementInfo.livenessDeadline) - now;

        if (timeUntilFinalize > 0) {
          throw new Error(
            `Liveness window not yet passed. Wait ${Math.floor(timeUntilFinalize / 60)} minutes.`,
          );
        }

        console.log("Finalizing settlement...", {
          roundId,
          triggered: settlementInfo.triggered,
          oracleResult: ethers.formatUnits(settlementInfo.oracleResult, 8),
        });

        // Finalize settlement
        const tx = await settlementContract.finalizeSettlement(roundId);

        toast.promise(tx.wait(), {
          loading: "Finalizing settlement...",
          success: settlementInfo.triggered
            ? "Settlement finalized! Buyers can claim payouts."
            : "Settlement finalized! Sellers can withdraw collateral.",
          error: "Failed to finalize settlement",
        });

        const receipt = await tx.wait();
        return receipt;
      } catch (error: unknown) {
        console.error("Error finalizing settlement:", error);
        toast.error((error as Error).message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [settlementEngine, signer],
  );

  // Get settlement info from engine
  const getSettlementInfo = useCallback(
    async (roundId: number): Promise<SettlementInfo | null> => {
      if (!settlementEngine) {
        throw new Error("Settlement engine not initialized");
      }

      try {
        const info = await settlementEngine.getSettlementInfo(roundId);

        if (info.roundId === 0n) {
          return null;
        }

        return {
          roundId: Number(info.roundId),
          triggered: info.triggered,
          oracleResult: info.oracleResult,
          livenessDeadline: info.livenessDeadline,
          settled: info.settled,
        };
      } catch (error) {
        console.error("Error fetching settlement info:", error);
        return null;
      }
    },
    [settlementEngine],
  );

  // Get all rounds needing settlement
  const getRoundsNeedingSettlement = useCallback(async (): Promise<
    number[]
  > => {
    if (!productCatalog) {
      throw new Error("Product catalog not initialized");
    }

    try {
      const activeTranches = await productCatalog.getActiveTranches();
      const roundsNeedingSettlement: number[] = [];
      const now = Math.floor(Date.now() / 1000);

      for (const trancheId of activeTranches) {
        const trancheSpec = await productCatalog.getTranche(trancheId);
        const maturityTime = Number(trancheSpec.maturityTimestamp);

        if (now >= maturityTime) {
          const rounds = await productCatalog.getTrancheRounds(trancheId);

          for (const roundId of rounds) {
            const roundInfo = await productCatalog.getRound(roundId);
            const state = Number(roundInfo.state);

            // ACTIVE or MATURED but not yet SETTLED
            if (state === 3 || state === 4) {
              roundsNeedingSettlement.push(Number(roundId));
            }
          }
        }
      }

      return roundsNeedingSettlement;
    } catch (error) {
      console.error("Error fetching rounds needing settlement:", error);
      return [];
    }
  }, [productCatalog]);

  // Batch settle multiple rounds
  const batchSettle = useCallback(
    async (roundIds: number[]) => {
      const results = [];

      for (const roundId of roundIds) {
        try {
          console.log(`Settling round ${roundId}...`);
          const result = await triggerSettlement(roundId);
          results.push({ roundId, success: true, result });
        } catch (error) {
          console.error(`Failed to settle round ${roundId}:`, error);
          results.push({ roundId, success: false, error });
        }
      }

      const successCount = results.length;
      toast.success(`Settled ${successCount}/${roundIds.length} rounds`);

      return results;
    },
    [triggerSettlement],
  );

  return {
    // Settlement functions
    checkSettlementStatus,
    triggerSettlement,
    finalizeSettlement,
    batchSettle,

    // Query functions
    getSettlementInfo,
    getRoundsNeedingSettlement,

    // State
    isLoading,
  };
}
