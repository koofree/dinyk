"use client";

import React, { useState } from "react";
import { useWeb3 } from "@/context/Web3Provider";
import { useLanguage } from "@/context/LanguageProvider";
import { ProviderType, ACTIVE_NETWORK } from "@/lib/constants";

export const WalletButton: React.FC = () => {
  const { 
    isConnected, 
    isConnecting, 
    account, 
    chainId, 
    balance,
    connectWallet, 
    disconnectWallet, 
    switchNetwork,
    error 
  } = useWeb3();
  const { t } = useLanguage();
  
  const [showConnectModal, setShowConnectModal] = useState(false);

  const handleConnect = async (type: ProviderType) => {
    try {
      await connectWallet(type);
      setShowConnectModal(false);
    } catch (err) {
      console.error("Connection failed:", err);
    }
  };

  const handleNetworkSwitch = async () => {
    try {
      await switchNetwork();
    } catch (err) {
      console.error("Network switch failed:", err);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatBalance = (balance: string) => {
    return parseFloat(balance).toFixed(4);
  };

  if (isConnecting) {
    return (
      <button className="w-[172px] h-12 bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white rounded-lg text-base font-semibold opacity-50 cursor-not-allowed flex items-center justify-center gap-2">
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="animate-spin"
        >
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
          <path d="M18 12a2 2 0 0 0-2 2v4h4v-4a2 2 0 0 0-2-2z"/>
        </svg>
        <span className="font-outfit font-semibold">
          {t('wallet.connecting')}
        </span>
      </button>
    );
  }

  if (isConnected && account) {
    const isWrongNetwork = chainId !== ACTIVE_NETWORK.chainId;
    
    if (isWrongNetwork) {
          return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleNetworkSwitch}
          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1.5 rounded text-sm font-medium transition-colors"
        >
          {t('wallet.switchNetwork').replace('{network}', ACTIVE_NETWORK.name)}
        </button>
        <button
          onClick={disconnectWallet}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
        >
          {t('wallet.disconnect')}
        </button>
      </div>
    );
    }

    return (
      <div className="flex items-center gap-3">
        <div className="text-right text-sm">
          <div className="text-gray-700 font-medium">{formatBalance(balance)} KAIA</div>
          <div className="text-gray-500 text-xs">{formatAddress(account)}</div>
        </div>
        <button
          onClick={disconnectWallet}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
        >
          {t('wallet.disconnect')}
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConnectModal(true)}
        className="relative w-[172px] h-12 bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white rounded-lg text-base font-semibold transition-all duration-300 hover:scale-95 hover:shadow-lg group overflow-hidden"
      >
        {/* 그라데이션 애니메이션 배경 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
        
        {/* 버튼 내용 */}
        <div className="relative flex items-center justify-center gap-2">
          {/* 지갑 아이콘 */}
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="flex-shrink-0"
          >
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
            <path d="M18 12a2 2 0 0 0-2 2v4h4v-4a2 2 0 0 0-2-2z"/>
          </svg>
          
          {/* 텍스트 */}
          <span className="font-outfit font-semibold">
            {t('wallet.connect')}
          </span>
        </div>
      </button>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-2xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Connect Your Wallet</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => handleConnect(ProviderType.METAMASK)}
                className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <div className="text-2xl">🦊</div>
                <div className="text-left">
                  <div className="text-white font-medium">MetaMask</div>
                  <div className="text-gray-400 text-sm">Recommended</div>
                </div>
              </button>

              <button
                onClick={() => handleConnect(ProviderType.KAIA)}
                className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <div className="text-2xl">🔷</div>
                <div className="text-left">
                  <div className="text-white font-medium">Kaia Wallet</div>
                  <div className="text-gray-400 text-sm">Official Kaia Wallet</div>
                </div>
              </button>

              <button
                onClick={() => handleConnect(ProviderType.WALLET_CONNECT)}
                className="w-full flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                disabled
              >
                <div className="text-2xl">🔗</div>
                <div className="text-left">
                  <div className="text-white font-medium">WalletConnect</div>
                  <div className="text-gray-400 text-sm">Coming Soon</div>
                </div>
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-900 text-red-300 rounded-lg text-sm">
                {error.message}
                {error.message.includes("Kaia Wallet") && (
                  <div className="mt-2">
                    <a 
                      href="https://chromewebstore.google.com/detail/kaia-wallet/jblndlipeogpafnldhgmapagcccfchpi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Install Kaia Wallet from Chrome Store
                    </a>
                  </div>
                )}
                {error.message.includes("MetaMask") && (
                  <div className="mt-2">
                    <a 
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Install MetaMask
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 text-center">
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-400 text-center">
              By connecting, you agree to our Terms of Service
            </div>
          </div>
        </div>
      )}
    </>
  );
};