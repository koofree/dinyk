import { useEffect, useState } from "react";
import { ethers } from "ethers";

import { ACTIVE_NETWORK } from "@dinsure/contracts";

interface UseBTCPriceProps {
  factory: any;
  refreshInterval?: number; // in milliseconds
}

// Create a default provider for Kaia Testnet
const createDefaultProvider = () => {
  return new ethers.JsonRpcProvider(ACTIVE_NETWORK.rpcUrl, {
    chainId: ACTIVE_NETWORK.chainId,
    name: ACTIVE_NETWORK.name,
  });
};

export function useBTCPrice({
  factory,
  refreshInterval = 10000,
}: UseBTCPriceProps) {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const fetchBTCPrice = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use factory provider if available, otherwise create default
      const provider = factory?.provider || createDefaultProvider();

      // Simple oracle router ABI for getPrice function
      const oracleRouterABI = [
        "function getPrice(bytes32 identifier) external view returns (tuple(uint256 price, uint256 timestamp))",
      ];

      // Create oracle router contract
      const oracleRouter = new ethers.Contract(
        ACTIVE_NETWORK.contracts.OracleRouter,
        oracleRouterABI,
        provider,
      );

      // Get BTC price
      const btcIdentifier = ethers.keccak256(ethers.toUtf8Bytes("BTC-USDT"));
      const priceResult = await oracleRouter.getPrice(btcIdentifier);

      const btcPrice = Number(ethers.formatUnits(priceResult.price, 8)); // Oracle uses 8 decimals

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
    fetchBTCPrice();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchBTCPrice, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [factory, refreshInterval]);

  return {
    price,
    loading,
    error,
    lastUpdate,
    refetch: fetchBTCPrice,
  };
}
