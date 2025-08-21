"use client";

import React from "react";
const RISK_COLORS = {
  LOW: 'text-green-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-red-400'
};

const ROUND_STATE_BADGES = {
  ANNOUNCED: { color: 'bg-gray-600 text-gray-300', label: 'Announced' },
  OPEN: { color: 'bg-green-600 text-green-100', label: 'Open' },
  MATCHED: { color: 'bg-blue-600 text-blue-100', label: 'Matched' },
  ACTIVE: { color: 'bg-yellow-600 text-yellow-100', label: 'Active' },
  MATURED: { color: 'bg-orange-600 text-orange-100', label: 'Matured' },
  SETTLED: { color: 'bg-purple-600 text-purple-100', label: 'Settled' },
  CANCELED: { color: 'bg-red-600 text-red-100', label: 'Canceled' }
};

interface LiquidityPool {
  id: number;
  productId: number;
  asset: string;
  trancheName: string;
  triggerPrice: number;
  triggerType: string;
  expectedPremium: number;
  premiumRateBps: number;
  stakingAPY: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  poolSize: string;
  totalLiquidity: string;
  userShare: string;
  utilization: number;
  roundState: string;
  roundEndsIn: number;
  navPerShare?: string;
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
          <h3 className="text-xl font-bold text-white">{pool.asset} - {pool.trancheName}</h3>
          <p className="text-gray-400 text-sm">
            Trigger: {pool.triggerType === 'PRICE_BELOW' ? '<' : '>'} ${pool.triggerPrice.toLocaleString()}
          </p>
          <p className="text-gray-500 text-xs mt-1">Tranche #{pool.id} • Product #{pool.productId}</p>
        </div>
        <div className="text-right space-y-2">
          <span className={`text-xs px-2 py-1 rounded ${RISK_COLORS[pool.riskLevel]} bg-gray-600`}>
            {pool.riskLevel}
          </span>
          {pool.roundState && ROUND_STATE_BADGES[pool.roundState as keyof typeof ROUND_STATE_BADGES] && (
            <div>
              <span className={`text-xs px-2 py-1 rounded ${ROUND_STATE_BADGES[pool.roundState as keyof typeof ROUND_STATE_BADGES].color}`}>
                {ROUND_STATE_BADGES[pool.roundState as keyof typeof ROUND_STATE_BADGES].label}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-gray-400 text-sm">Expected Premium</div>
          <div className="text-green-400 font-bold text-lg">{pool.expectedPremium}%</div>
          <div className="text-gray-500 text-xs">{pool.premiumRateBps} bps</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">NAV per Share</div>
          <div className="text-blue-400 font-bold text-lg">{pool.navPerShare || '1.00'}</div>
          <div className="text-gray-500 text-xs">+{pool.stakingAPY}% APY</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Pool Utilization</span>
          <span>{pool.utilization}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 to-green-500 h-2 rounded-full transition-all"
            style={{ width: `${pool.utilization}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-gray-400 text-sm">Pool Capacity</div>
          <div className="text-white font-medium">${parseInt(pool.poolSize).toLocaleString()} USDT</div>
          <div className="text-gray-500 text-xs">Total: ${parseInt(pool.totalLiquidity || '0').toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Your Position</div>
          <div className="text-white font-medium">
            {hasUserShare ? `$${parseInt(pool.userShare).toLocaleString()} USDT` : 'No position'}
          </div>
          {hasUserShare && (
            <div className="text-gray-500 text-xs">Shares: {(parseFloat(pool.userShare) / parseFloat(pool.navPerShare || '1')).toFixed(2)}</div>
          )}
        </div>
      </div>

      {pool.roundState === 'OPEN' && pool.roundEndsIn > 0 && (
        <div className="mb-4 bg-gray-700 rounded p-3">
          <div className="text-gray-400 text-sm">Sales Window Closes In</div>
          <div className="text-white font-medium">{pool.roundEndsIn} days</div>
        </div>
      )}
      
      {pool.roundState === 'ACTIVE' && pool.roundEndsIn > 0 && (
        <div className="mb-4 bg-yellow-900 rounded p-3">
          <div className="text-yellow-400 text-sm">Coverage Active</div>
          <div className="text-yellow-300 font-medium">{pool.roundEndsIn} days remaining</div>
        </div>
      )}

      <div className="space-y-2">
        {!hasUserShare ? (
          <button
            onClick={() => onDeposit(pool)}
            disabled={pool.roundState !== 'OPEN'}
            className={`w-full py-3 rounded-lg transition-colors ${
              pool.roundState === 'OPEN'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {pool.roundState === 'ANNOUNCED' ? 'Coming Soon' :
             pool.roundState === 'OPEN' ? 'Provide Liquidity' :
             pool.roundState === 'ACTIVE' ? 'Round Active' :
             'Not Available'}
          </button>
        ) : (
          <div className="flex gap-2">
            {onAddMore && (
              <button
                onClick={() => onAddMore(pool)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
              >
                Add More
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