"use client";

import React, { useEffect, useState, useRef } from "react";
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

// Progress bar component
function ProgressBar({ label, value, maxValue = 100, isVisible = false }: { label: string; value: number; maxValue?: number; isVisible?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const duration = 1500;
      const steps = 60;
      const increment = value / steps;
      const progressIncrement = (value / maxValue) * 100 / steps;
      let current = 0;
      let currentProgress = 0;
      
      const timer = setInterval(() => {
        current += increment;
        currentProgress += progressIncrement;
        
        if (current >= value) {
          current = value;
          currentProgress = (value / maxValue) * 100;
          clearInterval(timer);
        }
        
        setDisplayValue(Math.floor(current));
        setProgressWidth(currentProgress);
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isVisible, value, maxValue]);

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span className="font-bold">{label}</span>
        <span className={isVisible ? 'count-animate' : ''}>{displayValue}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-[#86D99C] to-[#00B1B8] h-2 rounded-full transition-all duration-1500 ease-out"
          style={{ width: isVisible ? `${progressWidth}%` : '0%' }}
        />
      </div>
    </div>
  );
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
  const [isProgressVisible, setIsProgressVisible] = useState(false);
  const [heroAnimations, setHeroAnimations] = useState({
    logo: false,
    title: false,
    subtitle: false,
    description: false,
    buttons: false
  });
  const [mounted, setMounted] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  // Track mounting state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Intersection observer for progress bars
  useEffect(() => {
    if (!mounted) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsProgressVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (progressRef.current) {
      observer.observe(progressRef.current);
    }

    return () => observer.disconnect();
  }, [mounted]);

  // Hero Section sequential animation
  useEffect(() => {
    if (!mounted) return;
    
    const timer1 = setTimeout(() => setHeroAnimations(prev => ({ ...prev, logo: true })), 200);
    const timer2 = setTimeout(() => setHeroAnimations(prev => ({ ...prev, title: true })), 400);
    const timer3 = setTimeout(() => setHeroAnimations(prev => ({ ...prev, subtitle: true })), 600);
    const timer4 = setTimeout(() => setHeroAnimations(prev => ({ ...prev, description: true })), 800);
    const timer5 = setTimeout(() => setHeroAnimations(prev => ({ ...prev, buttons: true })), 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [mounted]);

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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className={`transition-all duration-700 ${heroAnimations.logo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <img src="/images/BI.svg" alt="DIN Logo" className="h-16 w-auto mx-auto mb-8" />
            </div>
            <h1 className={`text-5xl md:text-7xl font-bold font-display text-gray-900 mb-6 transition-all duration-700 ${heroAnimations.title ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              DIN Protocol
              <span className={`block text-transparent bg-clip-text bg-gradient-to-r from-[#86D99C] to-[#00B1B8] transition-all duration-700 delay-200 ${heroAnimations.subtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                Decentralized Insurance on Kaia
              </span>
            </h1>
            <p className={`text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto transition-all duration-700 delay-400 ${heroAnimations.description ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              On-chain parametric insurance with automatic oracle-triggered payouts.
              100% collateralized pools with NFT insurance tokens.
            </p>
            <div className={`flex justify-center items-center gap-4 mb-8 transition-all duration-700 delay-600 ${heroAnimations.buttons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full font-medium">
                ● Live on Testnet
              </span>
              <a 
                href={`${KAIA_TESTNET.blockExplorer}/address/${KAIA_TESTNET.contracts.productCatalog}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                View Contracts ↗
              </a>
              <a 
                href={KAIA_TESTNET.faucet}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Get Test KLAY ↗
              </a>
            </div>
            
            <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-700 delay-800 ${heroAnimations.buttons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Link
                href="/insurance"
                className="relative bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white px-8 py-4 rounded-2xl text-lg font-semibold font-outfit transition-all duration-300 hover:scale-95 hover:shadow-lg group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                <span className="relative">Buy Insurance</span>
              </Link>
              <Link
                href="/tranches"
                className="bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 px-8 py-4 rounded-2xl text-lg font-semibold font-outfit transition-all duration-300"
              >
                Provide Liquidity
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16" ref={progressRef}>
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-[#86D99C] to-[#00B1B8] mb-2">
              {loading ? (
                <span className="text-2xl text-gray-400">Loading...</span>
              ) : (
                `$${(Number(totalCapacity) / 1e6).toFixed(0)}${Number(totalCapacity) >= 1e6 ? 'M' : 'K'}`
              )}
            </div>
            <div className="text-gray-700 font-medium">Total Capacity</div>
            <div className="text-sm text-gray-500 mt-2">
              {loading ? '-' : `${activeTranchesCount} Active Tranches`}
            </div>
            {!loading && (
              <div className="mt-4">
                <ProgressBar 
                  label="Capacity Filled" 
                  value={75} 
                  maxValue={100} 
                  isVisible={isProgressVisible} 
                />
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="text-4xl font-bold font-display text-gray-900 mb-2">
              {loading ? '-' : activeTranchesCount}
            </div>
            <div className="text-gray-700 font-medium">Risk Tranches</div>
            <div className="text-sm text-gray-500 mt-2">BTC Protection</div>
            {!loading && (
              <div className="mt-4">
                <ProgressBar 
                  label="Active Tranches" 
                  value={activeTranchesCount} 
                  maxValue={10} 
                  isVisible={isProgressVisible} 
                />
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="text-4xl font-bold font-display text-gray-900 mb-2">
              {loading ? '-' : `${premiumRange.min}-${premiumRange.max}%`}
            </div>
            <div className="text-gray-700 font-medium">Premium Range</div>
            <div className="text-sm text-gray-500 mt-2">30-Day Maturity</div>
            {!loading && (
              <div className="mt-4">
                <ProgressBar 
                  label="Average Premium" 
                  value={(premiumRange.min + premiumRange.max) / 2} 
                  maxValue={10} 
                  isVisible={isProgressVisible} 
                />
              </div>
            )}
          </div>
        </div>

        {/* Live Insurance Products */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold font-display text-gray-900 mb-12 text-center">
            Live Insurance Products
          </h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading insurance products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">No insurance products available</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.flatMap(product => 
                product.tranches.slice(0, 4).map((tranche) => (
                  <div key={tranche.trancheId} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold font-display text-gray-900">{tranche.name || `Tranche ${tranche.trancheId}`}</h3>
                      <img src="/images/BTC.svg" alt="BTC" className="w-8 h-8" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trigger:</span>
                        <span className="text-gray-900 font-semibold">
                          {tranche.triggerType === 0 ? '<' : '>'} ${(Number(tranche.threshold) / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Premium:</span>
                        <span className="text-gray-900 font-semibold">{(tranche.premiumRateBps / 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Capacity:</span>
                        <span className="text-gray-900 font-semibold">
                          ${Number(tranche.trancheCap) >= 1e6 
                            ? `${(Number(tranche.trancheCap) / 1e6).toFixed(0)}M`
                            : `${(Number(tranche.trancheCap) / 1e3).toFixed(0)}K`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Risk:</span>
                        <span className={`font-bold px-2 py-1 rounded-lg text-xs ${
                          tranche.riskLevel === 'LOW' ? 'bg-green-100 text-green-700' :
                          tranche.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {tranche.riskLevel || 'MEDIUM'}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/tranches/${tranche.productId}/${tranche.trancheId}`}
                      className="block w-full mt-6 relative bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white text-center py-3 rounded-xl font-semibold font-outfit transition-all duration-300 group-hover:scale-95 group-hover:shadow-md overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      <span className="relative">View Details</span>
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="text-center">
          <h2 className="text-4xl font-bold font-display text-gray-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="text-5xl mb-6">🛡️</div>
              <h3 className="text-2xl font-bold font-display text-gray-900 mb-4">For Insurance Buyers</h3>
              <ul className="text-gray-600 text-left space-y-3">
                <li className="flex items-start">
                  <span className="text-[#86D99C] mr-2">•</span>
                  <span>Browse available insurance products</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#86D99C] mr-2">•</span>
                  <span>Select coverage amount and duration</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#86D99C] mr-2">•</span>
                  <span>Pay premium to secure protection</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#86D99C] mr-2">•</span>
                  <span>Receive automatic payouts when triggered</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="text-5xl mb-6">💰</div>
              <h3 className="text-2xl font-bold font-display text-gray-900 mb-4">For Liquidity Providers</h3>
              <ul className="text-gray-600 text-left space-y-3">
                <li className="flex items-start">
                  <span className="text-[#00B1B8] mr-2">•</span>
                  <span>Deposit USDT into insurance pools</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00B1B8] mr-2">•</span>
                  <span>Earn premiums from insurance sales</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00B1B8] mr-2">•</span>
                  <span>Receive additional staking rewards</span>
                </li>
                <li className="flex items-start">
                  <span className="text-[#00B1B8] mr-2">•</span>
                  <span>Withdraw funds after pool periods</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <h3 className="text-2xl font-bold font-display text-gray-900 mb-3">Get Started</h3>
              <p className="text-gray-600 mb-4">
                Connect your wallet to start using DIN insurance platform
              </p>
              <p className="text-gray-500 text-sm">
                Supports MetaMask, Kaikas, and other Web3 wallets
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}