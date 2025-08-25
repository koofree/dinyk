import { Contract, ethers } from "ethers";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import TranchePoolCoreABI from '../config/abis/TranchePoolCore.json';
import { useWeb3 } from "../providers/Web3Provider";
import { useContracts } from "./useContracts";

export interface DepositCollateralParams {
  roundId: number;
  collateralAmount: string; // in USDT
}

export interface SellerPosition {
  collateralAmount: bigint;
  sharesIssued: bigint;
  filledCollateral: bigint;
  lockedSharesAssigned: bigint;
}

export interface PoolAccounting {
  totalAssets: bigint;
  lockedAssets: bigint;
  totalShares: bigint;
  navPerShare: bigint;
}

export interface YieldAnalysis {
  maturityDays: number;
  premiumRate: number; // percentage
  annualizedYield: number; // percentage
  expectedReturn: bigint; // in USDT
}

export function useSellerOperations() {
  const { signer, account } = useWeb3();
  const { productCatalog, tranchePoolFactory, usdt, isInitialized } = useContracts();
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);

  // Get a provider for read-only operations
  const getProvider = useCallback(() => {
    // If we have a signer, use its provider
    if (signer?.provider) {
      return signer.provider;
    }
    
    // Otherwise, create a read-only provider
    return new ethers.JsonRpcProvider('https://public-en-kairos.node.kaia.io', {
      chainId: 1001,
      name: 'Kaia Kairos'
    });
  }, [signer]);

  // Calculate potential yield for a collateral amount
  const calculateYield = useCallback(
    async (
      trancheId: number,
      collateralAmount: string,
    ): Promise<YieldAnalysis> => {
      if (!productCatalog) throw new Error("Product catalog not initialized");

      try {
        const trancheSpec = await productCatalog.getTranche(trancheId);
        const premiumRateBps = Number(trancheSpec.premiumRateBps);
        const premiumRate = premiumRateBps / 100;

        const now = Math.floor(Date.now() / 1000);
        const maturityTime = Number(trancheSpec.maturityTimestamp);
        const maturityDays = Math.max((maturityTime - now) / (24 * 60 * 60), 1);
        const annualizedYield = premiumRate * (365 / maturityDays);

        const collateralAmountWei = ethers.parseUnits(collateralAmount, 6);
        const expectedReturn =
          (collateralAmountWei * BigInt(premiumRateBps)) / 10000n;

        return {
          maturityDays,
          premiumRate,
          annualizedYield,
          expectedReturn,
        };
      } catch (error) {
        console.error("Error calculating yield:", error);
        throw error;
      }
    },
    [productCatalog],
  );

  // Deposit collateral to provide liquidity
  const depositCollateral = useCallback(
    async (params: DepositCollateralParams) => {
      if (
        !signer ||
        !account ||
        !productCatalog ||
        !tranchePoolFactory ||
        !usdt
      ) {
        throw new Error("Web3 not initialized");
      }

      setIsLoading(true);
      try {
        // Get round info
        const roundInfo = await productCatalog.getRound(params.roundId);
        const trancheId = Number(roundInfo.trancheId);
        const roundState = Number(roundInfo.state);

        // Validate round state
        if (roundState !== 1) {
          // Not OPEN
          const stateNames = [
            "ANNOUNCED",
            "OPEN",
            "MATCHED",
            "ACTIVE",
            "MATURED",
            "SETTLED",
            "CANCELED",
          ];
          throw new Error(
            `Round is not open for deposits (state: ${stateNames[roundState]})`,
          );
        }

        // Check sales period
        const now = Math.floor(Date.now() / 1000);
        if (now < Number(roundInfo.salesStartTime)) {
          throw new Error("Sales period has not started yet");
        }
        if (now > Number(roundInfo.salesEndTime)) {
          throw new Error("Sales period has ended");
        }

        // Get tranche details
        const trancheSpec = await productCatalog.getTranche(trancheId);

        // Calculate yield info
        const yieldAnalysis = await calculateYield(
          trancheId,
          params.collateralAmount,
        );

        console.log("Deposit details:", {
          collateral: params.collateralAmount,
          maturityDays: yieldAnalysis.maturityDays.toFixed(1),
          premiumRate: `${yieldAnalysis.premiumRate}%`,
          annualizedYield: `${yieldAnalysis.annualizedYield.toFixed(2)}%`,
          expectedReturn: ethers.formatUnits(yieldAnalysis.expectedReturn, 6),
        });

        // Convert amount to wei
        const collateralAmountWei = ethers.parseUnits(
          params.collateralAmount,
          6,
        );

        // Check USDT balance
        const balance = await usdt.balanceOf(account);
        if (balance < collateralAmountWei) {
          throw new Error(
            `Insufficient USDT balance. Need ${params.collateralAmount} USDT`,
          );
        }

        // Get pool address
        const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
        if (poolAddress === ethers.ZeroAddress) {
          throw new Error(`No pool found for tranche ${trancheId}`);
        }

        // Get pool contract
        const pool = new Contract(
          poolAddress,
          TranchePoolCoreABI.abi,
          signer,
        );

        // Get pool accounting before deposit
        const accountingBefore = await pool.getPoolAccounting();
        const shareBalanceBefore = await pool.shareBalances(account);

        // Approve USDT if needed
        setIsPreparing(true);
        const currentAllowance = await usdt.allowance(account, poolAddress);
        if (currentAllowance < collateralAmountWei) {
          console.log("Approving USDT...");

          // Reset to zero first if needed
          if (currentAllowance > 0n) {
            const resetTx = await usdt.connect(signer).approve(poolAddress, 0);
            await resetTx.wait();
          }

          const approveTx = await usdt
            .connect(signer)
            .approve(poolAddress, collateralAmountWei);
          await approveTx.wait();
          toast.success("USDT approved");
        }
        setIsPreparing(false);

        // Deposit collateral
        console.log("Depositing collateral...");
        const tx = await pool.depositCollateral(
          params.roundId,
          collateralAmountWei,
        );

        toast.promise(tx.wait(), {
          loading: `Depositing $${params.collateralAmount} collateral...`,
          success: "Collateral deposited successfully!",
          error: "Failed to deposit collateral",
        });

        const receipt = await tx.wait();

        // Get shares minted
        const shareBalanceAfter = await pool.shareBalances(account);
        const sharesMinted = shareBalanceAfter - shareBalanceBefore;

        if (sharesMinted > 0n) {
          toast.success(`Minted ${ethers.formatEther(sharesMinted)} shares`);
        }

        return receipt;
      } catch (error: any) {
        console.error("Error depositing collateral:", error);
        toast.error(error.message);
        throw error;
      } finally {
        setIsLoading(false);
        setIsPreparing(false);
      }
    },
    [signer, account, productCatalog, tranchePoolFactory, usdt, calculateYield],
  );

  // Get seller's position for a round
  const getSellerPosition = useCallback(
    async (
      roundId: number,
      seller?: string,
    ): Promise<SellerPosition | null> => {
      if (!productCatalog || !tranchePoolFactory) {
        throw new Error("Contracts not initialized");
      }

      const sellerAddress = seller || account;
      if (!sellerAddress) return null;

      try {
        // Get round info to find tranche
        const roundInfo = await productCatalog.getRound(roundId);
        const trancheId = Number(roundInfo.trancheId);

        // Get pool
        const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
        if (poolAddress === ethers.ZeroAddress) return null;

        const pool = new Contract(poolAddress, TranchePoolCoreABI.abi, signer);
        const position = await pool.getSellerPosition(roundId, sellerAddress);

        return {
          collateralAmount: position.collateralAmount,
          sharesIssued: position.sharesIssued,
          filledCollateral: position.filledCollateral || 0n,
          lockedSharesAssigned: position.lockedSharesAssigned || 0n,
        };
      } catch (error) {
        console.error("Error fetching seller position:", error);
        return null;
      }
    },
    [productCatalog, tranchePoolFactory, account, signer],
  );

  // Get seller's share balance
  const getSellerShareBalance = useCallback(
    async (trancheId: number, seller?: string): Promise<bigint> => {
      const sellerAddress = seller || account;
      if (!sellerAddress || !tranchePoolFactory) return 0n;

      try {
        const poolAddress = await tranchePoolFactory.getTranchePool(Number(trancheId));
        if (poolAddress === ethers.ZeroAddress) return 0n;

        const pool = new Contract(poolAddress, TranchePoolCoreABI.abi, getProvider());

        // Get share balance
        const balance = await pool.balanceOf(sellerAddress);
        return balance;
      } catch (error) {
        console.error("Error fetching seller share balance:", error);
        return 0n;
      }
    },
    [tranchePoolFactory, account, getProvider],
  );

  // Withdraw available collateral
  const withdrawCollateral = useCallback(
    async (trancheId: number, amount: string) => {
      if (!tranchePoolFactory || !signer || !account) {
        throw new Error("Not initialized");
      }

      setIsLoading(true);
      try {
        // Get pool
        const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
        if (poolAddress === ethers.ZeroAddress) {
          throw new Error(`No pool found for tranche ${trancheId}`);
        }

        const pool = new Contract(
          poolAddress,
          TranchePoolCoreABI.abi,
          signer,
        );

        // Check available amount
        const available = await pool.getAvailableCollateral(account);
        const withdrawAmount = ethers.parseUnits(amount, 6);

        if (withdrawAmount > available) {
          throw new Error(
            `Insufficient available collateral. Max: ${ethers.formatUnits(available, 6)} USDT`,
          );
        }

        // Calculate shares to burn
        const accounting = await pool.getPoolAccounting();
        const sharesToBurn =
          (withdrawAmount * ethers.parseEther("1")) / accounting.navPerShare;

        console.log("Withdrawing collateral:", {
          amount: ethers.formatUnits(withdrawAmount, 6),
          sharesToBurn: ethers.formatEther(sharesToBurn),
        });

        // Withdraw
        const tx = await pool.withdrawCollateral(sharesToBurn);

        toast.promise(tx.wait(), {
          loading: `Withdrawing $${amount}...`,
          success: `Withdrawn $${amount} successfully!`,
          error: "Failed to withdraw collateral",
        });

        const receipt = await tx.wait();
        return receipt;
      } catch (error: any) {
        console.error("Error withdrawing collateral:", error);
        toast.error(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [tranchePoolFactory, signer, account],
  );

  // Get pool accounting info
  const getPoolAccounting = useCallback(
    async (trancheId: number): Promise<PoolAccounting | null> => {
      console.log("getPoolAccounting called with trancheId:", trancheId);
      console.log("tranchePoolFactory available:", !!tranchePoolFactory);
      console.log("provider available:", !!getProvider());
      
      if (!tranchePoolFactory || !getProvider()) {
        console.error("Contracts not initialized - tranchePoolFactory:", !!tranchePoolFactory, "provider:", !!getProvider());
        throw new Error("Contracts not initialized");
      }

      try {
        console.log("Getting pool address for tranche:", trancheId);
        const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
        console.log("Pool address:", poolAddress);
        
        if (poolAddress === ethers.ZeroAddress) {
          console.log("No pool found for tranche:", trancheId);
          return null;
        }

        console.log("Creating pool contract with address:", poolAddress);
        const pool = new Contract(poolAddress, TranchePoolCoreABI.abi, getProvider());
        console.log("Calling pool.getPoolAccounting()");
        const accounting = await pool.getPoolAccounting();
        console.log("Pool accounting result:", accounting);

        return {
          totalAssets: accounting.totalAssets,
          lockedAssets: accounting.lockedAssets,
          totalShares: accounting.totalShares,
          navPerShare: accounting.navPerShare,
        };
      } catch (error) {
        console.error("Error fetching pool accounting:", error);
        return null;
      }
    },
    [tranchePoolFactory, getProvider],
  );

  // Claim premium earnings (after settlement)
  const claimPremiums = useCallback(
    async (roundId: number) => {
      if (!productCatalog || !tranchePoolFactory || !signer || !account) {
        throw new Error("Not initialized");
      }

      setIsLoading(true);
      try {
        // Get round info
        const roundInfo = await productCatalog.getRound(roundId);
        const trancheId = Number(roundInfo.trancheId);
        const roundState = Number(roundInfo.state);

        // Check if round is settled
        if (roundState !== 5) {
          // Not SETTLED
          throw new Error("Round is not settled yet");
        }

        // Get pool
        const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
        const pool = new Contract(
          poolAddress,
          TranchePoolCoreABI.abi,
          signer,
        );

        // Get seller position
        const position = await pool.getSellerPosition(roundId, account);

        if (position.filledCollateral === 0n) {
          throw new Error("No filled collateral to claim");
        }

        // Claim premiums
        console.log("Claiming premiums for round:", roundId);
        const tx = await pool.claimSellerPremiums(roundId);

        toast.promise(tx.wait(), {
          loading: "Claiming premium earnings...",
          success: "Premiums claimed successfully!",
          error: "Failed to claim premiums",
        });

        const receipt = await tx.wait();
        return receipt;
      } catch (error: any) {
        console.error("Error claiming premiums:", error);
        toast.error(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [productCatalog, tranchePoolFactory, signer, account],
  );

  // Get seller's active positions across all rounds
  const getActivePositions = useCallback(
    async (seller?: string) => {
      const sellerAddress = seller || account;
      if (!sellerAddress || !productCatalog || !tranchePoolFactory) return [];

      try {
        // Get all active tranches
        const activeTranches = await productCatalog.getActiveTranches();
        const positions = [];

        for (const trancheId of activeTranches) {
          const rounds = await productCatalog.getTrancheRounds(trancheId);

          for (const roundId of rounds) {
            const roundInfo = await productCatalog.getRound(roundId);
            const roundState = Number(roundInfo.state);

            // Include OPEN, ACTIVE, MATURED states
            if (roundState >= 1 && roundState <= 4) {
              const position = await getSellerPosition(
                Number(roundId),
                sellerAddress,
              );

              if (position && position.collateralAmount > 0n) {
                const trancheSpec = await productCatalog.getTranche(
                  Number(trancheId),
                );

                positions.push({
                  roundId: Number(roundId),
                  trancheId: Number(trancheId),
                  collateralAmount: position.collateralAmount,
                  sharesIssued: position.sharesIssued,
                  filledCollateral: position.filledCollateral,
                  lockedSharesAssigned: position.lockedSharesAssigned,
                  premiumRate: Number(trancheSpec.premiumRateBps) / 100,
                  maturityTime: trancheSpec.maturityTimestamp,
                  state: roundState,
                });
              }
            }
          }
        }

        return positions;
      } catch (error) {
        console.error("Error fetching active positions:", error);
        return [];
      }
    },
    [account, productCatalog, tranchePoolFactory, getSellerPosition],
  );

  return {
    // Deposit functions
    depositCollateral,
    calculateYield,

    // Query functions
    getSellerPosition,
    getShareBalance: getSellerShareBalance,
    getPoolAccounting,
    getActivePositions,

    // Withdrawal functions
    withdrawCollateral,
    claimPremiums,

    // State
    isLoading,
    isPreparing,
  };
}
