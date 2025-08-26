"use client";

import { PositionCard } from "@/components/insurance/PositionCard";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useUserPortfolio, useWeb3 } from "@dinsure/contracts";

export default function PortfolioPage() {
  const { isConnected } = useWeb3();
  const [activeTab, setActiveTab] = useState<
    "insurance" | "liquidity" | "history"
  >("insurance");
  const [isPoliciesExpanded, setIsPoliciesExpanded] = useState(false);
  const [isPositionsExpanded, setIsPositionsExpanded] = useState(false);
  const [currency, setCurrency] = useState<"USDT" | "KRW">("USDT");

  const {
    insurancePositions,
    liquidityPositions,
    portfolioSummary,
    isLoading,
    error,
    refetch,
  } = useUserPortfolio();  

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">🔗</div>
          <h2 className="font-display mb-4 text-2xl font-bold text-gray-900">
            Connect Your Wallet
          </h2>
          <p className="mb-8 text-gray-600">
            Please connect your wallet to view your portfolio
          </p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching data
  if (isLoading && !insurancePositions.length && !liquidityPositions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#00B1B8]" />
          <span className="ml-3 text-gray-600">Loading portfolio...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
        <div className="py-16 text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="font-display mb-4 text-2xl font-bold text-gray-900">
            Error Loading Portfolio
          </h2>
          <p className="mb-8 text-gray-600">{error}</p>
          <button
            onClick={() => refetch()}
            className="rounded-xl bg-gradient-to-br from-[#86D99C] to-[#00B1B8] px-6 py-3 font-semibold text-white transition-all duration-300 hover:scale-95"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
      {/* Header */}
      <div className="mb-16">
        <h1 className="mobile:text-[42px] font-display mb-4 break-words text-[40px] font-bold leading-tight text-gray-900">
          My Portfolio
        </h1>
        <p className="mobile:text-[20px] mb-8 break-words text-[18px] leading-tight text-gray-600">
          Manage your insurance policies and liquidity positions
        </p>
      </div>

      {/* Portfolio Overview */}
      <div className="mb-8">
        <h2 className="font-display mb-4 text-[30px] font-bold text-gray-900">
          Portfolio Overview
        </h2>
        <div className="mb-8 h-px w-full bg-gray-200"></div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex h-full flex-col justify-between p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-gray-600">Total Coverage</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrency("USDT")}
                  className={`rounded px-2 py-1 text-xs ${currency === "USDT" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                >
                  USDT
                </button>
                <button
                  onClick={() => setCurrency("KRW")}
                  className={`rounded px-2 py-1 text-xs ${currency === "KRW" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}
                >
                  KRW
                </button>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {currency === "KRW"
                ? `₩${(portfolioSummary.totalInsuranceCoverage * 1300).toLocaleString()}`
                : `$${portfolioSummary.totalInsuranceCoverage.toLocaleString()}`}{" "}
              <span className="text-sm text-gray-400">{currency}</span>
            </div>
            <div className="mt-auto">
              <button
                onClick={() => setIsPoliciesExpanded(!isPoliciesExpanded)}
                className="flex items-center gap-1 text-sm text-green-600 transition-colors hover:text-green-700"
              >
                <span>
                  {portfolioSummary.activeInsuranceCount} active policies
                </span>
                <svg
                  className={`h-4 w-4 transition-transform ${isPoliciesExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isPoliciesExpanded && insurancePositions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {insurancePositions.map((position) => (
                    <div
                      key={position.id}
                      className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600"
                    >
                      <div className="font-medium">
                        Policy #{position.tokenId}
                      </div>
                      <div>
                        {position.productId} - {position.trancheId}
                      </div>
                      <div>
                        Coverage: $
                        {position.coverageAmount?.toLocaleString() ?? "0"} USDT
                      </div>
                      <div className="text-gray-500">
                        Expires:{" "}
                        {position.expiryDate
                          ? new Date(position.expiryDate).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div className="flex h-full flex-col justify-between p-4">
            <div className="mb-2 text-sm text-gray-600">Liquidity Provided</div>
            <div className="text-2xl font-bold text-gray-900">
              {currency === "KRW"
                ? `₩${(portfolioSummary.totalLiquidityValue * 1300).toLocaleString()}`
                : `$${portfolioSummary.totalLiquidityValue.toLocaleString()}`}{" "}
              <span className="text-sm text-gray-400">{currency}</span>
            </div>
            <div className="mt-auto">
              <button
                onClick={() => setIsPositionsExpanded(!isPositionsExpanded)}
                className="flex items-center gap-1 text-sm text-blue-600 transition-colors hover:text-blue-700"
              >
                <span>
                  {portfolioSummary.activeLiquidityCount} pool positions
                </span>
                <svg
                  className={`h-4 w-4 transition-transform ${isPositionsExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isPositionsExpanded && liquidityPositions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {liquidityPositions.map((position: any) => (
                    <div
                      key={position.id}
                      className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600"
                    >
                      <div className="font-medium">
                        {position.productName} - {position.trancheName}
                      </div>
                      <div>
                        Deposited: $
                        {position.depositAmount?.toLocaleString() ?? "0"} USDT
                      </div>
                      <div>
                        Current Value: $
                        {position.currentValue?.toLocaleString() ?? "0"} USDT
                      </div>
                      <div className="text-green-600">
                        Earned: $
                        {typeof position.earnedPremium === "number"
                          ? position.earnedPremium.toFixed(2)
                          : parseFloat(position.earnedPremium || "0").toFixed(
                              2,
                            )}{" "}
                        USDT
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="h-px w-full bg-gray-200"></div>
          <div className="flex h-full flex-col justify-between p-4">
            <div className="mb-2 text-sm text-gray-600">Total Earnings</div>
            <div className="text-2xl font-bold text-gray-900">
              {currency === "KRW"
                ? `₩${(portfolioSummary.totalEarnings * 1300).toLocaleString()}`
                : `$${portfolioSummary.totalEarnings.toFixed(2)}`}{" "}
              <span className="text-sm text-gray-400">{currency}</span>
            </div>
            <div className="mt-auto space-y-2">
              <div className="text-sm text-yellow-600">
                Premiums + Staking rewards
              </div>
              <div className="space-y-2 rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-500">
                  Earnings vs. capital:{" "}
                  <span className="text-green-600">
                    {currency === "KRW"
                      ? `₩${(portfolioSummary.totalEarnings * 1300).toFixed(0)}`
                      : `$${portfolioSummary.totalEarnings.toFixed(0)}`}
                  </span>{" "}
                  earned on{" "}
                  {currency === "KRW"
                    ? `₩${(portfolioSummary.totalLiquidityValue * 1300).toLocaleString()}`
                    : `$${portfolioSummary.totalLiquidityValue.toLocaleString()}`}{" "}
                  liquidity ={" "}
                  <span className="text-green-600">
                    {portfolioSummary.totalLiquidityValue > 0
                      ? (
                          (portfolioSummary.totalEarnings /
                            portfolioSummary.totalLiquidityValue) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %
                  </span>{" "}
                  return
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 h-px w-full bg-gray-200"></div>
      </div>
      {/* Tab Navigation */}
      <div className="mb-8 flex space-x-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => setActiveTab("insurance")}
          className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
            activeTab === "insurance"
              ? "bg-[#374151] text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
          style={{ borderRadius: activeTab === "insurance" ? "12px" : "0px" }}
        >
          Active Insurance ({insurancePositions.length})
        </button>
        <button
          onClick={() => setActiveTab("liquidity")}
          className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
            activeTab === "liquidity"
              ? "bg-[#374151] text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
          style={{ borderRadius: activeTab === "liquidity" ? "12px" : "0px" }}
        >
          LP Positions ({liquidityPositions.length})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
            activeTab === "history"
              ? "bg-[#374151] text-white"
              : "text-gray-600 hover:text-gray-900"
          }`}
          style={{ borderRadius: activeTab === "history" ? "12px" : "0px" }}
        >
          History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "insurance" && (
        <div className="space-y-4">
          {insurancePositions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {insurancePositions.map((position) => (
                <PositionCard
                  key={position.id}
                  position={position}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mb-4 text-4xl">🛡️</div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                No Insurance Policies
              </h3>
              <p className="mb-6 text-gray-600">
                You don't have any active insurance policies yet
              </p>
              <a
                href="/insurance"
                className="inline-block rounded-lg bg-gradient-to-br from-[#86D99C] to-[#00B1B8] px-6 py-3 text-white transition-all duration-300 hover:scale-95 hover:from-[#00B1B8] hover:to-[#86D99C]"
              >
                Browse Insurance Products
              </a>
            </div>
          )}
        </div>
      )}

      {activeTab === "liquidity" && (
        <div className="space-y-4">
          {liquidityPositions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {liquidityPositions.map((position) => (
                <PositionCard
                  key={position.id}
                  position={position}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mb-4 text-4xl">💰</div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                No Liquidity Positions
              </h3>
              <p className="mb-6 text-gray-600">
                You haven't provided liquidity to any pools yet
              </p>
              <Link
                href="/tranches"
                className="inline-block rounded-lg bg-gradient-to-br from-[#86D99C] to-[#00B1B8] px-6 py-3 text-white transition-all duration-300 hover:scale-95 hover:from-[#00B1B8] hover:to-[#86D99C]"
              >
                Provide Liquidity
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mb-4 text-4xl">📊</div>
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Transaction History
            </h3>
            <p className="text-gray-600">
              Coming soon - View your complete transaction history
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
