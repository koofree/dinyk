 
 
 
 
 
"use client";

import type { UserPosition } from "@dinsure/contracts";
import React from "react";
import { useNames } from "~/hooks/useNames";

interface PositionCardProps {
  position: UserPosition;
  onClaim?: (positionId: string) => void;
  onWithdraw?: (positionId: string) => void;
  isProcessing?: boolean;
}

/**
 * This is a card that displays the position details.
 * 
 * It is used in the *portfolio* page to display the position details.
 * 
 * @param position - The position details
 * @param onClaim - The function to call when the user clicks the "Claim Now" button
 * @param onWithdraw - The function to call when the user clicks the "Withdraw Available" button
 * @param isProcessing - Whether the position is being processed
 * @returns A position card
 */
export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  onClaim,
  onWithdraw,
  isProcessing = false,
}) => {
  const { getTrancheName } = useNames();
  
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "text-green-400";
      case "claimable":
        return "text-blue-400";
      case "expired":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "active":
        return "●";
      case "claimable":
        return "✓";
      case "expired":
        return "○";
      default:
        return "○";
    }
  };

  const getRoundStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "text-green-400";
      case "settlement":
        return "text-yellow-400";
      case "completed":
        return "text-gray-400";
      default:
        return "text-gray-400";
    }
  };

  if (position.type === "insurance") {
    const insurancePosition = position;
    return (
      <div className="min-w-[250px] rounded-lg border border-gray-700 bg-gray-800 p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-medium text-white">{insurancePosition.asset}</h3>
            <p className="text-sm text-gray-400">{getTrancheName(insurancePosition.trancheId)}</p>
          </div>
          <div
            className={`flex items-center gap-1 ${getStatusColor(insurancePosition.status)}`}
          >
            <span>{getStatusIcon(insurancePosition.status)}</span>
            <span className="text-sm capitalize">{insurancePosition.status}</span>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-400">Coverage</div>
            <div className="font-medium text-white">
              ${parseInt(position.coverage ?? "0").toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Premium Paid</div>
            <div className="font-medium text-white">
              ${parseFloat(position.premiumPaid ?? "0").toFixed(2)}
            </div>
          </div>
        </div>

        {position.status === "active" && (
          <div className="mb-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-400">Expires in</span>
              <span className="text-white">{position.expiresIn} days</span>
            </div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-400">Current {position.asset}</span>
              <span className="text-white">
                ${insurancePosition.baseline?.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Trigger at</span>
              <span className="text-white">
                ${insurancePosition.triggerPrice?.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {position.status === "claimable" && (
          <div className="mb-4">
            <div className="rounded-lg border border-blue-600 bg-blue-900 p-3">
              <div className="font-medium text-blue-400">Payout Available</div>
              <div className="text-2xl font-bold text-blue-300">
                ${parseFloat(insurancePosition.claimAmount ?? "0").toFixed(2)} USDT
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {position.status === "claimable" && onClaim && (
            <button
              onClick={() => onClaim(position.id)}
              disabled={isProcessing}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Claim Now"}
            </button>
          )}
          <a
            href={`/tranches/${position.productId}/${position.trancheId}`}
            className="flex flex-1 items-center justify-center rounded-lg bg-gradient-to-br from-[#86D99C] to-[#00B1B8] py-2 text-center font-semibold text-white transition-all duration-300 hover:from-[#00B1B8] hover:to-[#86D99C]"
          >
            View Details
          </a>
        </div>
      </div>
    );
  }

  // Liquidity position

  const liquidityPosition = position;
  return (
    <div className="min-w-[250px] rounded-lg border border-gray-700 bg-gray-800 p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-medium text-white">{liquidityPosition.asset}</h3>
          <p className="text-sm text-gray-400">{getTrancheName(liquidityPosition.trancheId)}</p>
        </div>
        <div
          className={`flex items-center gap-1 ${getRoundStatusColor(liquidityPosition.roundStatus)}`}
        >
          <span>{getStatusIcon(liquidityPosition.roundStatus)}</span>
          <span className="text-sm capitalize">{liquidityPosition.roundStatus}</span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-400">Deposited</div>
          <div className="font-medium text-white">
            ${parseInt(liquidityPosition.deposited ?? "0").toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Current Value</div>
          <div className="font-medium text-white">
            ${parseInt(liquidityPosition.currentValue ?? "0").toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-400">Earned Premium</div>
          <div className="font-medium text-green-400">
            ${parseFloat(liquidityPosition.earnedPremium ?? "0").toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Staking Rewards</div>
          <div className="font-medium text-green-400">
            ${parseFloat(liquidityPosition.stakingRewards ?? "0").toFixed(2)}
          </div>
        </div>
      </div>

      {position.roundStatus === "active" && (
        <div className="mb-4">
          <div className="text-sm text-gray-400">Round ends in</div>
          <div className="text-white">{liquidityPosition.endTime.toLocaleDateString()}</div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {position.roundStatus === "settled" && onWithdraw && (
          <button
            onClick={() => onWithdraw(position.id)}
            disabled={isProcessing}
            className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Withdraw Available"}
          </button>
        )}

        <a
          href={`/tranches/${position.productId}/${position.trancheId}`}
          className="flex flex-1 items-center justify-center rounded-lg bg-gradient-to-br from-[#86D99C] to-[#00B1B8] py-2 text-center font-semibold text-white transition-all duration-300 hover:from-[#00B1B8] hover:to-[#86D99C]"
        >
          View Details
        </a>
      </div>
    </div>
  );
};
