"use client";

import React, { useState } from "react";
import { LiquidityPoolCard } from "@/components/insurance/LiquidityPoolCard";
import { DepositModal } from "@/components/insurance/DepositModal";
import { useWeb3 } from "@/context/Web3Provider";
import { Navbar } from "@/components/common/Navbar";

interface LiquidityPool {
  id: string;
  asset: string;
  tranche: string;
  triggerLevel: number;
  expectedPremium: number;
  stakingAPY: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  poolSize: string;
  userShare: string;
  utilization: number;
  roundEndsIn: number;
}

const MOCK_LIQUIDITY_POOLS: LiquidityPool[] = [
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
    id: 'kaia-10',
    asset: 'KAIA',
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
    console.log(`Depositing ${amount} USDT to ${selectedPool?.asset} ${selectedPool?.tranche}`);
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert(`Successfully deposited ${amount} USDT!`);
  };

  const handleWithdraw = async (pool: LiquidityPool) => {
    console.log(`Withdrawing from ${pool.asset} ${pool.tranche}`);
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    alert(`Successfully withdrew from ${pool.asset} ${pool.tranche}!`);
  };

  const handleAddMore = (pool: LiquidityPool) => {
    setSelectedPool(pool);
    setIsDepositModalOpen(true);
  };

  const assets = ['All', ...new Set(MOCK_LIQUIDITY_POOLS.map(p => p.asset))];
  const riskLevels = ['All', 'LOW', 'MEDIUM', 'HIGH'];

  const filteredPools = MOCK_LIQUIDITY_POOLS.filter(pool => {
    if (filter.asset !== 'All' && pool.asset !== filter.asset) return false;
    if (filter.riskLevel !== 'All' && pool.riskLevel !== filter.riskLevel) return false;
    return true;
  });

  const userPools = filteredPools.filter(pool => parseFloat(pool.userShare) > 0);
  const availablePools = filteredPools.filter(pool => parseFloat(pool.userShare) === 0);

  // 자산별로 그룹화
  const groupPoolsByAsset = (pools: LiquidityPool[]) => {
    const grouped = pools.reduce((acc, pool) => {
      if (!acc[pool.asset]) {
        acc[pool.asset] = [];
      }
      acc[pool.asset].push(pool);
      return acc;
    }, {} as Record<string, LiquidityPool[]>);

    // 자산 순서 정의 (BTC, ETH, KAIA)
    const assetOrder = ['BTC', 'ETH', 'KAIA'];
    return assetOrder.filter(asset => grouped[asset]).map(asset => ({
      asset,
      pools: grouped[asset]
    }));
  };

  const groupedUserPools = groupPoolsByAsset(userPools);
  const groupedAvailablePools = groupPoolsByAsset(availablePools);

  const totalDeposited = userPools.reduce((sum, pool) => sum + parseFloat(pool.userShare), 0);
  const totalExpectedEarnings = userPools.reduce((sum, pool) => {
    const amount = parseFloat(pool.userShare);
    return sum + (amount * (pool.expectedPremium + pool.stakingAPY) / 100);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-15 pb-15 mt-16">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-[56px] font-bold text-gray-900 mb-4 font-display">Become a <span className="bg-gradient-to-r from-[#86D99C] to-[#00B1B8] bg-clip-text text-transparent">Seller</span> and provide liquidity<br />to the insurance market.</h1>
          <p className="text-gray-600 text-2xl mb-8">
            By depositing USDT into the insurance pool,<br />
            <span className="font-bold bg-gradient-to-r from-[#86D99C] to-[#00B1B8] bg-clip-text text-transparent">you can earn premium rewards</span> whenever buyers purchase coverage.
          </p>
        </div>

        {/* Section Title */}
        <div className="mb-8">
          <h2 className="text-[30px] font-bold text-gray-900 mb-4 font-display">Liquidity Provider Dashboard</h2>
          <p className="text-gray-600">
            Provide liquidity to insurance pools and earn premiums + staking rewards
          </p>
        </div>

        {/* User Statistics */}
        {isConnected && userPools.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="text-gray-600 text-sm mb-2">Total Deposited</div>
              <div className="text-2xl font-bold text-gray-900">
                ${totalDeposited.toLocaleString()} USDT
              </div>
              <div className="text-blue-600 text-sm">{userPools.length} active pools</div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="text-gray-600 text-sm mb-2">Expected Annual Earnings</div>
              <div className="text-2xl font-bold text-gray-900">
                ${totalExpectedEarnings.toFixed(0)} USDT
              </div>
              <div className="text-green-600 text-sm">
                {totalDeposited > 0 ? ((totalExpectedEarnings / totalDeposited) * 100).toFixed(1) : 0}% APY
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="text-gray-600 text-sm mb-2">Active Pools</div>
              <div className="text-2xl font-bold text-gray-900">{userPools.length}</div>
              <div className="text-yellow-600 text-sm">across {new Set(userPools.map(p => p.asset)).size} assets</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8">
          <div className="flex gap-4 items-end w-full">
            <div className="flex-1">
              <label className="block text-gray-800 font-medium mb-2">Asset</label>
              <select
                value={filter.asset}
                onChange={(e) => setFilter(prev => ({ ...prev, asset: e.target.value }))}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 pr-12 text-gray-800 focus:border-[#86D99C] focus:outline-none appearance-none"
                style={{ 
                  borderRadius: '8px',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 12px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '20px'
                }}
              >
                {assets.map(asset => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-gray-800 font-medium mb-2">Risk Level</label>
              <select
                value={filter.riskLevel}
                onChange={(e) => setFilter(prev => ({ ...prev, riskLevel: e.target.value }))}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 pr-12 text-gray-800 focus:border-[#86D99C] focus:outline-none appearance-none"
                style={{ 
                  borderRadius: '8px',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 12px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '20px'
                }}
              >
                {riskLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={() => setFilter({ asset: 'All', riskLevel: 'All' })}
                className="bg-transparent border border-gray-300 text-gray-600 hover:border-[#86D99C] hover:text-[#86D99C] hover:scale-95 px-3 py-2 transition-all duration-300 flex items-center justify-center"
                style={{ borderRadius: '8px', height: '42px' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.51 15A9 9 0 1 0 6 5L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Connection Notice */}
        {!isConnected && (
          <div className="bg-[#F3FEF6] p-6 mb-8 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="text-[#00B1B8] text-xl">💡</div>
              <div>
                <h3 className="text-gray-800 font-medium">Connect Your Wallet</h3>
                <p className="text-gray-800 text-sm">
                  Connect your wallet to provide liquidity and earn rewards
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Your Pools Section */}
        {isConnected && userPools.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Liquidity Positions</h2>
            {groupedUserPools.map(({ asset, pools }, index) => (
              <div key={asset} style={{ marginTop: index > 0 ? '60px' : '0' }}>
                <div className={`flex items-center mb-4 ${asset === 'KAIA' ? 'gap-4' : 'gap-2'}`}>
                  <img
                    src={`/images/${asset}.svg`}
                    alt={asset}
                    className={`${asset === 'KAIA' ? 'w-8 h-8' : 'w-12 h-12'}`}
                    style={{ filter: 'brightness(0) invert(0.2)' }}
                  />
                  <h3 className="text-[30px] font-bold text-gray-900 font-display">{asset} Pools</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pools.map((pool) => (
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
            ))}
          </div>
        )}

        {/* Available Pools Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isConnected && userPools.length > 0 ? 'Available Pools' : 'Available Tranche Pools'}
          </h2>
          {groupedAvailablePools.map(({ asset, pools }, index) => (
            <div key={asset} style={{ marginTop: index > 0 ? '60px' : '0' }}>
              <div className={`flex items-center mb-4 ${asset === 'KAIA' ? 'gap-4' : 'gap-2'}`}>
                <img
                  src={`/images/${asset}.svg`}
                  alt={asset}
                  className={`${asset === 'KAIA' ? 'w-8 h-8' : 'w-12 h-12'}`}
                  style={{ filter: 'brightness(0) invert(0.2)' }}
                />
                <h3 className="text-[30px] font-bold text-gray-900 font-display">{asset} Pools</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pools.map((pool) => (
                  <LiquidityPoolCard
                    key={pool.id}
                    pool={pool}
                    onDeposit={handleDeposit}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredPools.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-600 text-lg">No pools match your filters</div>
            <button
              onClick={() => setFilter({ asset: 'All', riskLevel: 'All' })}
              className="mt-4 text-[#00B1B8] hover:text-[#86D99C] transition-colors font-medium"
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

      {/* Footer Section */}
      <div className="text-center pb-20" style={{ paddingTop: '60px' }}>
        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-6">
            <div className="rounded-lg p-6">
              <p className="text-gray-400 mb-4">
                Connect your wallet to start using DIN insurance platform
              </p>
              <p className="text-gray-400 text-sm">
                Supports MetaMask, Kaikas, and other Web3 wallets
              </p>
            </div>
          </div>
        )}
        
        {/* Footer Logo */}
        <img src="/images/bi-symbol.svg" alt="DIN Logo" className="h-12 w-auto mx-auto" style={{ filter: 'brightness(0) saturate(100%) invert(80%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)' }} />
      </div>
    </div>
  );
}