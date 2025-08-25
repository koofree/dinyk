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
    { name: 'For Buyer (Insurance)', href: '/insurance' },
    { name: 'For Seller (Liquidity)', href: '/liquidity' },
    { name: 'Portfolio', href: '/portfolio' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className={`${isScrolled ? 'fixed top-0 left-0 right-0 z-50 bg-white shadow-sm' : 'relative bg-transparent'} transition-all duration-200`}>
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
          <div className="hidden mobile:flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-base font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive(item.href)
                    ? 'text-gray-900 bg-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                }`}
              >
                {item.name === 'For Buyer (Insurance)' ? (
                  <>
                    For Buyer <span className="ml-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium">Insurance</span>
                  </>
                ) : item.name === 'For Seller (Liquidity)' ? (
                  <>
                    For Depositor(Seller) <span className="ml-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium">Liquidity</span>
                  </>
                ) : (
                  item.name
                )}
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


        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile:hidden border-t border-gray-100 ${isScrolled ? 'bg-white' : 'bg-transparent'}`}>
                  <div className="px-4 py-2 pb-0">
            <div className={`flex space-x-1 p-1 pb-0 ${isScrolled ? 'bg-white' : 'bg-transparent'}`}>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex-1 px-3 py-2 text-sm font-bold transition-colors relative text-center ${
                  isActive(item.href)
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                style={{ 
                  height: '42px'
                }}
              >
                {item.name === 'For Buyer (Insurance)' ? 'Buyer' : 
                 item.name === 'For Seller (Liquidity)' ? 'Depositor' : 
                 item.name}
                {isActive(item.href) && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};