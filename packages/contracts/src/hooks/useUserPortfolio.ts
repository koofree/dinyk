import { Contract, ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import TranchePoolCoreABI from '../config/abis/TranchePoolCore.json';
import { KAIA_RPC_ENDPOINTS } from "../config/constants";
import { useWeb3 } from "../providers/Web3Provider";
import { useContracts } from "./useContracts";

export interface UserInsurancePosition {
  id: string;
  tokenId: number;
  asset: string;
  type: 'insurance';
  tranche: string;
  trancheId: number;
  roundId: number;
  coverage: string;
  premiumPaid: string;
  status: 'active' | 'matured' | 'claimable' | 'expired' | 'claimed';
  expiresIn: number; // days
  currentPrice?: number;
  triggerPrice?: number;
  baseline?: number;
  roundState: string;
  maturityTimestamp: number;
  startTime: Date;
  endTime: Date;
  claimAmount?: string;
}

export interface UserLiquidityPosition {
  id: string;
  asset: string;
  type: 'liquidity';
  tranche: string;
  trancheId: number;
  roundId: number;
  deposited: string;
  shares: string;
  currentValue: string;
  earnedPremium: string;
  stakingRewards: string;
  lockedAmount: string;
  roundStatus: 'active' | 'matured' | 'settled';
  roundState: string;
  daysLeft: number;
  startTime: Date;
  endTime: Date;
  lossAmount?: string;
}

export type UserPosition = UserInsurancePosition | UserLiquidityPosition;

const ROUND_STATES = [
  'ANNOUNCED',
  'OPEN',
  'MATCHED',
  'ACTIVE',
  'MATURED',
  'SETTLED',
  'CANCELED'
];

export function useUserPortfolio() {
  const { account, signer } = useWeb3();
  const { 
    productCatalog, 
    insuranceToken, 
    tranchePoolFactory,
    settlementEngine,
    isInitialized 
  } = useContracts();
  
  const [insurancePositions, setInsurancePositions] = useState<UserInsurancePosition[]>([]);
  const [liquidityPositions, setLiquidityPositions] = useState<UserLiquidityPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create a provider for read-only operations
  const getProvider = useCallback(() => {
    if (signer?.provider) {
      return signer.provider;
    }
    
    return new ethers.JsonRpcProvider(KAIA_RPC_ENDPOINTS[0], {
      chainId: 1001,
      name: 'Kaia Kairos'
    });
  }, [signer]);

  // Fetch user's insurance NFT positions
  const fetchInsurancePositions = useCallback(async () => {
    if (!account || !insuranceToken || !productCatalog || !settlementEngine) return [];

    try {
      const positions: UserInsurancePosition[] = [];
      const provider = getProvider();
      
      // Get user's NFT balance
      const balance = await insuranceToken.balanceOf(account);
      console.log(`User has ${balance} insurance NFTs`);

      // Fetch token IDs owned by user using Transfer events
      const filter = insuranceToken.filters.Transfer(null, account);
      const events = await insuranceToken.queryFilter(filter);
      
      const tokenIds = new Set<number>();
      for (const event of events) {
        if (event.args) {
          const tokenId = Number(event.args[2]);
          try {
            // Verify current ownership
            const currentOwner = await insuranceToken.ownerOf(tokenId);
            if (currentOwner.toLowerCase() === account.toLowerCase()) {
              tokenIds.add(tokenId);
            }
          } catch (e) {
            // Token might be burned or transferred
          }
        }
      }

      console.log(`Found ${tokenIds.size} insurance tokens:`, Array.from(tokenIds));

      // Fetch details for each token
      for (const tokenId of tokenIds) {
        try {
          // Get token info
          const tokenInfo = await insuranceToken.getTokenInfo(tokenId);
          const trancheId = Number(tokenInfo.trancheId);
          const roundId = Number(tokenInfo.roundId);
          
          // Validate IDs
          if (trancheId === 0 || roundId === 0) {
            console.log(`Invalid token info for token ${tokenId}: trancheId=${trancheId}, roundId=${roundId}`);
            continue;
          }
          
          // Get round and tranche details with error handling
          let roundInfo, trancheSpec, product;
          try {
            roundInfo = await productCatalog.getRound(roundId);
          } catch (e) {
            console.log(`Round ${roundId} not found for token ${tokenId}`);
            continue;
          }
          
          try {
            trancheSpec = await productCatalog.getTranche(trancheId);
          } catch (e) {
            console.log(`Tranche ${trancheId} not found for token ${tokenId}`);
            continue;
          }
          
          const productId = Number(trancheSpec.productId);
          try {
            product = await productCatalog.getProduct(productId);
          } catch (e) {
            console.log(`Product ${productId} not found for token ${tokenId}`);
            continue;
          }
          
          // Get pool for premium calculation
          const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
          if (poolAddress !== ethers.ZeroAddress) {
            const pool = new Contract(poolAddress, TranchePoolCoreABI.abi, provider);
            const buyerOrder = await pool.getBuyerOrder(roundId, account);
            
            // Calculate status
            const roundState = Number(roundInfo.state);
            const now = Math.floor(Date.now() / 1000);
            const maturityTime = Number(roundInfo.maturityTimestamp);
            const expiresIn = Math.max(0, Math.ceil((maturityTime - now) / (24 * 60 * 60)));
            
            let status: UserInsurancePosition['status'] = 'active';
            let claimAmount: string | undefined;
            
            if (roundState === 5) { // SETTLED
              // Check if settlement was triggered
              const settlementInfo = await settlementEngine.getSettlementInfo(roundId);
              if (settlementInfo.triggered) {
                // User can claim
                status = 'claimable';
                claimAmount = ethers.formatUnits(buyerOrder.filled, 6);
              } else {
                status = 'expired';
              }
            } else if (roundState === 4) { // MATURED
              status = 'matured';
            } else if (roundState === 3) { // ACTIVE
              status = 'active';
            }

            // Get price information (mock for now, would come from oracle)
            const triggerLevel = Number(trancheSpec.triggerLevel) / 100; // Convert from bps
            const baseline = 45000; // Mock BTC price
            const triggerPrice = baseline * (1 - triggerLevel / 100);
            const currentPrice = 44500; // Mock current price
            
            // Extract asset name safely
            // TODO: how to make the product name more readable?
            const productName = product.name || `Product ${productId}`;
            const assetName = productName.includes(' ') ? productName.split(' ')[0] : productName;

            positions.push({
              id: `nft-${tokenId}`,
              tokenId,
              asset: assetName,
              type: 'insurance',
              tranche: `${productName} -${triggerLevel}% Protection`,
              trancheId,
              productId,
              roundId,
              coverage: ethers.formatUnits(tokenInfo.purchaseAmount, 6),
              premiumPaid: ethers.formatUnits(buyerOrder.premiumPaid, 6),
              status,
              expiresIn,
              currentPrice,
              triggerPrice,
              baseline,
              roundState: ROUND_STATES[roundState] || 'UNKNOWN',
              maturityTimestamp: maturityTime * 1000,
              startTime: new Date(Number(roundInfo.salesStartTime) * 1000),
              endTime: new Date(Number(roundInfo.maturityTimestamp) * 1000),
              claimAmount
            });
          }
        } catch (error) {
          console.error(`Error fetching token ${tokenId}:`, error);
        }
      }

      return positions;
    } catch (error) {
      console.error("Error fetching insurance positions:", error);
      return [];
    }
  }, [account, insuranceToken, productCatalog, settlementEngine, tranchePoolFactory, getProvider]);

  // Fetch user's liquidity positions
  const fetchLiquidityPositions = useCallback(async () => {
    if (!account || !productCatalog || !tranchePoolFactory) return [];

    const positions: UserLiquidityPosition[] = [];
    
    try {
      const provider = getProvider();
      
      // Try a simple approach: just check known product IDs 1-3
      const productIds = [1, 2, 3];
      console.log(`Checking products: ${productIds.join(', ')}`);
      
      for (const productId of productIds) {
        try {
          console.log(`Checking product ${productId}...`);
          const product = await productCatalog.getProduct(productId);
          
          // Skip if product doesn't exist or is inactive
          if (!product) {
            console.log(`Product ${productId} doesn't exist`);
            continue;
          }
          
          const isActive = product.active !== undefined ? product.active : product.enabled;
          if (!isActive) {
            console.log(`Product ${productId} is not active`);
            continue;
          }
          
          // Get tranches for this product
          let trancheIds = [];
          try {
            trancheIds = await productCatalog.getProductTranches(productId);
          } catch (e) {
            console.log(`No tranches found for product ${productId}`);
            continue;
          }
          
          // Skip if no tranches
          if (!trancheIds || trancheIds.length === 0) {
            console.log(`Product ${productId} has no tranches`);
            continue;
          }
          
          for (const trancheIdBN of trancheIds) {
            const trancheId = Number(trancheIdBN);
            
            try {
              console.log(`Checking tranche ${trancheId}...`);
              
              // Get tranche details
              const trancheSpec = await productCatalog.getTranche(trancheId);
              if (!trancheSpec) continue;
              
              // Get pool address
              const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
              if (poolAddress === ethers.ZeroAddress) {
                console.log(`No pool for tranche ${trancheId}`);
                continue;
              }
              
              console.log(`Found pool at ${poolAddress} for tranche ${trancheId}`);
              const pool = new Contract(poolAddress, TranchePoolCoreABI.abi, provider);
              
              // Skip event checking for now - just check rounds directly
              const triggerLevel = Number(trancheSpec.triggerLevel) / 100;
                
              // Get active rounds for this tranche
              let roundIds = [];
              try {
                roundIds = await productCatalog.getTrancheRounds(trancheId);
                console.log(`Found ${roundIds.length} rounds for tranche ${trancheId}:`, roundIds.map(id => Number(id)));
              } catch (e) {
                console.log(`No rounds found for tranche ${trancheId}`);
                continue;
              }
              
              // Skip if no rounds
              if (!roundIds || roundIds.length === 0) {
                console.log(`Tranche ${trancheId} has no rounds`);
                continue;
              }
              
              for (const roundIdBN of roundIds) {
                const roundId = Number(roundIdBN);
                console.log(`Processing round ${roundId} for tranche ${trancheId}`);
                
                try {
                  const roundInfo = await productCatalog.getRound(roundId);
                  const roundState = Number(roundInfo.state);
                  
                  // Check if user has a position in this round
                  // getSellerPosition takes (roundId, sellerAddress) as parameters
                  let sellerPosition;
                  try {
                    sellerPosition = await pool.getSellerPosition(roundId, account);
                    console.log(`Got seller position for round ${roundId}, account ${account}`);
                  } catch (err) {
                    console.log(`Error getting seller position for round ${roundId}, account ${account}:`, err);
                    // Try alternative: check if there's a different method or if parameters are reversed
                    try {
                      sellerPosition = await pool.sellerPositions(roundId, account);
                      console.log(`Got seller position via sellerPositions mapping`);
                    } catch (err2) {
                      console.log(`Also failed with sellerPositions:`, err2);
                      continue;
                    }
                  }
                  
                  console.log(`Checking seller position for round ${roundId} in tranche ${trancheId}:`, {
                    collateralAmount: sellerPosition?.collateralAmount?.toString() || '0',
                    sharesMinted: sellerPosition?.sharesMinted?.toString() || '0',
                    filledCollateral: sellerPosition?.filledCollateral?.toString() || '0',
                    lockedSharesAssigned: sellerPosition?.lockedSharesAssigned?.toString() || '0',
                    account,
                    rawPosition: sellerPosition
                  });
                  
                  // Use sharesMinted as the correct field name from the contract
                  const sharesAmount = sellerPosition?.sharesMinted || 0n;
                  const collateralAmount = sellerPosition?.collateralAmount || 0n;
                  
                  if (collateralAmount > 0n || sharesAmount > 0n) {
                    console.log(`Found liquidity position in round ${roundId}`);
                    // Calculate NAV and current value
                    const poolAccounting = await pool.getPoolAccounting();
                    const navPerShare = poolAccounting.navPerShare;
                    const currentValue = (sharesAmount * navPerShare) / ethers.parseUnits("1", 18);
                    
                    // Calculate days left
                    const now = Math.floor(Date.now() / 1000);
                    const maturityTime = Number(roundInfo.maturityTimestamp);
                    const daysLeft = Math.max(0, Math.ceil((maturityTime - now) / (24 * 60 * 60)));
                    
                    // Determine status
                    let roundStatus: UserLiquidityPosition['roundStatus'] = 'active';
                    if (roundState === 5) roundStatus = 'settled';
                    else if (roundState === 4) roundStatus = 'matured';
                    
                    // Calculate earned premium (simplified)
                    // Use the initial collateral amount as deposited
                    const depositedAmount = collateralAmount;
                    const earnedPremium = currentValue > depositedAmount 
                      ? currentValue - depositedAmount 
                      : 0n;
                    
                    // Extract asset name safely
                    const productName = product.name || `Product ${productId}`;
                    const assetName = productName.includes(' ') ? productName.split(' ')[0] : productName;
                    
                    positions.push({
                      id: `lp-${trancheId}-${roundId}`,
                      asset: assetName,
                      type: 'liquidity',
                      tranche: `${productName} -${triggerLevel}% Tranche Pool`,
                      trancheId,
                      productId,
                      roundId,
                      deposited: ethers.formatUnits(depositedAmount, 6),
                      shares: ethers.formatUnits(sharesAmount, 18),
                      currentValue: ethers.formatUnits(currentValue, 6),
                      earnedPremium: ethers.formatUnits(earnedPremium, 6),
                      stakingRewards: "0", // TODO: Implement staking rewards calculation
                      lockedAmount: ethers.formatUnits(sellerPosition?.lockedSharesAssigned || 0n, 18),
                      roundStatus,
                      roundState: ROUND_STATES[roundState] || 'UNKNOWN',
                      daysLeft,
                      startTime: new Date(Number(roundInfo.salesStartTime) * 1000),
                      endTime: new Date(Number(roundInfo.maturityTimestamp) * 1000),
                      lossAmount: earnedPremium < 0n ? ethers.formatUnits(-earnedPremium, 6) : undefined
                    });
                  }
                } catch (roundError) {
                  console.error(`Error processing round ${roundId}:`, roundError);
                }
              }
            } catch (error) {
              console.error(`Error fetching tranche ${trancheId} for product ${productId}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error fetching product ${productId}:`, error);
        }
      }
      
      return positions;
    } catch (error) {
      console.error("Error fetching liquidity positions:", error);
      return positions; // Return what we have so far
    }
  }, [account, productCatalog, tranchePoolFactory, getProvider]);

  // Fetch all positions
  const fetchAllPositions = useCallback(async () => {
    if (!isInitialized || !account) {
      console.log("Skipping fetch: not initialized or no account");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching portfolio for account:", account);
      
      const [insurance, liquidity] = await Promise.all([
        fetchInsurancePositions(),
        fetchLiquidityPositions()
      ]);
      
      console.log("Fetched positions:", {
        insurance: insurance.length,
        liquidity: liquidity.length
      });
      
      setInsurancePositions(insurance);
      setLiquidityPositions(liquidity);
    } catch (error: any) {
      console.error("Error fetching portfolio:", error);
      setError(error.message || "Failed to fetch portfolio");
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, account, fetchInsurancePositions, fetchLiquidityPositions]);

  // Claim insurance payout
  const claimInsurance = useCallback(async (positionId: string) => {
    const position = insurancePositions.find(p => p.id === positionId);
    if (!position || !signer || !tranchePoolFactory) {
      throw new Error("Position not found or contracts not initialized");
    }

    try {
      const poolAddress = await tranchePoolFactory.getTranchePool(position.trancheId);
      const pool = new Contract(poolAddress, TranchePoolCoreABI.abi, signer);
      
      const tx = await pool.claimBuyerPayout(position.roundId);
      await tx.wait();
      
      // Refresh positions
      await fetchAllPositions();
      
      return tx;
    } catch (error) {
      console.error("Error claiming insurance:", error);
      throw error;
    }
  }, [insurancePositions, signer, tranchePoolFactory, fetchAllPositions]);

  // Withdraw liquidity
  const withdrawLiquidity = useCallback(async (positionId: string) => {
    const position = liquidityPositions.find(p => p.id === positionId);
    if (!position || !signer || !tranchePoolFactory) {
      throw new Error("Position not found or contracts not initialized");
    }

    try {
      const poolAddress = await tranchePoolFactory.getTranchePool(position.trancheId);
      const pool = new Contract(poolAddress, TranchePoolCoreABI.abi, signer);
      
      // Withdraw shares
      const shares = ethers.parseUnits(position.shares, 18);
      const tx = await pool.withdraw(shares, account, account);
      await tx.wait();
      
      // Refresh positions
      await fetchAllPositions();
      
      return tx;
    } catch (error) {
      console.error("Error withdrawing liquidity:", error);
      throw error;
    }
  }, [liquidityPositions, signer, tranchePoolFactory, account, fetchAllPositions]);

  // Auto-fetch on account/contract changes
  useEffect(() => {
    fetchAllPositions();
  }, [fetchAllPositions]);

  // Calculate portfolio summary
  const portfolioSummary = {
    totalInsuranceCoverage: insurancePositions.reduce(
      (sum, pos) => sum + parseFloat(pos.coverage || '0'), 
      0
    ),
    totalLiquidityValue: liquidityPositions.reduce(
      (sum, pos) => sum + parseFloat(pos.currentValue || '0'), 
      0
    ),
    totalEarnings: liquidityPositions.reduce(
      (sum, pos) => sum + parseFloat(pos.earnedPremium || '0') + parseFloat(pos.stakingRewards || '0'), 
      0
    ),
    activeInsuranceCount: insurancePositions.length,
    claimableInsuranceCount: insurancePositions.length,
    activeLiquidityCount: liquidityPositions.length
  };

  return {
    insurancePositions,
    liquidityPositions,
    portfolioSummary,
    isLoading,
    error,
    refetch: fetchAllPositions,
    claimInsurance,
    withdrawLiquidity
  };
}