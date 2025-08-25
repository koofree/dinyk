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

  // 모달이 열릴 때 body scroll 방지
  React.useEffect(() => {
    if (showConnectModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showConnectModal]);

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
        className="relative w-[172px] max-[400px]:w-[160px] h-12 max-[400px]:h-[42px] bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-white rounded-lg text-base max-[400px]:text-sm font-semibold transition-all duration-300 hover:scale-95 hover:shadow-lg group overflow-hidden max-[400px]:px-1"
      >
        {/* 그라데이션 애니메이션 배경 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
        
        {/* 버튼 내용 */}
        <div className="relative flex items-center justify-center gap-1">
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
            className="flex-shrink-0 max-[400px]:w-4 max-[400px]:h-4"
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
          style={{ 
            margin: 0, 
            padding: 0, 
            left: 0, 
            right: 0, 
            top: 0, 
            bottom: 0,
            width: '100vw',
            height: '100vh'
          }}
          onClick={() => setShowConnectModal(false)}
        >
          <div 
            className="bg-white p-6 rounded-2xl w-full max-w-md shadow-lg border border-gray-200 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Connect Your Wallet</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => handleConnect(ProviderType.METAMASK)}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <img src="/images/metamask.svg" alt="MetaMask" className="w-8 h-8" />
                <div className="text-left">
                  <div className="text-gray-900 font-medium">MetaMask</div>
                  <div className="text-gray-600 text-sm">Recommended</div>
                </div>
              </button>

              <button
                onClick={() => handleConnect(ProviderType.KAIA)}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <img src="/images/kaiawallet.svg" alt="Kaia Wallet" className="w-8 h-8" />
                <div className="text-left">
                  <div className="text-gray-900 font-medium">Kaia Wallet</div>
                  <div className="text-gray-600 text-sm">Official Kaia Wallet</div>
                </div>
              </button>

              <button
                onClick={() => handleConnect(ProviderType.WALLET_CONNECT)}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 opacity-50 cursor-not-allowed"
                disabled
              >
                <img src="/images/link.svg" alt="WalletConnect" className="w-8 h-8" />
                <div className="text-left">
                  <div className="text-gray-900 font-medium">WalletConnect</div>
                  <div className="text-gray-600 text-sm">Coming Soon</div>
                </div>
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                {error.message}
                {error.message.includes("Kaia Wallet") && (
                  <div className="mt-2">
                    <a 
                      href="https://chromewebstore.google.com/detail/kaia-wallet/jblndlipeogpafnldhgmapagcccfchpi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500 underline"
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
                      className="text-blue-600 hover:text-blue-500 underline"
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
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              By connecting, you agree to our Terms of Service
            </div>
          </div>
        </div>
      )}
    </>
  );
};