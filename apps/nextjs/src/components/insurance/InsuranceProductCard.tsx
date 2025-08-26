import { useBTCPrice } from "@/hooks/useBTCPrice";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useContractFactory } from "@dinsure/contracts";

interface InsuranceProductCardProps {
  product: {
    productId: number;
    name: string;
    triggerType: number;
    threshold: bigint;
    maturityDays: number;
    premiumRateBps: number;
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

    const percentageChange = ((basePrice - thresholdPrice) / basePrice) * 100;

    // For price drop protection (triggerType 0), show as negative percentage
    const sign = product.triggerType === 0 ? "-" : "+";
    return `${sign}${Math.abs(percentageChange).toFixed(0)}%`;
  };

  // TODO: How to set the name of the asset?
  const assetName: "BTC" | "ETH" | "KAIA" = product.name.split("-")[0] as "BTC" | "ETH" | "KAIA";

  return (
    <div
      className={`group rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-sm transition-all duration-300 hover:shadow-lg ${mounted ? "opacity-100" : "opacity-0"}`}
    >
      <div className="relative mb-4 flex h-20 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-900 p-2">
        {assetName === "BTC" ? (
          <Image
            src="/images/BTC.svg"
            alt="BTC"
            className="h-10 w-10"
            width={40}
            height={40}
          />
        ) : assetName === "ETH" ? (
          <Image
            src="/images/ETH.svg"
            alt="ETH"
            className="h-10 w-10"
            width={40}
            height={40}
          />
        ) : (
          <Image
            src="/images/kaia.svg"
            alt="Kaia"
            className="h-10 w-10"
            width={40}
            height={40}
          />
        )}
      </div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="font-display font-header text-xl font-bold text-white">
            {assetName} Protection
          </h3>
          <p className="text-sm text-gray-500">Product #{product.productId}</p>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-400">Trigger:</span>
          <span className="text-lg font-bold text-white">
            {formatTrigger()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-400">Duration:</span>
          <span className="text-lg text-white">
            {product.maturityDays} days
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-400">Premium:</span>
          <span className="text-lg text-white">
            {(product.premiumRateBps / 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="mb-1 text-2xl font-bold text-gray-900">
            {product.buyerCount || 0}
          </div>
          <div className="text-xs text-gray-600">Insurance Buyers</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="mb-1 text-2xl font-bold text-gray-900">
            {product.providerCount || 0}
          </div>
          <div className="text-xs text-gray-600">Liquidity Providers</div>
        </div>
      </div> */}

      <Link
        href={`/tranches?productId=${product.productId}`}
        className="font-outfit relative block w-full overflow-hidden rounded-xl bg-gradient-to-br from-[#86D99C] to-[#00B1B8] py-3 text-center font-semibold text-white transition-all duration-300 group-hover:scale-95 group-hover:shadow-md"
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
        <span className="relative">View Details →</span>
      </Link>
    </div>
  );
}
