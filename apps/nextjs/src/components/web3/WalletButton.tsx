"use client";

import React, { useState } from "react";

import { ACTIVE_NETWORK, ProviderType, useWeb3 } from "@dinsure/contracts";

export const WalletButton: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    account,
    chainId,
    balance,
    usdtBalance,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    error,
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
      <button className="flex h-12 w-[172px] cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-base font-semibold text-white opacity-50">
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
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0-2 2v4h4v-4a2 2 0 0 0-2-2z" />
        </svg>
        <span className="font-semibold">Connecting...</span>
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
            className="rounded bg-yellow-100 px-3 py-1.5 text-sm font-medium text-yellow-800 transition-colors hover:bg-yellow-200"
          >
            Switch to {ACTIVE_NETWORK.name}
          </button>
          <button
            onClick={disconnectWallet}
            className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Disconnect
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <div className="text-right text-sm">
          <div className="font-medium text-gray-700">
            {formatBalance(usdtBalance)} USDT
          </div>
                        <div className="text-sm text-gray-500">{formatAddress(account)}</div>
        </div>
        <button
          onClick={disconnectWallet}
          className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
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
        className="group relative h-12 w-[172px] overflow-hidden rounded-lg bg-gradient-to-br from-[#86D99C] to-[#00B1B8] text-base font-semibold text-white transition-all duration-300 hover:scale-95 hover:shadow-lg max-[400px]:h-[42px] max-[400px]:w-[160px] max-[400px]:px-1 max-[400px]:text-sm"
      >
        {/* Gradient animation background */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#00B1B8] to-[#86D99C] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

        {/* Button content */}
        <div className="relative flex items-center justify-center gap-1">
          {/* Wallet icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-shrink-0 max-[400px]:h-4 max-[400px]:w-4"
          >
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0-2 2v4h4v-4a2 2 0 0 0-2-2z" />
          </svg>

          {/* Text */}
          <span className="font-semibold">Connect Wallet</span>
        </div>
      </button>

      {/* Connect Modal */}
      {showConnectModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50"
          style={{
            margin: 0,
            padding: 0,
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
          }}
          onClick={() => setShowConnectModal(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              Connect Your Wallet
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => handleConnect(ProviderType.METAMASK)}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100"
              >
                <div className="text-2xl">🦊</div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">MetaMask</div>
                  <div className="text-sm text-gray-600">Recommended</div>
                </div>
              </button>

              <button
                onClick={() => handleConnect(ProviderType.KAIA)}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100"
              >
                <div className="text-2xl">🔷</div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Kaia Wallet</div>
                  <div className="text-sm text-gray-600">
                    Official Kaia Wallet
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleConnect(ProviderType.WALLET_CONNECT)}
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-50 transition-colors hover:bg-gray-100"
                disabled
              >
                <div className="text-2xl">🔗</div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">WalletConnect</div>
                  <div className="text-sm text-gray-600">Coming Soon</div>
                </div>
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error.message}
                {error.message.includes("Kaia Wallet") && (
                  <div className="mt-2">
                    <a
                      href="https://chromewebstore.google.com/detail/kaia-wallet/jblndlipeogpafnldhgmapagcccfchpi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-500"
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
                      className="text-blue-600 underline hover:text-blue-500"
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
                className="text-gray-600 transition-colors hover:text-gray-900"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 text-center text-sm text-gray-500">
              By connecting, you agree to our Terms of Service
            </div>
          </div>
        </div>
      )}
    </>
  );
};
