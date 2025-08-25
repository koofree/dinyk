"use client";

import React from "react";
import Link from "next/link";
import { formatPercentage, formatUSDT } from "@/utils/calculations";
import { getTrancheName, getTrancheShortName } from "@/utils/productHelpers";
import {
  getRiskLevel,
  getRoundStateColor,
  getRoundStateLabel,
  getRoundStateTextColor,
} from "@/utils/statusMappings";

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
  
  // Calculate tranche index from trancheId (assuming encoding is productId * 10 + index)
  const trancheIndex = tranche.trancheId % 10;

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

  return (
    <div className="hover:bg-gray-750 rounded-lg bg-gray-800 p-6 transition-colors relative">
      {/* View Details Link */}
      <Link 
        href={`/insurance/tranches/${product.productId}/${trancheIndex}`}
        className="absolute top-4 right-4 text-sm text-blue-400 hover:text-blue-300 underline"
      >
        View Details →
      </Link>
      
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">{trancheName}</h3>
          <p className="mt-1 text-gray-400">
            Trigger: -{formatPercentage(Number(tranche.threshold) / 100)}
          </p>
        </div>
        <div
          className={`rounded-full px-2 py-1 text-xs ${getRoundStateColor(roundState)} mr-20`}
        >
          {shortName}
        </div>
      </div>

      {/* Details Grid */}
      <div className="mb-6 rounded-lg bg-gray-700 p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Premium Rate</div>
            <div className="font-medium text-white">{premiumRate}/period</div>
          </div>
          <div>
            <div className="text-gray-400">Risk Level</div>
            <div className={`font-medium ${riskLevel.color}`}>
              {riskLevel.label}
            </div>
          </div>
          {currentRound && (
            <>
              <div>
                <div className="text-gray-400">Round Status</div>
                <div
                  className={`font-medium ${getRoundStateTextColor(roundState)}`}
                >
                  {getRoundStateLabel(roundState)}
                  {roundState === 1 && daysLeft > 0 && ` (${daysLeft}d left)`}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Matched Amount</div>
                <div className="font-medium text-white">
                  {formatUSDT(currentRound.matchedAmount || "0")} USDT
                </div>
              </div>
              {currentRound.startTime && currentRound.endTime && (
                <div className="col-span-2">
                  <div className="text-gray-400">Sales Period</div>
                  <div className="font-medium text-white">
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
          <div className="mb-2 flex justify-between text-sm text-gray-400">
            <span>Pool Capacity</span>
            <span>
              {formatUSDT(currentRound.totalSellerCollateral)} /{" "}
              {formatUSDT(tranche.trancheCap)}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-600">
            <div
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${utilization}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Button */}
      <Link 
        href={`/insurance/tranches/${product.productId}/${trancheIndex}`}
        className="block w-full text-center rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700"
      >
        View Details
      </Link>
    </div>
  );
};
