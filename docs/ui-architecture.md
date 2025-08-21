# DIN Protocol UI Architecture & Contract Integration

## Overview

This document provides a comprehensive guide for the DIN Protocol UI architecture, combining user flows, wireframes, component mapping, and smart contract integration. It serves as the single source of truth for frontend implementation with complete contract function mappings.

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Navigation & Layout](#navigation--layout)
3. [Insurance Catalog & Purchase](#insurance-catalog--purchase)
4. [Liquidity Provision](#liquidity-provision)
5. [Portfolio Management](#portfolio-management)
6. [Oracle & Price Feeds](#oracle--price-feeds)
7. [Settlement & Claims](#settlement--claims)
8. [State Management Architecture](#state-management-architecture)
9. [Design System](#design-system)
10. [Implementation Guide](#implementation-guide)

## Platform Overview

DIN is a decentralized insurance platform on Kaia blockchain providing parametric insurance products with two user types:
- **Insurance Buyers**: Purchase coverage for risk hedging
- **Liquidity Providers**: Deposit USDT to earn premiums and staking rewards

### Main Navigation Structure

```
┌─────────────────────────────────────────────────┐
│                   Header                         │
│  [DIN Logo]  Insurance  Liquidity  Portfolio     │
│                              [Connect Wallet]     │
└─────────────────────────────────────────────────┘
```

## Landing Page

### Hero Section & Key Metrics

```
┌─────────────────────────────────────────────────┐
│         Decentralized Insurance on Kaia          │
│    Protect your crypto assets with on-chain      │
│         parametric insurance products             │
│     [Buy Insurance]    [Provide Liquidity]       │
├──────────────┬──────────────┬──────────────────┤
│  Total TVL   │ Active Pools │ Total Premiums   │
│  $2.5M USDT  │     12       │   $125K USDT     │
└──────────────┴──────────────┴──────────────────┘
```

#### Contract Functions
```solidity
// DinRegistry.sol
- getParameter(PROTOCOL_FEE_BPS) → protocolFee

// ProductCatalog.sol  
- getActiveProducts() → Product[]
- getActiveTranches() → Tranche[]

// TranchePoolCore.sol (multiple pools)
- poolAccounting() → PoolAccounting (TVL, shares, etc.)
```

#### Components & State
```typescript
// components/home/HeroSection.tsx
interface HeroSectionProps {
  onBuyInsurance: () => void;
  onProvideLiquidity: () => void;
}

// components/home/MetricsDashboard.tsx
interface MetricsDashboardProps {
  tvl: BigNumber;
  activePools: number;
  totalPremiums: BigNumber;
}

// State Management
interface DashboardState {
  metrics: {
    tvl: BigNumber;
    activePools: number;
    totalPremiums: BigNumber;
    totalUsers: number;
  };
  loading: boolean;
  
  fetchMetrics: () => Promise<void>;
}
```

## Insurance Catalog & Purchase

### Product Browsing Flow

```
┌─────────────────────────────────────────────────┐
│ Filter: Asset [All ▼] Trigger [All ▼] Duration  │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐   │
│ │ BTC Price Protection                       │   │
│ │ ┌─────────────────────────────────────┐   │   │
│ │ │ Tranche A: -5%  | Premium: 2%       │   │   │
│ │ │ Capacity: 100K | Filled: 60%        │   │   │
│ │ │ [Buy Insurance]                     │   │   │
│ │ └─────────────────────────────────────┘   │   │
│ │ ┌─────────────────────────────────────┐   │   │
│ │ │ Tranche B: -10% | Premium: 5%       │   │   │
│ │ │ Capacity: 50K  | Filled: 80%        │   │   │
│ │ │ [Buy Insurance]                     │   │   │
│ │ └─────────────────────────────────────┘   │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

#### Contract Integration
```solidity
// ProductCatalog.sol
- getActiveProducts() → Product[]
- getProductTranches(productId) → Tranche[]
- getTranche(trancheId) → TrancheSpec
- calculatePremium(trancheId, amount) → premium
- getRound(roundId) → Round

// TranchePoolCore.sol
- roundEconomics(roundId) → RoundEconomics
```

#### Components
```typescript
// components/insurance/ProductGrid.tsx
interface ProductGridProps {
  products: Product[];
  onSelectProduct: (productId: number) => void;
}

// components/insurance/TrancheCard.tsx
interface TrancheCardProps {
  tranche: Tranche;
  round: Round;
  capacity: BigNumber;
  filled: number; // percentage
  onBuyInsurance: () => void;
}

// State
interface ProductState {
  products: Product[];
  selectedProduct: Product | null;
  selectedTranche: Tranche | null;
  filters: {
    asset: string;
    triggerType: TriggerType;
    duration: number;
  };
  
  fetchProducts: () => Promise<void>;
  applyFilters: (filters: Filters) => void;
  selectProduct: (productId: number) => void;
}
```

### Insurance Purchase Flow

#### Step 1: Product Selection & Premium Calculation

```
┌─────────────────────────────────────────────────┐
│           BTC -10% Price Protection              │
├─────────────────────────────────────────────────┤
│ Coverage Details:                                │
│ • Trigger: BTC drops 10% from baseline           │
│ • Baseline: $45,000                              │
│ • Expiry: March 10, 2025                        │
│                                                   │
│ Coverage Amount: [1000] USDT                     │
│ Premium (5%): 50 USDT                           │
│ Total Payment: 50 USDT                          │
│                                                   │
│ [← Back]              [Continue to Review →]     │
└─────────────────────────────────────────────────┘
```

#### Contract Functions
```solidity
// ProductCatalog.sol
- calculatePremium(trancheId, purchaseAmount) → premium

// USDT.sol
- balanceOf(buyer) → balance
- allowance(buyer, poolAddress) → allowance
```

#### Components
```typescript
// components/insurance/PurchaseModal.tsx
interface PurchaseModalProps {
  tranche: Tranche;
  round: Round;
  onPurchase: (amount: string) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

// components/insurance/PremiumCalculator.tsx
interface PremiumCalculatorProps {
  trancheId: number;
  onCalculate: (amount: string) => void;
  premium?: BigNumber;
  balance: BigNumber;
}
```

#### Step 2: Approval & Confirmation

```
┌─────────────────────────────────────────────────┐
│              Review Your Insurance               │
├─────────────────────────────────────────────────┤
│ Product: BTC -10% Protection                     │
│ Coverage: 1000 USDT                             │
│ Premium: 50 USDT                                │
│                                                   │
│ Step 1: Approve USDT                            │
│ [Approve USDT] ✓ Approved                       │
│                                                   │
│ Step 2: Purchase Insurance                       │
│ □ I understand the terms                        │
│                                                   │
│ [← Back]                    [Confirm Purchase]   │
└─────────────────────────────────────────────────┘
```

#### Contract Functions
```solidity
// USDT.sol
- approve(poolAddress, amount) → success

// TranchePoolCore.sol
- buyInsurance(roundId, amount, recipient) → tokenId
```

#### Components & State
```typescript
// components/insurance/ApprovalStep.tsx
interface ApprovalStepProps {
  amount: BigNumber;
  currentAllowance: BigNumber;
  poolAddress: string;
  onApprove: () => Promise<void>;
  approved: boolean;
}

// State Management
interface PurchaseState {
  // Transaction state
  status: 'idle' | 'approving' | 'purchasing' | 'success' | 'error';
  txHash: string | null;
  tokenId: string | null;
  
  // Form state
  purchaseAmount: string;
  calculatedPremium: BigNumber | null;
  totalPayment: BigNumber | null;
  
  // Approval state
  allowance: BigNumber;
  needsApproval: boolean;
  
  // Actions
  approveUSDT: () => Promise<void>;
  executePurchase: () => Promise<void>;
}
```

#### Step 3: Transaction Status & Receipt

```
┌─────────────────────────────────────────────────┐
│           ✓ Insurance Purchased!                 │
├─────────────────────────────────────────────────┤
│                                                   │
│   Policy NFT #1234 has been minted              │
│                                                   │
│   Transaction: 0x1234...5678                    │
│   [View on Kaiascope]                           │
│                                                   │
│   [View in Portfolio]    [Buy More Insurance]    │
└─────────────────────────────────────────────────┘
```

#### Contract Events
```solidity
// TranchePoolCore.sol events
event BuyerOrderPlaced(
  address indexed buyer,
  uint256 indexed roundId,
  uint256 purchaseAmount,
  uint256 premiumPaid,
  uint256 insuranceTokenId
);

// InsuranceToken.sol events
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
```

## Liquidity Provision

### Liquidity Dashboard

```
┌─────────────────────────────────────────────────┐
│            Liquidity Provider Dashboard          │
├──────────────┬──────────────┬──────────────────┤
│ Total Deposit│ Active Pools │ Total Earnings   │
│ 10,000 USDT  │      3       │   450 USDT      │
├──────────────┴──────────────┴──────────────────┤
│              Available Tranche Pools             │
│ ┌───────────────────────────────────────────┐   │
│ │ BTC -10% Tranche                          │   │
│ │ Expected Premium: 5% (500 USDT/10K)       │   │
│ │ Staking APY: 3.5%                         │   │
│ │ Risk Level: MEDIUM                        │   │
│ │ Your Share: 5,000 USDT                    │   │
│ │ [Add More] [Withdraw]                     │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

#### Contract Functions
```solidity
// TranchePoolCore.sol
- depositCollateral(roundId, amount) → shares
- withdrawCollateral(amount) → withdrawn
- getSellerPosition(roundId, seller) → SellerPosition
- shareBalances(account) → balance
- navPerShare() → price
- poolAccounting() → PoolAccounting
```

#### Components
```typescript
// components/liquidity/LiquidityDashboard.tsx
interface LiquidityDashboardProps {
  totalDeposit: BigNumber;
  activePools: number;
  totalEarnings: BigNumber;
  pools: PoolInfo[];
}

// components/liquidity/PoolCard.tsx
interface PoolCardProps {
  pool: PoolInfo;
  userPosition: SellerPosition;
  navPerShare: BigNumber;
  onDeposit: () => void;
  onWithdraw: () => void;
}

// components/liquidity/DepositModal.tsx
interface DepositModalProps {
  pool: PoolInfo;
  round: Round;
  balance: BigNumber;
  onDeposit: (amount: string) => Promise<void>;
}
```

### Deposit Flow

```
┌─────────────────────────────────────────────────┐
│           Provide Liquidity to Pool              │
├─────────────────────────────────────────────────┤
│ Pool: BTC -10% Tranche                          │
│ Current Round: #12 (Ends in 2 days)             │
│                                                   │
│ Deposit Amount: [5000] USDT                     │
│ Balance: 15,000 USDT                            │
│ [25%] [50%] [75%] [MAX]                        │
│                                                   │
│ Expected Returns:                                │
│ • Premium Income: ~250 USDT (5%)                │
│ • Staking Rewards: ~175 USDT (3.5%)            │
│                                                   │
│ Step 1: Approve USDT [Approve]                  │
│ Step 2: Deposit Funds                           │
│                                                   │
│ [Cancel]                    [Confirm Deposit]    │
└─────────────────────────────────────────────────┘
```

#### Contract Functions & State
```solidity
// USDT.sol
- approve(poolAddress, amount)

// TranchePoolCore.sol
- depositCollateral(roundId, amount) → shares
- roundEconomics(roundId) → RoundEconomics
```

```typescript
// State Management
interface LiquidityState {
  // Pool data
  pools: PoolInfo[];
  selectedPool: PoolInfo | null;
  poolStats: PoolStats | null;
  
  // User positions
  positions: SellerPosition[];
  totalShares: BigNumber;
  totalValue: BigNumber;
  
  // Transaction state
  depositStatus: TransactionStatus;
  withdrawStatus: TransactionStatus;
  
  // Actions
  deposit: (poolId: number, amount: string) => Promise<void>;
  withdraw: (poolId: number, shares: string) => Promise<void>;
  calculateWithdrawAmount: (shares: string) => BigNumber;
}
```

## Portfolio Management

### Portfolio Overview

```
┌─────────────────────────────────────────────────┐
│                 My Portfolio                     │
├─────────────────────────────────────────────────┤
│ Tabs: [Active Insurance] [LP Positions] [History]│
├─────────────────────────────────────────────────┤
│              Active Insurance Policies           │
│ ┌───────────────────────────────────────────┐   │
│ │ Policy #1234                              │   │
│ │ BTC -10% Protection                       │   │
│ │ Coverage: 1000 USDT                       │   │
│ │ Status: ● Active                          │   │
│ │ Current BTC: $44,500 (-1.1%)              │   │
│ │ Expires: 5 days                           │   │
│ └───────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────┐   │
│ │ Policy #1235                              │   │
│ │ ETH -15% Protection                       │   │
│ │ Status: ✓ Claimable                      │   │
│ │ Payout: 500 USDT                          │   │
│ │ [Claim Now]                               │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

#### Contract Functions
```solidity
// InsuranceToken.sol
- balanceOf(owner) → count
- tokenOfOwnerByIndex(owner, index) → tokenId
- getTokenInfo(tokenId) → (trancheId, roundId, purchaseAmount, originalBuyer)

// TranchePoolCore.sol
- buyerOrders(roundId, buyer) → BuyerOrder
- sellerPositions(roundId, seller) → SellerPosition

// SettlementEngine.sol
- getClaimStatus(tokenId) → ClaimStatus
- processClaim(tokenId) → payout
```

#### Components
```typescript
// components/portfolio/PortfolioDashboard.tsx
interface PortfolioDashboardProps {
  insurancePositions: InsurancePosition[];
  liquidityPositions: LiquidityPosition[];
  totalValue: BigNumber;
  activeTab: 'insurance' | 'liquidity' | 'history';
}

// components/portfolio/InsurancePositionCard.tsx
interface InsurancePositionCardProps {
  position: InsurancePosition;
  currentPrice: BigNumber;
  triggerPrice: BigNumber;
  timeToMaturity: number;
  claimable: boolean;
  onClaim: () => Promise<void>;
}

// components/portfolio/LiquidityPositionCard.tsx
interface LiquidityPositionCardProps {
  position: LiquidityPosition;
  shares: BigNumber;
  currentValue: BigNumber;
  earnings: BigNumber;
  onWithdraw: () => Promise<void>;
}
```

#### State Management
```typescript
interface PortfolioState {
  // Insurance positions
  insuranceTokens: InsuranceToken[];
  insurancePositions: InsurancePosition[];
  
  // Liquidity positions
  liquidityPositions: LiquidityPosition[];
  totalShares: Map<number, BigNumber>;
  
  // Claims
  claimablePayouts: ClaimablePayout[];
  
  // Aggregated stats
  totalPortfolioValue: BigNumber;
  totalAtRisk: BigNumber;
  totalEarnings: BigNumber;
  
  // Actions
  fetchPortfolio: () => Promise<void>;
  checkClaimable: () => Promise<void>;
  claimPayout: (tokenId: number) => Promise<void>;
}
```

## Oracle & Price Feeds

### Oracle Status Display

```
┌─────────────────────────────────────────────────┐
│              Oracle Information                  │
├─────────────────────────────────────────────────┤
│ Primary Oracle: Kaia Price Feed                  │
│ Status: ● Active                                 │
│ Last Update: 2 minutes ago                       │
│                                                   │
│ Current Prices:                                  │
│ • BTC/USD: $45,234.56                           │
│ • ETH/USD: $2,456.78                            │
│                                                   │
│ ┌───────────────────────────────────────────┐   │
│ │    Price Chart with Trigger Levels        │   │
│ │    [Chart showing price vs triggers]      │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

#### Contract Functions
```solidity
// OracleRouter.sol
- getLatestPrice(oracleRouteId) → (price, timestamp)
- getPriceFeed(oracleRouteId) → PriceFeed

// OraklPriceFeed.sol
- latestRoundData() → (roundId, price, startedAt, updatedAt, answeredInRound)
```

#### Components
```typescript
// components/oracle/PriceFeedWidget.tsx
interface PriceFeedWidgetProps {
  asset: string;
  currentPrice: BigNumber;
  lastUpdate: number;
  changePercent: number;
}

// components/oracle/TriggerIndicator.tsx
interface TriggerIndicatorProps {
  currentPrice: BigNumber;
  triggerPrice: BigNumber;
  triggerType: TriggerType;
  progress: number; // 0-100
}

// components/oracle/PriceChart.tsx
interface PriceChartProps {
  priceHistory: PricePoint[];
  triggerLevels: TriggerLevel[];
  timeRange: '1H' | '1D' | '1W' | '1M';
}
```

#### State Management
```typescript
interface OracleState {
  priceFeeds: Map<string, PriceFeed>;
  priceHistory: Map<string, PricePoint[]>;
  lastUpdate: Map<string, number>;
  
  // Subscriptions
  subscriptions: Set<string>;
  updateInterval: number;
  
  // Actions
  fetchPrice: (asset: string) => Promise<BigNumber>;
  subscribeToFeed: (asset: string) => void;
  startPriceUpdates: () => void;
}
```

## Settlement & Claims

### Claim Process

```
┌─────────────────────────────────────────────────┐
│              Claim Your Payout                   │
├─────────────────────────────────────────────────┤
│ Policy: ETH -15% Protection                      │
│ Token ID: #1235                                 │
│                                                   │
│ Trigger Confirmed:                              │
│ ETH dropped from $3,000 to $2,400 (-20%)        │
│                                                   │
│ Payout Amount: 500 USDT                         │
│                                                   │
│ [Process Claim]                                 │
└─────────────────────────────────────────────────┘
```

#### Contract Functions
```solidity
// SettlementEngine.sol
- checkTrigger(roundId) → triggered
- processClaim(tokenId) → payout
- getClaimStatus(tokenId) → ClaimStatus
- batchProcessClaims(tokenIds[]) → payouts[]
```

#### Components
```typescript
// components/claims/ClaimModal.tsx
interface ClaimModalProps {
  tokenId: number;
  claimAmount: BigNumber;
  onClaim: () => Promise<void>;
  status: ClaimStatus;
}

// components/claims/SettlementStatus.tsx
interface SettlementStatusProps {
  round: Round;
  triggered: boolean;
  settlementTime?: number;
  totalPayout: BigNumber;
}
```

#### State Management
```typescript
interface SettlementState {
  // Claim tracking
  pendingClaims: Claim[];
  processingClaims: Set<number>;
  claimHistory: Claim[];
  
  // Settlement status
  triggeredRounds: Set<number>;
  
  // Actions
  checkClaimEligibility: (tokenId: number) => Promise<boolean>;
  submitClaim: (tokenId: number) => Promise<void>;
  batchClaim: (tokenIds: number[]) => Promise<void>;
}
```

## Round Management

### Round Lifecycle Display

```
┌─────────────────────────────────────────────────┐
│           Insurance Round Timeline               │
├─────────────────────────────────────────────────┤
│  Phase 1      Phase 2     Phase 3     Phase 4   │
│  Funding   →  Matching  →  Active  →  Settlement │
│  (3 days)     (1 hour)     (7 days)   (1 day)   │
│                                                   │
│  [===●===========================================]│
│      ↑ Current Phase: Funding                    │
│                                                   │
│  Progress: 60% funded | Time left: 12 hours      │
└─────────────────────────────────────────────────┘
```

#### Contract Functions
```solidity
// ProductCatalog.sol
- getRound(roundId) → Round
- getTrancheRounds(trancheId) → roundIds[]
// Round states: ANNOUNCED, OPEN, MATCHED, ACTIVE, MATURED, SETTLED

// TranchePoolCore.sol
- roundEconomics(roundId) → RoundEconomics
```

#### Components
```typescript
// components/rounds/RoundTimeline.tsx
interface RoundTimelineProps {
  round: Round;
  economics: RoundEconomics;
  currentPhase: RoundState;
  timeRemaining: number;
}

// components/rounds/RoundProgress.tsx
interface RoundProgressProps {
  totalBuyers: BigNumber;
  totalSellers: BigNumber;
  matched: BigNumber;
  cap: BigNumber;
}
```

## State Management Architecture

### Global State Organization

```typescript
// stores/index.ts
export interface RootState {
  // Core stores
  web3: Web3State;
  contracts: ContractState;
  
  // Feature stores
  products: ProductState;
  purchase: PurchaseState;
  liquidity: LiquidityState;
  rounds: RoundState;
  portfolio: PortfolioState;
  oracle: OracleState;
  settlement: SettlementState;
  
  // UI stores
  modals: ModalState;
  notifications: NotificationState;
  preferences: PreferencesState;
}
```

### Event-Driven Updates

```typescript
// services/eventSync.ts
class EventSyncService {
  setupEventHandlers() {
    // Round state changes
    this.subscribeToContract('ProductCatalog', 'RoundStateChanged', (event) => {
      const { roundId, oldState, newState } = event.args;
      roundStore.updateRoundState(roundId, newState);
      
      if (newState === RoundState.SETTLED) {
        portfolioStore.checkClaimable();
      }
    });
    
    // New insurance purchase
    this.subscribeToContract('TranchePoolCore', 'BuyerOrderPlaced', (event) => {
      const { buyer, roundId, amount, tokenId } = event.args;
      if (buyer === currentAccount) {
        portfolioStore.addInsurancePosition(tokenId);
        notificationStore.success(`Insurance purchased! Token #${tokenId}`);
      }
    });
    
    // Price updates
    this.subscribeToContract('OracleRouter', 'PriceUpdated', (event) => {
      const { asset, price, timestamp } = event.args;
      oracleStore.updatePrice(asset, price, timestamp);
      settlementStore.checkTriggers();
    });
  }
}
```

### Optimistic Updates

```typescript
class PurchaseStore {
  async executePurchase() {
    // Optimistic update
    this.setState({ status: 'purchasing' });
    portfolioStore.addPendingPosition({
      trancheId,
      amount: purchaseAmount,
      status: 'pending'
    });
    
    try {
      const result = await poolService.buyInsurance({
        roundId,
        amount: purchaseAmount
      });
      
      // Confirm optimistic update
      portfolioStore.confirmPosition(result.tokenId);
      this.setState({ 
        status: 'success',
        tokenId: result.tokenId
      });
      
    } catch (error) {
      // Rollback optimistic update
      portfolioStore.removePendingPosition();
      this.setState({ 
        status: 'error',
        error: error.message
      });
    }
  }
}
```

## Wallet Connection

### Connect Wallet Modal

```
┌─────────────────────────────────────────────────┐
│            Connect Your Wallet                   │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐   │
│ │ 🦊 MetaMask (Recommended)                 │   │
│ └───────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────┐   │
│ │ 🔷 Kaia Wallet (Native)                   │   │
│ └───────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────┐   │
│ │ 🔗 WalletConnect                          │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

#### Components & State
```typescript
// components/wallet/WalletModal.tsx
interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (wallet: WalletType) => Promise<void>;
}

// State
interface Web3State {
  account: string | null;
  chainId: number | null;
  provider: ethers.Provider | null;
  signer: ethers.Signer | null;
  balance: BigNumber;
  
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
}
```

## Design System

### Color Palette
- **Primary**: #0EA5E9 (Kaia Blue)
- **Success**: #10B981 (Green)
- **Warning**: #F59E0B (Amber)
- **Danger**: #EF4444 (Red)
- **Background**: #0F172A (Dark)
- **Surface**: #1E293B (Card Background)
- **Text**: #F1F5F9 (Light)

### Typography
- **Headings**: Inter Bold
- **Body**: Inter Regular
- **Numbers**: Space Mono (Monospace)

### Component Library
```typescript
// UI Components with Contract Integration
export const components = {
  // Insurance
  ProductCard: './components/insurance/ProductCard',
  TrancheSelector: './components/insurance/TrancheSelector',
  PurchaseModal: './components/insurance/PurchaseModal',
  PremiumCalculator: './components/insurance/PremiumCalculator',
  
  // Liquidity
  PoolCard: './components/liquidity/PoolCard',
  DepositModal: './components/liquidity/DepositModal',
  WithdrawModal: './components/liquidity/WithdrawModal',
  
  // Portfolio
  PositionCard: './components/portfolio/PositionCard',
  ClaimButton: './components/portfolio/ClaimButton',
  
  // Common
  TransactionStatus: './components/common/TransactionStatus',
  LoadingSpinner: './components/common/LoadingSpinner',
  ErrorMessage: './components/common/ErrorMessage'
};
```

## Implementation Guide

### Technical Stack
- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS
- **Web3**: @kaiachain/ethers-ext for Kaia blockchain
- **State**: Zustand with persistence
- **Contracts**: @dinsure/contracts package

### Key User Flows with Contract Calls

#### 1. Insurance Purchase Flow
```typescript
async function purchaseInsurance(trancheId: number, amount: string) {
  // 1. Calculate premium
  const premium = await productCatalog.calculatePremium(trancheId, parseUSDT(amount));
  
  // 2. Check & approve USDT
  const allowance = await usdt.allowance(account, poolAddress);
  if (allowance.lt(premium)) {
    await usdt.approve(poolAddress, MAX_UINT256);
  }
  
  // 3. Buy insurance
  const tx = await tranchePool.buyInsurance(roundId, amount, account);
  const receipt = await tx.wait();
  
  // 4. Extract token ID from events
  const tokenId = extractTokenId(receipt);
  
  return tokenId;
}
```

#### 2. Liquidity Provision Flow
```typescript
async function provideLiquidity(poolId: number, amount: string) {
  // 1. Get pool contract
  const pool = await getPoolContract(poolId);
  
  // 2. Approve USDT
  await usdt.approve(pool.address, parseUSDT(amount));
  
  // 3. Deposit collateral
  const tx = await pool.depositCollateral(roundId, parseUSDT(amount));
  const receipt = await tx.wait();
  
  // 4. Extract shares from events
  const shares = extractShares(receipt);
  
  return shares;
}
```

#### 3. Claim Process Flow
```typescript
async function claimPayout(tokenId: number) {
  // 1. Check eligibility
  const status = await settlementEngine.getClaimStatus(tokenId);
  
  if (status !== ClaimStatus.CLAIMABLE) {
    throw new Error('Not claimable');
  }
  
  // 2. Process claim
  const tx = await settlementEngine.processClaim(tokenId);
  const receipt = await tx.wait();
  
  // 3. Extract payout amount
  const payout = extractPayout(receipt);
  
  return payout;
}
```

### Performance Optimizations

1. **Contract Call Batching**
```typescript
// Use multicall for multiple reads
const [products, tranches, rounds] = await multicall([
  productCatalog.getActiveProducts(),
  productCatalog.getActiveTranches(),
  productCatalog.getActiveRounds()
]);
```

2. **Selective Re-renders**
```typescript
// Use shallow equality checks
const products = useProductStore(state => state.products, shallow);
```

3. **Cache Strategy**
```typescript
// Cache contract data with TTL
const cacheManager = new CacheManager({ 
  ttl: 60000, // 1 minute
  maxSize: 100 
});
```

### Responsive Design
- Mobile: < 640px
- Tablet: 640px - 1024px  
- Desktop: > 1024px

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode

## Error Handling

### User-Friendly Error Messages

```
┌─────────────────────────────────────────────────┐
│              ⚠️ Transaction Failed               │
├─────────────────────────────────────────────────┤
│   Insufficient USDT balance                      │
│                                                   │
│   Required: 1,000 USDT                          │
│   Available: 500 USDT                           │
│                                                   │
│   [Go to Swap]          [Cancel]                │
└─────────────────────────────────────────────────┘
```

### Error Recovery
```typescript
function parseUserError(error: ContractError): string {
  switch (error.code) {
    case 'INSUFFICIENT_FUNDS':
      return 'Insufficient balance for this transaction';
    case 'ROUND_NOT_OPEN':
      return 'This insurance round is not currently open';
    case 'AMOUNT_TOO_LOW':
      return `Minimum amount is ${error.details.min} USDT`;
    default:
      return 'Transaction failed. Please try again.';
  }
}
```

## Notification System

### Transaction Notifications
```typescript
// Success notification
notificationStore.success({
  title: 'Insurance Purchased!',
  message: `Policy NFT #${tokenId} has been minted`,
  txHash: receipt.transactionHash
});

// Error notification
notificationStore.error({
  title: 'Transaction Failed',
  message: parseUserError(error)
});
```

## Monitoring & Analytics

### Key Metrics
- Transaction success/failure rates
- Gas consumption patterns
- User flow completion rates
- Contract call latency
- Cache hit rates

### Event Tracking
```typescript
// Track user actions
analytics.track('InsurancePurchased', {
  trancheId,
  amount: formatUSDT(amount),
  premium: formatUSDT(premium),
  tokenId
});
```

## Conclusion

This unified architecture document provides:
1. **Complete UI/UX flows** with wireframes
2. **Smart contract integration** for every user action
3. **Component architecture** with TypeScript interfaces
4. **State management** patterns with real-time updates
5. **Implementation guide** with code examples

The architecture ensures seamless integration between the frontend UI and blockchain smart contracts, providing users with a smooth, transparent, and trustworthy decentralized insurance experience.