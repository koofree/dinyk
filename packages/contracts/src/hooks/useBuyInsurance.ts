import { useState, useCallback } from 'react';
import { BuyInsuranceParams } from '../types/products';
import { TransactionResult } from '../types/common';

export interface UseBuyInsuranceState {
  loading: boolean;
  error: any;
  lastResult: TransactionResult | null;
}

export interface UseBuyInsuranceActions {
  buyInsurance: (params: BuyInsuranceParams & { trancheId: bigint }) => Promise<TransactionResult>;
  clearError: () => void;
}

export type UseBuyInsuranceReturn = UseBuyInsuranceState & UseBuyInsuranceActions;

export function useBuyInsurance(factory: any): UseBuyInsuranceReturn {
  const [state, setState] = useState<UseBuyInsuranceState>({
    loading: false,
    error: null,
    lastResult: null,
  });

  const buyInsurance = useCallback(async (
    params: BuyInsuranceParams & { trancheId: bigint }
  ): Promise<TransactionResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Stub implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result: TransactionResult = {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).slice(2),
        gasUsed: 150000n,
        blockNumber: 12345678,
        tokenId: BigInt(Math.floor(Math.random() * 1000)),
      };

      setState(prev => ({
        ...prev,
        loading: false,
        lastResult: result,
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error as Error,
      }));
      throw error;
    }
  }, [factory]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    buyInsurance,
    clearError,
  };
}