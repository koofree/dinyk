"use client";

import React, { useState } from "react";
import { PositionCard } from "@/components/insurance/PositionCard";
import { useWeb3, useUserPortfolio } from "@dinsure/contracts";
import { KAIA_TESTNET } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PortfolioPage() {
  const { isConnected, account } = useWeb3();
  const [activeTab, setActiveTab] = useState<'insurance' | 'liquidity' | 'history'>('insurance');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const {
    insurancePositions,
    liquidityPositions,
    portfolioSummary,
    isLoading,
    error,
    claimInsurance,
    withdrawLiquidity,
    refetch
  } = useUserPortfolio();

  const handleClaim = async (positionId: string) => {
    setProcessingId(positionId);
    try {
      await claimInsurance(positionId);
      toast.success(`Successfully claimed payout for position ${positionId}!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to claim insurance");
    } finally {
      setProcessingId(null);
    }
  };

  const handleWithdraw = async (positionId: string) => {
    setProcessingId(positionId);
    try {
      await withdrawLiquidity(positionId);
      toast.success(`Successfully withdrew funds from position ${positionId}!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to withdraw liquidity");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">
              Please connect your wallet to view your portfolio
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while fetching data
  if (isLoading && !insurancePositions.length && !liquidityPositions.length) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-400">Loading portfolio...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Error Loading Portfolio</h2>
            <p className="text-gray-400 mb-8">{error}</p>
            <button
              onClick={() => refetch()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">My DIN Portfolio</h1>
          <p className="text-gray-400">
            Manage your insurance NFTs and liquidity positions
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-green-400">● Connected: {account?.slice(0, 6)}...{account?.slice(-4)}</span>
            <a 
              href={`${KAIA_TESTNET.blockExplorer}/address/${account}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              View on Explorer ↗
            </a>
            <a 
              href={`${KAIA_TESTNET.blockExplorer}/token/${KAIA_TESTNET.contracts.insuranceToken}?a=${account}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              View NFTs ↗
            </a>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Insurance Coverage</div>
            <div className="text-2xl font-bold text-white">
              ${portfolioSummary.totalInsuranceCoverage.toLocaleString()} USDT
            </div>
            <div className="text-green-400 text-sm">
              {portfolioSummary.activeInsuranceCount} active, {portfolioSummary.claimableInsuranceCount} claimable
            </div>
            <div className="text-gray-500 text-xs mt-1">
              InsuranceToken Contract
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Liquidity Provided</div>
            <div className="text-2xl font-bold text-white">
              ${portfolioSummary.totalLiquidityValue.toLocaleString()} USDT
            </div>
            <div className="text-blue-400 text-sm">
              {portfolioSummary.activeLiquidityCount} active position{portfolioSummary.activeLiquidityCount !== 1 ? 's' : ''}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              TranchePoolCore Shares
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Total Earnings</div>
            <div className="text-2xl font-bold text-white">
              ${portfolioSummary.totalEarnings.toFixed(2)} USDT
            </div>
            <div className="text-yellow-400 text-sm">
              Premiums + Staking rewards
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-8 border border-gray-700">
          <button
            onClick={() => setActiveTab('insurance')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'insurance'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🛡️ Insurance Positions ({insurancePositions.length})
          </button>
          <button
            onClick={() => setActiveTab('liquidity')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'liquidity'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            💰 Liquidity Positions ({liquidityPositions.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'insurance' && (
          <div className="space-y-6">
            {insurancePositions.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {insurancePositions.map((position) => (
                  <PositionCard
                    key={position.id}
                    position={position as any}
                    onClaim={handleClaim}
                    isProcessing={processingId === position.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🛡️</div>
                <h3 className="text-xl font-bold text-white mb-2">No Insurance Policies</h3>
                <p className="text-gray-400 mb-6">
                  You don't have any active insurance policies yet
                </p>
                <a
                  href="/insurance"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Browse Insurance Products
                </a>
              </div>
            )}
          </div>
        )}

        {activeTab === 'liquidity' && (
          <div className="space-y-6">
            {liquidityPositions.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {liquidityPositions.map((position) => (
                  <PositionCard
                    key={position.id}
                    position={position as any}
                    onWithdraw={handleWithdraw}
                    isProcessing={processingId === position.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-white mb-2">No Liquidity Positions</h3>
                <p className="text-gray-400 mb-6">
                  You haven't provided liquidity to any pools yet
                </p>
                <a
                  href="/tranches"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Provide Liquidity
                </a>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">Transaction History</h3>
              <p className="text-gray-400 mb-6">
                Coming soon - View your complete transaction history
              </p>
              <button
                onClick={() => refetch()}
                className="text-blue-400 hover:text-blue-300 text-sm"
                disabled={isLoading}
              >
                {isLoading ? "Refreshing..." : "Refresh Portfolio"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}