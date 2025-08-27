"use client";

import { WalletButton } from "@/components/web3/WalletButton";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const isTestnet = process.env.NEXT_PUBLIC_NETWORK_ENV === "testnet";
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 110);
    };
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1000);
    };
    // Check initial scroll position and screen size after mount
    handleScroll();
    handleResize();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const navigation = [
    { name: "For Buyer", badge: "Insurance", href: "/insurance" },
    { name: "For Depositor(Seller)", badge: "Liquidity", href: "/tranches" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "DINGO & DINO", badge: "coming soon", href: "", disabled: true },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "") return false; // Disabled items are never active
    return pathname.startsWith(href);
  };

  // Use consistent styling on initial render to avoid hydration mismatch
  const navClassName =
    mounted && isScrolled
      ? "fixed top-0 left-0 right-0 z-50 bg-white backdrop-blur-sm shadow-sm transition-all duration-200"
      : "relative bg-transparent transition-all duration-200";

  return (
    <nav className={navClassName}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative flex h-16 items-center">
          {/* Logo */}
          <Link
            href="/"
            className="absolute left-0 flex items-center text-xl font-semibold text-gray-900 transition-colors hover:text-gray-700"
          >
            <img src="/images/BI.svg" alt="DIN Logo" className="h-8 w-auto" />
          </Link>

          {/* Navigation Links - Centered */}
          {isLargeScreen && (
            <div className="flex absolute left-1/2 -translate-x-1/2 transform items-center space-x-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-base font-medium transition-all duration-200 ${
                    item.disabled
                      ? "cursor-not-allowed opacity-50 text-gray-400"
                      : isActive(item.href)
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                >
                  {item.name}
                  {item.badge && (
                    <span className={`ml-1 rounded px-1 py-0.5 text-sm font-medium ${
                      item.disabled 
                        ? "bg-gray-200 text-gray-500" 
                        : "bg-[#E0FBE8] text-[#48C6A9]"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}



          {/* Right side */}
          {isLargeScreen ? (
            <div className="flex absolute right-0 items-center space-x-4">
              {isTestnet && (
                <div className="rounded bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-800">
                  Testnet
                </div>
              )}
              <WalletButton />
            </div>
          ) : (
            <div className="flex absolute right-0 items-center">
              <WalletButton />
            </div>
          )}
        </div>

        {/* Mobile Navigation Tabs - Below Navbar */}
        {!isLargeScreen && (
          <div className="flex items-center gap-2 p-2 mx-2 mb-2 rounded-lg bg-white shadow-sm">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-base transition-all duration-200 text-center ${
                    item.disabled
                      ? "cursor-not-allowed opacity-50 text-gray-400 font-medium"
                      : isActive(item.href)
                      ? "bg-gray-100 text-gray-900 shadow-sm font-bold"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"
                  }`}
                  onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                >
                  {item.name === "For Buyer"
                    ? "Buyer"
                    : item.name === "For Depositor(Seller)"
                      ? "Depositor"
                      : item.name === "Portfolio"
                        ? "Portfolio"
                        : "DINGO"}
                </Link>
              ))}
          </div>
        )}
      </div>
    </nav>
  );
};
