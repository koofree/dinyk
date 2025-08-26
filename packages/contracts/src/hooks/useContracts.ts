import { useEffect, useState } from "react";
import { ethers } from "ethers";

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
import TranchePoolCoreABI from "../config/abis/TranchePoolCore.json";
import { ACTIVE_NETWORK, KAIA_RPC_ENDPOINTS } from "../config/constants";
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
  const { provider, signer } = useWeb3();
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
      if (typeof window !== "undefined" && process.env.DEBUG) {
        console.log(
          "[useContracts] No provider available, creating read-only provider",
        );
      }

      // Create a read-only provider for contract calls when no wallet is connected
      console.log(
        "[useContracts] Creating read-only provider with RPC:",
        KAIA_RPC_ENDPOINTS[0],
      );
      const readOnlyProvider = new ethers.JsonRpcProvider(
        KAIA_RPC_ENDPOINTS[0],
        {
          chainId: ACTIVE_NETWORK.chainId,
          name: ACTIVE_NETWORK.name,
        },
      );

      const initializeReadOnlyContracts = () => {
        try {
          if (typeof window !== "undefined" && process.env.DEBUG) {
            console.log("[useContracts] Initializing read-only contracts...");
          }

          // Initialize all contracts with read-only provider
          const productCatalog = ProductCatalog__factory.connect(
            ACTIVE_NETWORK.contracts.ProductCatalog,
            readOnlyProvider,
          );

          const tranchePoolFactory = TranchePoolFactory__factory.connect(
            ACTIVE_NETWORK.contracts.TranchePoolFactory,
            readOnlyProvider,
          );

          const insuranceToken = InsuranceToken__factory.connect(
            ACTIVE_NETWORK.contracts.InsuranceToken,
            readOnlyProvider,
          );

          const settlementEngine = SettlementEngine__factory.connect(
            ACTIVE_NETWORK.contracts.SettlementEngine,
            readOnlyProvider,
          );

          const oracleRouter = OracleRouter__factory.connect(
            ACTIVE_NETWORK.contracts.OracleRouter,
            readOnlyProvider,
          );

          const usdt = DinUSDT__factory.connect(
            ACTIVE_NETWORK.contracts.DinUSDT,
            readOnlyProvider,
          );

          const registry = DinRegistry__factory.connect(
            ACTIVE_NETWORK.contracts.DinRegistry,
            readOnlyProvider,
          );

          const feeTreasury = FeeTreasury__factory.connect(
            ACTIVE_NETWORK.contracts.FeeTreasury,
            readOnlyProvider,
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
          console.error("Error initializing read-only contracts:", error);
          setContracts((prev) => ({
            ...prev,
            isInitialized: false,
            error: error as Error,
          }));
        }
      };

      initializeReadOnlyContracts();
      return;
    }

    const initializeContracts = () => {
      try {
        if (typeof window !== "undefined" && process.env.DEBUG) {
          console.log("[useContracts] Initializing contracts...");
        }

        // Use signer if available, otherwise use provider
        const signerOrProvider = signer ?? provider;

        // Initialize all contracts
        const productCatalog = ProductCatalog__factory.connect(
          ACTIVE_NETWORK.contracts.ProductCatalog,
          signerOrProvider,
        );

        const tranchePoolFactory = TranchePoolFactory__factory.connect(
          ACTIVE_NETWORK.contracts.TranchePoolFactory,
          signerOrProvider,
        );

        const insuranceToken = InsuranceToken__factory.connect(
          ACTIVE_NETWORK.contracts.InsuranceToken,
          signerOrProvider,
        );

        const settlementEngine = SettlementEngine__factory.connect(
          ACTIVE_NETWORK.contracts.SettlementEngine,
          signerOrProvider,
        );

        const oracleRouter = OracleRouter__factory.connect(
          ACTIVE_NETWORK.contracts.OracleRouter,
          signerOrProvider,
        );

        const usdt = DinUSDT__factory.connect(
          ACTIVE_NETWORK.contracts.DinUSDT,
          signerOrProvider,
        );

        const registry = DinRegistry__factory.connect(
          ACTIVE_NETWORK.contracts.DinRegistry,
          signerOrProvider,
        );

        const feeTreasury = FeeTreasury__factory.connect(
          ACTIVE_NETWORK.contracts.FeeTreasury,
          signerOrProvider,
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
    };

    initializeContracts();
  }, [provider, signer]);

  // Add alias for backward compatibility
  return {
    ...contracts,
    usdtContract: contracts.usdt, // Alias for easier use
  };
}

// Helper hook to get a specific pool contract
export function useTranchePool(poolAddress: string | null) {
  const { provider, signer } = useWeb3();
  const [pool, setPool] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    if (!poolAddress || !provider || poolAddress === ethers.ZeroAddress) {
      setPool(null);
      return;
    }

    try {
      const signerOrProvider = signer ?? provider;
      const poolContract = new ethers.Contract(
        poolAddress,
        TranchePoolCoreABI.abi,
        signerOrProvider,
      );
      setPool(poolContract);
    } catch (error) {
      console.error("Error initializing pool contract:", error);
      setPool(null);
    }
  }, [poolAddress, provider, signer]);

  return pool;
}
