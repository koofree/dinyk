"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useWeb3, useContracts, useProductManagement } from "@dinsure/contracts";
import { KAIA_TESTNET } from "@/lib/constants";

interface Tranche {
  trancheId: number;
  productId: number;
  triggerType: number;
  threshold: bigint;
  premiumRateBps: number;
  maturityDays: number;
  trancheCap: bigint;
  poolAddress: string;
  active: boolean;
  name?: string;
  riskLevel?: string;
}

interface Product {
  productId: number;
  name: string;
  tranches: Tranche[];
  active: boolean;
}

export default function HomePage() {
  const { isConnected } = useWeb3();
  const { isInitialized, productCatalog } = useContracts();
  const { getProducts, getActiveTranches } = useProductManagement();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCapacity, setTotalCapacity] = useState<bigint>(BigInt(0));
  const [activeTranchesCount, setActiveTranchesCount] = useState(0);
  const [premiumRange, setPremiumRange] = useState({ min: 0, max: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch real data from contracts
  useEffect(() => {
    const fetchContractData = async () => {
      if (!isInitialized || !productCatalog) {
        return;
      }
      
      setLoading(true);
      
      try {
        // Get active products and tranches from contract
        const activeProductIds = await (productCatalog as any).getActiveProducts();
        const fetchedProducts: Product[] = [];
        let totalCap = BigInt(0);
        let minPremium = 100;
        let maxPremium = 0;
        const allTranches: Tranche[] = [];
        
        // Fetch each product and its tranches
        for (const productId of activeProductIds) {
          try {
            const productInfo = await (productCatalog as any).getProduct(Number(productId));
            
            if (productInfo && Number(productInfo.productId) !== 0) {
              const productTranches: Tranche[] = [];
              
              // Get tranches for this product
              const trancheIds = productInfo.trancheIds || [];
              
              for (const trancheId of trancheIds) {
                try {
                  const tranche = await (productCatalog as any).getTranche(Number(trancheId));
                  if (tranche && Number(tranche.productId) > 0) {
                    const trancheData: Tranche = {
                      trancheId: Number(trancheId),
                      productId: Number(tranche.productId),
                      triggerType: Number(tranche.triggerType || 0),
                      threshold: tranche.threshold ? BigInt(tranche.threshold.toString()) : BigInt(0),
                      premiumRateBps: Number(tranche.premiumRateBps || 0),
                      maturityDays: Number(tranche.maturityDays || 30),
                      trancheCap: tranche.trancheCap ? BigInt(tranche.trancheCap.toString()) : BigInt(0),
                      poolAddress: tranche.poolAddress || "",
                      active: true,
                      name: `Tranche ${String.fromCharCode(65 + productTranches.length)}`,
                      riskLevel: productTranches.length === 0 ? 'LOW' : productTranches.length === 1 ? 'MEDIUM' : 'HIGH'
                    };
                    
                    productTranches.push(trancheData);
                    allTranches.push(trancheData);
                    
                    // Update totals
                    totalCap += trancheData.trancheCap;
                    const premiumPercent = trancheData.premiumRateBps / 100;
                    if (premiumPercent > 0) {
                      minPremium = Math.min(minPremium, premiumPercent);
                      maxPremium = Math.max(maxPremium, premiumPercent);
                    }
                  }
                } catch (err) {
                  console.log(`Could not fetch tranche ${trancheId}`);
                }
              }
              
              // Create product entry
              fetchedProducts.push({
                productId: Number(productId),
                name: `BTC Price Protection ${productId}`,
                tranches: productTranches,
                active: productInfo?.active || false
              });
            }
          } catch (err) {
            console.log(`Could not fetch product ${productId}`);
          }
        }
        
        // If no tranches found from products, try direct tranche query
        if (allTranches.length === 0) {
          try {
            const activeTrancheIds = await (productCatalog as any).getActiveTranches();
            
            for (const trancheId of activeTrancheIds) {
              try {
                const tranche = await (productCatalog as any).getTranche(Number(trancheId));
                
                if (tranche && Number(tranche.productId) > 0 && Number(tranche.premiumRateBps) > 0) {
                  const trancheData: Tranche = {
                    trancheId: Number(trancheId),
                    productId: Number(tranche.productId),
                    triggerType: Number(tranche.triggerType || 0),
                    threshold: tranche.threshold ? BigInt(tranche.threshold.toString()) : BigInt(0),
                    premiumRateBps: Number(tranche.premiumRateBps || 0),
                    maturityDays: Number(tranche.maturityDays || 30),
                    trancheCap: tranche.trancheCap ? BigInt(tranche.trancheCap.toString()) : BigInt(0),
                    poolAddress: tranche.poolAddress || "",
                    active: true,
                    name: `Tranche ${trancheId}`,
                    riskLevel: 'MEDIUM'
                  };
                  
                  allTranches.push(trancheData);
                  totalCap += trancheData.trancheCap;
                  const premiumPercent = trancheData.premiumRateBps / 100;
                  if (premiumPercent > 0) {
                    minPremium = Math.min(minPremium, premiumPercent);
                    maxPremium = Math.max(maxPremium, premiumPercent);
                  }
                }
              } catch (err) {
                // Continue
              }
            }
          } catch (err) {
            console.error("Error fetching active tranches:", err);
          }
        }
        
        setProducts(fetchedProducts);
        setTotalCapacity(totalCap);
        setActiveTranchesCount(allTranches.length);
        setPremiumRange({ 
          min: minPremium === 100 ? 3 : minPremium, 
          max: maxPremium === 0 ? 8 : maxPremium 
        });
      } catch (error) {
        console.error('Error fetching contract data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContractData();
  }, [isInitialized, productCatalog, getProducts, getActiveTranches]);

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
                href="/tranches"
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
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {loading ? (
                <span className="text-xl">Loading...</span>
              ) : (
                `$${(Number(totalCapacity) / 1e6).toFixed(0)}${Number(totalCapacity) >= 1e6 ? 'M' : 'K'}`
              )}
            </div>
            <div className="text-gray-400">Total Capacity</div>
            <div className="text-xs text-gray-500 mt-1">
              {loading ? '-' : `${activeTranchesCount} Active Tranches`}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {loading ? '-' : activeTranchesCount}
            </div>
            <div className="text-gray-400">Risk Tranches</div>
            <div className="text-xs text-gray-500 mt-1">BTC Protection</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {loading ? '-' : `${premiumRange.min}-${premiumRange.max}%`}
            </div>
            <div className="text-gray-400">Premium Range</div>
            <div className="text-xs text-gray-500 mt-1">30-Day Maturity</div>
          </div>
        </div>

        {/* Live Insurance Products */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Live Insurance Products
          </h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-white">Loading insurance products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400">No insurance products available</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.flatMap(product => 
                product.tranches.slice(0, 4).map((tranche) => (
                  <div key={tranche.trancheId} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white">{tranche.name || `Tranche ${tranche.trancheId}`}</h3>
                      <span className="text-2xl">₿</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Trigger:</span>
                        <span className="text-white">
                          {tranche.triggerType === 0 ? '<' : '>'} ${(Number(tranche.threshold) / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Premium:</span>
                        <span className="text-white">{(tranche.premiumRateBps / 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Capacity:</span>
                        <span className="text-white">
                          ${Number(tranche.trancheCap) >= 1e6 
                            ? `${(Number(tranche.trancheCap) / 1e6).toFixed(0)}M`
                            : `${(Number(tranche.trancheCap) / 1e3).toFixed(0)}K`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk:</span>
                        <span className={`font-medium ${
                          tranche.riskLevel === 'LOW' ? 'text-green-400' :
                          tranche.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {tranche.riskLevel || 'MEDIUM'}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/tranches/${tranche.productId}/${tranche.trancheId}`}
                      className="block w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-lg transition-colors text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
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