"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "@/components/web3/WalletButton";
import { useLanguage } from "@/context/LanguageProvider";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const isTestnet = process.env.NEXT_PUBLIC_NETWORK_ENV === 'testnet';
  const { t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 서버사이드 렌더링과 클라이언트 렌더링 간의 불일치를 방지하기 위해 기본값 사용
  const navigation = [
    { name: t('nav.insurance') || 'Insurance', href: '/insurance' },
    { name: t('nav.liquidity') || 'Liquidity', href: '/liquidity' },
    { name: t('nav.portfolio') || 'Portfolio', href: '/portfolio' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className={`${isScrolled ? 'fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100' : 'relative bg-transparent'} transition-all duration-300`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center h-16 relative">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors absolute left-0"
          >
            <img src="/images/BI.svg" alt="DIN Logo" className="h-8 w-auto" />
          </Link>

          {/* Navigation Links - Centered */}
          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-base font-medium transition-all duration-200 relative group ${
                  isActive(item.href)
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {item.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-200 ${
                  isActive(item.href) ? 'w-full' : 'group-hover:w-full'
                }`}></span>
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4 absolute right-0">
            {isTestnet && (
              <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                Testnet
              </div>
            )}
            
            <WalletButton />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden absolute right-0">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-900 focus:outline-none p-2"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-100">
        <div className="px-4 py-2 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-3 py-2 text-sm font-medium rounded-md ${
                isActive(item.href)
                  ? 'text-gray-900 bg-gray-50'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};