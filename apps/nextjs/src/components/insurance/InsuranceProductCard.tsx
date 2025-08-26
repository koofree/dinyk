import { useBTCPrice } from "@/hooks/useBTCPrice";
import { useContractFactory } from "@dinsure/contracts";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface InsuranceProductCardProps {
  product: {
    productId: number;
    name: string;
    triggerType: number;
    threshold: bigint;
    maturityDays: number;
    premiumRateBps: number;
    buyerCount?: number;
    providerCount?: number;
  };
}

export function InsuranceProductCard({ product }: InsuranceProductCardProps) {
  const [mounted, setMounted] = useState(false);
  const factory = useContractFactory();
  const { price: btcPrice } = useBTCPrice({ factory });

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatTrigger = () => {
    // Threshold is in wei units (18 decimals)
    // Convert to actual dollar value first
    const thresholdPrice = Number(product.threshold) / 1e18;
    
    // Use actual BTC price if available, otherwise use a default
    const basePrice = (btcPrice ?? 100000) < 1 ? 100000 : (btcPrice ?? 100000);

    const percentageChange = ((basePrice - thresholdPrice) / basePrice * 100);
    
    // For price drop protection (triggerType 0), show as negative percentage
    const sign = product.triggerType === 0 ? "-" : "+";
    return `${sign}${Math.abs(percentageChange).toFixed(0)}%`;
  };

  // TODO: How to set the name of the asset?
  const assetName: 'BTC' | 'ETH' | 'KAIA' = product.name.includes("BTC") ? "BTC" : 
                    product.name.includes("ETH") ? "ETH" : 
                    "KAIA";

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 group ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="w-full h-20 mb-4 bg-gray-900 rounded-lg p-2 relative overflow-hidden flex items-center justify-center">
        {assetName === "BTC" ? (
          <Image src="/images/BTC.svg" alt="BTC" className="w-10 h-10" width={40} height={40} />
        ) : assetName === "ETH" ? (
          <Image src="/images/ETH.svg" alt="ETH" className="w-10 h-10" width={40} height={40} />
        ) : (
          <Image src="/images/kaia.svg" alt="Kaia" className="w-10 h-10" width={40} height={40} />
        )}
      </div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold font-display text-white font-header">
            {assetName} Protection
          </h3>
          <p className="text-sm text-gray-500">Product #{product.productId}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Trigger:</span>
          <span className="text-white font-bold text-lg">
            {formatTrigger()}
          </span>
        </div>

        <div className="flex items-center justify-between ">
          <span className="text-gray-400 font-medium">Duration:</span>
          <span className="text-white text-lg">
            {product.maturityDays} days
          </span>
        </div>

        <div className="flex items-center justify-between ">
          <span className="text-gray-400 font-medium">Premium:</span>
          <span className="text-white text-lg">
            {(product.premiumRateBps / 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {product.buyerCount || 0}
          </div>
          <div className="text-xs text-gray-600">Insurance Buyers</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {product.providerCount || 0}
          </div>
          <div className="text-xs text-gray-600">Liquidity Providers</div>
        </div>
      </div>

      <Link
        href={`/tranches?productId=${product.productId}`}
        className="block w-full relative bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white text-center py-3 rounded-xl font-semibold font-outfit transition-all duration-300 group-hover:scale-95 group-hover:shadow-md overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
        <span className="relative">View Details →</span>
      </Link>
    </div>
  );
}