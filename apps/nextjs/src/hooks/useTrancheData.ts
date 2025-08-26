import { ACTIVE_NETWORK, ProductCatalogService } from "@dinsure/contracts";
import { ethers } from "ethers";
import { useEffect, useState } from "react";

export interface RoundEconomics {
  totalBuyerPurchases: bigint;
  totalSellerCollateral: bigint;
  matchedAmount: bigint;
  lockedCollateral: bigint;
  premiumPool: bigint;
}

export interface RoundDetails {
  roundId: number;
  trancheId: number;
  state: number;
  salesStartTime: number;
  salesEndTime: number;
  stateName: string;
  economics?: RoundEconomics;
  isTriggered?: boolean;
  triggerPrice?: number;
  triggerDirection?: string;
  timeToMaturity?: {
    days: number;
    hours: number;
    isMatured: boolean;
  };
}

export interface TrancheDetails {
  trancheId: number;
  triggerType: number;
  threshold: bigint;
  premiumRateBps: number;
  maturityTimestamp: number;
  trancheCap: bigint;
  poolAddress: string;
  rounds: RoundDetails[];
}

interface UseTrancheDataProps {
  factory: any;
  currentBTCPrice?: number;
}

// Create a default provider for Kaia Testnet
const createDefaultProvider = () => {
  return new ethers.JsonRpcProvider(ACTIVE_NETWORK.rpcUrl, {
    chainId: ACTIVE_NETWORK.chainId,
    name: ACTIVE_NETWORK.name
  });
};

export function useTrancheData({ factory, currentBTCPrice }: UseTrancheDataProps) {
  const [tranches, setTranches] = useState<TrancheDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [service, setService] = useState<ProductCatalogService | null>(null);

  // Initialize service
  useEffect(() => {
    try {
      // Use factory provider if available, otherwise create default
      const provider = factory?.provider || createDefaultProvider();
      const catalogService = new ProductCatalogService(
        ACTIVE_NETWORK.contracts.ProductCatalog,
        provider
      );
      setService(catalogService);
      console.log('ProductCatalogService initialized for tranche data');
    } catch (error) {
      console.error('Failed to initialize ProductCatalogService for tranches:', error);
      setError(error instanceof Error ? error : new Error('Failed to initialize service'));
      setLoading(false);
    }
  }, [factory]);

  const fetchTrancheData = async () => {
    if (!service) {
      console.log('ProductCatalogService not initialized for tranche data');
      setLoading(false);
      setError(new Error('Contract service not initialized'));
      return;
    }

    try {
      console.log('Starting tranche data fetch...');
      setLoading(true);
      setError(null);

      // Get active tranches
      const activeTranches = await service.getActiveTrancheIds();
      console.log(`Found ${activeTranches.length} active tranches:`, activeTranches);

      // If no active tranches, return empty array immediately
      if (activeTranches.length === 0) {
        console.log('No active tranches found, returning empty array');
        setTranches([]);
        setLoading(false);
        return;
      }

      const trancheDetails: TrancheDetails[] = [];
      const now = Math.floor(Date.now() / 1000);

      for (const trancheId of activeTranches) {
        try {
          // Get tranche specification
          const tranche = await service.getTranche(trancheId);
          if (!tranche) {
            console.log(`Tranche ${trancheId} not found`);
            continue;
          }
          
          // Reduce console logging to avoid spam
          // console.log(`Tranche ${trancheId}:`, {
          //   tranche,
          //   rounds: tranche.rounds
          // });

          const rounds: RoundDetails[] = [];

          // Process rounds from tranche data
          for (const roundId of tranche.rounds) {
            try {
              const roundInfo = await service.getRound(roundId);
              if (!roundInfo) {
                console.log(`Round ${roundId} not found`);
                continue;
              }
              
              const roundState = ['ANNOUNCED', 'OPEN', 'ACTIVE', 'MATURED', 'SETTLED', 'CANCELED'][roundInfo.state];
              
              // Skip settled/canceled rounds
              if (roundInfo.state === 5 || roundInfo.state === 6) continue;

              // Calculate trigger status
              let isTriggered: boolean | undefined;
              let triggerPrice: number | undefined;
              let triggerDirection: string | undefined;

              if (currentBTCPrice && (roundInfo.state >= 2 && roundInfo.state <= 3)) {
                triggerPrice = Number(ethers.formatEther(tranche.threshold));
                
                if (tranche.triggerType === 0) { // PRICE_BELOW
                  isTriggered = currentBTCPrice <= triggerPrice;
                  triggerDirection = "BELOW";
                } else if (tranche.triggerType === 1) { // PRICE_ABOVE
                  isTriggered = currentBTCPrice >= triggerPrice;
                  triggerDirection = "ABOVE";
                }
              }

              // Calculate time to maturity
              const maturityTime = tranche.maturityTimestamp;
              const timeToMaturity = maturityTime - now;
              const days = Math.floor(Math.abs(timeToMaturity) / (24 * 60 * 60));
              const hours = Math.floor((Math.abs(timeToMaturity) % (24 * 60 * 60)) / 3600);

              // Create economics from round data
              const economics: RoundEconomics = {
                totalBuyerPurchases: roundInfo.totalBuyerPurchases,
                totalSellerCollateral: roundInfo.totalSellerCollateral,
                matchedAmount: roundInfo.matchedAmount,
                lockedCollateral: 0n, // Not available in Round interface
                premiumPool: 0n // Not available in Round interface
              };

              rounds.push({
                roundId: roundInfo.roundId,
                trancheId: roundInfo.trancheId,
                state: roundInfo.state,
                salesStartTime: roundInfo.salesStartTime,
                salesEndTime: roundInfo.salesEndTime,
                stateName: roundState,
                economics,
                ...(isTriggered !== undefined && {
                  isTriggered,
                  triggerPrice,
                  triggerDirection
                }),
                timeToMaturity: {
                  days,
                  hours,
                  isMatured: timeToMaturity <= 0
                }
              });

            } catch (roundError) {
              console.error(`Error processing round ${roundId}:`, roundError);
            }
          }

          trancheDetails.push({
            trancheId: tranche.trancheId,
            triggerType: tranche.triggerType,
            threshold: tranche.threshold,
            premiumRateBps: tranche.premiumRateBps,
            maturityTimestamp: tranche.maturityTimestamp,
            trancheCap: tranche.trancheCap,
            poolAddress: tranche.poolAddress || ethers.ZeroAddress,
            rounds
          });

        } catch (trancheError) {
          console.error(`Error processing tranche ${trancheId}:`, trancheError);
        }
      }

      console.log(`Processed ${trancheDetails.length} tranches successfully`);
      setTranches(trancheDetails);
    } catch (err) {
      console.error('Error fetching tranche data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch tranche data'));
      setTranches([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when service is available
  useEffect(() => {
    if (service) {
      fetchTrancheData();
    }
  }, [service]); // Only refetch when service changes, not on every BTC price update

  // Update trigger status when BTC price changes (without refetching all data)
  useEffect(() => {
    if (!currentBTCPrice || tranches.length === 0) return;
    
    // Update trigger status for existing tranches
    setTranches(prevTranches => 
      prevTranches.map(tranche => ({
        ...tranche,
        rounds: tranche.rounds.map(round => {
          // Only update trigger status for active/matured rounds
          if (round.state < 2 || round.state > 3) return round;
          
          const triggerPrice = Number(ethers.formatEther(tranche.threshold));
          let isTriggered: boolean | undefined;
          let triggerDirection: string | undefined;
          
          if (tranche.triggerType === 0) { // PRICE_BELOW
            isTriggered = currentBTCPrice <= triggerPrice;
            triggerDirection = "BELOW";
          } else if (tranche.triggerType === 1) { // PRICE_ABOVE
            isTriggered = currentBTCPrice >= triggerPrice;
            triggerDirection = "ABOVE";
          }
          
          return {
            ...round,
            isTriggered,
            triggerPrice,
            triggerDirection
          };
        })
      }))
    );
  }, [currentBTCPrice]); // Only update trigger status when BTC price changes

  return {
    tranches,
    loading,
    error,
    refetch: fetchTrancheData
  };
}