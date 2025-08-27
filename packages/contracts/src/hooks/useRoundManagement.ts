import { useCallback } from "react";
import { ethers } from "ethers";

import { TranchePoolCore__factory } from "../types/generated";
import { useContracts } from "./useContracts";

export enum RoundState {
  ANNOUNCED = 0,
  OPEN = 1,
  MATCHED = 2,
  ACTIVE = 3,
  MATURED = 4,
  SETTLED = 5,
  CANCELED = 6,
}

export interface RoundInfo {
  roundId: number;
  trancheId: number;
  state: RoundState;
  salesStartTime: bigint;
  salesEndTime: bigint;
  matchedAmount: bigint;
}

export interface RoundEconomics {
  totalBuyerPurchases: bigint;
  totalSellerCollateral: bigint;
  matchedAmount: bigint;
  lockedCollateral: bigint;
  premiumPool: bigint;
}

export interface AnnounceRoundParams {
  trancheId: number;
  durationMinutes?: number; // Default: 10080 (7 days)
  startDelayMinutes?: number; // Default: 10
  openImmediately?: boolean;
}

export function useRoundManagement() {
  const { productCatalog, tranchePoolFactory } = useContracts();

  // Get round information
  const getRoundInfo = useCallback(
    async (roundId: number): Promise<RoundInfo | null> => {
      if (!productCatalog) throw new Error("Product catalog not initialized");

      try {
        const round = await productCatalog.getRound(roundId);

        if (round.roundId === 0n) {
          return null;
        }

        return {
          roundId: Number(round.roundId),
          trancheId: Number(round.trancheId),
          state: Number(round.state) as RoundState,
          salesStartTime: round.salesStartTime,
          salesEndTime: round.salesEndTime,
          matchedAmount: round.matchedAmount,
        };
      } catch (error) {
        console.error("Error fetching round info:", error);
        throw error;
      }
    },
    [productCatalog],
  );

  // Get rounds for a tranche
  const getTrancheRounds = useCallback(
    async (trancheId: number): Promise<number[]> => {
      if (!productCatalog) throw new Error("Product catalog not initialized");

      try {
        const rounds = await productCatalog.getTrancheRounds(trancheId);
        return rounds.map((id) => Number(id));
      } catch (error) {
        console.error("Error fetching tranche rounds:", error);
        throw error;
      }
    },
    [productCatalog],
  );

  // Get round economics from pool
  const getRoundEconomics = useCallback(
    async (roundId: number): Promise<RoundEconomics | null> => {
      if (!productCatalog || !tranchePoolFactory) {
        throw new Error("Not initialized");
      }

      try {
        // Get tranche ID from round
        const roundInfo = await productCatalog.getRound(roundId);
        if (roundInfo.roundId === 0n) {
          return null;
        }

        const trancheId = Number(roundInfo.trancheId);

        // Get pool address
        const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
        if (poolAddress === ethers.ZeroAddress) {
          return null;
        }

        const pool = TranchePoolCore__factory.connect(
          poolAddress,
          productCatalog.runner,
        );
        const economics = await pool.getRoundEconomics(roundId);

        return {
          totalBuyerPurchases: economics[0],
          totalSellerCollateral: economics[1],
          matchedAmount: economics[2],
          lockedCollateral: economics[3],
          premiumPool: economics[4],
        };
      } catch (error) {
        console.error("Error fetching round economics:", error);
        throw error;
      }
    },
    [productCatalog, tranchePoolFactory],
  );

  // Get active rounds (OPEN or ACTIVE states)
  const getActiveRounds = useCallback(async (): Promise<number[]> => {
    if (!productCatalog) throw new Error("Product catalog not initialized");

    try {
      // Get all active tranches
      const activeTranches = await productCatalog.getActiveTranches();
      const activeRounds: number[] = [];

      // Check rounds for each tranche
      for (const trancheId of activeTranches) {
        const rounds = await productCatalog.getTrancheRounds(trancheId);

        for (const roundId of rounds) {
          const roundInfo = await productCatalog.getRound(roundId);
          const state = Number(roundInfo.state);

          // Include ANNOUNCED, OPEN, ACTIVE, MATURED (not yet settled)
          if (state >= 0 && state <= 4) {
            activeRounds.push(Number(roundId));
          }
        }
      }

      return activeRounds;
    } catch (error) {
      console.error("Error fetching active rounds:", error);
      throw error;
    }
  }, [productCatalog]);

  return {
    // Queries
    getRoundInfo,
    getTrancheRounds,
    getRoundEconomics,
    getActiveRounds,
  };
}
