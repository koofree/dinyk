import { ethers, Contract } from "ethers";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { useWeb3 } from "../providers/Web3Provider";
import { useContracts } from "./useContracts";
import TranchePoolCoreABI from '../config/abis/TranchePoolCore.json';

export interface BuyInsuranceParams {
  roundId: number;
  coverageAmount: string; // in USDT
}

export interface BuyerOrder {
  purchaseAmount: bigint;
  premiumPaid: bigint;
  filled: bigint;
  refunded: bigint;
}

export interface InsuranceTokenInfo {
  tokenId: bigint;
  trancheId: number;
  roundId: number;
  purchaseAmount: bigint;
  originalBuyer: string;
}

export interface PurchaseCalculation {
  coverageAmount: bigint;
  premiumAmount: bigint;
  totalCost: bigint;
  premiumRate: number; // in basis points
  premiumRatePercent: string;
}

export function useBuyerOperations() {
  const { signer, account } = useWeb3();
  const { productCatalog, tranchePoolFactory, usdt, insuranceToken } =
    useContracts();
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);

  // Calculate premium for a coverage amount
  const calculatePremium = useCallback(
    async (
      trancheId: number,
      coverageAmount: string,
    ): Promise<PurchaseCalculation> => {
      if (!productCatalog) throw new Error("Product catalog not initialized");

      try {
        const trancheSpec = await productCatalog.getTranche(trancheId);
        const premiumRateBps = Number(trancheSpec.premiumRateBps);

        const coverageAmountWei = ethers.parseUnits(coverageAmount, 6);
        const premiumAmount =
          (coverageAmountWei * BigInt(premiumRateBps)) / 10000n;
        const totalCost = coverageAmountWei + premiumAmount;

        return {
          coverageAmount: coverageAmountWei,
          premiumAmount,
          totalCost,
          premiumRate: premiumRateBps,
          premiumRatePercent: `${premiumRateBps / 100}%`,
        };
      } catch (error) {
        console.error("Error calculating premium:", error);
        throw error;
      }
    },
    [productCatalog],
  );

  // Main buy insurance function
  const buyInsurance = useCallback(
    async (params: BuyInsuranceParams) => {
      if (
        !signer ||
        !account ||
        !productCatalog ||
        !tranchePoolFactory ||
        !usdt ||
        !insuranceToken
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
            `Round is not open for purchases (state: ${stateNames[roundState]})`,
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

        // Calculate costs
        const calculation = await calculatePremium(
          trancheId,
          params.coverageAmount,
        );

        // Validate against min/max
        if (calculation.coverageAmount < trancheSpec.perAccountMin) {
          throw new Error(
            `Coverage amount below minimum: ${ethers.formatUnits(trancheSpec.perAccountMin, 6)} USDT`,
          );
        }
        if (calculation.coverageAmount > trancheSpec.perAccountMax) {
          throw new Error(
            `Coverage amount above maximum: ${ethers.formatUnits(trancheSpec.perAccountMax, 6)} USDT`,
          );
        }

        console.log("Purchase details:", {
          coverage: ethers.formatUnits(calculation.coverageAmount, 6),
          premium: ethers.formatUnits(calculation.premiumAmount, 6),
          total: ethers.formatUnits(calculation.totalCost, 6),
          premiumRate: calculation.premiumRatePercent,
        });

        // Check USDT balance
        const balance = await usdt.balanceOf(account);
        if (balance < calculation.totalCost) {
          throw new Error(
            `Insufficient USDT balance. Need ${ethers.formatUnits(calculation.totalCost, 6)} USDT`,
          );
        }

        // Get pool address
        const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
        if (poolAddress === ethers.ZeroAddress) {
          throw new Error(`No pool found for tranche ${trancheId}`);
        }

        // Approve USDT if needed
        setIsPreparing(true);
        const currentAllowance = await usdt.allowance(account, poolAddress);
        if (currentAllowance < calculation.totalCost) {
          console.log("Approving USDT...");

          // Reset to zero first if needed (for tokens like USDT that require it)
          if (currentAllowance > 0n) {
            const resetTx = await usdt.connect(signer).approve(poolAddress, 0);
            await resetTx.wait();
          }

          const approveTx = await usdt
            .connect(signer)
            .approve(poolAddress, calculation.totalCost);
          await approveTx.wait();
          toast.success("USDT approved");
        }
        setIsPreparing(false);

        // Get insurance token balance before purchase
        const tokenBalanceBefore = await insuranceToken.balanceOf(account);

        // Place buyer order
        const pool = new Contract(
          poolAddress,
          TranchePoolCoreABI.abi,
          signer,
        );
        
        // Log details before the transaction
        console.log("Placing buyer order with:", {
          poolAddress,
          roundId: params.roundId,
          coverageAmount: ethers.formatUnits(calculation.coverageAmount, 6),
          totalCost: ethers.formatUnits(calculation.totalCost, 6),
          premium: ethers.formatUnits(calculation.premiumAmount, 6),
          account,
          allowance: ethers.formatUnits(currentAllowance, 6),
        });
        
        // Check user's USDT balance
        const userBalance = await usdt.balanceOf(account);
        console.log("User USDT balance:", ethers.formatUnits(userBalance, 6));
        
        if (userBalance < calculation.totalCost) {
          throw new Error(`Insufficient USDT balance. Need ${ethers.formatUnits(calculation.totalCost, 6)} USDT, have ${ethers.formatUnits(userBalance, 6)} USDT`);
        }
        
        // Use manual gas limit instead of estimation
        const tx = await pool.placeBuyerOrder(
          params.roundId,
          calculation.coverageAmount,
          {
            gasLimit: 500000n, // Manual gas limit
          }
        );

        toast.promise(tx.wait(), {
          loading: `Purchasing $${params.coverageAmount} coverage...`,
          success: "Insurance purchased successfully!",
          error: "Failed to purchase insurance",
        });

        const receipt = await tx.wait();

        // Check if new token was minted
        const tokenBalanceAfter = await insuranceToken.balanceOf(account);
        if (tokenBalanceAfter > tokenBalanceBefore) {
          toast.success(
            `Insurance NFT minted! (${tokenBalanceAfter - tokenBalanceBefore} token${tokenBalanceAfter - tokenBalanceBefore > 1n ? "s" : ""})`,
          );
        }

        return receipt;
      } catch (error: any) {
        console.error("Error buying insurance:", error);
        toast.error(error.message);
        throw error;
      } finally {
        setIsLoading(false);
        setIsPreparing(false);
      }
    },
    [
      signer,
      account,
      productCatalog,
      tranchePoolFactory,
      usdt,
      insuranceToken,
      calculatePremium,
    ],
  );

  // Get buyer's order for a round
  const getBuyerOrder = useCallback(
    async (roundId: number, buyer?: string): Promise<BuyerOrder | null> => {
      if (!productCatalog || !tranchePoolFactory) {
        throw new Error("Contracts not initialized");
      }

      const buyerAddress = buyer || account;
      if (!buyerAddress) return null;

      try {
        // Get round info to find tranche
        const roundInfo = await productCatalog.getRound(roundId);
        const trancheId = Number(roundInfo.trancheId);

        // Get pool
        const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
        if (poolAddress === ethers.ZeroAddress) return null;

        const pool = new Contract(poolAddress, TranchePoolCoreABI, provider);
        const order = await pool.getBuyerOrder(roundId, buyerAddress);

        return {
          purchaseAmount: order.purchaseAmount,
          premiumPaid: order.premiumPaid,
          filled: order.filled,
          refunded: order.refunded,
        };
      } catch (error) {
        console.error("Error fetching buyer order:", error);
        return null;
      }
    },
    [productCatalog, tranchePoolFactory, account],
  );

  // Get buyer's insurance tokens with details
  const getBuyerTokens = useCallback(
    async (buyer?: string): Promise<InsuranceTokenInfo[]> => {
      if (!insuranceToken) {
        throw new Error("Insurance token contract not initialized");
      }

      const buyerAddress = buyer || account;
      if (!buyerAddress) return [];

      try {
        const balance = await insuranceToken.balanceOf(buyerAddress);
        const tokens: InsuranceTokenInfo[] = [];

        // Note: This is a simplified approach for non-enumerable ERC721
        // In production, you'd want to use events or an indexer
        // Try to find tokens by checking recent token IDs
        const maxTokenId = 1000; // Reasonable limit for testing

        for (
          let i = 1;
          i <= maxTokenId && tokens.length < Number(balance);
          i++
        ) {
          try {
            const owner = await insuranceToken.ownerOf(i);
            if (owner.toLowerCase() === buyerAddress.toLowerCase()) {
              const tokenInfo = await insuranceToken.getTokenInfo(i);
              tokens.push({
                tokenId: BigInt(i),
                trancheId: Number(tokenInfo.trancheId),
                roundId: Number(tokenInfo.roundId),
                purchaseAmount: tokenInfo.purchaseAmount,
                originalBuyer: tokenInfo.originalBuyer,
              });
            }
          } catch {
            // Token doesn't exist or other error, continue
          }
        }

        return tokens;
      } catch (error) {
        console.error("Error fetching buyer tokens:", error);
        return [];
      }
    },
    [insuranceToken, account],
  );

  // Check if buyer can claim payout
  const checkClaimStatus = useCallback(
    async (
      roundId: number,
    ): Promise<{
      canClaim: boolean;
      triggered: boolean;
      settled: boolean;
      payoutAmount: bigint;
    }> => {
      if (!productCatalog || !tranchePoolFactory || !account) {
        throw new Error("Not initialized");
      }

      try {
        // Get round info
        const roundInfo = await productCatalog.getRound(roundId);
        const trancheId = Number(roundInfo.trancheId);
        const roundState = Number(roundInfo.state);

        // Check if round is settled
        const settled = roundState === 5; // SETTLED state

        if (!settled) {
          return {
            canClaim: false,
            triggered: false,
            settled: false,
            payoutAmount: 0n,
          };
        }

        // Get pool to check buyer order
        const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
        const pool = new Contract(poolAddress, TranchePoolCoreABI, provider);

        const buyerOrder = await pool.getBuyerOrder(roundId, account);

        // Check if settlement was triggered (would need to check SettlementEngine)
        // For now, assume triggered if buyer has filled amount
        const triggered = buyerOrder.filled > 0n;
        const canClaim = triggered && settled && buyerOrder.filled > 0n;
        const payoutAmount = buyerOrder.filled; // Full coverage amount if triggered

        return {
          canClaim,
          triggered,
          settled,
          payoutAmount,
        };
      } catch (error) {
        console.error("Error checking claim status:", error);
        return {
          canClaim: false,
          triggered: false,
          settled: false,
          payoutAmount: 0n,
        };
      }
    },
    [productCatalog, tranchePoolFactory, account],
  );

  // Claim insurance payout (if triggered and settled)
  const claimPayout = useCallback(
    async (roundId: number) => {
      if (!productCatalog || !tranchePoolFactory || !signer || !account) {
        throw new Error("Not initialized");
      }

      setIsLoading(true);
      try {
        const status = await checkClaimStatus(roundId);

        if (!status.canClaim) {
          throw new Error("No payout available for this round");
        }

        // Get pool
        const roundInfo = await productCatalog.getRound(roundId);
        const trancheId = Number(roundInfo.trancheId);
        const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
        const pool = new Contract(
          poolAddress,
          TranchePoolCoreABI,
          signer,
        );

        // Claim payout
        console.log("Claiming payout for round:", roundId);
        const tx = await pool.claimBuyerPayout(roundId);

        toast.promise(tx.wait(), {
          loading: "Claiming insurance payout...",
          success: `Payout claimed: $${ethers.formatUnits(status.payoutAmount, 6)}`,
          error: "Failed to claim payout",
        });

        const receipt = await tx.wait();
        return receipt;
      } catch (error: any) {
        console.error("Error claiming payout:", error);
        toast.error(error.message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [productCatalog, tranchePoolFactory, signer, account, checkClaimStatus],
  );

  // Get buyer's active insurances
  const getActiveInsurances = useCallback(
    async (buyer?: string) => {
      const buyerAddress = buyer || account;
      if (!buyerAddress || !productCatalog) return [];

      try {
        const tokens = await getBuyerTokens(buyerAddress);
        const activeInsurances = [];

        for (const token of tokens) {
          const roundInfo = await productCatalog.getRound(token.roundId);
          const roundState = Number(roundInfo.state);

          // Include ACTIVE and MATURED states
          if (roundState === 3 || roundState === 4) {
            const trancheSpec = await productCatalog.getTranche(
              token.trancheId,
            );

            activeInsurances.push({
              tokenId: token.tokenId,
              roundId: token.roundId,
              trancheId: token.trancheId,
              coverageAmount: token.purchaseAmount,
              triggerPrice: trancheSpec.threshold,
              maturityTime: trancheSpec.maturityTimestamp,
              state: roundState,
            });
          }
        }

        return activeInsurances;
      } catch (error) {
        console.error("Error fetching active insurances:", error);
        return [];
      }
    },
    [account, productCatalog, getBuyerTokens],
  );

  return {
    // Purchase functions
    buyInsurance,
    calculatePremium,

    // Query functions
    getBuyerOrder,
    getBuyerTokens,
    checkClaimStatus,
    getActiveInsurances,

    // Claim functions
    claimPayout,

    // State
    isLoading,
    isPreparing,
  };
}
