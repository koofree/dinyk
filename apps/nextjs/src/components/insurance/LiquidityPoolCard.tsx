"use client";

import React from "react";
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
  const hasUserShare = parseFloat(pool.userShare) > 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{pool.asset} {pool.tranche} Tranche</h3>
          <p className="text-gray-400 text-sm">Trigger: {pool.triggerLevel}% drop</p>
        </div>
        <div className="text-right">
          <span className={`text-xs px-2 py-1 rounded ${RISK_COLORS[pool.riskLevel]} bg-gray-600`}>
            {pool.riskLevel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-gray-400 text-sm">Expected Premium</div>
          <div className="text-green-400 font-bold text-lg">{pool.expectedPremium}%</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Staking APY</div>
          <div className="text-blue-400 font-bold text-lg">{pool.stakingAPY}%</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Pool Utilization</span>
          <span>{pool.utilization}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-[#86D99C] to-[#00B1B8] h-2 rounded-full transition-all"
            style={{ width: `${pool.utilization}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-gray-400 text-sm">Pool Size</div>
          <div className="text-white font-medium">${parseInt(pool.poolSize).toLocaleString()} USDT</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Your Share</div>
          <div className="text-white font-medium">
            {hasUserShare ? `$${parseInt(pool.userShare).toLocaleString()} USDT` : '0 USDT'}
          </div>
        </div>
      </div>

      {pool.roundEndsIn > 0 && (
        <div className="mb-4">
          <div className="text-gray-400 text-sm">Current Round Ends In</div>
          <div className="text-white">{pool.roundEndsIn} days</div>
        </div>
      )}

      <div className="space-y-2">
        {!hasUserShare ? (
          <button
            onClick={() => onDeposit(pool)}
            className="w-full relative bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white py-3 rounded-lg transition-all duration-300 hover:scale-98 hover:shadow-lg group overflow-hidden"
          >
                          <span className="font-outfit">Deposit USDT</span>
          </button>
        ) : (
          <div className="flex gap-2">
            {onAddMore && (
              <button
                onClick={() => onAddMore(pool)}
                className="flex-1 relative bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white py-2 rounded-lg transition-all duration-300 hover:scale-98 hover:shadow-lg group overflow-hidden"
              >
                                  <span className="font-outfit">Add More</span>
              </button>
            )}
            {onWithdraw && (
              <button
                onClick={() => onWithdraw(pool)}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg transition-colors"
              >
                Withdraw
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expected Returns */}
      <div className="mt-4 bg-gray-700 rounded-lg p-3">
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
    </div>
  );
};