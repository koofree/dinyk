"use client";

import React, { useState } from "react";
import { LiquidityPoolCard } from "@/components/insurance/LiquidityPoolCard";
import { DepositModal } from "@/components/insurance/DepositModal";
import { useWeb3 } from "@/context/Web3Provider";
import { INSURANCE_PRODUCTS, KAIA_TESTNET } from "@/lib/constants";

interface LiquidityPool {
  id: number; // Tranche ID
  productId: number;
  asset: string;
  trancheName: string;
  triggerPrice: number;
  triggerType: string;
  expectedPremium: number;
  premiumRateBps: number;
  stakingAPY: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  poolSize: string; // Total tranche capacity
  totalLiquidity: string; // Total seller collateral
  userShare: string;
  utilization: number; // Percentage of matched liquidity
  roundState: string;
  roundEndsIn: number;
  navPerShare?: string; // Net Asset Value per share
}

// Convert insurance products to liquidity pools
const LIQUIDITY_POOLS: LiquidityPool[] = INSURANCE_PRODUCTS.flatMap(product => 
  product.tranches.map(tranche => ({
    id: tranche.id,
    productId: product.productId,
    asset: product.asset,
    trancheName: tranche.name,
    triggerPrice: tranche.triggerPrice,
    triggerType: tranche.triggerType,
    expectedPremium: tranche.premium,
    premiumRateBps: tranche.premiumRateBps,
    stakingAPY: 3.5, // Placeholder - would come from yield router
    riskLevel: tranche.riskLevel,
    poolSize: tranche.capacity,
    totalLiquidity: '0', // Would be fetched from contract
    userShare: '0', // Would be fetched from contract
    utilization: 0, // Would be calculated from matched/total
    roundState: tranche.roundState || 'ANNOUNCED',
    roundEndsIn: 7, // Would be calculated from round end time
    navPerShare: '1.0' // Would be fetched from pool accounting
  }))
);

// Legacy mock data (kept for reference)
const MOCK_LIQUIDITY_POOLS_OLD: LiquidityPool[] = [
  {
    id: 'btc-5',
    asset: 'BTC',
    tranche: '-5%',
    triggerLevel: -5,
    expectedPremium: 2,
    stakingAPY: 3.5,
    riskLevel: 'LOW',
    poolSize: '100000',
    userShare: '0',
    utilization: 60,
    roundEndsIn: 3,
  },
  {
    id: 'btc-10',
    asset: 'BTC',
    tranche: '-10%',
    triggerLevel: -10,
    expectedPremium: 5,
    stakingAPY: 3.5,
    riskLevel: 'MEDIUM',
    poolSize: '50000',
    userShare: '5000',
    utilization: 80,
    roundEndsIn: 2,
  },
  {
    id: 'btc-15',
    asset: 'BTC',
    tranche: '-15%',
    triggerLevel: -15,
    expectedPremium: 10,
    stakingAPY: 3.5,
    riskLevel: 'HIGH',
    poolSize: '25000',
    userShare: '0',
    utilization: 30,
    roundEndsIn: 2,
  },
  {
    id: 'eth-5',
    asset: 'ETH',
    tranche: '-5%',
    triggerLevel: -5,
    expectedPremium: 2.5,
    stakingAPY: 3.5,
    riskLevel: 'LOW',
    poolSize: '80000',
    userShare: '3000',
    utilization: 65,
    roundEndsIn: 1,
  },
  {
    id: 'eth-10',
    asset: 'ETH',
    tranche: '-10%',
    triggerLevel: -10,
    expectedPremium: 6,
    stakingAPY: 3.5,
    riskLevel: 'MEDIUM',
    poolSize: '40000',
    userShare: '0',
    utilization: 90,
    roundEndsIn: 1,
  },
  {
    id: 'klay-10',
    asset: 'KLAY',
    tranche: '-10%',
    triggerLevel: -10,
    expectedPremium: 4,
    stakingAPY: 3.5,
    riskLevel: 'MEDIUM',
    poolSize: '30000',
    userShare: '0',
    utilization: 50,
    roundEndsIn: 5,
  },
];

export default function LiquidityPage() {
  const { isConnected } = useWeb3();
  const [selectedPool, setSelectedPool] = useState<LiquidityPool | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [filter, setFilter] = useState({
    asset: 'All',
    riskLevel: 'All',
  });

  const handleDeposit = (pool: LiquidityPool) => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }
    
    setSelectedPool(pool);
    setIsDepositModalOpen(true);
  };

  const handleDepositConfirm = async (amount: string) => {
    console.log(`Depositing ${amount} USDT to ${selectedPool?.asset} ${selectedPool?.trancheName}`);
    console.log(`Tranche ID: ${selectedPool?.id}, Round State: ${selectedPool?.roundState}`);
    
    // TODO: Actual contract call to TranchePoolCore.provideLiquidity()
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert(`Successfully deposited ${amount} USDT to tranche #${selectedPool?.id}!`);
  };

  const handleWithdraw = async (pool: LiquidityPool) => {
    console.log(`Withdrawing from ${pool.asset} ${pool.trancheName}`);
    console.log(`Tranche ID: ${pool.id}, NAV per share: ${pool.navPerShare}`);
    
    // TODO: Actual contract call to TranchePoolCore.withdrawLiquidity()
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    alert(`Successfully withdrew from ${pool.asset} tranche #${pool.id}!`);
  };

  const handleAddMore = (pool: LiquidityPool) => {
    setSelectedPool(pool);
    setIsDepositModalOpen(true);
  };

  const assets = ['All', ...new Set(LIQUIDITY_POOLS.map(p => p.asset))];
  const riskLevels = ['All', 'LOW', 'MEDIUM', 'HIGH'];

  const filteredPools = LIQUIDITY_POOLS.filter(pool => {
    if (filter.asset !== 'All' && pool.asset !== filter.asset) return false;
    if (filter.riskLevel !== 'All' && pool.riskLevel !== filter.riskLevel) return false;
    return true;
  });

  const userPools = filteredPools.filter(pool => parseFloat(pool.userShare) > 0);
  const availablePools = filteredPools.filter(pool => parseFloat(pool.userShare) === 0);

  const totalDeposited = userPools.reduce((sum, pool) => sum + parseFloat(pool.userShare), 0);
  const totalExpectedEarnings = userPools.reduce((sum, pool) => {
    const amount = parseFloat(pool.userShare);
    return sum + (amount * (pool.expectedPremium + pool.stakingAPY) / 100);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">DIN Liquidity Provider Dashboard</h1>
          <p className="text-gray-400">
            Provide collateral to insurance pools and earn premiums + staking rewards
          </p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="text-green-400">● Connected to {KAIA_TESTNET.name}</span>
            <a 
              href={`${KAIA_TESTNET.blockExplorer}/address/${KAIA_TESTNET.contracts.poolFactory}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              View Pool Factory →
            </a>
          </div>
          <p className="text-gray-400">
            Provide liquidity to insurance pools and earn premiums + staking rewards
          </p>
        </div>

        {/* User Statistics */}
        {isConnected && userPools.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-2">Total Deposited</div>
              <div className="text-2xl font-bold text-white">
                ${totalDeposited.toLocaleString()} USDT
              </div>
              <div className="text-blue-400 text-sm">{userPools.length} active pools</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-2">Expected Annual Earnings</div>
              <div className="text-2xl font-bold text-white">
                ${totalExpectedEarnings.toFixed(0)} USDT
              </div>
              <div className="text-green-400 text-sm">
                {totalDeposited > 0 ? ((totalExpectedEarnings / totalDeposited) * 100).toFixed(1) : 0}% APY
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-gray-400 text-sm mb-2">Active Pools</div>
              <div className="text-2xl font-bold text-white">{userPools.length}</div>
              <div className="text-yellow-400 text-sm">across {new Set(userPools.map(p => p.asset)).size} assets</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-white font-medium mb-2">Asset</label>
              <select
                value={filter.asset}
                onChange={(e) => setFilter(prev => ({ ...prev, asset: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {assets.map(asset => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Risk Level</label>
              <select
                value={filter.riskLevel}
                onChange={(e) => setFilter(prev => ({ ...prev, riskLevel: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {riskLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={() => setFilter({ asset: 'All', riskLevel: 'All' })}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Connection Notice */}
        {!isConnected && (
          <div className="bg-blue-900 border border-blue-600 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="text-blue-400 text-xl">💡</div>
              <div>
                <h3 className="text-blue-400 font-medium">Connect Your Wallet</h3>
                <p className="text-blue-300 text-sm">
                  Connect your wallet to provide liquidity and earn rewards
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Your Pools Section */}
        {isConnected && userPools.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Your Liquidity Positions</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userPools.map((pool) => (
                <LiquidityPoolCard
                  key={pool.id}
                  pool={pool}
                  onDeposit={handleDeposit}
                  onWithdraw={handleWithdraw}
                  onAddMore={handleAddMore}
                />
              ))}
            </div>
          </div>
        )}

        {/* Available Pools Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            {isConnected && userPools.length > 0 ? 'Available Pools' : 'Available Tranche Pools'}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {availablePools.map((pool) => (
              <LiquidityPoolCard
                key={pool.id}
                pool={pool}
                onDeposit={handleDeposit}
              />
            ))}
          </div>
        </div>

        {filteredPools.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No pools match your filters</div>
            <button
              onClick={() => setFilter({ asset: 'All', riskLevel: 'All' })}
              className="mt-4 text-blue-400 hover:text-blue-300 transition-colors"
            >
              Clear filters to see all pools
            </button>
          </div>
        )}

        {/* Deposit Modal */}
        <DepositModal
          pool={selectedPool}
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          onConfirm={handleDepositConfirm}
        />
      </div>
    </div>
  );
}