"use client";

import { InsuranceProductCard } from "@/components/insurance/InsuranceProductCard";
import { ACTIVE_NETWORK, useContracts, useProductManagement, useWeb3 } from "@dinsure/contracts";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "~/context/LanguageProvider";

interface InsuranceProduct {
  productId: number;
  name: string;
  triggerType: number;
  threshold: bigint;
  maturityDays: number;
  premiumRateBps: number;
  buyerCount: number;
  providerCount: number;
  totalCapacity: bigint;
  active: boolean;
}

export default function HomePage() {
  const { isConnected } = useWeb3();
  const { isInitialized, productCatalog } = useContracts();
  const { getProducts, getActiveTranches } = useProductManagement();
  
  const [insuranceProducts, setInsuranceProducts] = useState<InsuranceProduct[]>([]);
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
        // Get active products from contract
        const activeProductIds = await (productCatalog as any).getActiveProducts();
        const fetchedProducts: InsuranceProduct[] = [];
        let totalCap = BigInt(0);
        let minPremium = 100;
        let maxPremium = 0;
        let totalTranches = 0;
        
        // Fetch each product and aggregate data
        for (const productId of activeProductIds) {
          try {
            const productInfo = await (productCatalog as any).getProduct(Number(productId));
            
            if (productInfo && Number(productInfo.productId) !== 0) {
              let productCapacity = BigInt(0);
              let avgPremium = 0;
              let avgMaturity = 0;
              let avgThreshold = BigInt(0);
              let triggerType = 0;
              let trancheCount = 0;
              
              // Get tranches for this product to calculate averages
              const trancheIds = productInfo.trancheIds || [];
              
              for (const trancheId of trancheIds) {
                try {
                  const tranche = await (productCatalog as any).getTranche(Number(trancheId));
                  if (tranche && Number(tranche.productId) > 0) {
                    productCapacity += tranche.trancheCap ? BigInt(tranche.trancheCap.toString()) : BigInt(0);
                    avgPremium += Number(tranche.premiumRateBps || 0);
                    avgMaturity += Number(tranche.maturityDays || 30);
                    avgThreshold += tranche.threshold ? BigInt(tranche.threshold.toString()) : BigInt(0);
                    triggerType = Number(tranche.triggerType || 0);
                    trancheCount++;
                    totalTranches++;
                    
                    const premiumPercent = Number(tranche.premiumRateBps) / 100;
                    if (premiumPercent > 0) {
                      minPremium = Math.min(minPremium, premiumPercent);
                      maxPremium = Math.max(maxPremium, premiumPercent);
                    }
                  }
                } catch (err) {
                  console.log(`Could not fetch tranche ${trancheId}`);
                }
              }
              
              if (trancheCount > 0) {
                // Calculate averages
                avgPremium = Math.round(avgPremium / trancheCount);
                avgMaturity = Math.round(avgMaturity / trancheCount);
                avgThreshold = avgThreshold / BigInt(trancheCount);
                
                // Mock buyer and provider counts (in production, fetch from actual pool data)
                const buyerCount = Math.floor(Math.random() * 50) + 10;
                const providerCount = Math.floor(Math.random() * 30) + 5;
                
                // Create aggregated product entry
                fetchedProducts.push({
                  productId: Number(productId),
                  name: `BTC Price Protection`,
                  triggerType: triggerType,
                  threshold: avgThreshold,
                  maturityDays: avgMaturity,
                  premiumRateBps: avgPremium,
                  buyerCount: buyerCount,
                  providerCount: providerCount,
                  totalCapacity: productCapacity,
                  active: productInfo?.active || false
                });
                
                totalCap += productCapacity;
              }
            }
          } catch (err) {
            console.log(`Could not fetch product ${productId}`);
          }
        }
        
        // Sort by total capacity and take top 3
        fetchedProducts.sort((a, b) => Number(b.totalCapacity - a.totalCapacity));
        const topProducts = fetchedProducts.slice(0, 3);
        
        setInsuranceProducts(topProducts);
        setTotalCapacity(totalCap / BigInt(1e6));
        setActiveTranchesCount(totalTranches);
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
                href={`${ACTIVE_NETWORK.blockExplorer}/address/${ACTIVE_NETWORK.contracts.productCatalog}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                View Contracts ↗
              </a>
              <a 
                href={ACTIVE_NETWORK.faucet}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Get Test KAIA ↗
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

        {/* Top Insurance Products */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-left font-header">
            Available DIN Protection Plans
          </h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading insurance products...</div>
            </div>
          ) : insuranceProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">No insurance products available</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {insuranceProducts.map((product) => (
                <InsuranceProductCard key={product.productId} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* How It Works */}
        
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
    </div>
  );
}