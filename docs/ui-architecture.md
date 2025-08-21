# DIN Protocol UI Architecture & Contract Integration

## Overview

This document provides a comprehensive guide for the DIN Protocol UI architecture, combining user flows, wireframes, component mapping, and smart contract integration. It serves as the single source of truth for frontend implementation with complete contract function mappings.

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Navigation & Layout](#navigation--layout)
3. [Insurance Tab](#insurance-tab)
4. [Tranche Tab](#tranche-tab)
5. [Portfolio Tab](#portfolio-tab)
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
│  [DIN Logo]  Insurance  Tranche  Portfolio       │
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

## Insurance Tab

### Insurance Summary Cards

The Insurance tab displays a summary view of all available insurance products. Each card shows aggregated information about all tranches and pools for that insurance product.

```
┌─────────────────────────────────────────────────┐
│                Insurance Products                │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐   │
│ │ 🪙 BTC Price Protection                    │   │
│ │ ┌─────────────────────────────────────┐   │   │
│ │ │ Summary Stats:                       │   │   │
│ │ │ • 3 Active Tranches                 │   │   │
│ │ │ • Total TVL: $2.5M USDT             │   │   │
│ │ │ • Premium Range: 2% - 10%           │   │   │
│ │ │ • Current Price: $45,234            │   │   │
│ │ │ • 24h Change: +2.3%                 │   │   │
│ │ └─────────────────────────────────────┘   │   │
│ │ [View Tranches →]                         │   │
│ └───────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────┐   │
│ │ ⚡ ETH Price Protection                    │   │
│ │ ┌─────────────────────────────────────┐   │   │
│ │ │ Summary Stats:                       │   │   │
│ │ │ • 3 Active Tranches                 │   │   │
│ │ │ • Total TVL: $1.8M USDT             │   │   │
│ │ │ • Premium Range: 3% - 12%           │   │   │
│ │ │ • Current Price: $2,456             │   │   │
│ │ │ • 24h Change: -1.2%                 │   │   │
│ │ └─────────────────────────────────────┘   │   │
│ │ [View Tranches →]                         │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

When a user clicks "View Tranches →" on an insurance card, it automatically navigates to the Tranche tab with that insurance product pre-filtered.

#### Contract Integration
```solidity
// ProductCatalog.sol
- getActiveProducts() → Product[]
- getProductTranches(productId) → Tranche[]

// TranchePoolCore.sol (multiple pools)
- poolAccounting() → PoolAccounting (TVL per tranche)

// OracleRouter.sol
- getLatestPrice(oracleRouteId) → (price, timestamp)
```

#### Components
```typescript
// components/insurance/InsuranceSummaryGrid.tsx
interface InsuranceSummaryGridProps {
  products: Product[];
  onViewTranches: (productId: number) => void;
}

// components/insurance/InsuranceSummaryCard.tsx
interface InsuranceSummaryCardProps {
  product: Product;
  tranches: Tranche[];
  totalTVL: BigNumber;
  premiumRange: { min: number; max: number };
  currentPrice: BigNumber;
  priceChange: number;
  onViewTranches: () => void;
}

// State
interface InsuranceState {
  products: Product[];
  productSummaries: ProductSummary[];
  loading: boolean;
  
  fetchProducts: () => Promise<void>;
  calculateSummaries: () => Promise<void>;
}

interface ProductSummary {
  productId: number;
  activeTranches: number;
  totalTVL: BigNumber;
  premiumRange: { min: number; max: number };
  currentPrice: BigNumber;
  priceChange: number;
}
```

## Tranche Tab

### Tranche List with Filtering

The Tranche tab shows all individual tranches with detailed information. Users can filter by insurance product and activeness.

```
┌─────────────────────────────────────────────────┐
│                   All Tranches                   │
├─────────────────────────────────────────────────┤
│ Filter: Insurance [BTC ▼] Status [Active ▼]     │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐   │
│ │ BTC -5% Protection (Tranche A)            │   │
│ │ ┌─────────────────────────────────────┐   │   │
│ │ │ • Premium Rate: 2%                   │   │   │
│ │ │ • Pool TVL: 850K USDT               │   │   │
│ │ │ • Capacity: 100K USDT               │   │   │
│ │ │ • Utilization: 60% filled           │   │   │
│ │ │ • Round Status: OPEN (2 days left)  │   │   │
│ │ │ • Start: Jan 15 | End: Jan 22       │   │   │
│ │ └─────────────────────────────────────┘   │   │
│ │ [Buy Insurance] [Provide Liquidity]       │   │
│ └───────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────┐   │
│ │ BTC -10% Protection (Tranche B)           │   │
│ │ ┌─────────────────────────────────────┐   │   │
│ │ │ • Premium Rate: 5%                   │   │   │
│ │ │ • Pool TVL: 650K USDT               │   │   │
│ │ │ • Capacity: 50K USDT                │   │   │
│ │ │ • Utilization: 80% filled           │   │   │
│ │ │ • Round Status: ACTIVE              │   │   │
│ │ │ • Start: Jan 10 | End: Jan 17       │   │   │
│ │ └─────────────────────────────────────┘   │   │
│ │ [View Details]                            │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Filter Behavior
- **Default State**: Shows all tranches from all insurance products
- **From Insurance Tab**: When user clicks "View Tranches" from Insurance tab, automatically filters by that insurance product
- **Filter Options**:
  - Insurance: All, BTC Protection, ETH Protection, etc.
  - Status: All, Active Only, Open for Sales, Settling

#### Contract Functions
```solidity
// ProductCatalog.sol
- getActiveTranches() → Tranche[]
- getTranche(trancheId) → TrancheSpec
- getRound(roundId) → Round
- calculatePremium(trancheId, amount) → premium

// TranchePoolCore.sol
- roundEconomics(roundId) → RoundEconomics
- poolAccounting() → PoolAccounting
```

#### Components
```typescript
// components/tranche/TrancheList.tsx
interface TrancheListProps {
  tranches: Tranche[];
  filters: TrancheFilters;
  onFilterChange: (filters: TrancheFilters) => void;
  onBuyInsurance: (tranche: Tranche) => void;
  onProvideLiquidity: (tranche: Tranche) => void;
}

// components/tranche/TrancheCard.tsx
interface TrancheCardProps {
  tranche: Tranche;
  round: Round;
  economics: RoundEconomics;
  poolStats: PoolAccounting;
  onBuyInsurance: () => void;
  onProvideLiquidity: () => void;
}

// components/tranche/TrancheFilters.tsx
interface TrancheFiltersProps {
  filters: TrancheFilters;
  products: Product[];
  onFilterChange: (filters: TrancheFilters) => void;
}

// State
interface TrancheState {
  tranches: Tranche[];
  filteredTranches: Tranche[];
  filters: TrancheFilters;
  selectedTranche: Tranche | null;
  
  fetchTranches: () => Promise<void>;
  applyFilters: (filters: TrancheFilters) => void;
  setSelectedInsurance: (productId: number) => void; // From Insurance tab navigation
}

interface TrancheFilters {
  insuranceProduct: number | null; // null = All
  status: 'all' | 'active' | 'open' | 'settling';
}
```

## Portfolio Tab

### User's Joined Pools

The Portfolio tab shows all pools that the user has joined as either an insurance buyer or liquidity provider. Each pool entry includes start and end times.

```
┌─────────────────────────────────────────────────┐
│                  My Portfolio                    │
├─────────────────────────────────────────────────┤
│ Tabs: [Insurance Positions] [Liquidity Positions]│
├─────────────────────────────────────────────────┤
│              Insurance Positions                 │
│ ┌───────────────────────────────────────────┐   │
│ │ Policy #1234 - BTC -10% Protection       │   │
│ │ ┌─────────────────────────────────────┐   │   │
│ │ │ • Coverage: 1,000 USDT              │   │   │
│ │ │ • Premium Paid: 50 USDT             │   │   │
│ │ │ • Status: 🟢 Active                 │   │   │
│ │ │ • Start: Jan 10, 2025 14:00        │   │   │
│ │ │ • End: Jan 17, 2025 14:00          │   │   │
│ │ │ • Current BTC: $44,500 (-1.1%)     │   │   │
│ │ └─────────────────────────────────────┘   │   │
│ │ [View Details] [Claim if Triggered]       │   │
│ └───────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────┐   │
│ │ Policy #1235 - ETH -15% Protection       │   │
│ │ ┌─────────────────────────────────────┐   │   │
│ │ │ • Coverage: 500 USDT                │   │   │
│ │ │ • Premium Paid: 60 USDT             │   │   │
│ │ │ • Status: ✅ Claimable              │   │   │
│ │ │ • Start: Jan 8, 2025 10:00         │   │   │
│ │ │ • End: Jan 15, 2025 10:00          │   │   │
│ │ │ • Payout: 500 USDT                 │   │   │
│ │ └─────────────────────────────────────┘   │   │
│ │ [Claim Payout]                            │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────┐
│               Liquidity Positions                │
├─────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐   │
│ │ BTC -5% Tranche Pool                      │   │
│ │ ┌─────────────────────────────────────┐   │   │
│ │ │ • Deposited: 5,000 USDT             │   │   │
│ │ │ • Current Value: 5,120 USDT         │   │   │
│ │ │ • Earnings: +120 USDT (+2.4%)       │   │   │
│ │ │ • Share: 850 pool tokens            │   │   │
│ │ │ • Start: Jan 10, 2025 09:00        │   │   │
│ │ │ • End: Jan 17, 2025 09:00          │   │   │
│ │ │ • Status: 🟡 Active Round          │   │   │
│ │ └─────────────────────────────────────┘   │   │
│ │ [Add More] [Withdraw Available]           │   │
│ └───────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────┐   │
│ │ ETH -10% Tranche Pool                     │   │
│ │ ┌─────────────────────────────────────┐   │   │
│ │ │ • Deposited: 2,000 USDT             │   │   │
│ │ │ • Current Value: 1,950 USDT         │   │   │
│ │ │ • Earnings: -50 USDT (-2.5%)        │   │   │
│ │ │ • Share: 340 pool tokens            │   │   │
│ │ │ • Start: Jan 5, 2025 16:00         │   │   │
│ │ │ • End: Jan 12, 2025 16:00          │   │   │
│ │ │ • Status: ⚫ Settled (Paid Claims) │   │   │
│ │ └─────────────────────────────────────┘   │   │
│ │ [Withdraw Final Amount]                   │   │
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
- shareBalances(account) → balance
- navPerShare() → currentValue

// SettlementEngine.sol
- getClaimStatus(tokenId) → ClaimStatus
- processClaim(tokenId) → payout

// ProductCatalog.sol
- getRound(roundId) → Round (for start/end times)
```

#### Components & State
```typescript
// components/portfolio/PortfolioDashboard.tsx
interface PortfolioDashboardProps {
  activeTab: 'insurance' | 'liquidity';
  onTabChange: (tab: 'insurance' | 'liquidity') => void;
}

// components/portfolio/InsurancePositionCard.tsx
interface InsurancePositionCardProps {
  position: InsurancePosition;
  round: Round;
  currentPrice?: BigNumber;
  triggerPrice: BigNumber;
  claimStatus: ClaimStatus;
  onClaim: () => Promise<void>;
  onViewDetails: () => void;
}

// components/portfolio/LiquidityPositionCard.tsx
interface LiquidityPositionCardProps {
  position: LiquidityPosition;
  round: Round;
  poolStats: PoolAccounting;
  shares: BigNumber;
  currentValue: BigNumber;
  onAddMore: () => void;
  onWithdraw: () => Promise<void>;
}

// State Management
interface PortfolioState {
  // Insurance positions
  insuranceTokens: InsuranceToken[];
  insurancePositions: InsurancePosition[];
  
  // Liquidity positions  
  liquidityPositions: LiquidityPosition[];
  poolShares: Map<number, BigNumber>;
  
  // Claims
  claimablePayouts: ClaimablePayout[];
  
  // Actions
  fetchPortfolio: () => Promise<void>;
  checkClaimable: () => Promise<void>;
  claimPayout: (tokenId: number) => Promise<void>;
  withdrawLiquidity: (poolId: number, shares: BigNumber) => Promise<void>;
}

interface InsurancePosition {
  tokenId: number;
  trancheId: number;
  roundId: number;
  coverage: BigNumber;
  premiumPaid: BigNumber;
  startTime: number;
  endTime: number;
  status: 'active' | 'expired' | 'claimable' | 'claimed';
}

interface LiquidityPosition {
  poolId: number;
  trancheId: number;
  roundId: number;
  deposited: BigNumber;
  shares: BigNumber;
  currentValue: BigNumber;
  earnings: BigNumber;
  startTime: number;
  endTime: number;
  status: 'active' | 'settled' | 'claimable';
}
```

### Tab Navigation Behavior

#### Navigation Flow
1. **Insurance Tab → Tranche Tab**: When user clicks "View Tranches →" on any insurance card, navigate to Tranche tab with that insurance product pre-filtered
2. **Tranche Tab → Portfolio Tab**: After user buys insurance or provides liquidity, they can navigate to Portfolio to see their positions
3. **Direct Navigation**: Users can navigate directly to any tab, with appropriate default states

#### URL Structure
- `/insurance` - Insurance summary cards
- `/tranche?insurance=btc` - Tranche list filtered by BTC
- `/tranche` - All tranches (default filter state)
- `/portfolio` - User's positions

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