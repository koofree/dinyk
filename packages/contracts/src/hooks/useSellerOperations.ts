import { useCallback, useState } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";

import { KAIA_RPC_ENDPOINTS } from "../config/constants";
import { useWeb3 } from "../providers/Web3Provider";
import { TranchePoolCore__factory } from "../types/generated";
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
  const { signer, account, provider } = useWeb3();
  const { productCatalog, tranchePoolFactory, usdt, isInitialized } =
    useContracts();
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);

  // Create a provider with fallback RPC endpoints
  const createProviderWithFallback =
    useCallback(async (): Promise<ethers.JsonRpcProvider> => {
      for (const rpcUrl of KAIA_RPC_ENDPOINTS) {
        try {
          const provider = new ethers.JsonRpcProvider(rpcUrl, {
            chainId: 1001,
            name: "Kaia Kairos",
          });

          // Test the connection
          const blockNumberPromise = provider.getBlockNumber();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Connection timeout")), 3000),
          );

          await Promise.race([blockNumberPromise, timeoutPromise]);
          console.log(`Successfully connected to RPC: ${rpcUrl}`);
          return provider;
        } catch (error) {
          console.warn(`RPC endpoint ${rpcUrl} failed, trying next...`);
        }
      }

      throw new Error("All RPC endpoints failed. Please try again later.");
    }, []);

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
      console.log("depositCollateral called with:", {
        hasSigner: !!signer,
        hasAccount: !(typeof account !== "string"),
        hasProductCatalog: !!productCatalog,
        hasTranchePoolFactory: !!tranchePoolFactory,
        hasUsdt: !!usdt,
        isInitialized,
      });

      if (!isInitialized) {
        throw new Error(
          "Contracts are still initializing. Please wait a moment.",
        );
      }
      if (!signer) {
        throw new Error("Signer not available. Please connect your wallet.");
      }
      if (typeof account !== "string") {
        throw new Error("Account not available. Please connect your wallet.");
      }
      if (!productCatalog) {
        throw new Error("Product catalog contract not initialized.");
      }
      if (!tranchePoolFactory) {
        throw new Error("Tranche pool factory contract not initialized.");
      }
      if (!usdt) {
        throw new Error("USDT contract not initialized.");
      }

      setIsLoading(true);
      try {
        // Check network
        const network = await signer.provider.getNetwork();
        console.log("Current network:", {
          chainId: network.chainId.toString(),
        });

        // First verify the ProductCatalog contract is accessible
        const catalogAddress = await productCatalog.getAddress();
        console.log("ProductCatalog contract address:", catalogAddress);

        // Get round info
        console.log("Getting round info for roundId:", params.roundId);

        // First, let's check what rounds exist
        try {
          // Try to get the round count or check if the round exists
          console.log("Attempting to get round", params.roundId);
        } catch (checkError) {
          console.error("Error checking rounds:", checkError);
        }

        const currentProductCatalog = productCatalog;

        const roundInfo = await currentProductCatalog.getRound(params.roundId);
        console.log("Round info retrieved successfully");

        const trancheId = Number(roundInfo.trancheId);
        const roundState = Number(roundInfo.state);

        console.log("Round info:", {
          roundId: params.roundId,
          trancheId,
          state: roundState,
          salesStartTime: Number(roundInfo.salesStartTime),
          salesEndTime: Number(roundInfo.salesEndTime),
        });

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

        // Get tranche details (removed as unused)

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
        console.log(
          "Checking USDT balance for account:",
          await usdt.getAddress(),
          account,
        );
        const balance = await usdt.balanceOf(account);
        if (balance < collateralAmountWei) {
          throw new Error(
            `Insufficient USDT balance. Need ${params.collateralAmount} USDT`,
          );
        }

        // Get pool address
        console.log("Getting pool address for tranche:", trancheId);
        const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
        console.log("Pool address:", poolAddress);

        // Get pool contract
        const pool = TranchePoolCore__factory.connect(poolAddress, signer);

        // Try to call a view function to verify the pool is working
        try {
          const poolAccounting = await pool.getPoolAccounting();
          console.log("Pool is accessible, accounting:", {
            totalAssets: ethers.formatUnits(poolAccounting.totalAssets, 6),
            totalShares: ethers.formatEther(poolAccounting.totalShares),
            navPerShare: ethers.formatEther(poolAccounting.navPerShare),
          });
        } catch (poolError) {
          console.error("Failed to access pool contract:", poolError);
          throw new Error("Pool contract is not accessible");
        }

        // Get share balance before deposit
        const shareBalanceBefore = await pool.shareBalances(account);

        // Approve USDT if needed
        setIsPreparing(true);
        console.log("Checking USDT allowance:", {
          account,
          poolAddress,
          usdtAddress: await usdt.getAddress(),
        });

        const currentAllowance = await usdt.allowance(account, poolAddress);
        console.log(
          "Current allowance:",
          ethers.formatUnits(currentAllowance, 6),
          "USDT",
        );

        if (currentAllowance < collateralAmountWei) {
          console.log(
            "Need to approve USDT. Current:",
            ethers.formatUnits(currentAllowance, 6),
            "Need:",
            ethers.formatUnits(collateralAmountWei, 6),
          );

          // Reset to zero first if needed
          if (currentAllowance > 0n) {
            console.log("Resetting allowance to 0 first...");
            const resetTx = await usdt.connect(signer).approve(poolAddress, 0);
            await resetTx.wait();
            console.log("Allowance reset to 0");
          }

          console.log(
            "Approving",
            ethers.formatUnits(collateralAmountWei, 6),
            "USDT for pool",
            poolAddress,
          );
          const approveTx = await usdt
            .connect(signer)
            .approve(poolAddress, collateralAmountWei);
          const approveReceipt = await approveTx.wait();
          console.log("Approval transaction:", approveReceipt?.hash);

          // Verify the approval worked
          const newAllowance = await usdt.allowance(account, poolAddress);
          console.log(
            "New allowance after approval:",
            ethers.formatUnits(newAllowance, 6),
            "USDT",
          );

          if (newAllowance < collateralAmountWei) {
            throw new Error(
              "USDT approval failed - allowance not set correctly",
            );
          }

          toast.success("USDT approved");
        } else {
          console.log(
            "USDT already approved, current allowance:",
            ethers.formatUnits(currentAllowance, 6),
          );
        }
        setIsPreparing(false);

        // Deposit collateral
        console.log("Depositing collateral to pool:", {
          poolAddress,
          roundId: params.roundId,
          amount: ethers.formatUnits(collateralAmountWei, 6),
          allowance: ethers.formatUnits(currentAllowance, 6),
          userBalance: ethers.formatUnits(balance, 6),
        });

        // Manually set gas limit instead of estimating
        const gasLimit = 500000n; // Set a reasonable gas limit
        console.log("Using manual gas limit:", gasLimit.toString());

        const tx = await pool.depositCollateral(
          params.roundId,
          collateralAmountWei,
          { gasLimit },
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
      } catch (error) {
        console.error("Error depositing collateral:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        toast.error(errorMessage);
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
      calculateYield,
      isInitialized,
      createProviderWithFallback,
    ],
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

        const pool = TranchePoolCore__factory.connect(poolAddress, signer);
        const position = await pool.getSellerPosition(roundId, sellerAddress);

        return {
          collateralAmount: position.collateralAmount,
          sharesIssued: position.sharesMinted,
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
      const sellerAddress = seller ?? account;
      if (!sellerAddress || !tranchePoolFactory) return 0n;

      try {
        const poolAddress = await tranchePoolFactory.getTranchePool(
          Number(trancheId),
        );
        if (!poolAddress || poolAddress === ethers.ZeroAddress) {
          // No pool exists for this tranche (no round)
          return 0n;
        }

        const pool = TranchePoolCore__factory.connect(poolAddress, provider);

        // Get share balance using shareBalances mapping
        const balance = await pool.shareBalances(sellerAddress);
        return balance;
      } catch (error) {
        // Only log error if it's not an expected "no pool" scenario
        if (
          error instanceof Error &&
          !error.message.includes("missing revert data")
        ) {
          console.error("Error fetching seller share balance:", error);
        }
        return 0n;
      }
    },
    [tranchePoolFactory, account, provider],
  );

  // Get pool accounting info
  const getPoolAccounting = useCallback(
    async (trancheId: number): Promise<PoolAccounting | null> => {
      console.log("getPoolAccounting called with trancheId:", trancheId);
      console.log("tranchePoolFactory available:", !!tranchePoolFactory);
      console.log("provider available:", !!provider);

      if (!tranchePoolFactory) {
        throw new Error("Tranche pool factory not initialized");
      }

      console.log("Getting pool address for tranche:", trancheId);
      const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
      console.log("Pool address:", poolAddress);

      if (!poolAddress || poolAddress === ethers.ZeroAddress) {
        console.log("No pool found for tranche:", trancheId);
        return null;
      }

      const pool = TranchePoolCore__factory.connect(poolAddress, provider);

      console.log(`Calling pool.getPoolAccounting() by ${poolAddress}`);
      const accounting = await pool.getPoolAccounting();
      console.log("Pool accounting result:", accounting);

      return {
        totalAssets: accounting.totalAssets,
        lockedAssets: accounting.lockedAssets,
        totalShares: accounting.totalShares,
        navPerShare: accounting.navPerShare,
      };
    },
    [tranchePoolFactory, provider],
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

  // Get available collateral for withdrawal
  const getAvailableCollateral = useCallback(
    async (trancheId: number, seller?: string): Promise<bigint> => {
      const sellerAddress = seller || account;
      if (!sellerAddress || !tranchePoolFactory) return 0n;

      try {
        const poolAddress = await tranchePoolFactory.getTranchePool(trancheId);
        if (!poolAddress || poolAddress === ethers.ZeroAddress) {
          // No pool exists for this tranche
          return 0n;
        }

        const pool = TranchePoolCore__factory.connect(poolAddress, provider);

        const available = await pool.getAvailableCollateral(sellerAddress);
        return available;
      } catch (error) {
        // Only log error if it's not an expected "no pool" scenario
        if (
          error instanceof Error &&
          !error.message.includes("missing revert data")
        ) {
          console.error("Error fetching available collateral:", error);
        }
        return 0n;
      }
    },
    [tranchePoolFactory, account, provider],
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
    getAvailableCollateral,

    // State
    isLoading,
    isPreparing,
  };
}
