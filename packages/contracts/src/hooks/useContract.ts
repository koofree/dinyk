import { useState, useEffect, useCallback } from 'react';
import { Provider, Signer } from 'ethers';
import { ContractServiceFactory } from '../services/ServiceFactory';
import { ContractError, parseContractError } from '../utils/errors';

export interface UseContractState {
  factory: ContractServiceFactory | null;
  isInitializing: boolean;
  isInitialized: boolean;
  error: ContractError | null;
}

export interface UseContractActions {
  initialize: () => Promise<void>;
  clearError: () => void;
  clearCache: () => void;
}

export type UseContractReturn = UseContractState & UseContractActions;

/**
 * Base hook for contract interactions
 * Manages the ContractServiceFactory lifecycle
 */
export function useContract(
  provider: Provider | Signer | undefined,
  chainId: number | undefined
): UseContractReturn {
  const [state, setState] = useState<UseContractState>({
    factory: null,
    isInitializing: false,
    isInitialized: false,
    error: null,
  });

  // Initialize factory when provider and chainId are available
  useEffect(() => {
    if (!provider || !chainId) {
      setState(prev => ({
        ...prev,
        factory: null,
        isInitialized: false,
        error: null,
      }));
      return;
    }

    const initializeFactory = async () => {
      setState(prev => ({ ...prev, isInitializing: true, error: null }));

      try {
        const factory = new ContractServiceFactory(provider, chainId);
        await factory.initialize();
        
        setState(prev => ({
          ...prev,
          factory,
          isInitialized: true,
          isInitializing: false,
        }));
      } catch (error) {
        const contractError = parseContractError(error);
        setState(prev => ({
          ...prev,
          factory: null,
          isInitialized: false,
          isInitializing: false,
          error: contractError,
        }));
      }
    };

    initializeFactory();

    // Cleanup on unmount or dependency change
    return () => {
      if (state.factory) {
        state.factory.cleanup();
      }
    };
  }, [provider, chainId]);

  const initialize = useCallback(async () => {
    if (!provider || !chainId) {
      throw new Error('Provider and chainId are required');
    }

    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      const factory = new ContractServiceFactory(provider, chainId);
      await factory.initialize();
      
      setState(prev => ({
        ...prev,
        factory,
        isInitialized: true,
        isInitializing: false,
      }));
    } catch (error) {
      const contractError = parseContractError(error);
      setState(prev => ({
        ...prev,
        factory: null,
        isInitialized: false,
        isInitializing: false,
        error: contractError,
      }));
      throw contractError;
    }
  }, [provider, chainId]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearCache = useCallback(() => {
    if (state.factory) {
      state.factory.clearCache();
    }
  }, [state.factory]);

  return {
    ...state,
    initialize,
    clearError,
    clearCache,
  };
}