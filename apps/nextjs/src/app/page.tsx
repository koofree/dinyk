"use client";

import { InsuranceProductCard } from "@/components/insurance/InsuranceProductCard";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  ACTIVE_NETWORK,
  ORACLE_ROUTE_ID_TO_TYPE,
  useContracts,
  useProductManagement,
  useWeb3
} from "@dinsure/contracts";

import { useLanguage } from "~/context/LanguageProvider";

export interface InsuranceProduct {
  productId: number;
  name: string;
  asset: string;
  triggerType: number;
  threshold: bigint;
  maturityDays: number;
  premiumRateBps: number;
  totalCapacity: bigint;
  active: boolean;
}

export default function HomePage() {
  const { provider } = useWeb3();
  const { isInitialized, productCatalog } = useContracts(provider);
  
  const { getProducts, getActiveTranches } = useProductManagement();

  const [insuranceProducts, setInsuranceProducts] = useState<
    InsuranceProduct[]
  >([]);
  const [totalCapacity, setTotalCapacity] = useState<bigint>(BigInt(0));
  const [activeTranchesCount, setActiveTranchesCount] = useState(0);
  const [premiumRange, setPremiumRange] = useState({ min: 0, max: 0 });
  const [loading, setLoading] = useState(true);

  const [heroAnimations, setHeroAnimations] = useState({
    logo: false,
    title: false,
    subtitle: false,
    description: false,
    buttons: false,
  });
  const [mounted, setMounted] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  // Track mounting state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hero Section sequential animation
  useEffect(() => {
    if (!mounted) return;

    const timer1 = setTimeout(
      () => setHeroAnimations((prev) => ({ ...prev, logo: true })),
      200,
    );
    const timer2 = setTimeout(
      () => setHeroAnimations((prev) => ({ ...prev, title: true })),
      400,
    );
    const timer3 = setTimeout(
      () => setHeroAnimations((prev) => ({ ...prev, subtitle: true })),
      600,
    );
    const timer4 = setTimeout(
      () => setHeroAnimations((prev) => ({ ...prev, description: true })),
      800,
    );
    const timer5 = setTimeout(
      () => setHeroAnimations((prev) => ({ ...prev, buttons: true })),
      1000,
    );

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
        const activeProductIds = await productCatalog.getActiveProducts().then(ids => ids.filter(id => id > BigInt(1)));
        const fetchedProducts: InsuranceProduct[] = [];
        let totalCap = BigInt(0);
        let minPremium = 100;
        let maxPremium = 0;
        let totalTranches = 0;

        // Store products by asset type
        const productsByAsset: Record<string, InsuranceProduct[]> = {
          BTC: [],
          ETH: [],
          KAIA: []
        };

        // Fetch each product and collect tranches by asset
        for (const productId of activeProductIds) {
          try {
            const productInfo = await productCatalog.getProduct(
              Number(productId),
            );

            if (Number(productInfo.productId) !== 0) {
              // Get tranches for this product
              const trancheIds = productInfo.trancheIds;

              for (const trancheId of trancheIds) {
                try {
                  const tranche = await productCatalog.getTranche(
                    Number(trancheId),
                  );
                  if (Number(tranche.productId) > 0) {
                    const oracleRouteId = tranche.oracleRouteId as unknown as keyof typeof ORACLE_ROUTE_ID_TO_TYPE;
                    const asset = ORACLE_ROUTE_ID_TO_TYPE[oracleRouteId]?.split("-")[0] ?? 'UNKNOWN';
                    
                    const productCapacity = tranche.trancheCap
                      ? BigInt(tranche.trancheCap.toString())
                      : BigInt(0);
                    
                    totalCap += productCapacity;
                    totalTranches++;

                    const premiumPercent = Number(tranche.premiumRateBps) / 100;
                    if (premiumPercent > 0) {
                      minPremium = Math.min(minPremium, premiumPercent);
                      maxPremium = Math.max(maxPremium, premiumPercent);
                    }

                    // Create product entry for this specific tranche
                    const product: InsuranceProduct = {
                      productId: Number(productId),
                      asset: asset,
                      name: ORACLE_ROUTE_ID_TO_TYPE[oracleRouteId],
                      triggerType: Number(tranche.triggerType || 0),
                      threshold: tranche.threshold
                        ? BigInt(tranche.threshold.toString())
                        : BigInt(0),
                      maturityDays: Math.round(Number(tranche.maturityTimestamp || 0) / 86400 / 1000),
                      premiumRateBps: Number(tranche.premiumRateBps || 0),
                      totalCapacity: productCapacity,
                      active: productInfo.active,
                    };

                    // Store by asset type
                    if (asset in productsByAsset) {
                      productsByAsset[asset]?.push(product);
                    }
                  }
                } catch (err) {
                  console.log(`Could not fetch tranche ${trancheId}`, err);
                }
              }
            }
          } catch (err) {
            console.log(`Could not fetch product ${productId}`, err);
          }
        }

        // Select one random tranche for each asset type
        const topProducts: InsuranceProduct[] = [];
        
        for (const asset of ['BTC', 'ETH', 'KAIA']) {
          const assetProducts = productsByAsset[asset];
          if (assetProducts && assetProducts.length > 0) {
            // Select a random tranche for this asset
            const randomIndex = Math.floor(Math.random() * assetProducts.length);
            topProducts.push(assetProducts[randomIndex]!);
          }
        }

        setInsuranceProducts(topProducts);
        setTotalCapacity(totalCap / BigInt(1e6));
        setActiveTranchesCount(totalTranches);
        setPremiumRange({
          min: minPremium === 100 ? 3 : minPremium,
          max: maxPremium === 0 ? 8 : maxPremium,
        });
      } catch (error) {
        console.error("Error fetching contract data:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchContractData();
  }, [isInitialized, productCatalog, getProducts, getActiveTranches]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl py-24">
          <div className="text-center">
            <div
              className={`transition-all duration-700 ${heroAnimations.logo ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              <img
                src="/images/BI-symbol.svg"
                alt="DIN Logo"
                className="mx-auto mb-8 h-16 w-auto"
              />
            </div>
            <h1
              className={`font-display mb-6 text-5xl font-bold text-gray-900 transition-all duration-700 md:text-7xl ${heroAnimations.title ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              Decentralized Insurance
              <span
                className={`block bg-gradient-to-r from-[#86D99C] to-[#00B1B8] bg-clip-text text-transparent transition-all delay-200 duration-700 ${heroAnimations.subtitle ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
              >
                on Kaia
              </span>
            </h1>
            <p
              className={`font-outfit mx-auto mb-8 max-w-3xl text-lg font-semibold leading-tight text-gray-600 transition-all duration-700 ease-out md:text-[18px] ${
                heroAnimations.description
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
            >
              {t("hero.description")}
            </p>

            <div
              className={`delay-600 mb-8 flex items-center justify-center gap-4 transition-all duration-700 ${heroAnimations.buttons ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-600">
                ● Live on Testnet
              </span>
              <a
                href={`${ACTIVE_NETWORK.blockExplorer}/address/${ACTIVE_NETWORK.contracts.ProductCatalog}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                View Contracts ↗ 
              </a>
              <a
                href={`/faucet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                Get USDT for Testing ↗
              </a>
            </div>

            <div
              className={`delay-800 flex flex-col items-center justify-center gap-4 transition-all duration-700 sm:flex-row ${heroAnimations.buttons ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
            >
              <Link
                href="/insurance"
                className="font-outfit group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#86D99C] to-[#00B1B8] px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:scale-95 hover:shadow-lg"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <span className="relative">Buy Insurance</span>
              </Link>
              <Link
                href="/tranches"
                className="font-outfit rounded-2xl border-2 border-gray-200 bg-white px-8 py-4 text-lg font-semibold text-gray-700 transition-all duration-300 hover:border-gray-300 hover:bg-gray-50"
              >
                Provide Liquidity
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="mx-auto max-w-7xl pt-0 pb-16">
        <div
          className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-3"
          ref={progressRef}
        >
          <div className="group rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm hover:cursor-pointer">
            <div className="mb-3 h-10 w-10">
              <Image
                src="/images/1.svg"
                alt="TVL Icon"
                className="h-full w-full"
                width={40}
                height={40}
              />
            </div>
            <div className="font-outfit mb-2 text-3xl font-bold text-gray-800">
              {loading ? (
                <span className="text-2xl text-gray-400">Loading...</span>
              ) : (
                `$${(Number(totalCapacity) / 1e6).toFixed(0)}${Number(totalCapacity) >= 1e6 ? "M" : "K"}`
              )}
            </div>
            <div className="font-outfit mb-3 font-medium text-gray-600">
              {t("metrics.totalTVL")} (Total Value Locked)
            </div>
            <div className="text-sm leading-relaxed text-gray-500">
              Higher TVL means more trust and bigger trading capacity.
            </div>
          </div>
          <div className="group rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm hover:cursor-pointer">
            <div className="mb-3 h-10 w-10">
              <Image
                src="/images/2.svg"
                alt="TVL Icon"
                className="h-full w-full"
                width={40}
                height={40}
              />
            </div>
            <div className="font-outfit mb-2 text-3xl font-bold text-gray-800">
              {loading ? (
                <span className="text-2xl text-gray-400">Loading...</span>
              ) : (
                activeTranchesCount
              )}
            </div>
            <div className="font-outfit mb-3 font-medium text-gray-600">
              {t("metrics.activePools")}
            </div>
            <div className="text-sm leading-relaxed text-gray-500">
              More pools mean more trading pairs supported.
            </div>
          </div>
          <div className="group rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm hover:cursor-pointer">
            <div className="mb-3 h-10 w-10">
              <Image
                src="/images/3.svg"
                alt="TVL Icon"
                className="h-full w-full"
                width={40}
                height={40}
              />
            </div>
            <div className="font-outfit mb-2 text-3xl font-bold text-gray-800">
              {loading ? (
                <span className="text-2xl text-gray-400">Loading...</span>
              ) : (
                `${premiumRange.min}-${premiumRange.max}%`
              )}
            </div>
            <div className="font-outfit mb-3 font-medium text-gray-600">
              {t("metrics.totalPremiums")}
            </div>
            <div className="text-sm leading-relaxed text-gray-500">
              Higher premium means more active trading or subscriptions.
            </div>
          </div>
        </div>

        <div className="mb-12 rounded-2xl bg-[#F3FEF6] border border-[#BEF2CC] p-8 text-left">
          <h3 className="font-header mb-2 text-2xl font-bold text-gray-900">
            Hedge your downside risk with simple, on-chain insurance products.
            🚀
          </h3>
          <p className="max-w-3xl text-base text-gray-700">
            From crypto volatility to special events — cover unexpected risks
            with DIN.
          </p>
        </div>

        {/* Top Insurance Products */}
        <div className="mb-16">
          <h2 className="font-header mb-10 text-left text-3xl font-bold text-gray-900">
            Available DIN Protection Plans
          </h2>
          {loading ? (
            <div className="py-12 text-center">
              <div className="text-gray-600">Loading insurance products...</div>
            </div>
          ) : insuranceProducts.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-gray-500">
                No insurance products available
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {insuranceProducts.map((product) => (
                <InsuranceProductCard
                  key={product.productId}
                  product={product}
                />
              ))}
            </div>
          )}
        </div>

        {/* How It Works */}

        <div className="text-left">
          <h2 className="mb-8 text-3xl font-bold text-gray-900">
            How It Works
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[#F3FEF6] border border-[#BEF2CC] p-8 text-left">
              <h3 className="mb-4 text-2xl font-bold text-gray-900">
                For Insurance Buyers
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Browse available insurance products</li>
                <li>• Select coverage amount and duration</li>
                <li>• Pay premium to secure protection</li>
                <li>• Receive automatic payouts when triggered</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-[#F3FEF6] border border-[#BEF2CC] p-8 text-left">
              <h3 className="mb-4 text-2xl font-bold text-gray-900">
                For Liquidity Providers
              </h3>
              <ul className="space-y-2 text-left text-gray-700">
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
