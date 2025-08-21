"use client";

import React, { useState } from "react";
import { useWeb3 } from "@/context/Web3Provider";
import { ProviderType, KAIA_MAINNET } from "@/lib/constants";

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
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg opacity-50 cursor-not-allowed">
        Connecting...
      </button>
    );
  }

  if (isConnected && account) {
    const isWrongNetwork = chainId !== KAIA_MAINNET.chainId;
    
    if (isWrongNetwork) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={handleNetworkSwitch}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Switch to Kaia
          </button>
          <button
            onClick={disconnectWallet}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <div className="text-right text-sm">
          <div className="text-gray-300">{formatBalance(balance)} KAIA</div>
          <div className="text-gray-400">{formatAddress(account)}</div>
        </div>
        <button
          onClick={disconnectWallet}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConnectModal(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Connect Wallet
      </button>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
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