"use client";

import React from "react";
import Link from "next/link";
import { useWeb3 } from "@/context/Web3Provider";

export default function HomePage() {
  const { isConnected } = useWeb3();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Decentralized Insurance
              <span className="block text-blue-400">on Kaia</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Protect your crypto assets with on-chain parametric insurance products.
              Earn premiums by providing liquidity to insurance pools.
            </p>
            
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
            <div className="text-3xl font-bold text-blue-400 mb-2">$2.5M</div>
            <div className="text-gray-400">Total TVL</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <div className="text-3xl font-bold text-green-400 mb-2">12</div>
            <div className="text-gray-400">Active Pools</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <div className="text-3xl font-bold text-yellow-400 mb-2">$125K</div>
            <div className="text-gray-400">Total Premiums</div>
          </div>
        </div>

        {/* Featured Insurance Products */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Featured Insurance Products
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">BTC Protection</h3>
                <span className="text-2xl">₿</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Trigger:</span>
                  <span className="text-white">-10%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">7 Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Premium:</span>
                  <span className="text-white">5%</span>
                </div>
              </div>
              <Link
                href="/insurance"
                className="block w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-lg transition-colors"
              >
                View Details
              </Link>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">ETH Protection</h3>
                <span className="text-2xl">Ξ</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Trigger:</span>
                  <span className="text-white">-15%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">14 Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Premium:</span>
                  <span className="text-white">8%</span>
                </div>
              </div>
              <Link
                href="/insurance"
                className="block w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-lg transition-colors"
              >
                View Details
              </Link>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">KLAY Protection</h3>
                <span className="text-2xl">🔷</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Trigger:</span>
                  <span className="text-white">-20%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">30 Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Premium:</span>
                  <span className="text-white">12%</span>
                </div>
              </div>
              <Link
                href="/insurance"
                className="block w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-lg transition-colors"
              >
                View Details
              </Link>
            </div>
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