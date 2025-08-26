"use client";

import { formatPercentage, formatUSDT } from "@/utils/calculations";
import { getTrancheName, getTrancheShortName } from "@/utils/productHelpers";
import {
  getRiskLevel,
  getRoundStateLabel,
  getRoundStateTextColor
} from "@/utils/statusMappings";
import Link from "next/link";
import React from "react";

import type { Product, Tranche } from "@dinsure/contracts";

interface TrancheCardProps {
  product: Product;
  tranche: Tranche;
}

export const TrancheCard: React.FC<TrancheCardProps> = ({
  product,
  tranche,
}) => {
  // Get names using helpers
  const trancheName = getTrancheName(tranche, product);
  const shortName = getTrancheShortName(tranche, product);
  const riskLevel = getRiskLevel(Number(tranche.threshold) / 100);

  // Use actual data from tranche/round
  const currentRound = tranche.currentRound;
  const roundState = currentRound?.state || 1; // Default to OPEN
  const premiumRate = formatPercentage(tranche.premiumRateBps);

  // Calculate days left if round is open
  const daysLeft = currentRound?.endTime
    ? Math.max(
        0,
        Math.ceil(
          (currentRound.endTime * 1000 - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Calculate utilization
  const utilization =
    currentRound?.totalSellerCollateral && tranche.trancheCap
      ? Math.min(
          (Number(currentRound.totalSellerCollateral) /
            Number(tranche.trancheCap)) *
            100,
          100,
        )
      : 0;

  // Calculate APY (premium + staking rewards estimate)
  const stakingAPY = 3.5; // Default staking APY
  const totalAPY = (Number(tranche.premiumRateBps) / 100) + stakingAPY;

  return (
    <div className="bg-[#1f2937] rounded-lg p-4">      
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold font-display text-white">{trancheName}</h3>
          <p className="mt-1 text-gray-400 text-sm">
            Trigger: -{formatPercentage(Number(tranche.threshold) / 100)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {/* Premium rate */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">Premium:</span>
            <span className="text-green-400 font-bold text-sm">{premiumRate}</span>
          </div>
          {/* APY */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">APY:</span>
            <span className="text-blue-400 font-bold text-sm">{totalAPY.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="mb-6 rounded-xl bg-gray-50 p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Premium Rate</div>
            <div className="font-semibold text-gray-900">{premiumRate}/period</div>
          </div>
          <div>
            <div className="text-gray-600">Risk Level</div>
            <div className={`font-semibold ${riskLevel.color}`}>
              {riskLevel.label}
            </div>
          </div>
          {currentRound && (
            <>
              <div>
                <div className="text-gray-600">Round Status</div>
                <div
                  className={`font-semibold ${getRoundStateTextColor(roundState)}`}
                >
                  {getRoundStateLabel(roundState)}
                  {roundState === 1 && daysLeft > 0 && ` (${daysLeft}d left)`}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Matched Amount</div>
                <div className="font-semibold text-gray-900">
                  {formatUSDT(currentRound.matchedAmount || "0")} USDT
                </div>
              </div>
              {currentRound.startTime && currentRound.endTime && (
                <div className="col-span-2">
                  <div className="text-gray-600">Sales Period</div>
                  <div className="font-semibold text-gray-900">
                    {formatDate(currentRound.startTime)} -{" "}
                    {formatDate(currentRound.endTime)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Capacity Progress Bar */}
      {currentRound?.totalSellerCollateral && tranche.trancheCap && (
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm text-gray-600">
            <span className="font-medium">Pool Capacity</span>
            <span className="font-medium">
              {formatUSDT(currentRound.totalSellerCollateral)} /{" "}
              {formatUSDT(tranche.trancheCap)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#86D99C] to-[#00B1B8] transition-all duration-500 ease-out"
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Button */}
      <Link 
        href={`/tranches/${product.productId}/${tranche.trancheId}`}
        className="block w-full text-center rounded-xl bg-gradient-to-br from-[#86D99C] to-[#00B1B8] px-4 py-3 font-semibold text-white transition-all duration-300 hover:scale-95 hover:shadow-md relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
        <span className="relative">View Details</span>
      </Link>
    </div>
  );
};
