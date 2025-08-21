"use client";

import React, { useState } from "react";
import { PositionCard } from "@/components/insurance/PositionCard";
import { useWeb3 } from "@/context/Web3Provider";
import { KAIA_TESTNET } from "@/lib/constants";
import type { UserPosition } from "@/lib/types";

// Mock NFT positions - would be fetched from InsuranceToken contract
const MOCK_NFT_POSITIONS: UserPosition[] = [
  {
    id: 'nft-1',
    tokenId: 1,
    asset: 'BTC',
    type: 'insurance',
    tranche: 'Conservative Downside',
    trancheId: 1,
    roundId: 1,
    coverage: '5000',
    premiumPaid: '150',
    status: 'active',
    expiresIn: 25,
    currentPrice: 115000,
    triggerPrice: 110000,
    baseline: 120000,
    roundState: 'ACTIVE',
    maturityTimestamp: Date.now() + 25 * 24 * 60 * 60 * 1000
  },
  {
    id: 'nft-2',
    tokenId: 2,
    asset: 'BTC',
    type: 'insurance',
    tranche: 'Moderate Downside',
    trancheId: 2,
    roundId: 1,
    coverage: '10000',
    premiumPaid: '500',
    status: 'active',
    expiresIn: 25,
    currentPrice: 115000,
    triggerPrice: 100000,
    baseline: 120000,
    roundState: 'ACTIVE'
  }
];

// Mock liquidity positions - would be fetched from TranchePoolCore
const MOCK_LP_POSITIONS: UserPosition[] = [
  {
    id: 'lp-1',
    asset: 'BTC',
    type: 'liquidity',
    tranche: 'Conservative Downside',
    trancheId: 1,
    roundId: 1,
    deposited: '20000',
    shares: '20000',
    currentValue: '20400',
    earnedPremium: '300',
    stakingRewards: '100',
    lockedAmount: '15000',
    roundStatus: 'active',
    roundState: 'ACTIVE',
    daysLeft: 25
  }
];

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

  const insurancePositions = MOCK_NFT_POSITIONS.filter(p => p.type === 'insurance');
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
              ${totalInsuranceCoverage.toLocaleString()} USDT
            </div>
            <div className="text-green-400 text-sm">
              {insurancePositions.length} NFT{insurancePositions.length !== 1 ? 's' : ''} held
            </div>
            <div className="text-gray-500 text-xs mt-1">
              InsuranceToken Contract
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm mb-2">Liquidity Provided</div>
            <div className="text-2xl font-bold text-white">
              ${totalLiquidityValue.toLocaleString()} USDT
            </div>
            <div className="text-blue-400 text-sm">
              {liquidityPositions.length} tranche pool{liquidityPositions.length !== 1 ? 's' : ''}
            </div>
            <div className="text-gray-500 text-xs mt-1">
              TranchePoolCore Shares
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