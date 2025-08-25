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
import { KAIA_RPC_ENDPOINTS, useWeb3 } from "../providers/Web3Provider";

export interface ContractsState {
  productCatalog: ethers.Contract | null;
  tranchePoolFactory: ethers.Contract | null;
  insuranceToken: ethers.Contract | null;
  settlementEngine: ethers.Contract | null;
  oracleRouter: ethers.Contract | null;
  usdt: ethers.Contract | null;
  usdtContract?: ethers.Contract | null; // Alias for usdt
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

  // Debug logging
  if (typeof window !== 'undefined' && process.env.DEBUG) {
    console.log('[useContracts] Hook called, provider:', !!provider, 'signer:', !!signer);
  }

  useEffect(() => {
    if (!provider) {
      if (typeof window !== 'undefined' && process.env.DEBUG) {
        console.log('[useContracts] No provider available, creating read-only provider');
      }
      
      // Create a read-only provider for contract calls when no wallet is connected
      console.log('[useContracts] Creating read-only provider with RPC:', KAIA_RPC_ENDPOINTS[0]);
      const readOnlyProvider = new ethers.JsonRpcProvider(KAIA_RPC_ENDPOINTS[0], {
        chainId: 1001,
        name: 'Kaia Kairos'
      });
      console.log('[useContracts] Read-only provider created:', readOnlyProvider);
      
      const initializeReadOnlyContracts = async () => {
        try {
          if (typeof window !== 'undefined' && process.env.DEBUG) {
            console.log('[useContracts] Initializing read-only contracts...');
          }

          // Initialize all contracts with read-only provider
          const productCatalog = new ethers.Contract(
            CONTRACT_ADDRESSES.ProductCatalog,
            ProductCatalogABI.abi,
            readOnlyProvider,
          );

          const tranchePoolFactory = new ethers.Contract(
            CONTRACT_ADDRESSES.TranchePoolFactory,
            TranchePoolFactoryABI.abi,
            readOnlyProvider,
          );

          const insuranceToken = new ethers.Contract(
            CONTRACT_ADDRESSES.InsuranceToken,
            InsuranceTokenABI.abi,
            readOnlyProvider,
          );

          const settlementEngine = new ethers.Contract(
            CONTRACT_ADDRESSES.SettlementEngine,
            SettlementEngineABI.abi,
            readOnlyProvider,
          );

          const oracleRouter = new ethers.Contract(
            CONTRACT_ADDRESSES.OracleRouter,
            OracleRouterABI.abi,
            readOnlyProvider,
          );

          const usdt = new ethers.Contract(
            CONTRACT_ADDRESSES.DinUSDT,
            DinUSDTABI.abi,
            readOnlyProvider,
          );

          const registry = new ethers.Contract(
            CONTRACT_ADDRESSES.DinRegistry,
            DinRegistryABI.abi,
            readOnlyProvider,
          );

          const feeTreasury = new ethers.Contract(
            CONTRACT_ADDRESSES.FeeTreasury,
            FeeTreasuryABI.abi,
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

    const initializeContracts = async () => {
      try {
        if (typeof window !== 'undefined' && process.env.DEBUG) {
          console.log('[useContracts] Initializing contracts...');
        }
        
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

  // Add alias for backward compatibility
  return {
    ...contracts,
    usdtContract: contracts.usdt  // Alias for easier use
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
