# DIN Web3 Architecture & Implementation Guide
## Decentralized Insurance Platform on Kaia Blockchain

---

## 🎯 Executive Summary

DIN (Dinyk) is transforming from a traditional web application to a fully decentralized Web3 insurance platform on the Kaia blockchain. This architecture prioritizes direct blockchain interactions, eliminates server dependencies, and provides a seamless user experience through wallet connectivity and smart contract integration.

### Key Technologies
- **Blockchain**: Kaia Mainnet (Chain ID: 8217)
- **Smart Contracts**: Ethers.js v6 with Kaia extensions
- **Wallet Support**: MetaMask (primary), Kaikas, WalletConnect
- **Framework**: Next.js 15 with React 19
- **State Management**: React Context with session persistence

---

## 🏗️ Architecture Principles

### Core Design Philosophy
1. **Decentralization First**: Direct blockchain interactions without intermediary servers
2. **User Sovereignty**: Users control their funds and data through their wallets
3. **Transparency**: All insurance operations are verifiable on-chain
4. **Progressive Enhancement**: Start with core features, expand functionality gradually
5. **Gas Optimization**: Efficient contract design and batched operations
6. **Security by Default**: Multiple layers of transaction validation and user confirmation

### Technical Decisions
- **No Backend API**: Remove tRPC, authentication, and database layers
- **Client-Side Only**: All logic executes in the browser
- **Session Persistence**: Maintain wallet state across page refreshes
- **Kaia Native**: Optimize specifically for Kaia blockchain first

---

## 🏛️ System Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ Insurance UI │ │ Liquidity UI │ │ Portfolio UI │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Web3 Provider   │
                    │ @kaiachain/ethers │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼─────────────────────────┐
│              Smart Contract Layer (Kaia)               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │   Insurance  │ │ TranchePool  │ │   Treasury   │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ │
└────────────────────────────┬──────────────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │   Oracle Layer     │
                   │ ┌───────────────┐ │
                   │ │ Kaia Price Feed│ │
                   │ │ OO-lite       │ │
                   │ └───────────────┘ │
                   └───────────────────┘
```

---

## 🔧 Technology Stack

### Core Web3 Libraries

#### 1. **@kaiachain/ethers-ext** (v1.1.1)
Primary library for Kaia blockchain interaction
```typescript
import { Web3Provider } from "@kaiachain/ethers-ext/v6";
```
- **Why this choice**: Native Kaia support with enhanced features
- **Key Features**:
  - Kaia-specific RPC methods (`kaia_requestAccounts`)
  - Optimized gas estimation for Kaia
  - Compatible with existing ethers.js patterns
  - Built-in transaction type support for Kaia

#### 2. **Ethers.js** (v6.13.4)
Foundation library for Ethereum-compatible operations
```typescript
import { ethers, Contract, JsonRpcSigner } from "ethers";
```
- **Why this choice**: Industry standard with excellent documentation
- **Key Features**:
  - Comprehensive contract interaction
  - BigInt native support
  - TypeScript-first design
  - Extensive utility functions

#### 3. **React Context API**
State management for Web3 connections
- **Why this choice**: Simple, built-in, no external dependencies
- **Implementation**: Custom Web3Provider with session storage
- **Benefits**: Clean API, easy testing, predictable state updates

### Blockchain Configuration

#### Kaia Mainnet Specification
```typescript
export const KAIA_MAINNET = {
  chainId: 8217,
  chainIdHex: '0x2019',
  name: 'Kaia Mainnet',
  currency: {
    name: 'KLAY',
    symbol: 'KLAY',
    decimals: 18,
  },
  rpcUrl: 'https://public-en-cypress.klaytn.net',
  wsUrl: 'wss://public-en-cypress.klaytn.net/ws',
  blockExplorer: 'https://kaiascope.com',
  contracts: {
    insurance: process.env.NEXT_PUBLIC_INSURANCE_CONTRACT,
    treasury: process.env.NEXT_PUBLIC_TREASURY_CONTRACT,
    tranchePool: process.env.NEXT_PUBLIC_TRANCHE_POOL_CONTRACT,
  }
} as const;
```

### Wallet Support Matrix

| Wallet | Priority | Status | Features |
|--------|----------|--------|----------|
| MetaMask | Primary | ✅ Full Support | Network switching, signing, transactions |
| Kaikas | Secondary | ✅ Full Support | Native Kaia wallet |
| WalletConnect | Tertiary | 🔄 Planned | Mobile wallet support |
| Coinbase Wallet | Future | 📋 Backlog | Additional option |

---

## 📁 Project Structure

```
dinyk/
├── apps/
│   └── nextjs/
│       └── src/
│           ├── app/
│           │   ├── layout.tsx                 # Root with Web3Provider
│           │   ├── page.tsx                   # Landing with wallet connect
│           │   ├── insurance/
│           │   │   ├── catalog/page.tsx       # Browse insurance products
│           │   │   ├── [id]/page.tsx          # Product detail & purchase
│           │   │   └── purchase/page.tsx      # Purchase flow
│           │   ├── portfolio/
│           │   │   ├── page.tsx               # User's positions
│           │   │   ├── claims/page.tsx       # Claim management
│           │   │   └── history/page.tsx      # Transaction history
│           │   └── liquidity/
│           │       ├── page.tsx               # Liquidity provision
│           │       └── rewards/page.tsx       # Rewards claiming
│           │
│           ├── components/
│           │   ├── web3/
│           │   │   ├── WalletButton.tsx       # Connection UI
│           │   │   ├── NetworkIndicator.tsx   # Current network display
│           │   │   ├── TransactionModal.tsx   # TX preview & status
│           │   │   ├── AccountBalance.tsx     # KLAY balance display
│           │   │   └── GasEstimator.tsx       # Gas cost preview
│           │   ├── insurance/
│           │   │   ├── ProductCard.tsx        # Insurance product display
│           │   │   ├── TrancheSelector.tsx    # Risk level selection
│           │   │   ├── PurchaseForm.tsx       # Purchase parameters
│           │   │   ├── PositionCard.tsx       # User position display
│           │   │   └── ClaimButton.tsx        # Claim interaction
│           │   └── common/
│           │       ├── LoadingSpinner.tsx
│           │       ├── ErrorBoundary.tsx
│           │       └── Toast.tsx
│           │
│           ├── context/
│           │   ├── Web3Provider.tsx           # Core Web3 context
│           │   ├── ContractProvider.tsx       # Contract instances
│           │   └── TransactionProvider.tsx    # TX management
│           │
│           ├── hooks/
│           │   ├── useWeb3.ts                 # Web3 connection hook
│           │   ├── useContract.ts             # Generic contract hook
│           │   ├── useInsurance.ts            # Insurance operations
│           │   ├── useTranche.ts              # Tranche management
│           │   ├── useBalance.ts              # Token/KLAY balances
│           │   └── useTransaction.ts          # TX status tracking
│           │
│           ├── contracts/                     # Contract ABIs
│           │   ├── abis/
│           │   │   ├── Insurance.json
│           │   │   ├── Treasury.json
│           │   │   └── TranchePool.json
│           │   ├── addresses.ts               # Deployed addresses
│           │   └── types/                     # Generated types
│           │       └── Insurance.ts
│           │
│           ├── lib/
│           │   ├── constants.ts               # App constants
│           │   ├── errors.ts                  # Error handling
│           │   ├── format.ts                  # Formatters
│           │   └── validation.ts              # Input validation
│           │
│           └── utils/
│               ├── contracts.ts               # Contract helpers
│               ├── transactions.ts            # TX utilities
│               └── storage.ts                 # Session storage
│
├── packages/
│   └── contracts/                             # Smart contracts
│       ├── contracts/
│       │   ├── Insurance.sol
│       │   ├── Treasury.sol
│       │   ├── TranchePool.sol
│       │   └── interfaces/
│       │       └── IInsurance.sol
│       ├── scripts/
│       │   ├── deploy.ts
│       │   └── verify.ts
│       ├── test/
│       │   └── Insurance.test.ts
│       └── hardhat.config.ts
│
└── docs/
    ├── din-architecture.md                    # This document
    ├── whitepaper.md                          # Protocol specification
    ├── ui-flow-wireframe.md                   # UI/UX flows
    └── menu-flow.md                           # Navigation structure
```

---

## 🔗 Smart Contract Architecture

### Core Contracts

#### 1. Insurance.sol
Main insurance logic contract handling product registration and claims.

```solidity
pragma solidity ^0.8.20;

contract Insurance {
    struct Tranche {
        uint256 id;
        int256 triggerLevel; // -5%, -10%, -15%
        uint256 premium; // Premium rate in basis points
        uint256 capacity; // Max coverage amount
        uint256 filled; // Current filled amount
        bool active;
    }
    
    struct Position {
        address holder;
        uint256 trancheId;
        uint256 coverage;
        uint256 premium;
        uint256 expiry;
        bool claimed;
    }
    
    mapping(uint256 => Tranche) public tranches;
    mapping(uint256 => Position) public positions;
    
    event InsurancePurchased(
        address indexed buyer,
        uint256 indexed positionId,
        uint256 trancheId,
        uint256 coverage
    );
    
    event ClaimProcessed(
        address indexed holder,
        uint256 indexed positionId,
        uint256 payout
    );
    
    function purchase(uint256 trancheId) external payable {
        // Purchase logic
    }
    
    function processClaim(uint256 positionId) external {
        // Claim processing logic
    }
}
```

#### 2. TranchePool.sol
Manages liquidity pools for each insurance tranche.

```solidity
contract TranchePool {
    struct Pool {
        uint256 totalDeposits;
        uint256 activeInsurance;
        uint256 availableLiquidity;
        uint256 accumulatedPremiums;
        uint256 stakingRewards;
    }
    
    struct LPPosition {
        address provider;
        uint256 depositAmount;
        uint256 shareTokens;
        uint256 earnedPremiums;
        uint256 stakingRewards;
    }
    
    mapping(uint256 => Pool) public pools;
    mapping(address => LPPosition) public positions;
    
    function deposit(uint256 trancheId) external payable {
        // Deposit logic
    }
    
    function withdraw(uint256 amount) external {
        // Withdrawal logic
    }
}
```

#### 3. Treasury.sol
Protocol treasury and fee management.

```solidity
contract Treasury {
    uint256 public protocolFeeRate = 500; // 5% in basis points
    uint256 public totalFeesCollected;
    uint256 public emergencyFund;
    
    function collectFees(uint256 amount) external {
        uint256 fee = (amount * protocolFeeRate) / 10000;
        totalFeesCollected += fee;
        // Transfer logic
    }
    
    function distributeFees() external onlyAdmin {
        // Fee distribution logic
    }
}
```

### Contract Interactions

```
User Purchase Flow:
User → Insurance.purchase() → TranchePool.lockCollateral()
                           → Treasury.collectFees()
                           → Emit InsurancePurchased

LP Deposit Flow:
LP → TranchePool.deposit() → Mint share tokens
                           → Enable for underwriting

Claim Flow:
Oracle → Insurance.processClaim() → TranchePool.payoutClaim()
                                  → Update position
                                  → Emit ClaimProcessed
```

---

## 🌐 Web3 Provider Implementation

### Provider Setup

```typescript
// src/context/Web3Provider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Web3Provider as KaiaWeb3Provider } from "@kaiachain/ethers-ext/v6";
import { ethers } from "ethers";
import { KAIA_MAINNET, switchToKaiaNetwork } from "@/lib/constants";

// Storage keys
const STORAGE_KEYS = {
  ACCOUNT: "dinyk_wallet_account",
  CONNECTED: "dinyk_wallet_connected",
  PROVIDER_TYPE: "dinyk_provider_type",
} as const;

// Provider types
export enum ProviderType {
  METAMASK = "metamask",
  KAIKAS = "kaikas",
  WALLET_CONNECT = "walletconnect",
}

// Context type
interface Web3ContextType {
  // State
  provider: KaiaWeb3Provider | undefined;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  
  // Actions
  connectWallet: (type?: ProviderType) => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
  
  // Utilities
  getSigner: () => Promise<ethers.JsonRpcSigner | null>;
  getBalance: () => Promise<string>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<KaiaWeb3Provider>();
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize from session storage
  useEffect(() => {
    const storedAccount = sessionStorage.getItem(STORAGE_KEYS.ACCOUNT);
    const storedConnected = sessionStorage.getItem(STORAGE_KEYS.CONNECTED);
    const storedProviderType = sessionStorage.getItem(STORAGE_KEYS.PROVIDER_TYPE);
    
    if (storedAccount && storedConnected === "true" && window.ethereum) {
      reconnectWallet(storedProviderType as ProviderType);
    }
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        sessionStorage.setItem(STORAGE_KEYS.ACCOUNT, accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setChainId(parseInt(chainId, 16));
      window.location.reload(); // Reload on network change
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [account]);

  const detectProvider = (): any => {
    if (typeof window === "undefined") return null;
    
    // Check for Kaikas first (Kaia native wallet)
    if (window.klaytn) return window.klaytn;
    
    // Check for MetaMask or other ethereum wallets
    if (window.ethereum) return window.ethereum;
    
    return null;
  };

  const reconnectWallet = async (providerType: ProviderType) => {
    try {
      const detectedProvider = detectProvider();
      if (!detectedProvider) return;

      const web3Provider = new KaiaWeb3Provider(detectedProvider);
      const accounts = await web3Provider.listAccounts();
      
      if (accounts.length > 0) {
        const network = await web3Provider.getNetwork();
        
        setProvider(web3Provider);
        setAccount(accounts[0]);
        setChainId(Number(network.chainId));
        setIsConnected(true);
      }
    } catch (err) {
      console.error("Failed to reconnect wallet:", err);
    }
  };

  const connectWallet = async (type: ProviderType = ProviderType.METAMASK) => {
    setIsConnecting(true);
    setError(null);

    try {
      const detectedProvider = detectProvider();
      
      if (!detectedProvider) {
        throw new Error("No Web3 wallet detected. Please install MetaMask or Kaikas.");
      }

      const web3Provider = new KaiaWeb3Provider(detectedProvider);
      
      // Request accounts
      const accounts = await web3Provider.send("kaia_requestAccounts", []);
      
      if (accounts.length === 0) {
        throw new Error("No accounts found. Please unlock your wallet.");
      }

      // Get network
      const network = await web3Provider.getNetwork();
      const currentChainId = Number(network.chainId);
      
      // Check if on Kaia network
      if (currentChainId !== KAIA_MAINNET.chainId) {
        await switchToKaiaNetwork();
      }

      // Set state
      setProvider(web3Provider);
      setAccount(accounts[0]);
      setChainId(currentChainId);
      setIsConnected(true);

      // Persist to session
      sessionStorage.setItem(STORAGE_KEYS.ACCOUNT, accounts[0]);
      sessionStorage.setItem(STORAGE_KEYS.CONNECTED, "true");
      sessionStorage.setItem(STORAGE_KEYS.PROVIDER_TYPE, type);

    } catch (err: any) {
      setError(err);
      console.error("Failed to connect wallet:", err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(undefined);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    setError(null);

    // Clear session storage
    Object.values(STORAGE_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
  };

  const switchNetwork = async () => {
    if (!window.ethereum) {
      throw new Error("No wallet detected");
    }
    await switchToKaiaNetwork();
  };

  const getSigner = async (): Promise<ethers.JsonRpcSigner | null> => {
    if (!provider || !account) return null;
    return provider.getSigner(0);
  };

  const getBalance = async (): Promise<string> => {
    if (!provider || !account) return "0";
    const balance = await provider.getBalance(account);
    return ethers.formatEther(balance);
  };

  const value: Web3ContextType = {
    provider,
    account,
    chainId,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getSigner,
    getBalance,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};
```

### Network Management

```typescript
export const switchToKaiaNetwork = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: KAIA_MAINNET.chainIdHex }],
    });
  } catch (switchError: any) {
    // Network not added, add it
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: KAIA_MAINNET.chainIdHex,
          chainName: KAIA_MAINNET.name,
          nativeCurrency: KAIA_MAINNET.currency,
          rpcUrls: [KAIA_MAINNET.rpcUrl],
          blockExplorerUrls: [KAIA_MAINNET.blockExplorer],
        }],
      });
    }
  }
};
```

---

## 🔮 Oracle Architecture

### Multi-Oracle Router System

```
┌─────────────────────────────────────────────┐
│              Oracle Router                   │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────┐      ┌──────────────┐    │
│  │ Primary Feed │      │ Fallback Feed│    │
│  │ (Kaia Price) │      │   (OO-lite)  │    │
│  └──────┬───────┘      └──────┬───────┘    │
│         │                      │             │
│    ┌────▼──────────────────────▼────┐       │
│    │     Aggregation Logic          │       │
│    │  - Median calculation          │       │
│    │  - Outlier detection           │       │
│    │  - Timestamp validation        │       │
│    └────────────┬───────────────────┘       │
│                 │                            │
│         ┌───────▼────────┐                  │
│         │ Final Result   │                  │
│         └────────────────┘                  │
└─────────────────────────────────────────────┘
```

### Oracle Implementation

```solidity
contract OracleRouter {
    mapping(bytes32 => DataFeed) public dataFeeds;
    
    struct DataFeed {
        address primaryOracle;
        address fallbackOracle;
        uint256 maxDeviation;
        uint256 heartbeat;
    }
    
    function getPrice(bytes32 feedId) 
        external 
        view 
        returns (int256 price, uint256 timestamp) 
    {
        // Try primary oracle
        try IPriceOracle(dataFeeds[feedId].primaryOracle).latestAnswer() 
            returns (int256 _price, uint256 _timestamp) {
            if (block.timestamp - _timestamp <= dataFeeds[feedId].heartbeat) {
                return (_price, _timestamp);
            }
        } catch {}
        
        // Fallback to OO-lite
        return IOOLite(dataFeeds[feedId].fallbackOracle).getPrice(feedId);
    }
}
```

---

## 🔧 Contract Integration Hooks

### Insurance Hook

```typescript
// src/hooks/useInsurance.ts
import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/context/Web3Provider';
import InsuranceABI from '@/contracts/abis/Insurance.json';
import { KAIA_MAINNET } from '@/lib/constants';

export interface InsuranceProduct {
  id: number;
  name: string;
  triggerLevel: number;
  premium: number;
  capacity: string;
  filled: string;
  available: string;
}

export function useInsurance() {
  const { provider, account, getSigner } = useWeb3();
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get contract instance
  const getContract = useCallback(async (withSigner = false) => {
    if (!provider) return null;
    
    const contractAddress = KAIA_MAINNET.contracts.insurance;
    if (!contractAddress) return null;

    if (withSigner && account) {
      const signer = await getSigner();
      if (!signer) return null;
      return new ethers.Contract(contractAddress, InsuranceABI.abi, signer);
    }

    return new ethers.Contract(contractAddress, InsuranceABI.abi, provider);
  }, [provider, account, getSigner]);

  // Fetch insurance products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const contract = await getContract();
      if (!contract) throw new Error("Contract not available");

      const productCount = await contract.getProductCount();
      const products: InsuranceProduct[] = [];

      for (let i = 0; i < productCount; i++) {
        const tranche = await contract.tranches(i);
        products.push({
          id: i,
          name: `Protection ${tranche.triggerLevel}%`,
          triggerLevel: Number(tranche.triggerLevel),
          premium: Number(tranche.premium),
          capacity: ethers.formatEther(tranche.capacity),
          filled: ethers.formatEther(tranche.filled),
          available: ethers.formatEther(tranche.capacity - tranche.filled),
        });
      }

      setProducts(products);
    } catch (err: any) {
      setError(err);
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [getContract]);

  // Purchase insurance
  const purchaseInsurance = useCallback(async (
    trancheId: number,
    coverageAmount: string
  ) => {
    try {
      const contract = await getContract(true);
      if (!contract) throw new Error("Contract not available");

      const value = ethers.parseEther(coverageAmount);
      
      // Estimate gas
      const gasEstimate = await contract.purchase.estimateGas(trancheId, {
        value,
      });

      // Add 20% buffer to gas estimate
      const gasLimit = gasEstimate * 120n / 100n;

      // Send transaction
      const tx = await contract.purchase(trancheId, {
        value,
        gasLimit,
      });

      // Wait for confirmation
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (err: any) {
      console.error("Purchase failed:", err);
      throw err;
    }
  }, [getContract]);

  // Claim payout
  const claimPayout = useCallback(async (positionId: number) => {
    try {
      const contract = await getContract(true);
      if (!contract) throw new Error("Contract not available");

      const tx = await contract.claim(positionId, {
        gasLimit: 200000,
      });

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (err: any) {
      console.error("Claim failed:", err);
      throw err;
    }
  }, [getContract]);

  // Auto-fetch products when provider is ready
  useEffect(() => {
    if (provider) {
      fetchProducts();
    }
  }, [provider, fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    purchaseInsurance,
    claimPayout,
  };
}
```

---

## 📊 Data Flow Patterns

### Read Operations (View Functions)
```
User Action → React Component → Custom Hook → Contract Instance → RPC Provider → Blockchain
                                       ↓
                              Return Cached Data (if fresh)
```

### Write Operations (Transactions)
```
User Action → Validation → Preview Modal → Wallet Signature → Transaction
                                                    ↓
                                            Monitor Status
                                                    ↓
                                            Update UI State
                                                    ↓
                                            Show Confirmation
```

### Event Monitoring
```typescript
// Listen for contract events
useEffect(() => {
  if (!contract) return;

  const handleInsurancePurchased = (buyer: string, positionId: bigint) => {
    if (buyer.toLowerCase() === account?.toLowerCase()) {
      // Refresh user positions
      fetchUserPositions();
      // Show success notification
      showToast("Insurance purchased successfully!");
    }
  };

  contract.on("InsurancePurchased", handleInsurancePurchased);

  return () => {
    contract.off("InsurancePurchased", handleInsurancePurchased);
  };
}, [contract, account]);
```

---

## 🏦 Asset Management Architecture

### Tranche Pool Structure

```
┌─────────────────────────────────────────────┐
│           Tranche Pool Manager               │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │     Low Risk Tranche (-5%)           │   │
│  │  • Capacity: 100,000 USDT           │   │
│  │  • Premium: 2%                      │   │
│  │  • Staking APY: 3.5%                │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │    Medium Risk Tranche (-10%)        │   │
│  │  • Capacity: 50,000 USDT            │   │
│  │  • Premium: 5%                       │   │
│  │  • Staking APY: 3.5%                │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │     High Risk Tranche (-15%)         │   │
│  │  • Capacity: 25,000 USDT            │   │
│  │  • Premium: 10%                      │   │
│  │  • Staking APY: 3.5%                │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Re-staking Strategy

```typescript
interface RestakingConfig {
  enabled: boolean;
  maxAllocation: number; // 80% max
  whitelistedProtocols: string[];
  minLiquidity: number; // 20% must remain liquid
  emergencyWithdrawEnabled: boolean;
}

// Conservative re-staking implementation
class RestakingManager {
  async stake(amount: BigNumber) {
    // Check constraints
    if (amount > maxAllocation) revert("Exceeds max allocation");
    
    // Distribute across whitelisted protocols
    const protocols = getWhitelistedProtocols();
    const allocation = amount.div(protocols.length);
    
    for (const protocol of protocols) {
      await protocol.deposit(allocation);
    }
  }
  
  async withdraw(amount: BigNumber) {
    // Emergency withdrawal if needed
    if (emergencyMode) {
      return emergencyWithdraw(amount);
    }
    
    // Normal withdrawal with checks
    const available = await getAvailableLiquidity();
    if (amount > available) revert("Insufficient liquidity");
    
    return normalWithdraw(amount);
  }
}
```

---

## 🔐 Security Implementation

### Transaction Safety Layers

#### 1. Input Validation
```typescript
export const validatePurchaseInput = (amount: string, maxAmount: string): void => {
  const value = parseFloat(amount);
  const max = parseFloat(maxAmount);
  
  if (isNaN(value) || value <= 0) {
    throw new Error("Invalid amount");
  }
  
  if (value > max) {
    throw new Error("Amount exceeds available capacity");
  }
  
  // Check decimal places (max 18 for KLAY)
  const decimals = amount.split('.')[1]?.length || 0;
  if (decimals > 18) {
    throw new Error("Too many decimal places");
  }
};
```

#### 2. Transaction Preview
```typescript
export const TransactionPreview: React.FC<{tx: any}> = ({ tx }) => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h3 className="font-bold mb-2">Transaction Preview</h3>
      <div className="space-y-1 text-sm">
        <div>To: {tx.to}</div>
        <div>Value: {ethers.formatEther(tx.value)} KLAY</div>
        <div>Estimated Gas: {tx.gasLimit?.toString()}</div>
        <div>Action: {tx.data ? "Contract Interaction" : "Transfer"}</div>
      </div>
    </div>
  );
};
```

#### 3. Error Handling
```typescript
export const parseContractError = (error: any): string => {
  // Common contract errors
  if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    return "Transaction would fail. Please check your inputs.";
  }
  
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return "Insufficient KLAY balance for transaction.";
  }
  
  if (error.reason) {
    return error.reason;
  }
  
  if (error.message?.includes('user rejected')) {
    return "Transaction cancelled by user.";
  }
  
  return "Transaction failed. Please try again.";
};
```

### Multi-Signature Controls

```
Admin Functions (3/5 Multisig Required):
- Update oracle addresses
- Modify fee structures
- Emergency pause/unpause
- Add/remove whitelisted protocols

Operational Functions (2/3 Multisig):
- Process large claims
- Rebalance pools
- Update product parameters
```

### Access Control Pattern

```solidity
contract AccessControl {
    mapping(bytes32 => mapping(address => bool)) public roles;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE");
    
    modifier onlyRole(bytes32 role) {
        require(roles[role][msg.sender], "Access denied");
        _;
    }
}
```

### Emergency Procedures

```solidity
contract EmergencyStop {
    bool public paused;
    uint256 public pausedAt;
    uint256 public constant MAX_PAUSE_DURATION = 72 hours;
    
    function emergencyPause() external onlyAdmin {
        paused = true;
        pausedAt = block.timestamp;
        emit EmergencyPause(msg.sender, block.timestamp);
    }
    
    function unpause() external onlyAdmin {
        require(
            block.timestamp <= pausedAt + MAX_PAUSE_DURATION,
            "Pause expired"
        );
        paused = false;
        emit Unpaused(msg.sender, block.timestamp);
    }
}
```

---

## 🎨 UI/UX Guidelines

### Connection States
```typescript
enum WalletState {
  Disconnected = "Connect your wallet to get started",
  Connecting = "Connecting to wallet...",
  Connected = "Connected",
  WrongNetwork = "Please switch to Kaia network",
  NoWallet = "Please install MetaMask or Kaikas"
}
```

### Loading Patterns
- **Skeleton loaders** for data fetching
- **Spinner overlays** for transactions
- **Progress bars** for multi-step processes
- **Optimistic updates** where safe

### Error Display
- **Toast notifications** for transaction status
- **Inline errors** for form validation
- **Modal alerts** for critical errors
- **Retry buttons** for recoverable errors

---

## 📈 Performance Optimization

### Contract Call Optimization
```typescript
// Batch read operations
const batchRead = async (contract: Contract, calls: any[]) => {
  const promises = calls.map(call => 
    contract[call.method](...call.args)
  );
  return Promise.all(promises);
};
```

### Caching Strategy
```typescript
// Cache contract data for 30 seconds
const CACHE_DURATION = 30_000;

const cacheManager = {
  cache: new Map(),
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  },
  
  set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
};
```

### Gas Optimization
- Use `view` functions whenever possible
- Batch operations in single transaction
- Implement efficient data structures in contracts
- Pre-calculate gas estimates with buffer

---

## 🔄 Implementation Plan

### Phase 1: Foundation Setup (Week 1)

#### Day 1-2: Remove Server Dependencies
```bash
# Remove packages
pnpm remove @dinsure/api @dinsure/auth @dinsure/db @dinsure/validators
pnpm remove @trpc/client @trpc/server @trpc/next
pnpm remove better-auth drizzle-orm

# Clean up files
rm -rf packages/api packages/auth packages/db
rm -rf apps/nextjs/src/server
rm -rf apps/nextjs/src/trpc
```

#### Day 3-4: Install Web3 Stack
```bash
# Core dependencies
pnpm add @kaiachain/ethers-ext@1.1.1
pnpm add ethers@^6.13.4

# Development dependencies
pnpm add -D hardhat @nomicfoundation/hardhat-toolbox
pnpm add -D @typechain/ethers-v6 @typechain/hardhat
pnpm add -D hardhat-deploy hardhat-gas-reporter
```

#### Day 5: Setup Web3 Provider
Implement the Web3Provider context as shown above.

### Phase 2: Smart Contract Development (Week 2)
- Deploy Insurance.sol
- Deploy TranchePool.sol
- Deploy Treasury.sol
- Integrate Oracle Router

### Phase 3: Contract Integration (Week 3)
- Implement insurance hooks
- Build UI components
- Create purchase flow
- Add portfolio management

### Phase 4: UI Implementation (Week 4)
- Complete wallet connection
- Insurance catalog
- Liquidity provision
- Claims interface

---

## 🧪 Testing Strategy

### Unit Testing
```typescript
// Test wallet connection
describe('Web3Provider', () => {
  it('should connect wallet successfully', async () => {
    const { result } = renderHook(() => useWeb3());
    await act(async () => {
      await result.current.connectWallet();
    });
    expect(result.current.isConnected).toBe(true);
  });
});
```

### Integration Testing
- Mock contract interactions
- Test transaction flows
- Verify error handling
- Check state persistence

### E2E Testing
```typescript
// Playwright test example
test('complete insurance purchase flow', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Connect Wallet');
  await page.click('text=MetaMask');
  // ... continue flow
});
```

---

## 📝 Environment Configuration

### Development (.env.local)
```bash
# Network
NEXT_PUBLIC_CHAIN_ID=8217
NEXT_PUBLIC_RPC_URL=https://public-en-cypress.klaytn.net

# Contracts (deploy to testnet first)
NEXT_PUBLIC_INSURANCE_CONTRACT=0x...
NEXT_PUBLIC_TREASURY_CONTRACT=0x...
NEXT_PUBLIC_TRANCHE_POOL_CONTRACT=0x...

# Optional
NEXT_PUBLIC_ENABLE_TESTNETS=true
NEXT_PUBLIC_SHOW_DEBUG_INFO=true
```

### Production (.env.production)
```bash
# Network
NEXT_PUBLIC_CHAIN_ID=8217
NEXT_PUBLIC_RPC_URL=https://your-dedicated-rpc.com

# Contracts (mainnet addresses)
NEXT_PUBLIC_INSURANCE_CONTRACT=0x...
NEXT_PUBLIC_TREASURY_CONTRACT=0x...
NEXT_PUBLIC_TRANCHE_POOL_CONTRACT=0x...

# Security
NEXT_PUBLIC_ENABLE_TESTNETS=false
NEXT_PUBLIC_SHOW_DEBUG_INFO=false
```

---

## 🚀 Deployment Process

### Smart Contract Deployment

```typescript
// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying to Kaia Mainnet...");
  
  const Insurance = await ethers.getContractFactory("Insurance");
  const insurance = await Insurance.deploy();
  await insurance.waitForDeployment();
  
  console.log("Insurance deployed to:", await insurance.getAddress());
  
  // Verify on Kaiascope
  if (process.env.KAIASCOPE_API_KEY) {
    await run("verify:verify", {
      address: await insurance.getAddress(),
      constructorArguments: [],
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Deployment Checklist

#### Pre-deployment
- [ ] Smart contracts audited
- [ ] Gas optimization completed
- [ ] All tests passing
- [ ] Security review done
- [ ] RPC endpoints configured
- [ ] Environment variables set

#### Deployment Steps
1. Deploy smart contracts to Kaia mainnet
2. Verify contracts on Kaiascope
3. Update contract addresses in environment
4. Deploy frontend to Vercel/Netlify
5. Test with small amounts first
6. Monitor for issues

#### Post-deployment
- [ ] Monitor contract events
- [ ] Track gas usage
- [ ] Collect user feedback
- [ ] Plan iterative improvements

---

## 📊 Monitoring & Analytics

### Key Metrics

```typescript
interface ProtocolMetrics {
  // Financial metrics
  totalValueLocked: BigNumber;
  totalPremiumsCollected: BigNumber;
  totalClaimsPaid: BigNumber;
  lossRatio: number;
  
  // Operational metrics
  activePositions: number;
  averageCoverageAmount: BigNumber;
  poolUtilization: number;
  
  // Risk metrics
  maxExposurePerEvent: BigNumber;
  concentrationRisk: number;
  liquidityRatio: number;
}
```

### Event Monitoring

```typescript
// Critical events to monitor
enum CriticalEvents {
  LARGE_CLAIM = "LargeClaim", // > $10,000
  POOL_DEPLETION = "PoolDepletion", // < 20% liquidity
  ORACLE_FAILURE = "OracleFailure",
  UNUSUAL_ACTIVITY = "UnusualActivity",
}

// Monitoring service
class MonitoringService {
  async monitorEvents() {
    contract.on("ClaimProcessed", async (event) => {
      if (event.amount > LARGE_CLAIM_THRESHOLD) {
        await alertAdmin(CriticalEvents.LARGE_CLAIM, event);
      }
    });
    
    // Check pool health every hour
    setInterval(async () => {
      const pools = await getAllPools();
      for (const pool of pools) {
        if (pool.liquidityRatio < 0.2) {
          await alertAdmin(CriticalEvents.POOL_DEPLETION, pool);
        }
      }
    }, 3600000);
  }
}
```

---

## 📊 Success Metrics

### Technical Metrics
- **Connection Success Rate**: > 95%
- **Transaction Success Rate**: > 90%
- **Page Load Time**: < 2 seconds
- **Time to Connect Wallet**: < 3 seconds

### User Experience Metrics
- **Wallet Connection Completion**: > 80%
- **Purchase Flow Completion**: > 60%
- **Error Recovery Rate**: > 70%
- **User Retention**: > 40% weekly

### Business Metrics
- **Total Value Locked (TVL)**: Track growth
- **Number of Active Positions**: Monitor adoption
- **Claim Success Rate**: Ensure reliability
- **Gas Cost per Transaction**: Optimize for users

---

## 🔄 Future Enhancements

### Phase 2 (Q2 2025)
- Multi-chain support (Ethereum, Polygon)
- Advanced wallet integrations (Safe, Argent)
- Gasless transactions via meta-transactions
- On-chain governance implementation

### Phase 3 (Q3 2025)
- Cross-chain insurance products
- Automated market making for premiums
- Yield optimization strategies
- Mobile app with WalletConnect

### Phase 4 (Q4 2025)
- Decentralized oracle integration
- AI-powered risk assessment
- Social trading features
- DAO treasury management

---

## 📚 Resources & References

### Documentation
- [Kaia Documentation](https://docs.kaia.io)
- [Ethers.js v6 Docs](https://docs.ethers.org/v6/)
- [@kaiachain/ethers-ext](https://www.npmjs.com/package/@kaiachain/ethers-ext)
- [MetaMask Integration](https://docs.metamask.io/guide/)

### Project Documentation
- **Whitepaper**: `/docs/whitepaper.md` - Full protocol specification
- **UI Wireframes**: `/docs/ui-flow-wireframe.md` - Detailed UI flows
- **Menu Flow**: `/docs/menu-flow.md` - Navigation structure

### Example Projects
- [Kaia DApp Examples](https://github.com/kaiachain/samples)
- [DeFi Insurance References](https://github.com/topics/defi-insurance)

### Development Tools
- [Kaiascope Explorer](https://kaiascope.com)
- [Hardhat](https://hardhat.org)
- [Remix IDE](https://remix.ethereum.org)

### Community
- [Kaia Discord](https://discord.gg/kaia)
- [Kaia Forum](https://forum.kaia.io)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/kaia)

---

*This document represents the complete Web3 architecture for DIN (Dinyk). It prioritizes Kaia blockchain integration while maintaining flexibility for future expansion. All technical decisions are based on proven patterns and best practices.*

*Last Updated: January 2025*
*Version: 2.0.0 (Unified)*