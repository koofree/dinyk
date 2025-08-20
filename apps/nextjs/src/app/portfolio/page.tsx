"use client";

import React, { useState } from "react";
import { PositionCard } from "@/components/insurance/PositionCard";
import { useWeb3 } from "@/context/Web3Provider";
import { MOCK_USER_POSITIONS, MOCK_LP_POSITIONS } from "@/lib/constants";

export default function PortfolioPage() {
  const { isConnected, account } = useWeb3();
  const [activeTab, setActiveTab] = useState<'insurance' | 'liquidity' | 'history'>('insurance');

  const handleClaim = async (positionId: string) => {
    console.log(`Claiming position ${positionId}`);
    // Mock claim transaction
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert(`Successfully claimed payout for position ${positionId}!`);
  };

  const handleWithdraw = async (positionId: string) => {
    console.log(`Withdrawing from position ${positionId}`);
    // Mock withdraw transaction
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert(`Successfully withdrew funds from position ${positionId}!`);
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

  const insurancePositions = MOCK_USER_POSITIONS.filter(p => p.type === 'insurance');
  const liquidityPositions = MOCK_LP_POSITIONS.filter(p => p.type === 'liquidity');

  const totalInsuranceCoverage = insurancePositions.reduce((sum, pos) => {
    return sum + parseInt(pos.coverage || '0');
  }, 0);

  const totalLiquidityValue = liquidityPositions.reduce((sum, pos) => {
    return sum + parseInt(pos.currentValue || '0');
  }, 0);

  const totalEarnings = liquidityPositions.reduce((sum, pos) => {
    return sum + parseFloat(pos.earnedPremium || '0') + parseFloat(pos.stakingRewards || '0');
  }, 0);

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">My Portfolio</h1>
          <p className="text-gray-400">
            Manage your insurance policies and liquidity positions
          </p>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Total Coverage</div>
            <div className="text-2xl font-bold text-white">
              ${totalInsuranceCoverage.toLocaleString()} USDT
            </div>
            <div className="text-green-400 text-sm">
              {insurancePositions.length} active policies
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Liquidity Provided</div>
            <div className="text-2xl font-bold text-white">
              ${totalLiquidityValue.toLocaleString()} USDT
            </div>
            <div className="text-blue-400 text-sm">
              {liquidityPositions.length} pool positions
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Total Earnings</div>
            <div className="text-2xl font-bold text-white">
              ${totalEarnings.toFixed(2)} USDT
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
            🛡️ Active Insurance ({insurancePositions.length})
          </button>
          <button
            onClick={() => setActiveTab('liquidity')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'liquidity'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            💰 LP Positions ({liquidityPositions.length})
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
                    position={position}
                    onClaim={handleClaim}
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
                    position={position}
                    onWithdraw={handleWithdraw}
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
                  href="/liquidity"
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
              <p className="text-gray-400">
                Coming soon - View your complete transaction history
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}