"use client";

import { KAIA_TESTNET } from "@/lib/constants";
import { useContracts, useProductManagement, useWeb3 } from "@dinsure/contracts";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "~/context/LanguageProvider";

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
  const { t } = useLanguage();
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
        setTotalCapacity(totalCap / BigInt(1e6));
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className={`transition-all duration-700 ${heroAnimations.logo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <img src="/images/BI-symbol.svg" alt="DIN Logo" className="h-16 w-auto mx-auto mb-8" />
            </div>
            <h1 className={`text-5xl md:text-7xl font-bold font-display text-gray-900 mb-6 transition-all duration-700 ${heroAnimations.title ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Decentralized Insurance
              <span className={`block text-transparent bg-clip-text bg-gradient-to-r from-[#86D99C] to-[#00B1B8] transition-all duration-700 delay-200 ${heroAnimations.subtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                on Kaia
              </span>
            </h1>
            <p className={`text-lg md:text-[18px] text-gray-600 mb-8 max-w-3xl mx-auto font-semibold font-outfit leading-tight transition-all duration-700 ease-out ${
              heroAnimations.description ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              {t('hero.description')}
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
          <div className="bg-white rounded-lg p-6 text-left border border-gray-200 shadow-sm hover:cursor-pointer group">
            <div className="w-10 h-10 mb-3">
              <Image src="/images/1.svg" alt="TVL Icon" className="w-full h-full" width={40} height={40} />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2 font-outfit">
              {loading ? (
                <span className="text-2xl text-gray-400">Loading...</span>
              ) : (
                `$${(Number(totalCapacity) / 1e6).toFixed(0)}${Number(totalCapacity) >= 1e6 ? 'M' : 'K'}`
              )}
            </div>
            <div className="text-gray-600 font-medium mb-3 font-outfit">{t('metrics.totalTVL')} (Total Value Locked)</div>
            <div className="text-gray-500 text-sm leading-relaxed">
              Higher TVL means more trust and bigger trading capacity.
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 text-left border border-gray-200 shadow-sm hover:cursor-pointer group">
          <div className="w-10 h-10 mb-3">
              <Image src="/images/2.svg" alt="TVL Icon" className="w-full h-full" width={40} height={40} />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2 font-outfit">
              {loading ? <span className="text-2xl text-gray-400">Loading...</span> : activeTranchesCount}
            </div>
            <div className="text-gray-600 font-medium mb-3 font-outfit">{t('metrics.activePools')}</div>
            <div className="text-gray-500 text-sm leading-relaxed">
              More pools mean more trading pairs supported.
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 text-left border border-gray-200 shadow-sm hover:cursor-pointer group">
          <div className="w-10 h-10 mb-3">
              <Image src="/images/3.svg" alt="TVL Icon" className="w-full h-full" width={40} height={40} />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2 font-outfit">
              {loading ? <span className="text-2xl text-gray-400">Loading...</span> : `${premiumRange.min}-${premiumRange.max}%`}
            </div>
            <div className="text-gray-600 font-medium mb-3 font-outfit">{t('metrics.totalPremiums')}</div>
            <div className="text-gray-500 text-sm leading-relaxed">
              Higher premium means more active trading or subscriptions.
            </div>
          </div>
        </div>

        <div className="text-left mb-12 bg-[#F3FEF6] rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 font-header">
            Hedge your downside risk with simple, on-chain insurance products. 🚀
          </h3>
          <p className="text-base text-gray-700 max-w-3xl">
            From crypto volatility to special events — cover unexpected risks with DIN.
          </p>
        </div>

        {/* Live Insurance Products */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-left font-header">
            Available DIN Protection Plans
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
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#F3FEF6] rounded-2xl p-8 text-left">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Insurance Buyers</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• Browse available insurance products</li>
                <li>• Select coverage amount and duration</li>
                <li>• Pay premium to secure protection</li>
                <li>• Receive automatic payouts when triggered</li>
              </ul>
            </div>

            <div className="bg-[#F3FEF6] rounded-2xl p-8 text-left">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Liquidity Providers</h3>
              <ul className="text-gray-700 text-left space-y-2">
                <li>• Deposit USDT into insurance pools</li>
                <li>• Earn premiums from insurance sales</li>
                <li>• Receive additional staking rewards</li>
                <li>• Withdraw funds after pool periods</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      
      <div className="text-center py-8 pb-20">
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
      </div>
      </div>
    </div>
  );
}