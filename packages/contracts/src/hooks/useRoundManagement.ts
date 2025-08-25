import { ethers } from 'ethers';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useWeb3 } from '../providers/Web3Provider';
import { useContracts } from './useContracts';

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
  const { signer, account } = useWeb3();
  const { productCatalog, tranchePoolFactory } = useContracts();
  const [isLoading, setIsLoading] = useState(false);

  // Announce a new round
  const announceRound = useCallback(async (params: AnnounceRoundParams): Promise<number> => {
    if (!productCatalog || !signer) throw new Error('Not initialized');
    
    setIsLoading(true);
    try {
      const contract = productCatalog.connect(signer);
      
      // Check OPERATOR_ROLE
      const OPERATOR_ROLE = await contract.OPERATOR_ROLE();
      const hasRole = await contract.hasRole(OPERATOR_ROLE, account!);
      
      if (!hasRole) {
        throw new Error('Account does not have OPERATOR_ROLE');
      }
      
      // Sales window configuration
      const now = Math.floor(Date.now() / 1000);
      const oneMinute = 60;
      
      const salesStart = now + ((params.startDelayMinutes || 10) * oneMinute);
      const salesEnd = salesStart + ((params.durationMinutes || 10080) * oneMinute);
      
      console.log('Announcing round:', {
        trancheId: params.trancheId,
        salesStart: new Date(salesStart * 1000).toLocaleString(),
        salesEnd: new Date(salesEnd * 1000).toLocaleString(),
      });
      
      const tx = await contract.announceRound(
        params.trancheId,
        salesStart,
        salesEnd
      );
      
      const receipt = await tx.wait();
      
      // Extract round ID from events
      const roundAnnouncedEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          return parsed?.name === 'RoundAnnounced';
        } catch {
          return false;
        }
      });
      
      const roundId = roundAnnouncedEvent ? 
        Number(contract.interface.parseLog({
          topics: roundAnnouncedEvent.topics as string[],
          data: roundAnnouncedEvent.data,
        })?.args.roundId) : 
        0;
      
      if (!roundId) {
        throw new Error('Failed to extract round ID');
      }
      
      toast.success(`Round ${roundId} announced!`);
      
      // Open immediately if requested and possible
      if (params.openImmediately && salesStart <= now) {
        await openRound(roundId);
      }
      
      return roundId;
      
    } catch (error: any) {
      console.error('Error announcing round:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [productCatalog, signer, account]);

  // Open a round for sales
  const openRound = useCallback(async (roundId: number) => {
    if (!productCatalog || !signer) throw new Error('Not initialized');
    
    setIsLoading(true);
    try {
      const contract = productCatalog.connect(signer);
      
      // Check round state
      const roundInfo = await contract.getRound(roundId);
      const currentState = Number(roundInfo.state);
      
      if (currentState !== RoundState.ANNOUNCED) {
        toast.info(`Round is not in ANNOUNCED state (current: ${RoundState[currentState]})`);
        return;
      }
      
      // Check if sales start time has been reached
      const now = Math.floor(Date.now() / 1000);
      if (now < Number(roundInfo.salesStartTime)) {
        const waitTime = Number(roundInfo.salesStartTime) - now;
        toast.info(`Sales start in ${Math.floor(waitTime / 60)} minutes`);
        return;
      }
      
      console.log('Opening round:', roundId);
      const tx = await contract.openRound(roundId);
      await tx.wait();
      
      toast.success(`Round ${roundId} opened for sales!`);
      
    } catch (error: any) {
      console.error('Error opening round:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [productCatalog, signer]);

  // Close and match a round
  const closeAndMatchRound = useCallback(async (roundId: number, force?: boolean) => {
    if (!productCatalog || !tranchePoolFactory || !signer) {
      throw new Error('Not initialized');
    }
    
    setIsLoading(true);
    try {
      const catalogContract = productCatalog.connect(signer);
      
      // Get round info
      const roundInfo = await catalogContract.getRound(roundId);
      const trancheId = Number(roundInfo.trancheId);
      const currentState = Number(roundInfo.state);
      
      if (currentState !== RoundState.OPEN) {
        toast.info(`Round is not in OPEN state (current: ${RoundState[currentState]})`);
        return;
      }
      
      // Check if sales period has ended (unless forced)
      const now = Math.floor(Date.now() / 1000);
      if (!force && now < Number(roundInfo.salesEndTime)) {
        const waitTime = Number(roundInfo.salesEndTime) - now;
        toast.info(`Sales end in ${Math.floor(waitTime / 60)} minutes. Use force to close anyway.`);
        return;
      }
      
      // Get pool address
      const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
      if (poolAddress === ethers.ZeroAddress) {
        throw new Error(`No pool found for tranche ${trancheId}`);
      }
      
      const pool = await ethers.getContractAt('TranchePoolCore', poolAddress, signer);
      
      // Get round economics before matching
      const economicsBefore = await pool.getRoundEconomics(roundId);
      const totalBuyers = economicsBefore[0];
      const totalSellers = economicsBefore[1];
      
      if (totalBuyers === 0n && totalSellers === 0n) {
        toast.info('No orders to match');
        return;
      }
      
      // Check OPERATOR_ROLE on pool
      const POOL_OPERATOR_ROLE = await pool.OPERATOR_ROLE();
      const hasPoolRole = await pool.hasRole(POOL_OPERATOR_ROLE, account!);
      
      if (!hasPoolRole) {
        // Try to grant if we're admin
        const POOL_ADMIN_ROLE = await pool.DEFAULT_ADMIN_ROLE();
        const hasAdminRole = await pool.hasRole(POOL_ADMIN_ROLE, account!);
        
        if (hasAdminRole) {
          console.log('Granting OPERATOR_ROLE on pool...');
          const grantTx = await pool.grantRole(POOL_OPERATOR_ROLE, account!);
          await grantTx.wait();
        } else {
          throw new Error('Account lacks OPERATOR_ROLE on pool');
        }
      }
      
      // Close and match the round
      console.log('Closing and matching round:', roundId);
      const closeTx = await pool.computeMatchAndDistribute(roundId);
      await closeTx.wait();
      
      // Get matched amount
      const economicsAfter = await pool.getRoundEconomics(roundId);
      const matchedAmount = economicsAfter[2];
      
      // Update catalog state
      const markTx = await catalogContract.closeAndMarkMatched(roundId, matchedAmount);
      await markTx.wait();
      
      toast.success(`Round ${roundId} closed! Matched: $${ethers.formatUnits(matchedAmount, 6)}`);
      
    } catch (error: any) {
      console.error('Error closing round:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [productCatalog, tranchePoolFactory, signer, account]);

  // Get round information
  const getRoundInfo = useCallback(async (roundId: number): Promise<RoundInfo | null> => {
    if (!productCatalog) throw new Error('Product catalog not initialized');
    
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
      console.error('Error fetching round info:', error);
      throw error;
    }
  }, [productCatalog]);

  // Get rounds for a tranche
  const getTrancheRounds = useCallback(async (trancheId: number): Promise<number[]> => {
    if (!productCatalog) throw new Error('Product catalog not initialized');
    
    try {
      const rounds = await productCatalog.getTrancheRounds(trancheId);
      return rounds.map(id => Number(id));
    } catch (error) {
      console.error('Error fetching tranche rounds:', error);
      throw error;
    }
  }, [productCatalog]);

  // Get round economics from pool
  const getRoundEconomics = useCallback(async (roundId: number): Promise<RoundEconomics | null> => {
    if (!productCatalog || !tranchePoolFactory) {
      throw new Error('Not initialized');
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
      
      const pool = await ethers.getContractAt('TranchePoolCore', poolAddress);
      const economics = await pool.getRoundEconomics(roundId);
      
      return {
        totalBuyerPurchases: economics[0],
        totalSellerCollateral: economics[1],
        matchedAmount: economics[2],
        lockedCollateral: economics[3],
        premiumPool: economics[4],
      };
    } catch (error) {
      console.error('Error fetching round economics:', error);
      throw error;
    }
  }, [productCatalog, tranchePoolFactory]);

  // Cancel a round (emergency)
  const cancelRound = useCallback(async (roundId: number) => {
    if (!productCatalog || !signer) throw new Error('Not initialized');
    
    setIsLoading(true);
    try {
      const contract = productCatalog.connect(signer);
      
      // Check OPERATOR_ROLE
      const OPERATOR_ROLE = await contract.OPERATOR_ROLE();
      const hasRole = await contract.hasRole(OPERATOR_ROLE, account!);
      
      if (!hasRole) {
        throw new Error('Account does not have OPERATOR_ROLE');
      }
      
      console.log('Canceling round:', roundId);
      const tx = await contract.cancelRound(roundId);
      
      toast.promise(tx.wait(), {
        loading: 'Canceling round...',
        success: `Round ${roundId} canceled. Refunds will be processed.`,
        error: 'Failed to cancel round',
      });
      
      await tx.wait();
      
    } catch (error: any) {
      console.error('Error canceling round:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [productCatalog, signer, account]);

  // Get active rounds (OPEN or ACTIVE states)
  const getActiveRounds = useCallback(async (): Promise<number[]> => {
    if (!productCatalog) throw new Error('Product catalog not initialized');
    
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
      console.error('Error fetching active rounds:', error);
      throw error;
    }
  }, [productCatalog]);

  return {
    // State
    isLoading,
    
    // Round lifecycle
    announceRound,
    openRound,
    closeAndMatchRound,
    cancelRound,
    
    // Queries
    getRoundInfo,
    getTrancheRounds,
    getRoundEconomics,
    getActiveRounds,
  };
}