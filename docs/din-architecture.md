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

| Contract | Address | Purpose |
|----------|---------|---------|
| **DinRegistry** | `0x0000760e713fed5b6F866d3Bad87927337DF61c0` | Central registry and configuration |
| **ProductCatalog** | `0x5c251A3561E47700a9bcbD6ec91e61fB52Eb50d2` | Products, tranches, and rounds |
| **InsuranceToken** | `0x147f4660515aE91c81FdB43Cf743C6faCACa9903` | ERC721 NFT positions |
| **TranchePoolFactory** | `0x563e95673d4210148eD59eDb6310AC7d488F5Ec0` | Pool deployment |
| **SettlementEngine** | `0xAE3FA73652499Bf0aB0b79B8C309DD62137f142D` | Claims processing |
| **OracleRouter** | `0x5d83444EBa6899f1B7abD34eF04dDF7Dd7b38a37` | Oracle aggregation |
| **OraklPriceFeed** | `0x1320682DCe0b0A52A09937d19b404901d32D5f68` | Primary oracle |
| **DinoOracle** | `0x2480108C0dA6F7563a887D7d9d969630529340dD` | Fallback oracle |
| **DinUSDT** | `0x53232164780a589dfAe08fB16D1962bD78591Aa0` | Test USDT (6 decimals) |
| **DinToken** | `0x01200e08D6C522C288bE660eb7E8c82d5f095a42` | Governance token |
| **FeeTreasury** | `0x9C20316Ba669e762Fb43dbb6d3Ff63062b89945D` | Fee collection |

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
  chainIdHex: '0x3E9',
  name: 'Kaia Kairos Testnet',
  currency: { name: 'KLAY', symbol: 'KLAY', decimals: 18 },
  rpcUrl: 'https://public-en-kairos.node.kaia.io',
  blockExplorer: 'https://kairos.kaiascope.com'
};

// Kaia Mainnet (Production)
export const KAIA_MAINNET = {
  chainId: 8217,
  chainIdHex: '0x2019',
  name: 'Kaia Mainnet',
  currency: { name: 'KLAY', symbol: 'KLAY', decimals: 18 },
  rpcUrl: 'https://public-en-cypress.klaytn.net',
  blockExplorer: 'https://kaiascope.com'
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
  error
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
  updateTrancheStatus
} = useProductManagement();

// Example: Register new insurance product
await registerProduct({
  name: 'BTC Price Protection',
  description: 'Protects against BTC price drops'
});

// Example: Create tranche with specific risk parameters
await registerTranche({
  productId: 1,
  name: 'BTC -10% Protection',
  triggerType: 0, // PRICE_BELOW
  threshold: '54000', // $54,000 trigger
  premiumRateBps: 500, // 5% premium
  trancheCap: '100000', // $100k capacity
  maturityDays: 7,
  perAccountMin: '100',
  perAccountMax: '10000',
  oracleRouteId: 1
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
  isLoading
} = useRoundManagement();

// Example: Complete round lifecycle
const roundId = await announceRound({
  trancheId: 1,
  durationMinutes: 10080, // 7 days
  startDelayMinutes: 10,
  openImmediately: false
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
  isLoading
} = useBuyerOperations();

// Example: Purchase insurance with premium calculation
const calculation = await calculatePremium(trancheId, '1000');
console.log(`Premium: ${calculation.premiumAmount} USDT`);

const receipt = await buyInsurance({
  roundId: 1,
  coverageAmount: '1000'
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
  withdrawCollateral,
  getSellerPosition,
  calculateYield,
  getPoolMetrics,
  claimSellerRewards,
  isLoading
} = useSellerOperations();

// Example: Provide liquidity to pool
await depositCollateral({
  roundId: 1,
  amount: '10000' // USDT
});

// Monitor position
const position = await getSellerPosition(roundId);
console.log(`Shares: ${position.shareTokens}`);
console.log(`Earned: ${position.earnedPremiums}`);

// Withdraw after settlement
await withdrawCollateral(roundId, '5000');
```

### 6. useMonitoring - Analytics & Monitoring
```typescript
const {
  getPoolHealth,
  getTrancheRiskMetrics,
  getRoundMonitoring,
  getSystemMetrics,
  getHistoricalData,
  isLoading
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
  isLoading
} = useSettlement();

// Example: Trigger settlement after maturity
const status = await getSettlementStatus(roundId);
if (status.canSettle) {
  await triggerSettlement(roundId);
}
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

## 🏦 Insurance Product Structure

### Tranche Configuration

| Tranche | Trigger | Premium | Capacity | Risk Level |
|---------|---------|---------|----------|------------|
| A | -5% | 2% | $100,000 | Low |
| B | -10% | 5% | $50,000 | Medium |
| C | -15% | 10% | $25,000 | High |

### Economic Model

```typescript
interface TrancheEconomics {
  // Coverage parameters
  triggerThreshold: number;      // Price drop percentage
  premiumRateBps: number;        // Premium in basis points
  trancheCap: BigNumber;         // Maximum capacity
  
  // Limits
  perAccountMin: BigNumber;      // Minimum purchase
  perAccountMax: BigNumber;      // Maximum purchase
  
  // Timing
  maturityTimestamp: number;     // Coverage expiry
  salesWindow: number;           // Sales duration
  
  // Pool metrics
  totalBuyerPurchases: BigNumber;
  totalSellerCollateral: BigNumber;
  matchedAmount: BigNumber;      // Min(purchases, collateral)
  utilizationRate: number;       // Matched/Collateral %
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
  coverageAmount: coverageAmount
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
  amount: depositAmount
});

// 4. Monitor earnings
const { getSellerPosition } = useSellerOperations();
const position = await getSellerPosition(roundId);

// 5. Withdraw after settlement
const { withdrawCollateral } = useSellerOperations();
await withdrawCollateral(roundId, withdrawAmount);
```

---

## 🧪 Testing Strategy

### Unit Testing
```typescript
describe('useBuyerOperations', () => {
  it('should calculate premium correctly', async () => {
    const { calculatePremium } = renderHook(() => useBuyerOperations());
    const result = await calculatePremium(1, '1000');
    expect(result.premiumAmount).toBe('50'); // 5% of 1000
  });
});
```

### Integration Testing
```typescript
describe('Insurance Purchase Flow', () => {
  it('should complete purchase end-to-end', async () => {
    // Setup
    await connectWallet();
    await approveUSDT();
    
    // Execute
    const receipt = await buyInsurance({ roundId: 1, coverageAmount: '1000' });
    
    // Verify
    expect(receipt.status).toBe(1);
    const position = await getBuyerOrder(1);
    expect(position.purchaseAmount).toBe('1000');
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
# Development (.env.local)
NEXT_PUBLIC_CHAIN_ID=1001
NEXT_PUBLIC_RPC_URL=https://public-en-kairos.node.kaia.io

# Testnet Contract Addresses
NEXT_PUBLIC_REGISTRY_ADDRESS=0x0000760e713fed5b6F866d3Bad87927337DF61c0
NEXT_PUBLIC_PRODUCT_CATALOG_ADDRESS=0x5c251A3561E47700a9bcbD6ec91e61fB52Eb50d2
NEXT_PUBLIC_INSURANCE_TOKEN_ADDRESS=0x147f4660515aE91c81FdB43Cf743C6faCACa9903
NEXT_PUBLIC_POOL_FACTORY_ADDRESS=0x563e95673d4210148eD59eDb6310AC7d488F5Ec0
NEXT_PUBLIC_SETTLEMENT_ENGINE_ADDRESS=0xAE3FA73652499Bf0aB0b79B8C309DD62137f142D
NEXT_PUBLIC_ORACLE_ROUTER_ADDRESS=0x5d83444EBa6899f1B7abD34eF04dDF7Dd7b38a37
NEXT_PUBLIC_USDT_ADDRESS=0x53232164780a589dfAe08fB16D1962bD78591Aa0
NEXT_PUBLIC_FEE_TREASURY_ADDRESS=0x9C20316Ba669e762Fb43dbb6d3Ff63062b89945D

# Production (.env.production)
NEXT_PUBLIC_CHAIN_ID=8217
NEXT_PUBLIC_RPC_URL=https://public-en-cypress.klaytn.net
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

## 🔄 Future Roadmap

### Phase 2 (Q2 2025)
- Cross-chain support (Ethereum, Polygon)
- Advanced oracle integrations
- Automated market making for premiums
- Mobile app with WalletConnect

### Phase 3 (Q3 2025)
- Decentralized governance (DAO)
- Yield optimization strategies
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

*This document represents the complete architecture and integration guide for the DIN Protocol. It combines system architecture, smart contract design, and implementation details into a single comprehensive reference.*

*Last Updated: January 2025*
*Version: 3.0.0 (Unified)*