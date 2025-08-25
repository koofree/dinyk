"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@dinsure/ui/card";
import { Badge } from "@dinsure/ui/badge";
import { Progress } from "@dinsure/ui/progress";
import { TrendingUp, Users, DollarSign, Shield } from "lucide-react";
import { formatUnits } from "ethers";

interface PoolCardProps {
  pool: {
    address: string;
    totalAssets: bigint;
    totalShares: bigint;
    availableLiquidity: bigint;
    totalActiveCoverage: bigint;
  };
  nav?: {
    totalAssets: bigint;
    sharePrice: bigint;
  };
  round?: {
    state: number;
    totalBuyerOrders: bigint;
    totalSellerCollateral: bigint;
    matchedAmount: bigint;
  };
}

export function PoolCard({ pool, nav, round }: PoolCardProps) {
  const utilizationRate = pool.totalAssets > 0n
    ? Number((pool.totalActiveCoverage * 10000n) / pool.totalAssets) / 100
    : 0;

  const getStateLabel = (state: number) => {
    const states = ["Announced", "Open", "Matched", "Active", "Matured", "Settled", "Canceled"];
    return states[state] || "Unknown";
  };

  const getStateColor = (state: number) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-yellow-100 text-yellow-800",
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-gray-100 text-gray-800",
      "bg-red-100 text-red-800"
    ];
    return colors[state] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Pool Overview</CardTitle>
            <CardDescription className="text-xs mt-1">
              {pool.address.slice(0, 6)}...{pool.address.slice(-4)}
            </CardDescription>
          </div>
          {round && (
            <Badge className={getStateColor(round.state)}>
              {getStateLabel(round.state)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span className="text-xs">Total Value Locked</span>
            </div>
            <p className="text-sm font-semibold">
              ${Number(formatUnits(pool.totalAssets, 6)).toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Share Price</span>
            </div>
            <p className="text-sm font-semibold">
              ${nav ? (Number(nav.sharePrice) / 1e6).toFixed(4) : "1.0000"}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span className="text-xs">Active Coverage</span>
            </div>
            <p className="text-sm font-semibold">
              ${Number(formatUnits(pool.totalActiveCoverage, 6)).toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span className="text-xs">Available Liquidity</span>
            </div>
            <p className="text-sm font-semibold">
              ${Number(formatUnits(pool.availableLiquidity, 6)).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Utilization Rate</span>
            <span className="font-medium">{utilizationRate.toFixed(1)}%</span>
          </div>
          <Progress value={utilizationRate} className="h-2" />
        </div>

        {round && (
          <div className="pt-2 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Current Round</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Orders: </span>
                <span className="font-medium">
                  ${Number(formatUnits(round.totalBuyerOrders, 6)).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Matched: </span>
                <span className="font-medium">
                  ${Number(formatUnits(round.matchedAmount, 6)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}