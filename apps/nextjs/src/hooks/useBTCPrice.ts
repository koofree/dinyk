/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useEffect, useState } from "react";
import { ethers } from "ethers";

import { ACTIVE_NETWORK, OracleRouter__factory } from "@dinsure/contracts";

// Create a default provider for Kaia Testnet
const createDefaultProvider = () => {
  return new ethers.JsonRpcProvider(ACTIVE_NETWORK.rpcUrl, {
    chainId: ACTIVE_NETWORK.chainId,
    name: ACTIVE_NETWORK.name,
  });
};

export function useBTCPrice() {
  const [price, setPrice] = useState<number>(100000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const refreshInterval = 5000; // 60000;

  const fetchBTCPrice = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use factory provider if available, otherwise create default
      const provider = createDefaultProvider();

      // Create oracle router contract
      const oracleRouter = OracleRouter__factory.connect(
        ACTIVE_NETWORK.contracts.OracleRouter,
        provider,
      );

      // Get BTC price
      const btcIdentifier = ethers.keccak256(ethers.toUtf8Bytes("BTC-USDT"));
      const priceResult = await oracleRouter.getPrice(btcIdentifier);

      // Validate the price result
      if (!priceResult.valid) {
        throw new Error(
          `Invalid price data: ${priceResult.error ?? "Unknown error"}`,
        );
      }

      // Extract the price from the PriceResult struct
      const btcPrice = Number(
        ethers.formatUnits(priceResult.price as bigint, 8),
      ); // Oracle uses 8 decimals

      setPrice(btcPrice);
      setLastUpdate(Date.now());

      console.log(`BTC Price updated: $${btcPrice.toLocaleString()}`);
    } catch (err) {
      console.error("Error fetching BTC price:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to fetch BTC price"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBTCPrice();

    const interval = setInterval(() => {
      void fetchBTCPrice();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, []);

  return {
    price,
    loading,
    error,
    lastUpdate,
    refetch: fetchBTCPrice,
  };
}
