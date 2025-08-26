"use client";

import React from "react";
import Link from "next/link";
import { useWeb3 } from "@/context/Web3Provider";
import { useLanguage } from "@/context/LanguageProvider";
import { Navbar } from "@/components/common/Navbar";
import { useEffect, useRef, useState } from 'react';

// 프로그래스 바 컴포넌트
function ProgressBar({ label, value, maxValue = 100, isVisible = false }: { label: string; value: number; maxValue?: number; isVisible?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    if (isVisible) {
      // 숫자와 프로그래스 바 동시 애니메이션
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

      return () => {
        clearInterval(timer);
      };
    }
  }, [isVisible, value, maxValue]);

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span className="font-bold">{label}</span>
        <span className={isVisible ? 'count-animate' : ''}>{displayValue}</span>
      </div>
      <div className="w-full bg-gray-900 rounded-full h-2">
        <div 
          className="bg-gray-700 h-2 rounded-full transition-all duration-1500 ease-out"
          style={{ 
            width: isVisible ? `${progressWidth}%` : '0%'
          }}
        ></div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isConnected } = useWeb3();
  const { t } = useLanguage();
  const [isProgressVisible, setIsProgressVisible] = useState(false);
  const [heroAnimations, setHeroAnimations] = useState({
    logo: false,
    title: false,
    subtitle: false,
    description: false,
    buttons: false
  });
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, []);

  // Hero Section 순차 애니메이션
  useEffect(() => {
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
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <Navbar />
      <div>
        {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <img 
              src="/images/BI-symbol.svg" 
              alt="DIN Logo" 
              className={`h-16 w-auto mx-auto mb-6 transition-all duration-700 ease-out ${
                heroAnimations.logo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} 
            />
            <h1 className={`text-[40px] mobile:text-[42px] font-bold text-gray-900 mb-6 font-display break-words leading-tight transition-all duration-700 ease-out ${
              heroAnimations.title ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              {t('hero.title')}
              <span className="block bg-gradient-to-r from-[#86D99C] to-[#00B1B8] bg-clip-text text-transparent">{t('hero.subtitle')}</span>
            </h1>
            <p className={`text-lg md:text-[18px] text-gray-600 mb-8 max-w-3xl mx-auto font-semibold font-outfit leading-tight transition-all duration-700 ease-out ${
              heroAnimations.description ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              {t('hero.description')}
            </p>
            
            <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-700 ease-out ${
              heroAnimations.buttons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <Link
                href="/insurance"
                className="relative bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white px-8 py-4 rounded-2xl text-lg font-medium transition-all duration-300 hover:scale-95 hover:shadow-lg group overflow-hidden w-56"
              >
                {/* 그라데이션 애니메이션 배경 */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative font-outfit hover:font-semibold">{t('hero.buyInsurance')}</span>
              </Link>
              <Link
                href="/liquidity"
                className="relative bg-transparent px-8 py-4 rounded-2xl text-lg font-medium transition-all duration-300 hover:scale-95 hover:shadow-lg group overflow-hidden w-56"
                style={{
                  background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, #86D99C, #00B1B8) border-box',
                  border: '2px solid transparent',
                  borderRadius: '16px'
                }}
              >
                <span className="relative hover:font-semibold bg-gradient-to-r from-[#86D99C] to-[#00B1B8] bg-clip-text text-transparent">{t('hero.provideLiquidity')}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 text-left border border-gray-200 shadow-sm hover:cursor-pointer group flex flex-col h-full">
            {/* TVL 아이콘 */}
            <div className="w-10 h-10 mb-3">
              <img src="/images/1.svg" alt="TVL Icon" className="w-full h-full" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2 font-outfit">$2.5M</div>
            <div className="text-gray-600 font-medium mb-3 font-outfit">{t('metrics.totalTVL')} (Total Value Locked)</div>
            <div className="text-gray-500 text-sm leading-relaxed mt-auto">
              Higher TVL means more trust and bigger trading capacity.
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 text-left border border-gray-200 shadow-sm hover:cursor-pointer group flex flex-col h-full">
            {/* Active Pools 아이콘 */}
            <div className="w-10 h-10 mb-3">
              <img src="/images/2.svg" alt="Active Pools Icon" className="w-full h-full" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2 font-outfit">12</div>
            <div className="text-gray-600 font-medium mb-3 font-outfit">{t('metrics.activePools')}</div>
            <div className="text-gray-500 text-sm leading-relaxed mt-auto">
              More pools mean more trading pairs supported.
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 text-left border border-gray-200 shadow-sm hover:cursor-pointer group flex flex-col h-full">
            {/* Total Premiums 아이콘 */}
            <div className="w-10 h-10 mb-3">
              <img src="/images/3.svg" alt="Total Premiums Icon" className="w-full h-full" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2 font-outfit">$125K</div>
            <div className="text-gray-600 font-medium mb-3 font-outfit">{t('metrics.totalPremiums')}</div>
            <div className="text-gray-500 text-sm leading-relaxed mt-auto">
              Higher premium means more active trading or subscriptions.
            </div>
          </div>
        </div>
      </div>

      {/* Featured Insurance Products */}
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div>
                      {/* 새로운 문구 섹션 */}
            <div className="text-left mb-12 bg-[#F3FEF6] rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2 font-header">
                Hedge your downside trigger probability with simple, on-chain insurance products. 🚀
              </h3>
              <p className="text-base text-gray-700 max-w-3xl">
                From crypto volatility to special events — cover unexpected trigger probability with DIN.
              </p>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-left font-header">
              Available DIN Protection Plans
            </h2>
          <div className="grid grid-cols-1 gap-6">
                                      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              {/* BTC SVG 이미지 */}
              <div className="w-full h-20 mb-4 bg-gray-900 rounded-2xl p-2 relative overflow-hidden flex items-center justify-center">
                <img src="/images/BTC.svg" alt="Bitcoin" className="w-12 h-12" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
            
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[30px] font-semibold text-white font-header">BTC Protection</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Trigger:</span>
                  <span className="text-white font-bold">-10%</span>
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
              
              {/* Divider */}
              <div className="border-t border-gray-700 my-4"></div>
              
              {/* Progress Bars */}
              <div className="space-y-3" ref={progressRef}>
                <ProgressBar label="Insurance Buyer" value={75} isVisible={isProgressVisible} />
                <ProgressBar label="Liquidity Providers" value={60} isVisible={isProgressVisible} />
              </div>
              
              <Link
                href="/insurance"
                className="block w-full mt-8 relative bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white text-center py-3 rounded-lg transition-all duration-300 hover:scale-95 hover:shadow-lg group overflow-hidden"
              >
                {/* 그라데이션 애니메이션 배경 */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                <span className="relative font-outfit">View Details</span>
              </Link>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              {/* ETH SVG 이미지 */}
              <div className="w-full h-20 mb-4 bg-gray-900 rounded-2xl p-2 relative overflow-hidden flex items-center justify-center">
                <img src="/images/ETH.svg" alt="Ethereum" className="w-12 h-12" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[30px] font-semibold text-white font-header">ETH Protection</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Trigger:</span>
                  <span className="text-white font-bold">-15%</span>
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
              
              {/* Divider */}
              <div className="border-t border-gray-700 my-4"></div>
              
              {/* Progress Bars */}
              <div className="space-y-3">
                <ProgressBar label="Insurance Buyer" value={85} isVisible={isProgressVisible} />
                <ProgressBar label="Liquidity Providers" value={70} isVisible={isProgressVisible} />
              </div>
              
              <Link
                href="/insurance"
                className="block w-full mt-8 relative bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white text-center py-3 rounded-lg transition-all duration-300 hover:scale-95 hover:shadow-lg group overflow-hidden"
              >
                {/* 그라데이션 애니메이션 배경 */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                <span className="relative font-outfit">View Details</span>
              </Link>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              {/* KAIA SVG 이미지 */}
              <div className="w-full h-20 mb-4 bg-gray-900 rounded-lg p-2 relative overflow-hidden flex items-center justify-center">
                <img src="/images/kaia.svg" alt="Kaia" className="w-10 h-10" style={{ filter: 'brightness(0) invert(1)' }} />
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[30px] font-semibold text-white font-header">KAIA Protection</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Trigger:</span>
                  <span className="text-white font-bold">-20%</span>
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
              
              {/* Divider */}
              <div className="border-t border-gray-700 my-4"></div>
              
              {/* Progress Bars */}
              <div className="space-y-3">
                <ProgressBar label="Insurance Buyer" value={90} isVisible={isProgressVisible} />
                <ProgressBar label="Liquidity Providers" value={80} isVisible={isProgressVisible} />
              </div>
              
              <Link
                href="/insurance"
                className="block w-full mt-8 relative bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white text-center py-3 rounded-lg transition-all duration-300 hover:scale-95 hover:shadow-lg group overflow-hidden"
              >
                {/* 그라데이션 애니메이션 배경 */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                <span className="relative font-outfit">View Details</span>
              </Link>
            </div>
          </div>
        </div>
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

      {/* Footer Section */}
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