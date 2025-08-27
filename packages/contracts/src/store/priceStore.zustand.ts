import { ethers } from "ethers";
import { create } from "zustand";

import { ACTIVE_NETWORK } from "../config/constants";
import { OracleRouter__factory } from "../types/generated";

export interface PriceData {
  value: number;
  loading: boolean;
  error: Error | null;
  lastUpdate: number | null;
}

interface PriceStore {
  // Price data
  btc: PriceData;
  eth: PriceData;
  kaia: PriceData;

  // Settings
  refreshInterval: number;
  intervalId: NodeJS.Timeout | null;

  // Actions
  fetchPrices: () => Promise<void>;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  setRefreshInterval: (ms: number) => void;
  reset: () => void;
}

// Default values
const defaultPriceData: PriceData = {
  value: 0,
  loading: false,
  error: null,
  lastUpdate: null,
};

const defaultPrices = {
  btc: { ...defaultPriceData, value: 100000 },
  eth: { ...defaultPriceData, value: 3500 },
  kaia: { ...defaultPriceData, value: 0.15 },
};

// Create the store
export const usePriceStore = create<PriceStore>((set, get) => ({
  // Initial state
  btc: defaultPrices.btc,
  eth: defaultPrices.eth,
  kaia: defaultPrices.kaia,
  refreshInterval: 30000, // 30 seconds
  intervalId: null,

  // Fetch prices from oracle
  fetchPrices: async () => {
    const symbols = ["BTC", "ETH", "KAIA"] as const;

    try {
      // Create provider and oracle router
      const provider = new ethers.JsonRpcProvider(ACTIVE_NETWORK.rpcUrl, {
        chainId: ACTIVE_NETWORK.chainId,
        name: ACTIVE_NETWORK.name,
      });

      const oracleRouter = OracleRouter__factory.connect(
        ACTIVE_NETWORK.contracts.OracleRouter,
        provider,
      );

      // Fetch all prices in parallel
      const pricePromises = symbols.map(async (symbol) => {
        try {
          const identifier = ethers.keccak256(
            ethers.toUtf8Bytes(`${symbol}-USDT`),
          );
          const priceResult = await oracleRouter.getPrice(identifier);

          if (!priceResult.valid) {
            throw new Error(`Invalid price for ${symbol}`);
          }

          // Oracle uses 8 decimals
          const price = Number(ethers.formatUnits(priceResult.price, 8));

          return { symbol: symbol.toLowerCase(), price, error: null };
        } catch (error) {
          console.warn(`Error fetching ${symbol} price:`, error);
          return {
            symbol: symbol.toLowerCase(),
            price: null,
            error:
              error instanceof Error
                ? error
                : new Error(`Failed to fetch ${symbol}`),
          };
        }
      });

      const results = await Promise.allSettled(pricePromises);

      // Update state with results
      set((state) => {
        const newState = { ...state };

        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            const { symbol, price, error } = result.value;
            const key = symbol as keyof Pick<
              PriceStore,
              "btc" | "eth" | "kaia"
            >;

            if (price !== null) {
              newState[key] = {
                value: price,
                loading: false,
                error: null,
                lastUpdate: Date.now(),
              };
              console.log(
                `${symbol.toUpperCase()} price updated: $${price.toLocaleString()}`,
              );
            } else if (error) {
              newState[key] = {
                ...newState[key],
                loading: false,
                error,
              };
            }
          }
        });

        return newState;
      });
    } catch (error) {
      console.error("Failed to initialize price fetching:", error);
      // Keep existing prices on total failure
      set((state) => ({
        btc: { ...state.btc, loading: false },
        eth: { ...state.eth, loading: false },
        kaia: { ...state.kaia, loading: false },
      }));
    }
  },

  // Start automatic refresh
  startAutoRefresh: () => {
    const { intervalId, refreshInterval, fetchPrices, stopAutoRefresh } = get();

    // Clear existing interval if any
    if (intervalId) {
      stopAutoRefresh();
    }

    // Initial fetch
    void fetchPrices();

    // Set up interval
    const newIntervalId = setInterval(() => {
      void fetchPrices();
    }, refreshInterval);

    set({ intervalId: newIntervalId });
  },

  // Stop automatic refresh
  stopAutoRefresh: () => {
    const { intervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
      set({ intervalId: null });
    }
  },

  // Set refresh interval
  setRefreshInterval: (ms: number) => {
    set({ refreshInterval: ms });

    // Restart auto-refresh if it's running
    const { intervalId, startAutoRefresh } = get();
    if (intervalId) {
      startAutoRefresh();
    }
  },

  // Reset to defaults
  reset: () => {
    const { stopAutoRefresh } = get();
    stopAutoRefresh();
    set({
      btc: defaultPrices.btc,
      eth: defaultPrices.eth,
      kaia: defaultPrices.kaia,
      intervalId: null,
    });
  },
}));

// Auto-start on first use (optional - you can call startAutoRefresh manually instead)
if (typeof window !== "undefined") {
  // Start auto-refresh when the store is first accessed in the browser
  setTimeout(() => {
    const state = usePriceStore.getState();
    if (!state.intervalId) {
      state.startAutoRefresh();
    }
  }, 1000);
}
