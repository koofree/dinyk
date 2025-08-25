"use client";

import React, { useState } from "react";
import { PositionCard } from "@/components/insurance/PositionCard";
import { useWeb3 } from "@/context/Web3Provider";
import { MOCK_USER_POSITIONS, MOCK_LP_POSITIONS } from "@/lib/constants";
import { Navbar } from "@/components/common/Navbar";
import { SuccessModal } from "@/components/common/SuccessModal";

export default function PortfolioPage() {
  const { isConnected, account } = useWeb3();
  const [activeTab, setActiveTab] = useState<'insurance' | 'liquidity' | 'history'>('insurance');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isPoliciesExpanded, setIsPoliciesExpanded] = useState(false);
  const [isPositionsExpanded, setIsPositionsExpanded] = useState(false);
  const [currency, setCurrency] = useState<'USDT' | 'KRW'>('USDT');

  const handleClaim = async (positionId: string) => {
    console.log(`Claiming position ${positionId}`);
    // Mock claim transaction
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSuccessMessage(`Successfully claimed payout for position ${positionId}!`);
    setIsSuccessModalOpen(true);
  };

  const handleWithdraw = async (positionId: string) => {
    console.log(`Withdrawing from position ${positionId}`);
    // Mock withdraw transaction
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSuccessMessage(`Successfully withdrew funds from position ${positionId}!`);
    setIsSuccessModalOpen(true);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Navbar />
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 pt-15 pb-15 mt-16">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔗</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-8">
              Please connect your wallet to view your portfolio
            </p>
          </div>
        </div>
      </div>
    );
  }

  const insurancePositions = MOCK_USER_POSITIONS.filter(p => p.type === 'insurance');
  const liquidityPositions = MOCK_LP_POSITIONS.filter(p => p.type === 'liquidity');

  const totalInsuranceCoverage = insurancePositions.reduce((sum, pos) => {
    return sum + parseInt(pos.coverage || '0');
  }, 0);

  const totalLiquidityValue = liquidityPositions.reduce((sum, pos) => {
    return sum + parseInt(pos.currentValue || '0');
  }, 0);

  const totalEarnings = liquidityPositions.reduce((sum, pos) => {
    return sum + parseFloat(pos.earnedPremium || '0') + parseFloat(pos.stakingRewards || '0');
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Navbar />
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 pt-15 pb-15 mt-16">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-[40px] mobile:text-[42px] font-bold text-gray-900 mb-4 font-display break-words leading-tight">My Portfolio</h1>
          <p className="text-gray-600 text-[18px] mobile:text-[20px] mb-8 break-words leading-tight">
            Manage your insurance policies and liquidity positions
          </p>
        </div>

        {/* Portfolio Overview */}
        <div className="mb-8 Portfolio-Overview">
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
                {currency === 'KRW' ? `₩${(totalInsuranceCoverage * 1300).toLocaleString()}` : `$${totalInsuranceCoverage.toLocaleString()}`} <span className="text-sm text-gray-400">{currency}</span>
              </div>
              <div className="mt-auto" style={{ margin: 0 }}>
                <button 
                  onClick={() => {
                    console.log('Policies button clicked, current state:', isPoliciesExpanded);
                    setIsPoliciesExpanded(!isPoliciesExpanded);
                  }}
                  className="flex items-center gap-1 text-green-600 text-sm hover:text-green-700 transition-colors"
                >
                  <span>{insurancePositions.length} active policies</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${isPoliciesExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isPoliciesExpanded && (
                  <div className="mt-3 space-y-2">
                    {insurancePositions.map((position) => (
                      <div key={position.id} className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                        <div className="font-medium">Policy #{position.id}</div>
                        <div>Maturity on {position.expiresIn ? `${position.expiresIn} days` : 'N/A'}</div>
                        {position.asset && position.triggerPrice && position.currentPrice && (
                          <div>
                            Condition: {position.asset} {position.triggerPrice > 0 ? '+' : ''}{position.triggerPrice}%
                            <br />
                            <span className="text-gray-500">
                              (Current {position.asset} ${position.currentPrice?.toLocaleString()}, Trigger at ${position.triggerPrice?.toLocaleString()})
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="w-full h-px bg-gray-200 mx-4"></div>
            <div className="p-4 flex flex-col justify-between h-full">
              <div className="text-gray-600 text-sm mb-2">Liquidity Provided</div>
              <div className="text-2xl font-bold text-gray-900">
                {currency === 'KRW' ? `₩${(totalLiquidityValue * 1300).toLocaleString()}` : `$${totalLiquidityValue.toLocaleString()}`} <span className="text-sm text-gray-400">{currency}</span>
              </div>
              <div className="mt-auto" style={{ margin: 0 }}>
                <button 
                  onClick={() => {
                    console.log('Positions button clicked, current state:', isPositionsExpanded);
                    setIsPositionsExpanded(!isPositionsExpanded);
                  }}
                  className="flex items-center gap-1 text-blue-600 text-sm hover:text-blue-700 transition-colors"
                >
                  <span>{liquidityPositions.length} pool positions</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${isPositionsExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isPositionsExpanded && (
                  <div className="mt-3 space-y-2">
                    {liquidityPositions.map((position) => (
                      <div key={position.id} className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                        <div className="font-medium">{position.tranche}</div>
                        <div>{position.asset} Pool</div>
                        <div>Deposited: ${parseInt(position.deposited || '0').toLocaleString()} USDT</div>
                        <div>Current Value: ${parseInt(position.currentValue || '0').toLocaleString()} USDT</div>
                        <div className="text-green-600">
                          Earned: ${position.earnedPremium} USDT + ${position.stakingRewards} USDT
                        </div>
                      </div>
                    ))}
                  </div>
                                )}
              </div>
            </div>
            <div className="w-full h-px bg-gray-200 mx-4"></div>
            <div className="p-4 flex flex-col justify-between h-full">
              <div className="text-gray-600 text-sm mb-2">Total Earnings</div>
            <div className="text-2xl font-bold text-gray-900">
              {currency === 'KRW' ? `₩${(totalEarnings * 1300).toLocaleString()}` : `$${totalEarnings.toFixed(2)}`} <span className="text-sm text-gray-400">{currency}</span>
            </div>
            <div className="mt-auto space-y-2">
              <div className="text-yellow-600 text-sm">
                Premiums + Staking rewards
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="text-gray-500 text-xs">
                  Earnings vs. capital: <span className="text-green-600">{currency === 'KRW' ? `₩${(totalEarnings * 1300).toFixed(0)}` : `$${totalEarnings.toFixed(0)}`}</span> earned on {currency === 'KRW' ? `₩${(totalLiquidityValue * 1300).toLocaleString()}` : `$${totalLiquidityValue.toLocaleString()}`} liquidity = <span className="text-green-600">{totalLiquidityValue > 0 ? ((totalEarnings / totalLiquidityValue) * 100).toFixed(1) : '0'}%</span> return
                </div>
                <div className="text-gray-500 text-xs">
                  Claimable now: <span className="text-green-600">{currency === 'KRW' ? `₩${(120 * 1300).toLocaleString()}` : `$${120.00}`}</span>
                </div>
                <div className="text-gray-500 text-xs">
                  Already settled: <span className="text-green-600">{currency === 'KRW' ? `₩${(322 * 1300).toLocaleString()}` : `$${322.00}`}</span>
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
            className={`flex-1 px-4 text-sm font-bold transition-colors ${
              activeTab === 'insurance'
                ? 'bg-[#374151] text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={{ height: '54px', borderRadius: activeTab === 'insurance' ? '12px' : '0px' }}
            style={{ borderRadius: activeTab === 'insurance' ? '12px' : '0px' }}
          >
            Active Insurance ({insurancePositions.length})
          </button>
          <button
            onClick={() => setActiveTab('liquidity')}
            className={`flex-1 py-2 px-4 text-sm font-bold transition-colors ${
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
            className={`flex-1 py-2 px-4 text-sm font-bold transition-colors ${
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
                {insurancePositions.map((position) => (
                  <PositionCard
                    key={position.id}
                    position={position}
                    onClaim={handleClaim}
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
                {liquidityPositions.map((position) => (
                  <PositionCard
                    key={position.id}
                    position={position}
                    onWithdraw={handleWithdraw}
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
                <a
                  href="/liquidity"
                  className="inline-block bg-gradient-to-br from-[#86D99C] to-[#00B1B8] hover:from-[#00B1B8] hover:to-[#86D99C] text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-95"
                >
                  Provide Liquidity
                </a>
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

        {/* Success Modal */}
        <SuccessModal
          message={successMessage}
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
        />
      </div>

      {/* Footer Section */}
      <div className="text-center pb-20" style={{ paddingTop: '60px' }}>
        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-6">
            <div className="rounded-lg p-6">
              <p className="text-gray-400 mb-4">
                Connect your wallet to start using DIN insurance platform
              </p>
              <p className="text-gray-400 text-sm">
                Supports MetaMask, Kaikas, and other Web3 wallets
              </p>
            </div>
          </div>
        )}
        
        {/* Footer Logo */}
        <img src="/images/bi-symbol.svg" alt="DIN Logo" className="h-12 w-auto mx-auto" style={{ filter: 'brightness(0) saturate(100%) invert(80%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)' }} />
        
        {/* Footer Text */}
        <div className="mt-6">
          <p className="text-gray-400 mb-4">
            Connect your wallet to start using DIN insurance platform
          </p>
          <p className="text-gray-400 text-sm">
            Supports MetaMask, Kaikas, and other Web3 wallets
          </p>
        </div>
      </div>
    </div>
  );
}