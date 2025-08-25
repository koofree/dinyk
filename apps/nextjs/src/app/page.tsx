"use client";

import React from "react";
import Link from "next/link";
import { useWeb3 } from "@dinsure/contracts";
import { KAIA_TESTNET, INSURANCE_PRODUCTS } from "@/lib/constants";

export default function HomePage() {
  const { isConnected } = useWeb3();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              DIN Protocol
              <span className="block text-blue-400">Decentralized Insurance on Kaia</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              On-chain parametric insurance with automatic oracle-triggered payouts.
              100% collateralized pools with NFT insurance tokens.
            </p>
            <div className="flex justify-center items-center gap-4 mb-6">
              <span className="text-sm text-green-400 bg-green-900 px-3 py-1 rounded">
                ● Live on Testnet
              </span>
              <a 
                href={`${KAIA_TESTNET.blockExplorer}/address/${KAIA_TESTNET.contracts.productCatalog}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                View Contracts ↗
              </a>
              <a 
                href={KAIA_TESTNET.faucet}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Get Test KLAY ↗
              </a>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/insurance"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors"
              >
                Buy Insurance
              </Link>
              <Link
                href="/liquidity"
                className="bg-transparent border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white px-8 py-4 rounded-lg text-lg font-medium transition-all"
              >
                Provide Liquidity
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <div className="text-3xl font-bold text-blue-400 mb-2">$425K</div>
            <div className="text-gray-400">Total Capacity</div>
            <div className="text-xs text-gray-500 mt-1">4 Active Tranches</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <div className="text-3xl font-bold text-green-400 mb-2">{INSURANCE_PRODUCTS[0].tranches.length}</div>
            <div className="text-gray-400">Risk Tranches</div>
            <div className="text-xs text-gray-500 mt-1">BTC Protection</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <div className="text-3xl font-bold text-yellow-400 mb-2">3-8%</div>
            <div className="text-gray-400">Premium Range</div>
            <div className="text-xs text-gray-500 mt-1">30-Day Maturity</div>
          </div>
        </div>

        {/* Live Insurance Products */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Live Insurance Products
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {INSURANCE_PRODUCTS[0].tranches.map((tranche) => (
              <div key={tranche.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">{tranche.name}</h3>
                  <span className="text-2xl">₿</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trigger:</span>
                    <span className="text-white">
                      {tranche.triggerType === 'PRICE_BELOW' ? '<' : '>'} ${(tranche.triggerPrice / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Premium:</span>
                    <span className="text-white">{tranche.premium}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Capacity:</span>
                    <span className="text-white">${parseInt(tranche.capacity) / 1000}K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk:</span>
                    <span className={`font-medium ${
                      tranche.riskLevel === 'LOW' ? 'text-green-400' :
                      tranche.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {tranche.riskLevel}
                    </span>
                  </div>
                </div>
                <Link
                  href="/insurance"
                  className="block w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-lg transition-colors text-sm"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-white mb-4">For Insurance Buyers</h3>
              <ul className="text-gray-400 text-left space-y-2">
                <li>• Browse available insurance products</li>
                <li>• Select coverage amount and duration</li>
                <li>• Pay premium to secure protection</li>
                <li>• Receive automatic payouts when triggered</li>
              </ul>
            </div>

            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-white mb-4">For Liquidity Providers</h3>
              <ul className="text-gray-400 text-left space-y-2">
                <li>• Deposit USDT into insurance pools</li>
                <li>• Earn premiums from insurance sales</li>
                <li>• Receive additional staking rewards</li>
                <li>• Withdraw funds after pool periods</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="mt-16 text-center">
            <div className="bg-blue-900 border border-blue-600 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-400 mb-2">Get Started</h3>
              <p className="text-blue-300 mb-4">
                Connect your wallet to start using DIN insurance platform
              </p>
              <p className="text-blue-400 text-sm">
                Supports MetaMask, Kaikas, and other Web3 wallets
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}