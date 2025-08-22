"use client";

import React, { useState, useEffect } from "react";
import { RISK_COLORS } from "@/lib/constants";

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

interface LiquidityPoolCardProps {
  pool: LiquidityPool;
  onDeposit: (pool: LiquidityPool) => void;
  onWithdraw?: (pool: LiquidityPool) => void;
  onAddMore?: (pool: LiquidityPool) => void;
}

export const LiquidityPoolCard: React.FC<LiquidityPoolCardProps> = ({
  pool,
  onDeposit,
  onWithdraw,
  onAddMore
}) => {
  const [animatedUtilization, setAnimatedUtilization] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const hasUserShare = parseFloat(pool.userShare) > 0;

  useEffect(() => {
    // 컴포넌트가 마운트되면 애니메이션 시작
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isVisible) {
      // utilization 애니메이션
      let currentValue = 0;
      const duration = 1500; // 1.5초
      const steps = 60; // 60단계로 나누어 애니메이션
      const increment = pool.utilization / steps;
      const stepDuration = duration / steps;
      
      const interval = setInterval(() => {
        currentValue += increment;
        if (currentValue >= pool.utilization) {
          currentValue = pool.utilization;
          clearInterval(interval);
        }
        setAnimatedUtilization(Math.round(currentValue));
      }, stepDuration);
    }
  }, [isVisible, pool.utilization]);

  return (
    <div className="bg-[#1f2937] rounded-lg p-4">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-[20px]">
            {pool.asset} {pool.tranche}%
          </span>
          <span className={`text-xs px-2 py-1 rounded text-white font-bold ${
            pool.riskLevel === 'LOW' ? 'bg-green-500/70' : 
            pool.riskLevel === 'MEDIUM' ? 'bg-yellow-500/70' : 
            'bg-red-500/70'
          }`}>
            {pool.riskLevel}
          </span>
        </div>
        <div className="text-right">
          <div className="text-white font-medium">Premium: {pool.expectedPremium}%</div>
          <div className="text-gray-400 text-sm">APY: {pool.stakingAPY}%</div>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Pool Utilization</span>
          <span>{animatedUtilization}%</span>
        </div>
        <div className="w-full bg-[#111827] rounded-full h-2">
          <div 
            className="bg-[#6b7280] h-2 rounded-full transition-all duration-1500 ease-out"
            style={{ 
              width: `${animatedUtilization}%`,
              transition: 'width 1.5s ease-out'
            }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-200 font-bold mt-1">
          <span>Pool Size: ${parseInt(pool.poolSize).toLocaleString()} USDT</span>
          <span>Your Share: {hasUserShare ? `$${parseInt(pool.userShare).toLocaleString()}` : '$0'} USDT</span>
        </div>
      </div>

      {/* Expected Returns */}
      <div className="mb-5 bg-gray-700 rounded-lg p-3">
        <div className="text-gray-400 text-sm mb-2">Expected Returns (per $10K)</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Premium Income:</span>
            <span className="text-green-400">
              ~${(10000 * pool.expectedPremium / 100).toLocaleString()} USDT
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Staking Rewards:</span>
            <span className="text-blue-400">
              ~${(10000 * pool.stakingAPY / 100).toLocaleString()} USDT
            </span>
          </div>
          <div className="border-t border-gray-600 pt-1 mt-1">
            <div className="flex justify-between font-medium">
              <span className="text-white">Total Expected:</span>
              <span className="text-yellow-400">
                ~${(10000 * (pool.expectedPremium + pool.stakingAPY) / 100).toLocaleString()} USDT
              </span>
            </div>
          </div>
        </div>
      </div>

      {pool.roundEndsIn > 0 && (
        <div className="text-base text-[#86D99C] mb-4 flex items-center gap-0">
          Round ends in {pool.roundEndsIn} days
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}

      <div className="space-y-2">
        {!hasUserShare ? (
          <button
            onClick={() => onDeposit(pool)}
            className="w-full px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 relative bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white hover:scale-95 hover:shadow-lg group overflow-hidden"
            style={{ height: '48px' }}
          >
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" style={{ height: '48px' }}></div>
              <span className="relative font-outfit font-semibold">Deposit USDT</span>
            </>
          </button>
        ) : (
          <div className="flex gap-2">
            {onAddMore && (
              <button
                onClick={() => onAddMore(pool)}
                className="flex-1 px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 relative bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white hover:scale-95 hover:shadow-lg group overflow-hidden"
                style={{ height: '48px' }}
              >
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" style={{ height: '48px' }}></div>
                  <span className="relative font-outfit font-semibold">Add More</span>
                </>
              </button>
            )}
            {onWithdraw && (
              <button
                onClick={() => onWithdraw(pool)}
                className="flex-1 px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 bg-transparent border-2 border-gray-300 text-gray-600 hover:border-[#86D99C] hover:text-[#86D99C] hover:scale-95"
                style={{ height: '48px' }}
              >
                Withdraw
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};