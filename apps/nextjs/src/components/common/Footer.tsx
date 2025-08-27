"use client";

import Image from "next/image";

import { useWeb3 } from "@dinsure/contracts";

export const Footer = () => {
  const { isConnected } = useWeb3();

  return (
    <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-8 rounded-lg bg-blue-50/50 p-6 text-center">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Connect your wallet to start using DIN insurance platform
            </p>
            <p className="text-xs text-gray-600">
              Supports MetaMask, Kaikas, and other Web3 wallets
            </p>
          </div>
        )}

        <div className="text-center">
          {/* Logo and Description */}
          <div className="flex flex-col items-center justify-center">
            <Image
              src="/images/BI-symbol.svg"
              alt="DIN Logo"
              className="h-10 w-auto mb-3"
              width={40}
              height={40}
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">DIN Insurance</h3>
              <p className="text-sm text-gray-600">Decentralized Insurance on Kaia</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Protect your crypto assets with on-chain parametric insurance products. 
            Simple, transparent, and automated coverage for the digital economy.
          </p>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-sm text-gray-600">
              © 2025 DIN Insurance. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <span className="text-sm text-gray-600">
                Built on Kaia Blockchain
              </span>
              <span className="text-sm text-gray-600">
                • Testnet v1.0
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
