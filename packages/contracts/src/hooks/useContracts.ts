import { useEffect, useState } from "react";

import type {
  DinRegistry,
  DinUSDT,
  FeeTreasury,
  InsuranceToken,
  OracleRouter,
  ProductCatalog,
  SettlementEngine,
  TranchePoolFactory,
} from "../types/generated";
import { ACTIVE_NETWORK } from "../config/constants";
import { useWeb3 } from "../providers/Web3Provider";
import {
  DinRegistry__factory,
  DinUSDT__factory,
  FeeTreasury__factory,
  InsuranceToken__factory,
  OracleRouter__factory,
  ProductCatalog__factory,
  SettlementEngine__factory,
  TranchePoolFactory__factory,
} from "../types/generated";

export interface ContractsState {
  productCatalog: ProductCatalog | null;
  tranchePoolFactory: TranchePoolFactory | null;
  insuranceToken: InsuranceToken | null;
  settlementEngine: SettlementEngine | null;
  oracleRouter: OracleRouter | null;
  usdt: DinUSDT | null;
  usdtContract?: DinUSDT | null; // Alias for usdt
  registry: DinRegistry | null;
  feeTreasury: FeeTreasury | null;
  isInitialized: boolean;
  error: Error | null;
}

export function useContracts(): ContractsState {
  const { provider } = useWeb3();

  const [contracts, setContracts] = useState<ContractsState>({
    productCatalog: null,
    tranchePoolFactory: null,
    insuranceToken: null,
    settlementEngine: null,
    oracleRouter: null,
    usdt: null,
    registry: null,
    feeTreasury: null,
    isInitialized: false,
    error: null,
  });

  useEffect(() => {
    if (!provider) {
      console.log("[useContracts] No provider found");
      return;
    }

    try {
      if (typeof window !== "undefined" && process.env.DEBUG) {
        console.log("[useContracts] Initializing contracts...");
      }

      // Initialize all contracts
      const productCatalog = ProductCatalog__factory.connect(
        ACTIVE_NETWORK.contracts.ProductCatalog,
        provider,
      );

      const tranchePoolFactory = TranchePoolFactory__factory.connect(
        ACTIVE_NETWORK.contracts.TranchePoolFactory,
        provider,
      );

      const insuranceToken = InsuranceToken__factory.connect(
        ACTIVE_NETWORK.contracts.InsuranceToken,
        provider,
      );

      const settlementEngine = SettlementEngine__factory.connect(
        ACTIVE_NETWORK.contracts.SettlementEngine,
        provider,
      );

      const oracleRouter = OracleRouter__factory.connect(
        ACTIVE_NETWORK.contracts.OracleRouter,
        provider,
      );

      const usdt = DinUSDT__factory.connect(
        ACTIVE_NETWORK.contracts.DinUSDT,
        provider,
      );

      const registry = DinRegistry__factory.connect(
        ACTIVE_NETWORK.contracts.DinRegistry,
        provider,
      );

      const feeTreasury = FeeTreasury__factory.connect(
        ACTIVE_NETWORK.contracts.FeeTreasury,
        provider,
      );

      setContracts({
        productCatalog,
        tranchePoolFactory,
        insuranceToken,
        settlementEngine,
        oracleRouter,
        usdt,
        registry,
        feeTreasury,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      console.error("Error initializing contracts:", error);
      setContracts((prev) => ({
        ...prev,
        isInitialized: false,
        error: error as Error,
      }));
    }
  }, [provider]);

  // Add alias for backward compatibility
  return {
    ...contracts,
    usdtContract: contracts.usdt, // Alias for easier use
  };
}
