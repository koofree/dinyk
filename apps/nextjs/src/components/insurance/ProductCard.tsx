"use client";

import React, { useState, useEffect } from "react";
import { InsuranceProduct, InsuranceTranche } from "@/lib/types";
import { RISK_COLORS } from "@/lib/constants";

interface ProductCardProps {
  product: InsuranceProduct;
  onTrancheSelect: (product: InsuranceProduct, tranche: InsuranceTranche) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onTrancheSelect }) => {
  const [animatedPercentages, setAnimatedPercentages] = useState<{ [key: string]: number }>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 컴포넌트가 마운트되면 애니메이션 시작
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isVisible) {
      // 각 tranche의 퍼센티지 애니메이션
      product.tranches.forEach((tranche, index) => {
        const filledPercentage = Math.round((parseInt(tranche.filled) / parseInt(tranche.capacity)) * 100);
        
        setTimeout(() => {
          // 프로그레스바와 수치값 애니메이션을 동시에 시작
          let currentValue = 0;
          const duration = 1500; // 1.5초 (프로그레스바 transition과 동일)
          const steps = 60; // 60단계로 나누어 애니메이션
          const increment = filledPercentage / steps;
          const stepDuration = duration / steps; // 각 단계별 시간
          
          const interval = setInterval(() => {
            currentValue += increment;
            if (currentValue >= filledPercentage) {
              currentValue = filledPercentage;
              clearInterval(interval);
            }
            setAnimatedPercentages(prev => ({
              ...prev,
              [tranche.id]: Math.round(currentValue)
            }));
          }, stepDuration); // 프로그레스바 transition과 동일한 타이밍
        }, index * 300); // 각 tranche마다 300ms씩 지연
      });
    }
  }, [isVisible, product.tranches]);

  const formatNumber = (num: string) => {
    return parseInt(num).toLocaleString();
  };

  const getFilledPercentage = (filled: string, capacity: string) => {
    return Math.round((parseInt(filled) / parseInt(capacity)) * 100);
  };

  return (
            <div className="rounded-2xl">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
                            <div className={`flex items-center mb-2 ${product.asset === 'KAIA' ? 'gap-4' : 'gap-2'}`}>
                    <img
                      src={`/images/${product.asset}.svg`}
                      alt={product.asset}
                      className={`${product.asset === 'KAIA' ? 'w-6 h-6' : 'w-10 h-10'}`}
                      style={{ filter: 'brightness(0) invert(0.2)' }}
                    />
                    <h3 className="text-[24px] font-bold text-gray-900 font-display">{product.name}</h3>
                  </div>
                            <p className="text-gray-600 text-base">{product.description}</p>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {product.tranches.map((tranche) => {
          const filledPercentage = getFilledPercentage(tranche.filled, tranche.capacity);
          const isLowCapacity = parseInt(tranche.available) < 5000;

          return (
                                <div
                      key={tranche.id}
                      className="bg-[#1f2937] rounded-lg p-4"
                    >
              <div className="mb-10">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-white font-bold text-[20px] block">
                      Tranche {tranche.triggerLevel}%
                    </span>
                    <span className={`text-xs px-2 py-1 rounded text-white font-bold mt-2 inline-block ${
                      tranche.riskLevel === 'LOW' ? 'bg-green-500/70' : 
                      tranche.riskLevel === 'MEDIUM' ? 'bg-yellow-500/70' : 
                      'bg-red-500/70'
                    }`}>
                      {tranche.riskLevel}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">Premium: {tranche.premium}%</div>
                    <div className="text-gray-400 text-sm">Expiry: {tranche.expiry} days</div>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Capacity</span>
                  <span>{animatedPercentages[tranche.id] || 0}% filled</span>
                </div>
                <div className="w-full bg-[#111827] rounded-full h-2">
                  <div 
                    className="bg-[#6b7280] h-2 rounded-full transition-all duration-1500 ease-out"
                    style={{ 
                      width: `${animatedPercentages[tranche.id] || 0}%`,
                      transition: 'width 1.5s ease-out'
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-200 font-bold mt-1">
                  <span>Available: ${formatNumber(tranche.available)} USDT</span>
                  <span>Total: ${formatNumber(tranche.capacity)} USDT</span>
                </div>
              </div>

              <div className="text-base text-[#86D99C] mb-4 flex items-center gap-0">
                Trigger: {product.asset} drops {Math.abs(tranche.triggerLevel)}% or more
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 7L17 17M17 17H7M17 17V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              <button
                onClick={() => onTrancheSelect(product, tranche)}
                disabled={isLowCapacity}
                className={`w-full px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 ${
                  isLowCapacity
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'relative bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white hover:scale-95 hover:shadow-lg group overflow-hidden'
                }`}
                style={{ height: '48px' }}
              >
                {isLowCapacity ? (
                  'Low Capacity'
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" style={{ height: '48px' }}></div>
                    <span className="relative font-outfit font-semibold">Buy Insurance</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};