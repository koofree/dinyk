"use client";

import Image from "next/image";

import { useWeb3 } from "@dinsure/contracts";

export const Footer = () => {
  const { isConnected } = useWeb3();

  return (
    <div className="py-20 text-center">
      {/* Connection Status */}
      {!isConnected && (
        <div className="mb-6">
          <div className="rounded-lg p-6">
            <p className="mb-4 text-gray-400">
              Connect your wallet to start using DIN insurance platform
            </p>
            <p className="text-sm text-gray-400">
              Supports MetaMask, Kaikas, and other Web3 wallets
            </p>
          </div>
        </div>
      )}

      {/* Footer Logo */}
      <Image
        src="/images/BI-symbol.svg"
        alt="DIN Logo"
        className="mx-auto h-12 w-auto"
        width={48}
        height={48}
        style={{
          filter:
            "brightness(0) saturate(100%) invert(80%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)",
        }}
      />
    </div>
  );
};
