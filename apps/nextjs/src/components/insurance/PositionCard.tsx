"use client";

import React from "react";
import { UserPosition } from "@/lib/types";

interface PositionCardProps {
  position: UserPosition;
  onClaim?: (positionId: string) => void;
  onWithdraw?: (positionId: string) => void;
}

export const PositionCard: React.FC<PositionCardProps> = ({ 
  position, 
  onClaim, 
  onWithdraw 
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'claimable': return 'text-blue-400';
      case 'expired': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active': return '●';
      case 'claimable': return '✓';
      case 'expired': return '○';
      default: return '○';
    }
  };

  const getRoundStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'settlement': return 'text-yellow-400';
      case 'completed': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  if (position.type === 'insurance') {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-white font-medium">Policy #{position.id}</h3>
            <p className="text-gray-400 text-sm">{position.tranche}</p>
          </div>
          <div className={`flex items-center gap-1 ${getStatusColor(position.status)}`}>
            <span>{getStatusIcon(position.status)}</span>
            <span className="text-sm capitalize">{position.status}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-gray-400 text-sm">Coverage</div>
            <div className="text-white font-medium">${parseInt(position.coverage || '0').toLocaleString()} USDT</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Premium Paid</div>
            <div className="text-white font-medium">${position.premiumPaid} USDT</div>
          </div>
        </div>

        {position.status === 'active' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Expires in</span>
              <span className="text-white">{position.expiresIn} days</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Current {position.asset}</span>
              <span className="text-white">${position.currentPrice?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Trigger at</span>
              <span className="text-white">${position.triggerPrice?.toLocaleString()}</span>
            </div>
          </div>
        )}

        {position.status === 'claimable' && (
          <div className="mb-4">
            <div className="bg-gradient-to-br from-[#86D99C]/20 to-[#00B1B8]/20 border border-[#86D99C] rounded-lg p-3">
              <div className="text-blue-400 font-medium">Payout Available</div>
              <div className="text-blue-300 text-2xl font-bold">${position.payout} USDT</div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {position.status === 'claimable' && onClaim && (
            <button
              onClick={() => onClaim(position.id)}
              className="flex-1 relative bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white py-2 px-4 rounded-lg transition-all duration-300 hover:scale-98 hover:shadow-lg group overflow-hidden"
            >
                              <span className="font-outfit">Claim Now</span>
            </button>
          )}
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
            View Details
          </button>
        </div>
      </div>
    );
  }

  // Liquidity position
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-medium">{position.tranche}</h3>
          <p className="text-gray-400 text-sm">{position.asset} Pool</p>
        </div>
        <div className={`flex items-center gap-1 ${getRoundStatusColor(position.roundStatus)}`}>
          <span>●</span>
          <span className="text-sm capitalize">{position.roundStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-gray-400 text-sm">Deposited</div>
          <div className="text-white font-medium">${parseInt(position.deposited || '0').toLocaleString()} USDT</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Current Value</div>
          <div className="text-white font-medium">${parseInt(position.currentValue || '0').toLocaleString()} USDT</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-gray-400 text-sm">Earned Premium</div>
          <div className="text-green-400 font-medium">${position.earnedPremium} USDT</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Staking Rewards</div>
          <div className="text-green-400 font-medium">${position.stakingRewards} USDT</div>
        </div>
      </div>

      {position.roundStatus === 'active' && (
        <div className="mb-4">
          <div className="text-gray-400 text-sm">Round ends in</div>
          <div className="text-white">{position.daysLeft} days</div>
        </div>
      )}

      <div className="flex gap-2">
        {position.roundStatus === 'settlement' && onWithdraw && (
          <button
            onClick={() => onWithdraw(position.id)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Withdraw Available
          </button>
        )}
        {position.roundStatus === 'active' && (
          <button className="flex-1 bg-gray-600 text-gray-400 py-2 px-4 rounded-lg cursor-not-allowed">
            Withdraw After Round
          </button>
        )}
        <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
          Add More
        </button>
      </div>
    </div>
  );
};