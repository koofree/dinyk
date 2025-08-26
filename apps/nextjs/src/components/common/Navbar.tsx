"use client";

import { WalletButton } from "@/components/web3/WalletButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const isTestnet = process.env.NEXT_PUBLIC_NETWORK_ENV === 'testnet';
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 110);
    };
    // Check initial scroll position after mount
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'For Buyer', badge: 'Insurance', href: '/insurance' },
    { name: 'For Depositor(Seller)', badge: 'Liquidity', href: '/tranches' },
    { name: 'Portfolio', href: '/portfolio' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Use consistent styling on initial render to avoid hydration mismatch
  const navClassName = mounted && isScrolled 
    ? 'fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm transition-all duration-200'
    : 'relative bg-transparent transition-all duration-200';

  return (
    <nav className={navClassName}>
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
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.name}
                {item.badge && (
                  <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden mobile:flex items-center space-x-4 absolute right-0">
            {isTestnet && (
              <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                Testnet
              </div>
            )}
            <WalletButton />
          </div>

          {/* Mobile menu button */}
          <div className="mobile:hidden flex items-center absolute right-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile:hidden border-t border-gray-100 ${mounted && isScrolled ? 'bg-white' : 'bg-transparent'} ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-4 py-2 pb-0">
          <div className={`flex flex-col space-y-1 p-1 pb-0 ${mounted && isScrolled ? 'bg-white' : 'bg-transparent'}`}>
            <div className="flex justify-center items-center space-x-4 my-4">
              <WalletButton />
            </div>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-3 py-3 text-sm font-bold transition-colors relative text-center rounded-lg ${
                  isActive(item.href)
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.name === 'For Buyer' ? 'Buyer' : 
                 item.name === 'For Depositor' ? 'Depositor' : 
                 item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};