"use client";

import { PositionCard } from "@/components/insurance/PositionCard";
import { useUserPortfolio, useWeb3 } from "@dinsure/contracts";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function PortfolioPage() {
  const { isConnected, account } = useWeb3();
  const [activeTab, setActiveTab] = useState<'insurance' | 'liquidity' | 'history'>('insurance');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isPoliciesExpanded, setIsPoliciesExpanded] = useState(false);
  const [isPositionsExpanded, setIsPositionsExpanded] = useState(false);
  const [currency, setCurrency] = useState<'USDT' | 'KRW'>('USDT');
  
  const {
    insurancePositions,
    liquidityPositions,
    portfolioSummary,
    isLoading,
    error,
    claimInsurance,
    withdrawLiquidity,
    refetch
  } = useUserPortfolio();

  const handleClaim = async (positionId: string) => {
    setProcessingId(positionId);
    try {
      await claimInsurance(positionId);
      toast.success(`Successfully claimed payout for position ${positionId}!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to claim insurance";
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleWithdraw = async (positionId: string) => {
    setProcessingId(positionId);
    try {
      await withdrawLiquidity(positionId);
      toast.success(`Successfully withdrew funds from position ${positionId}!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to withdraw liquidity";
      toast.error(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
      
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold font-display text-gray-900 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-8">
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
          <div className="text-center py-16">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold font-display text-gray-900 mb-4">Error Loading Portfolio</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={() => refetch()}
              className="bg-gradient-to-br from-[#86D99C] to-[#00B1B8] hover:scale-95 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
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
          <h1 className="text-[40px] mobile:text-[42px] font-bold text-gray-900 mb-4 font-display break-words leading-tight">My Portfolio</h1>
          <p className="text-gray-600 text-[18px] mobile:text-[20px] mb-8 break-words leading-tight">
            Manage your insurance policies and liquidity positions
          </p>
        </div>

        {/* Portfolio Overview */}
        <div className="mb-8">
          <h2 className="text-[30px] font-bold text-gray-900 mb-4 font-display">Portfolio Overview</h2>
          <div className="w-full h-px bg-gray-200 mb-8"></div>
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 flex flex-col justify-between h-full">
              <div className="flex justify-between items-center mb-2">
                <div className="text-gray-600 text-sm">Total Coverage</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrency('USDT')}
                    className={`text-xs px-2 py-1 rounded ${currency === 'USDT' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                  >
                    USDT
                  </button>
                  <button
                    onClick={() => setCurrency('KRW')}
                    className={`text-xs px-2 py-1 rounded ${currency === 'KRW' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                  >
                    KRW
                  </button>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {currency === 'KRW' ? `₩${(portfolioSummary.totalInsuranceCoverage * 1300).toLocaleString()}` : `$${portfolioSummary.totalInsuranceCoverage.toLocaleString()}`} <span className="text-sm text-gray-400">{currency}</span>
              </div>
              <div className="mt-auto">
                <button 
                  onClick={() => setIsPoliciesExpanded(!isPoliciesExpanded)}
                  className="flex items-center gap-1 text-green-600 text-sm hover:text-green-700 transition-colors"
                >
                  <span>{portfolioSummary.activeInsuranceCount} active policies</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${isPoliciesExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isPoliciesExpanded && insurancePositions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {insurancePositions.map((position: any) => (
                      <div key={position.id} className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                        <div className="font-medium">Policy #{position.tokenId}</div>
                        <div>{position.productName} - {position.trancheName}</div>
                        <div>Coverage: ${position.coverageAmount?.toLocaleString() ?? '0'} USDT</div>
                        <div className="text-gray-500">Expires: {position.expiryDate ? new Date(position.expiryDate).toLocaleDateString() : 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="w-full h-px bg-gray-200"></div>
            <div className="p-4 flex flex-col justify-between h-full">
              <div className="text-gray-600 text-sm mb-2">Liquidity Provided</div>
              <div className="text-2xl font-bold text-gray-900">
                {currency === 'KRW' ? `₩${(portfolioSummary.totalLiquidityValue * 1300).toLocaleString()}` : `$${portfolioSummary.totalLiquidityValue.toLocaleString()}`} <span className="text-sm text-gray-400">{currency}</span>
              </div>
              <div className="mt-auto">
                <button 
                  onClick={() => setIsPositionsExpanded(!isPositionsExpanded)}
                  className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-700 transition-colors"
                >
                  <span>{portfolioSummary.activeLiquidityCount} pool positions</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${isPositionsExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isPositionsExpanded && liquidityPositions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {liquidityPositions.map((position: any) => (
                      <div key={position.id} className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                        <div className="font-medium">{position.productName} - {position.trancheName}</div>
                        <div>Deposited: ${position.depositAmount?.toLocaleString() ?? '0'} USDT</div>
                        <div>Current Value: ${position.currentValue?.toLocaleString() ?? '0'} USDT</div>
                        <div className="text-green-600">
                          Earned: ${typeof position.earnedPremium === 'number' ? position.earnedPremium.toFixed(2) : parseFloat(position.earnedPremium || '0').toFixed(2)} USDT
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="w-full h-px bg-gray-200"></div>
            <div className="p-4 flex flex-col justify-between h-full">
              <div className="text-gray-600 text-sm mb-2">Total Earnings</div>
              <div className="text-2xl font-bold text-gray-900">
                {currency === 'KRW' ? `₩${(portfolioSummary.totalEarnings * 1300).toLocaleString()}` : `$${portfolioSummary.totalEarnings.toFixed(2)}`} <span className="text-sm text-gray-400">{currency}</span>
              </div>
              <div className="mt-auto space-y-2">
                <div className="text-yellow-600 text-sm">
                  Premiums + Staking rewards
                </div>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="text-gray-500 text-xs">
                    Earnings vs. capital: <span className="text-green-600">{currency === 'KRW' ? `₩${(portfolioSummary.totalEarnings * 1300).toFixed(0)}` : `$${portfolioSummary.totalEarnings.toFixed(0)}`}</span> earned on {currency === 'KRW' ? `₩${(portfolioSummary.totalLiquidityValue * 1300).toLocaleString()}` : `$${portfolioSummary.totalLiquidityValue.toLocaleString()}`} liquidity = <span className="text-green-600">{portfolioSummary.totalLiquidityValue > 0 ? ((portfolioSummary.totalEarnings / portfolioSummary.totalLiquidityValue) * 100).toFixed(1) : '0'}%</span> return
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full h-px bg-gray-200 mt-8"></div>
        </div>
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 mb-8 border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('insurance')}
            className={`flex-1 py-3 px-4 text-sm font-bold transition-colors ${
              activeTab === 'insurance'
                ? 'bg-[#374151] text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{ borderRadius: activeTab === 'insurance' ? '12px' : '0px' }}
          >
            Active Insurance ({insurancePositions.length})
          </button>
          <button
            onClick={() => setActiveTab('liquidity')}
            className={`flex-1 py-3 px-4 text-sm font-bold transition-colors ${
              activeTab === 'liquidity'
                ? 'bg-[#374151] text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{ borderRadius: activeTab === 'liquidity' ? '12px' : '0px' }}
          >
            LP Positions ({liquidityPositions.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 px-4 text-sm font-bold transition-colors ${
              activeTab === 'history'
                ? 'bg-[#374151] text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{ borderRadius: activeTab === 'history' ? '12px' : '0px' }}
          >
            History
          </button>
        </div>
            
        {/* Tab Content */}
        {activeTab === 'insurance' && (
          <div className="space-y-4">
            {insurancePositions.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {insurancePositions.map((position: any) => (
                  <PositionCard
                    key={position.id}
                    position={position}
                    onClaim={handleClaim}
                    isProcessing={processingId === position.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🛡️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Insurance Policies</h3>
                <p className="text-gray-600 mb-6">
                  You don't have any active insurance policies yet
                </p>
                <a
                  href="/insurance"
                  className="inline-block bg-gradient-to-br from-[#86D99C] to-[#00B1B8] hover:from-[#00B1B8] hover:to-[#86D99C] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-95"
                >
                  Browse Insurance Products
                </a>
              </div>
            )}
          </div>
        )}

        {activeTab === 'liquidity' && (
          <div className="space-y-4">
            {liquidityPositions.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {liquidityPositions.map((position: any) => (
                  <PositionCard
                    key={position.id}
                    position={position}
                    onWithdraw={handleWithdraw}
                    isProcessing={processingId === position.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Liquidity Positions</h3>
                <p className="text-gray-600 mb-6">
                  You haven't provided liquidity to any pools yet
                </p>
                <Link
                  href="/tranches"
                  className="inline-block bg-gradient-to-br from-[#86D99C] to-[#00B1B8] hover:from-[#00B1B8] hover:to-[#86D99C] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-95"
                >
                  Provide Liquidity
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Transaction History</h3>
              <p className="text-gray-600">
                Coming soon - View your complete transaction history
              </p>
            </div>
          </div>
        )}
    </div>
  );
}