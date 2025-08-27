"use client";

import React from "react";

const RISK_COLORS = {
  LOW: "text-green-400",
  MEDIUM: "text-yellow-400",
  HIGH: "text-red-400",
};

const ROUND_STATE_BADGES = {
  ANNOUNCED: { color: "bg-gray-600 text-gray-300", label: "Announced" },
  OPEN: { color: "bg-green-600 text-green-100", label: "Open" },
  MATCHED: { color: "bg-blue-600 text-blue-100", label: "Matched" },
  ACTIVE: { color: "bg-yellow-600 text-yellow-100", label: "Active" },
  MATURED: { color: "bg-orange-600 text-orange-100", label: "Matured" },
  SETTLED: { color: "bg-purple-600 text-purple-100", label: "Settled" },
  CANCELED: { color: "bg-red-600 text-red-100", label: "Canceled" },
};

export interface LiquidityPool {
  id: number;
  productId: number;
  asset: string;
  trancheName: string;
  triggerPrice: number;
  triggerRate: number;
  triggerType: "PRICE_BELOW" | "PRICE_ABOVE";
  expectedPremium: number;
  premiumRateBps: number;
  stakingAPY: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  poolSize: string;
  totalLiquidity: string;
  userShare: string;
  utilization: number;
  roundState: string;
  roundStatus: string;
  roundEndsIn: number;
  navPerShare?: string;
}

interface LiquidityPoolCardProps {
  pool: LiquidityPool;
  onDeposit: (pool: LiquidityPool) => void;
}

export const LiquidityPoolCard: React.FC<LiquidityPoolCardProps> = ({
  pool,
  onDeposit,
}) => {
  const hasUserShare = parseFloat(pool.userShare) > 0;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">
            {pool.asset} {pool.triggerType === "PRICE_BELOW" ? "-" : "+"}{pool.triggerRate.toFixed(2)}%
          </h3>
                      <p className="mt-1 text-sm text-gray-500">
            Tranche #{pool.id} • Product #{pool.productId}
          </p>
        </div>
        <div className="space-y-2 text-right">
          <span
                          className={`rounded px-2 py-1 text-sm ${RISK_COLORS[pool.riskLevel]} bg-gray-600`}
          >
            {pool.riskLevel}
          </span>
          {pool.roundState &&
            ROUND_STATE_BADGES[
              pool.roundState as keyof typeof ROUND_STATE_BADGES
            ] && (
              <div>
                <span
                  className={`rounded px-2 py-1 text-sm ${ROUND_STATE_BADGES[pool.roundState as keyof typeof ROUND_STATE_BADGES].color}`}
                >
                  {
                    ROUND_STATE_BADGES[
                      pool.roundState as keyof typeof ROUND_STATE_BADGES
                    ].label
                  }
                </span>
              </div>
            )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-400">Expected Premium</div>
          <div className="text-lg font-bold text-green-400">
            {pool.expectedPremium}%
          </div>
                      <div className="text-sm text-gray-500">{pool.premiumRateBps} bps</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">NAV per Share</div>
          <div className="text-lg font-bold text-blue-400">
            {pool.navPerShare || "1.00"}
          </div>
                      <div className="text-sm text-gray-500">+{pool.stakingAPY}% APY</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex justify-between text-sm text-gray-400">
          <span>Pool Utilization</span>
          <span>{pool.utilization}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-700">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-green-500 transition-all"
            style={{ width: `${pool.utilization}%` }}
          />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-400">Pool Capacity</div>
          <div className="font-medium text-white">
            ${parseInt(pool.poolSize).toLocaleString()} USDT
          </div>
                      <div className="text-sm text-gray-500">
            Total: ${parseInt(pool.totalLiquidity || "0").toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Your Position</div>
          <div className="font-medium text-white">
            {hasUserShare
              ? `$${parseInt(pool.userShare).toLocaleString()} USDT`
              : "No position"}
          </div>
          {hasUserShare && (
            <div className="text-sm text-gray-500">
              Shares:{" "}
              {(
                parseFloat(pool.userShare) / parseFloat(pool.navPerShare || "1")
              ).toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {pool.roundState === "OPEN" && pool.roundEndsIn > 0 && (
        <div className="mb-4 rounded bg-gray-700 p-3">
          <div className="text-sm text-gray-400">Sales Window Closes In</div>
          <div className="font-medium text-white">{pool.roundEndsIn} days</div>
        </div>
      )}

      {pool.roundState === "ACTIVE" && pool.roundEndsIn > 0 && (
        <div className="mb-4 rounded bg-yellow-900 p-3">
          <div className="text-sm text-yellow-400">Coverage Active</div>
          <div className="font-medium text-yellow-300">
            {pool.roundEndsIn} days remaining
          </div>
        </div>
      )}

      <div className="space-y-2">
        {!hasUserShare ? (
          <button
            onClick={() => onDeposit(pool)}
            disabled={pool.roundState !== "OPEN"}
            className={`w-full rounded-lg py-3 transition-colors ${
              pool.roundState === "OPEN"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "cursor-not-allowed bg-gray-600 text-gray-400"
            }`}
          >
            {pool.roundState === "ANNOUNCED"
              ? "Coming Soon"
              : pool.roundState === "OPEN"
                ? "Provide Liquidity"
                : pool.roundState === "ACTIVE"
                  ? "Round Active"
                  : "Not Available"}
          </button>
        ) : (
          <div className="flex gap-2">
            <a
              href={`/tranches/${pool.productId}/${pool.id}`}
              className="flex flex-1 items-center justify-center rounded-lg bg-gradient-to-br from-[#86D99C] to-[#00B1B8] py-2 text-center font-semibold text-white transition-all duration-300 hover:from-[#00B1B8] hover:to-[#86D99C]"
            >
              View Details
            </a>
          </div>
        )}
      </div>

      {/* Expected Returns */}
      <div className="mt-4 rounded-lg bg-gray-700 p-3">
        <div className="mb-2 text-sm text-gray-400">
          Expected Returns (per $10K)
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Premium Income:</span>
            <span className="text-green-400">
              ~${((10000 * pool.expectedPremium) / 100).toLocaleString()} USDT
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Staking Rewards:</span>
            <span className="text-blue-400">
              ~${((10000 * pool.stakingAPY) / 100).toLocaleString()} USDT
            </span>
          </div>
          <div className="mt-1 border-t border-gray-600 pt-1">
            <div className="flex justify-between font-medium">
              <span className="text-white">Total Expected:</span>
              <span className="text-yellow-400">
                ~$
                {(
                  (10000 * (pool.expectedPremium + pool.stakingAPY)) /
                  100
                ).toLocaleString()}{" "}
                USDT
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
