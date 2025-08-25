import { ethers } from "ethers";
import { useEffect, useState } from "react";

import DinRegistryABI from "../config/abis/DinRegistry.json";
import DinUSDTABI from "../config/abis/DinUSDT.json";
import FeeTreasuryABI from "../config/abis/FeeTreasury.json";
import InsuranceTokenABI from "../config/abis/InsuranceToken.json";
import OracleRouterABI from "../config/abis/OracleRouter.json";
import ProductCatalogABI from "../config/abis/ProductCatalog.json";
import SettlementEngineABI from "../config/abis/SettlementEngine.json";
import TranchePoolCoreABI from "../config/abis/TranchePoolCore.json";
import TranchePoolFactoryABI from "../config/abis/TranchePoolFactory.json";
import { CONTRACT_ADDRESSES } from "../config/addresses";
import { useWeb3 } from "../providers/Web3Provider";

export interface ContractsState {
  productCatalog: ethers.Contract | null;
  tranchePoolFactory: ethers.Contract | null;
  insuranceToken: ethers.Contract | null;
  settlementEngine: ethers.Contract | null;
  oracleRouter: ethers.Contract | null;
  usdt: ethers.Contract | null;
  registry: ethers.Contract | null;
  feeTreasury: ethers.Contract | null;
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
      setContracts((prev) => ({
        ...prev,
        isInitialized: false,
        error: new Error("No provider available"),
      }));
      return;
    }

    const initializeContracts = async () => {
      try {
        // Use signer if available, otherwise use provider
        const signerOrProvider = signer || provider;

        // Initialize all contracts
        const productCatalog = new ethers.Contract(
          CONTRACT_ADDRESSES.ProductCatalog,
          ProductCatalogABI.abi,
          signerOrProvider,
        );

        const tranchePoolFactory = new ethers.Contract(
          CONTRACT_ADDRESSES.TranchePoolFactory,
          TranchePoolFactoryABI.abi,
          signerOrProvider,
        );

        const insuranceToken = new ethers.Contract(
          CONTRACT_ADDRESSES.InsuranceToken,
          InsuranceTokenABI.abi,
          signerOrProvider,
        );

        const settlementEngine = new ethers.Contract(
          CONTRACT_ADDRESSES.SettlementEngine,
          SettlementEngineABI.abi,
          signerOrProvider,
        );

        const oracleRouter = new ethers.Contract(
          CONTRACT_ADDRESSES.OracleRouter,
          OracleRouterABI.abi,
          signerOrProvider,
        );

        const usdt = new ethers.Contract(
          CONTRACT_ADDRESSES.DinUSDT,
          DinUSDTABI.abi,
          signerOrProvider,
        );

        const registry = new ethers.Contract(
          CONTRACT_ADDRESSES.DinRegistry,
          DinRegistryABI.abi,
          signerOrProvider,
        );

        const feeTreasury = new ethers.Contract(
          CONTRACT_ADDRESSES.FeeTreasury,
          FeeTreasuryABI.abi,
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

  return contracts;
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
      const signerOrProvider = signer || provider;
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
