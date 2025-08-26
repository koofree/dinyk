"use client";

import { useWeb3 } from "@dinsure/contracts";
import Image from "next/image";

export const Footer = () => {
  const { isConnected } = useWeb3();

  return (
    <div className="text-center py-20">
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
        <Image src="/images/bi-symbol.svg" alt="DIN Logo" className="h-12 w-auto mx-auto" width={48} height={48} style={{ filter: 'brightness(0) saturate(100%) invert(80%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)' }} />
    </div>
  );
};