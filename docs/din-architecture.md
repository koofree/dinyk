# DIN Protocol - Complete Architecture & Integration Guide

## Decentralized Insurance Platform on Kaia Blockchain

---

## 🎯 Executive Summary

DIN (Dinyk) is a fully decentralized Web3 insurance platform on the Kaia blockchain. This document combines the complete system architecture, smart contract integration, and implementation guide into a single comprehensive reference.

### Key Technologies

- **Blockchain**: Kaia (Testnet: Chain ID 1001, Mainnet: Chain ID 8217)
- **Smart Contracts**: Comprehensive insurance protocol with registry-based architecture
- **Web3 Library**: @kaiachain/ethers-ext v1.1.1 with ethers.js v6
- **Wallet Support**: MetaMask (primary), Kaikas, WalletConnect
- **Framework**: Next.js 15 with React 19
- **State Management**: React Context with session persistence
- **Monorepo**: Turborepo with pnpm workspaces

---

## 🏗️ Architecture Principles

### Core Design Philosophy

1. **Decentralization First**: Direct blockchain interactions without intermediary servers
2. **User Sovereignty**: Users control their funds and data through their wallets
3. **Transparency**: All insurance operations are verifiable on-chain
4. **Progressive Enhancement**: Start with core features, expand functionality gradually
5. **Gas Optimization**: Efficient contract design and batched operations
6. **Security by Default**: Multiple layers of transaction validation and user confirmation

### Technical Stack Decisions

- **No Backend API**: Removed tRPC, authentication, and database layers
- **Client-Side Only**: All logic executes in the browser
- **Session Persistence**: Maintain wallet state across page refreshes
- **Registry Pattern**: Central registry for contract addresses and parameters
- **Modular Contracts**: Separated concerns with upgradeable architecture

---

## 🏛️ Smart Contract Architecture

### Deployed Contracts (Kaia Testnet - Active)

All contracts are deployed and verified on Kaia Kairos testnet (Chain ID: 1001).

| Contract               | Address                                      | Purpose                            |
| ---------------------- | -------------------------------------------- | ---------------------------------- |
| **DinRegistry**        | `0xCD2B28186b257869B3C2946ababB56683F4304C3` | Central registry and configuration |
| **ProductCatalog**     | `0x145E2f2e2B9C6Bdd22D8cE21504f6d5fca0Cc72D` | Products, tranches, and rounds     |
| **InsuranceToken**     | `0x3bEDE5f043E8D0597F9F0b60eCfc52B134d8E934` | ERC721 NFT positions               |
| **TranchePoolFactory** | `0x3810066EfEAc98F18cF6A1E62FF3f089CC30Fb01` | Pool deployment                    |
| **SettlementEngine**   | `0x1d3975e61A50e9dd0e4995F837F051A94F36fdd8` | Claims processing                  |
| **OracleRouter**       | `0x5F54ce2BFE2A63472a9462FFe2Cf89Da59b29D72` | Oracle aggregation                 |
| **OraklPriceFeed**     | `0xFa2f0063BAC2e5BA304f50eC54b6EA07aCC534fF` | Primary oracle                     |
| **DinoOracle**         | `0x6317f2f9271d484548871915DDDff95aD4c45aC3` | Fallback oracle                    |
| **DinUSDT**            | `0x8C034f0DBA8664DA4242Cb4CF7fCD7e0a3aa5c90` | Test USDT (6 decimals)             |
| **DinToken**           | `0x7126Dbd15e6888AeDd606A7242C998DBED7530Fd` | Governance token                   |
| **FeeTreasury**        | `0xb96D484cB71A5d5C3C3AB1Ac18dF587cC6AC6914` | Fee collection                     |
| **YieldRouter**        | `0xC5dB540bca54FAce539AF2d2a7c5ac717795fb11` | Yield generation strategies        |

### Contract Interaction Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ Insurance UI │ │ Liquidity UI │ │ Portfolio UI │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ @dinsure/contracts│
                    │   Hook System     │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼─────────────────────────┐
│                   Contract Layer                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ DinRegistry                                     │  │
│  │ • Central configuration                         │  │
│  │ • Address management                            │  │
│  │ • Global parameters                             │  │
│  └────────────────────┬────────────────────────────┘  │
│                       │                                │
│  ┌──────────────┐ ┌──▼──────────┐ ┌──────────────┐  │
│  │ProductCatalog│ │TranchePool  │ │SettlementEng│  │
│  │• Products    │ │Factory       │ │• Claims      │  │
│  │• Tranches    │ │• Pool deploy │ │• Payouts     │  │
│  │• Rounds      │ │• Economics   │ │• Disputes    │  │
│  └──────────────┘ └───────┬───────┘ └──────────────┘  │
│                           │                            │
│               ┌───────────▼───────────┐                │
│               │ TranchePoolCore       │                │
│               │ • Buyer orders        │                │
│               │ • Seller collateral   │                │
│               │ • Premium distribution│                │
│               └───────────────────────┘                │
└────────────────────────────┬──────────────────────────┘
                             │
                   ┌─────────▼─────────┐
                   │   Oracle Layer     │
                   │ ┌───────────────┐ │
                   │ │OracleRouter   │ │
                   │ │• Aggregation  │ │
                   │ │• Validation   │ │
                   │ └───────┬───────┘ │
                   │         │         │
                   │ ┌───────▼───────┐ │
                   │ │ Price Feeds   │ │
                   │ │• Orakl        │ │
                   │ │• DINO         │ │
                   │ └───────────────┘ │
                   └───────────────────┘
```

### Round Lifecycle States

```
ANNOUNCED → OPEN → MATCHED → ACTIVE → MATURED → SETTLED/CANCELED
    ↓        ↓        ↓         ↓        ↓          ↓
  Created  Sales   Matching  Coverage  Expired  Payout/Refund
```

---

## 📁 Complete Project Structure

```
dinyk/
├── apps/
│   └── nextjs/
│       └── src/
│           ├── app/                          # Next.js app router
│           │   ├── layout.tsx                # Root with providers
│           │   ├── page.tsx                  # Landing page
│           │   ├── insurance/
│           │   │   ├── catalog/page.tsx     # Browse products
│           │   │   ├── [id]/page.tsx        # Product detail
│           │   │   └── purchase/page.tsx    # Purchase flow
│           │   ├── portfolio/
│           │   │   ├── page.tsx             # User positions
│           │   │   ├── claims/page.tsx      # Claim management
│           │   │   └── history/page.tsx     # TX history
│           │   └── liquidity/
│           │       ├── page.tsx             # Provide liquidity
│           │       └── rewards/page.tsx     # Rewards claiming
│           │
│           ├── components/
│           │   ├── web3/
│           │   │   ├── WalletButton.tsx     # Wallet connection
│           │   │   ├── NetworkIndicator.tsx # Network status
│           │   │   └── TransactionModal.tsx # TX preview
│           │   ├── insurance/
│           │   │   ├── ProductCard.tsx      # Product display
│           │   │   ├── TrancheSelector.tsx  # Risk selection
│           │   │   └── PurchaseForm.tsx     # Purchase UI
│           │   └── common/
│           │       └── LoadingSpinner.tsx
│           │
│           └── hooks/                       # App-specific hooks
│               └── useAppState.ts
│
├── packages/
│   └── contracts/                           # @dinsure/contracts package
│       ├── src/
│       │   ├── hooks/                       # Protocol hooks
│       │   │   ├── index.ts
│       │   │   ├── useContracts.ts         # Core contracts
│       │   │   ├── useProductManagement.ts  # Products/tranches
│       │   │   ├── useRoundManagement.ts    # Round lifecycle
│       │   │   ├── useBuyerOperations.ts    # Insurance purchase
│       │   │   ├── useSellerOperations.ts   # Liquidity provision
│       │   │   ├── useMonitoring.ts         # Analytics
│       │   │   └── useSettlement.ts         # Claims
│       │   │
│       │   ├── providers/
│       │   │   ├── Web3Provider.tsx         # Web3 connection
│       │   │   └── ContractProvider.tsx     # Contract instances
│       │   │
│       │   ├── services/
│       │   │   └── ProductCatalogService.ts # Product service
│       │   │
│       │   ├── types/
│       │   │   ├── products.ts              # Product types
│       │   │   ├── common.ts                # Common types
│       │   │   └── contracts.ts             # Contract types
│       │   │
│       │   ├── config/
│       │   │   ├── addresses.ts             # Contract addresses
│       │   │   ├── networks.ts              # Network configs
│       │   │   └── abis/                    # Contract ABIs
│       │   │       ├── DinRegistry.json
│       │   │       ├── ProductCatalog.json
│       │   │       ├── InsuranceToken.json
│       │   │       ├── TranchePoolCore.json
│       │   │       ├── TranchePoolFactory.json
│       │   │       ├── SettlementEngine.json
│       │   │       ├── OracleRouter.json
│       │   │       ├── DinUSDT.json
│       │   │       └── FeeTreasury.json
│       │   │
│       │   ├── utils/
│       │   │   ├── formatters.ts            # Data formatting
│       │   │   ├── cache.ts                 # Cache manager
│       │   │   └── errors.ts                # Error handling
│       │   │
│       │   └── test/
│       │       └── testnet-scenarios.ts     # Test scenarios
│       │
│       ├── package.json
│       ├── tsup.config.ts
│       └── tsconfig.json
│
├── packages/                                 # Other packages
│   ├── ui/                                 # Shared UI components
│   ├── tailwind-config/                    # Tailwind configuration
│   └── tsconfig/                           # TypeScript configs
│
├── docs/
│   ├── din-architecture.md                 # This document
│   ├── whitepaper.md                       # Protocol specification
│   └── ui-architecture.md                  # UI/UX flows
│
├── turbo.json                              # Turborepo config
├── package.json                            # Root package.json
└── pnpm-workspace.yaml                     # Workspace config
```

---

## 🔧 Technology Stack Details

### Core Web3 Libraries

#### @kaiachain/ethers-ext (v1.1.1)

Primary library for Kaia blockchain interaction

- **Native Kaia support** with enhanced features
- **Optimized gas estimation** for Kaia
- **Compatible** with existing ethers.js patterns
- **Built-in transaction types** for Kaia

#### Ethers.js (v6.13.4)

Foundation library for Ethereum-compatible operations

- **Comprehensive contract interaction**
- **BigInt native support**
- **TypeScript-first design**
- **Extensive utility functions**

### Network Configuration

```typescript
// Kaia Testnet (Development)
export const KAIA_TESTNET = {
  chainId: 1001,
  chainIdHex: "0x3E9",
  name: "Kaia Kairos Testnet",
  currency: { name: "KAIA", symbol: "KAIA", decimals: 18 },
  rpcUrl: "https://public-en-kairos.node.kaia.io",
  blockExplorer: "https://kairos.kaiascope.com",
};

// Kaia Mainnet (Production)
export const KAIA_MAINNET = {
  chainId: 8217,
  chainIdHex: "0x2019",
  name: "Kaia Mainnet",
  currency: { name: "KAIA", symbol: "KAIA", decimals: 18 },
  rpcUrl: "https://public-en-cypress.klaytn.net",
  blockExplorer: "https://kaiascope.com",
};
```

---

## 🪝 Hook System - Complete Reference

### Core Hooks Overview

The `@dinsure/contracts` package provides comprehensive React hooks for all protocol operations:

### 1. useContracts - Core Contract Management

```typescript
const {
  productCatalog,
  tranchePoolFactory,
  insuranceToken,
  settlementEngine,
  oracleRouter,
  usdt,
  registry,
  feeTreasury,
  isInitialized,
  error,
} = useContracts();
```

### 2. useProductManagement - Product & Tranche Operations

```typescript
const {
  isLoading,
  getProducts,
  registerProduct,
  registerTranche,
  createTranchePool,
  updateProductStatus,
  updateTrancheStatus,
} = useProductManagement();

// Example: Register new insurance product
await registerProduct({
  name: "BTC Price Protection",
  description: "Protects against BTC price drops",
});

// Example: Create tranche with specific risk parameters
await registerTranche({
  productId: 1,
  name: "BTC -10% Protection",
  triggerType: 0, // PRICE_BELOW
  threshold: "54000", // $54,000 trigger
  premiumRateBps: 500, // 5% premium
  trancheCap: "100000", // $100k capacity
  maturityDays: 7,
  perAccountMin: "100",
  perAccountMax: "10000",
  oracleRouteId: 1,
});
```

### 3. useRoundManagement - Round Lifecycle

```typescript
const {
  announceRound,
  openRound,
  closeAndMatchRound,
  getRoundInfo,
  getRoundEconomics,
  getActiveRounds,
  cancelRound,
  isLoading,
} = useRoundManagement();

// Example: Complete round lifecycle
const roundId = await announceRound({
  trancheId: 1,
  durationMinutes: 10080, // 7 days
  startDelayMinutes: 10,
  openImmediately: false,
});

await openRound(roundId);
// ... wait for sales period ...
await closeAndMatchRound(roundId);
```

### 4. useBuyerOperations - Insurance Purchase

```typescript
const {
  buyInsurance,
  calculatePremium,
  getBuyerOrder,
  getBuyerTokens,
  checkClaimStatus,
  claimPayout,
  getActiveInsurances,
  isLoading,
} = useBuyerOperations();

// Example: Purchase insurance with premium calculation
const calculation = await calculatePremium(trancheId, "1000");
console.log(`Premium: ${calculation.premiumAmount} USDT`);

const receipt = await buyInsurance({
  roundId: 1,
  coverageAmount: "1000",
});

// Check claim after maturity
const status = await checkClaimStatus(roundId);
if (status.canClaim) {
  await claimPayout(roundId);
}
```

### 5. useSellerOperations - Liquidity Provision

```typescript
const {
  depositCollateral,
  getSellerPosition,
  calculateYield,
  getPoolMetrics,
  claimSellerRewards,
  isLoading,
} = useSellerOperations();

// Example: Provide liquidity to pool
await depositCollateral({
  roundId: 1,
  amount: "10000", // USDT
});

// Monitor position
const position = await getSellerPosition(roundId);
console.log(`Shares: ${position.shareTokens}`);
console.log(`Earned: ${position.earnedPremiums}`);
```

### 6. useMonitoring - Analytics & Monitoring

```typescript
const {
  getPoolHealth,
  getTrancheRiskMetrics,
  getRoundMonitoring,
  getSystemMetrics,
  getHistoricalData,
  isLoading,
} = useMonitoring();

// Example: Monitor system health
const health = await getPoolHealth(trancheId);
console.log(`NAV: ${health.netAssetValue}`);
console.log(`Utilization: ${health.utilizationRate}%`);

const metrics = await getSystemMetrics();
console.log(`TVL: ${metrics.totalValueLocked}`);
console.log(`Active Insurance: ${metrics.activeInsuranceValue}`);
```

### 7. useSettlement - Settlement & Claims

```typescript
const {
  triggerSettlement,
  getSettlementStatus,
  processEmergencySettlement,
  disputeSettlement,
  getDisputeStatus,
  isLoading,
} = useSettlement();

// Example: Trigger settlement after maturity
const status = await getSettlementStatus(roundId);
if (status.canSettle) {
  await triggerSettlement(roundId);
}
```

### 8. useUserPortfolio - User Position Management

```typescript
const {
  insurancePositions,
  liquidityPositions,
  totalPortfolioValue,
  totalCoverage,
  totalLiquidity,
  totalEarnings,
  refetchPositions,
  isLoading,
  error,
} = useUserPortfolio();

// Example: Display user positions
insurancePositions.forEach((position) => {
  console.log(`Product: ${position.productName}`);
  console.log(`Coverage: ${position.coverageAmount} USDT`);
  console.log(`Status: ${position.status}`);
});

liquidityPositions.forEach((position) => {
  console.log(`Tranche: ${position.trancheName}`);
  console.log(`Liquidity: ${position.collateralAmount} USDT`);
  console.log(`Earnings: ${position.earnedPremiums} USDT`);
});
```

### 9. ProductCatalogService - Centralized Data Service

```typescript
import { ProductCatalogService } from "@dinsure/contracts/services";

// Initialize service
const service = new ProductCatalogService(provider, chainId);

// Fetch active products
const products = await service.getActiveProducts();

// Get product with tranches
const productDetails = await service.getProductWithTranches(productId);

// Get active rounds for tranche
const rounds = await service.getActiveRoundsForTranche(trancheId);

// Fetch all data in one call
const catalog = await service.getFullCatalog();
```

---

## 🌐 Web3 Provider Implementation

### Provider Setup with Session Persistence

```typescript
// packages/contracts/src/providers/Web3Provider.tsx
export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<KaiaWeb3Provider>();
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState<string>("0");
  const [usdtBalance, setUsdtBalance] = useState<string>("0");

  // Initialize from session storage
  useEffect(() => {
    const storedAccount = sessionStorage.getItem(STORAGE_KEYS.ACCOUNT);
    const storedConnected = sessionStorage.getItem(STORAGE_KEYS.CONNECTED);

    if (storedAccount && storedConnected === "true") {
      reconnectWallet();
    }
  }, []);

  const connectWallet = async () => {
    // Detect provider (MetaMask/Kaikas)
    const detectedProvider = detectProvider();

    // Create Web3 provider
    const web3Provider = new KaiaWeb3Provider(detectedProvider);

    // Request accounts
    const accounts = await web3Provider.send("eth_requestAccounts", []);

    // Verify network
    if (chainId !== ACTIVE_NETWORK.chainId) {
      await switchToKaiaNetwork();
    }

    // Update state and persist
    setProvider(web3Provider);
    setAccount(accounts[0]);
    setIsConnected(true);
    sessionStorage.setItem(STORAGE_KEYS.ACCOUNT, accounts[0]);
  };

  return (
    <Web3Context.Provider value={{
      provider,
      account,
      chainId,
      isConnected,
      balance,
      usdtBalance,
      connectWallet,
      disconnectWallet,
      switchNetwork
    }}>
      {children}
    </Web3Context.Provider>
  );
};
```

---

## 🔮 Oracle Architecture

### Multi-Oracle System with Aggregation

```
┌─────────────────────────────────────────────┐
│              Oracle Router                   │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────┐      ┌──────────────┐    │
│  │ Orakl Feed   │      │ DINO Oracle  │    │
│  │ (Primary)    │      │ (Fallback)   │    │
│  └──────┬───────┘      └──────┬───────┘    │
│         │                      │             │
│    ┌────▼──────────────────────▼────┐       │
│    │     Aggregation Logic          │       │
│    │  • Median calculation          │       │
│    │  • Outlier detection           │       │
│    │  • Timestamp validation        │       │
│    └────────────┬───────────────────┘       │
│                 │                            │
│         ┌───────▼────────┐                  │
│         │ Final Price     │                  │
│         └────────────────┘                  │
└─────────────────────────────────────────────┘
```

---

## 🎯 Implemented Features & Components

### Contract Package Structure (@dinsure/contracts)

```
packages/contracts/
├── src/
│   ├── config/
│   │   ├── addresses.ts      # Contract addresses by network
│   │   ├── constants.ts      # Protocol constants
│   │   └── networks.ts       # Network configurations
│   ├── hooks/
│   │   ├── useContracts.ts   # Contract instances
│   │   ├── useProductManagement.ts
│   │   ├── useRoundManagement.ts
│   │   ├── useBuyerOperations.ts
│   │   ├── useSellerOperations.ts
│   │   ├── useMonitoring.ts
│   │   ├── useSettlement.ts
│   │   ├── useUserPortfolio.ts
│   │   └── index.ts
│   ├── services/
│   │   └── ProductCatalogService.ts  # Centralized data fetching
│   ├── types/
│   │   ├── common.ts         # Common types
│   │   ├── contracts.ts      # Contract types
│   │   ├── products.ts       # Product/tranche types
│   │   ├── pools.ts          # Pool types
│   │   └── oracles.ts        # Oracle types
│   └── utils/
│       ├── cache.ts          # 5-minute TTL cache
│       ├── errors.ts         # Error handling
│       └── formatters.ts     # Amount formatting
└── abis/                     # Contract ABIs
```

### UI Components Implementation

#### Insurance Components

- **ProductCard**: Displays product with APY, TVL, risk metrics
- **TrancheCard**: Shows trigger level, premium rate, round status
- **EnhancedTrancheCard**: Advanced display with real-time updates
- **BuyInsuranceForm**: Premium calculation, amount input, transaction flow
- **ProvideLiquidityForm**: Collateral deposit, yield projection
- **EnhancedPurchaseModal**: Multi-step purchase with confirmations
- **LiquidityModal**: Deposit/withdraw with earnings display
- **PositionCard**: User's active positions with status tracking

#### Page Implementation

- **HomePage (`/`)**: Product showcase, platform stats
- **InsurancePage (`/insurance`)**: Product grid with filtering
- **TranchePage (`/tranches`)**: All tranches with sorting
- **TrancheDetailPage (`/tranches/[productId]/[trancheId]`)**: Buy/sell forms
- **PortfolioPage (`/portfolio`)**: User positions and earnings
- **DebugPage (`/debug`)**: Contract state inspection (dev only)

## 🏦 Insurance Product Structure

### Tranche Configuration

| Tranche | Trigger | Premium | Capacity | Risk Level |
| ------- | ------- | ------- | -------- | ---------- |
| A       | -5%     | 2%      | $100,000 | Low        |
| B       | -10%    | 5%      | $50,000  | Medium     |
| C       | -15%    | 10%     | $25,000  | High       |

### Economic Model

```typescript
interface TrancheEconomics {
  // Coverage parameters
  triggerThreshold: number; // Price drop percentage
  premiumRateBps: number; // Premium in basis points
  trancheCap: BigNumber; // Maximum capacity

  // Limits
  perAccountMin: BigNumber; // Minimum purchase
  perAccountMax: BigNumber; // Maximum purchase

  // Timing
  maturityTimestamp: number; // Coverage expiry
  salesWindow: number; // Sales duration

  // Pool metrics
  totalBuyerPurchases: BigNumber;
  totalSellerCollateral: BigNumber;
  matchedAmount: BigNumber; // Min(purchases, collateral)
  utilizationRate: number; // Matched/Collateral %
}
```

---

## 🔐 Security Implementation

### Multi-Layer Security

1. **Smart Contract Security**

   - Registry-based access control
   - Role-based permissions (ADMIN, OPERATOR, ORACLE)
   - Emergency pause mechanism
   - Bounded parameter validation

2. **Frontend Security**

   - Input validation and sanitization
   - Transaction preview and confirmation
   - Gas estimation with buffer
   - Error handling and recovery

3. **Oracle Security**
   - Multiple data sources
   - Outlier detection
   - Timestamp validation
   - Dispute mechanism

### Access Control Pattern

```solidity
contract AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");

    modifier onlyRole(bytes32 role) {
        require(hasRole(role, msg.sender), "Access denied");
        _;
    }
}
```

---

## 📊 Implementation Examples

### Complete Insurance Purchase Flow

```typescript
// 1. Connect wallet
const { connectWallet, account } = useWeb3();
await connectWallet();

// 2. Get available products
const { getProducts } = useProductManagement();
const products = await getProducts();

// 3. Calculate premium
const { calculatePremium } = useBuyerOperations();
const calculation = await calculatePremium(trancheId, coverageAmount);

// 4. Approve USDT spending
const { usdt } = useContracts();
await usdt.approve(poolAddress, premiumAmount);

// 5. Purchase insurance
const { buyInsurance } = useBuyerOperations();
const receipt = await buyInsurance({
  roundId: selectedRound,
  coverageAmount: coverageAmount,
});

// 6. Monitor position
const { getBuyerTokens } = useBuyerOperations();
const tokens = await getBuyerTokens(account);
```

### Liquidity Provider Flow

```typescript
// 1. Check pool metrics
const { getPoolMetrics } = useSellerOperations();
const metrics = await getPoolMetrics(trancheId);

// 2. Calculate expected yield
const { calculateYield } = useSellerOperations();
const yield = await calculateYield(trancheId, depositAmount);

// 3. Approve and deposit
const { depositCollateral } = useSellerOperations();
await depositCollateral({
  roundId: selectedRound,
  amount: depositAmount,
});

// 4. Monitor earnings
const { getSellerPosition } = useSellerOperations();
const position = await getSellerPosition(roundId);
```

---

## 🧪 Testing Strategy

### Unit Testing

```typescript
describe("useBuyerOperations", () => {
  it("should calculate premium correctly", async () => {
    const { calculatePremium } = renderHook(() => useBuyerOperations());
    const result = await calculatePremium(1, "1000");
    expect(result.premiumAmount).toBe("50"); // 5% of 1000
  });
});
```

### Integration Testing

```typescript
describe("Insurance Purchase Flow", () => {
  it("should complete purchase end-to-end", async () => {
    // Setup
    await connectWallet();
    await approveUSDT();

    // Execute
    const receipt = await buyInsurance({ roundId: 1, coverageAmount: "1000" });

    // Verify
    expect(receipt.status).toBe(1);
    const position = await getBuyerOrder(1);
    expect(position.purchaseAmount).toBe("1000");
  });
});
```

### Testnet Scenarios

The package includes comprehensive test scenarios in `testnet-scenarios.ts`:

- Product registration and configuration
- Round lifecycle management
- Insurance purchase flows
- Liquidity provision
- Settlement and claims
- Emergency procedures

---

## 📈 Monitoring & Analytics

### Key Metrics

```typescript
interface ProtocolMetrics {
  // Financial
  totalValueLocked: BigNumber;
  totalPremiumsCollected: BigNumber;
  totalClaimsPaid: BigNumber;
  lossRatio: number;

  // Operational
  activePositions: number;
  averageCoverageAmount: BigNumber;
  poolUtilization: number;

  // Risk
  maxExposurePerEvent: BigNumber;
  concentrationRisk: number;
  liquidityRatio: number;
}
```

### Event Monitoring

```typescript
// Critical events to monitor
contract.on("LargeClaim", (event) => {
  if (event.amount > THRESHOLD) {
    alertAdmin("Large claim processed", event);
  }
});

contract.on("PoolDepletion", (event) => {
  if (event.liquidityRatio < 0.2) {
    alertAdmin("Low liquidity warning", event);
  }
});
```

---

## 🚀 Deployment & Operations

### Environment Configuration

```bash
# ... mainnet addresses ...
```

### Deployment Commands

```bash
# Install dependencies
pnpm install

# Build packages
pnpm build

# Run tests
pnpm test

# Deploy to testnet
pnpm deploy:testnet

# Start development
pnpm dev

# Production build
pnpm build:prod
```

### Operational Scripts

Located in `../din-contract/scripts/`:

- `RegisterInsuranceProduct.js` - Register new products
- `CreateTranchePools.js` - Deploy tranche pools
- `AnnounceRounds.js` - Start new rounds
- `CloseAndMatchRounds.js` - Close sales periods
- `TriggerSettlement.js` - Process settlements
- `MonitorActiveInsurances.js` - Track positions
- `MonitorPools.js` - Monitor pool health

---

## 📊 Success Metrics

### Technical Metrics

- **Connection Success Rate**: > 95%
- **Transaction Success Rate**: > 90%
- **Page Load Time**: < 2 seconds
- **Gas Optimization**: < $5 per transaction

### Business Metrics

- **Total Value Locked (TVL)**: Track growth
- **Active Insurance Positions**: Monitor adoption
- **Claim Success Rate**: > 99%
- **Loss Ratio**: < 80%

### User Experience Metrics

- **Wallet Connection Rate**: > 80%
- **Purchase Completion**: > 60%
- **Error Recovery**: > 70%
- **User Retention**: > 40% weekly

---

## 🌱 Yield Generation System

### YieldRouter Architecture

The YieldRouter contract manages idle collateral to generate additional returns for liquidity providers:

```
┌───────────────────────────────────────────────┐
│                YieldRouter                     │
├───────────────────────────────────────────────┤
│                                                │
│  ┌────────────────────────────────────────┐   │
│  │         Capital Management              │   │
│  ├────────────────────────────────────────┤   │
│  │ • Receive idle funds from pools        │   │
│  │ • Track deposits per pool              │   │
│  │ • Calculate yield earned               │   │
│  │ • Return principal + yield on demand  │   │
│  └────────────────┬───────────────────────┘   │
│                    │                           │
│  ┌────────────────▼───────────────────────┐   │
│  │        DeFi Protocol Integration       │   │
│  ├────────────────────────────────────────┤   │
│  │ • Lending protocols (Aave, Compound)  │   │
│  │ • Stablecoin farming                   │   │
│  │ • Conservative strategies only         │   │
│  │ • Risk-adjusted returns                │   │
│  └────────────────────────────────────────┘   │
└───────────────────────────────────────────────┘
```

### Yield Operations

```typescript
// Move funds to yield generation
await yieldRouter.moveToYield(poolAddress, amount);

// Track yield performance
const position = await yieldRouter.getYieldPosition(poolAddress);
console.log(`Principal: ${position.principal}`);
console.log(`Yield earned: ${position.yieldEarned}`);
console.log(`APY: ${position.currentAPY}%`);

// Return funds before settlement
await yieldRouter.returnFromYield(poolAddress, amount);
```

### Safety Features

- **Conservative Strategies**: Only low-risk DeFi protocols
- **Emergency Withdrawal**: Admin can force return of funds
- **Audit Trail**: All movements tracked on-chain
- **Buffer Maintenance**: Keep minimum liquidity for claims

## 🔄 Future Roadmap

### Phase 2 (Q2 2025)

- Cross-chain support (Ethereum, Polygon)
- Advanced oracle integrations
- Automated market making for premiums
- Mobile app with WalletConnect

### Phase 3 (Q3 2025)

- Decentralized governance (DAO)
- Enhanced yield optimization strategies
- Social insurance features
- AI-powered risk assessment

### Phase 4 (Q4 2025)

- Institutional features
- Reinsurance marketplace
- Advanced derivatives
- Global expansion

---

## 📚 Resources & References

### Documentation

- [Kaia Documentation](https://docs.kaia.io)
- [Ethers.js v6](https://docs.ethers.org/v6/)
- [@kaiachain/ethers-ext](https://www.npmjs.com/package/@kaiachain/ethers-ext)
- [Hardhat](https://hardhat.org)

### Project Files

- **Smart Contracts**: `../din-contract/`
- **Frontend**: `apps/nextjs/`
- **Contract Package**: `packages/contracts/`
- **Documentation**: `docs/`

### Community

- [Kaia Discord](https://discord.gg/kaia)
- [GitHub Repository](https://github.com/yourusername/dinyk)

---

_This document represents the complete architecture and integration guide for the DIN Protocol. It combines system architecture, smart contract design, and implementation details into a single comprehensive reference._

_Last Updated: January 2025_
_Version: 3.0.0 (Unified)_
