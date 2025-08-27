# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: DIN (Dinyk) - Decentralized Insurance Platform

**DIN** is a decentralized insurance platform on the Kaia blockchain that provides parametric insurance products. The platform enables users to purchase insurance for risk hedging or provide liquidity to earn premiums and staking rewards.

### Key Features
- **Parametric Insurance**: Automatic payouts based on predefined conditions (e.g., BTC price drops)
- **Tranche-based Risk Segmentation**: Multiple risk levels (-5%, -10%, -15% triggers)
- **Dual-sided Market**: Insurance buyers and liquidity providers
- **Automatic Claims**: Oracle-based automatic claim processing
- **Re-staking**: Conservative yield generation on locked collateral
- **NFT Insurance Tokens**: ERC-721 tokens representing insurance positions
- **100% Collateralization**: Full backing of insurance payouts in TranchePool

## Architecture Overview

This project is transitioning from a T3 Turbo monorepo to a Web3-focused architecture for decentralized insurance on Kaia blockchain.

### Current Structure (Transitioning)
- **Next.js (`apps/nextjs`)**: Web application with Next.js 15, React 19, and Tailwind CSS
- **Expo (`apps/expo`)**: React Native mobile app (to be deprecated for Web3 focus)

### Target Web3 Architecture

#### Frontend
- **Next.js 15**: Main web application
- **Web3 Integration**: @kaiachain/ethers-ext for Kaia blockchain interaction
- **Wallet Support**: MetaMask (primary), Kaikas, WalletConnect
- **State Management**: React Context with session persistence
- **Contract Package**: `@dinsure/contracts` - TypeScript interfaces and hooks for smart contract interaction

#### Oracle System
- **Primary**: Kaia Price Feed for standard crypto prices
- **Fallback**: OO-lite (Optimistic Oracle) for special events
- **Aggregation**: Median calculation with outlier detection

### Tooling
- **Turborepo**: Monorepo orchestration and build caching
- **ESLint & Prettier**: Code formatting and linting
- **TypeScript**: Shared TypeScript configurations
- **Tailwind CSS**: Shared styling configurations

## Essential Commands

### Development
```bash
# Install dependencies (requires pnpm 9.6.0+)
pnpm install

# Start all apps in dev mode with watch
pnpm dev

# Start only Next.js app
pnpm dev:next

# Start Expo app (iOS)
pnpm ios

# Start Expo app (Android)
pnpm android
```

### Database
```bash
# Push schema changes to database
pnpm db:push

# Open Drizzle Studio for database management
pnpm db:studio

# Generate authentication migrations
pnpm auth:generate
```

### Code Quality
```bash
# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Run type checking
pnpm typecheck

# Format code
pnpm format

# Fix formatting
pnpm format:fix
```

### Build & Clean
```bash
# Build all packages
pnpm build

# Clean all node_modules
pnpm clean

# Clean workspace build artifacts
pnpm clean:workspaces
```

### UI Components
```bash
# Add new shadcn/ui component
pnpm ui-add
```

### Creating New Packages
```bash
# Generate new package with Turbo
pnpm turbo gen init
```

## Key Architectural Decisions

### Web3 Migration Strategy
1. **Remove Server Dependencies**: Eliminate tRPC, auth, and database layers for full decentralization
2. **Direct Blockchain Interaction**: All data and logic on-chain via smart contracts
3. **Client-Side Only**: No backend API, all logic executes in browser
4. **Session Persistence**: Maintain wallet state across page refreshes

### Insurance Model
1. **Round-based Sales**: Fixed funding periods with automatic refunds for unmatched liquidity
2. **Tranche System**: Risk segmentation with different trigger levels and premiums
3. **100% Collateralization**: Full backing of insurance payouts in TranchePool
4. **Automatic Settlement**: Oracle-triggered claim processing without manual intervention

### Technical Stack
1. **Blockchain**: Kaia Mainnet (Chain ID: 8217)
2. **Web3 Library**: @kaiachain/ethers-ext v1.1.1 with ethers.js v6
3. **Frontend**: Next.js 15 with React 19
4. **Styling**: Tailwind CSS with dark theme
5. **Monorepo**: Turborepo for build orchestration

## Environment Setup

### Development Environment
1. Copy `.env.example` to `.env`
2. Configure Kaia network settings:
   ```bash
   NEXT_PUBLIC_CHAIN_ID=8217
   NEXT_PUBLIC_RPC_URL=https://public-en-cypress.klaytn.net
   ```
3. Add contract addresses (Testnet deployed) (addresses.ts file)

### Kaia Network Configuration

#### Mainnet (Production)
- **Chain ID**: 8217 (0x2019 in hex)
- **RPC URL**: https://public-en-cypress.klaytn.net
- **Block Explorer**: https://kaiascope.com
- **Native Token**: KAIA

#### Testnet (Development)
- **Chain ID**: 1001 (0x3E9 in hex)
- **RPC URL**: https://public-en-kairos.node.kaia.io
- **Block Explorer**: https://kairos.kaiascope.com
- **Native Token**: Test KAIA
- **Faucet**: https://faucet.kaia.io

## Implementation Roadmap

### Phase 1: Foundation (Completed)
- [x] Smart contracts deployed on Kaia Testnet
- [x] Registry-based architecture with role-based access control
- [x] Product catalog with tranche management
- [x] Oracle integration (Orakl + DINO)
- [ ] Remove server-side dependencies (tRPC, auth, database)
- [ ] Set up Web3 provider with Kaia support
- [ ] Implement wallet connection (MetaMask, Kaikas)

### Phase 2: Frontend Integration (Current)
- [x] Create `@dinsure/contracts` package with TypeScript interfaces
- [x] Implement contract service layer (Registry, Products, Pools, Settlement)
- [x] Build insurance catalog UI with live contract data
- [x] Add wallet connection with session persistence
- [x] Implement transaction builders with gas optimization

### Phase 3: Core Features
- [x] Insurance purchase flow (BuyInsuranceForm, EnhancedPurchaseModal)
- [x] Liquidity provision interface (ProvideLiquidityForm, LiquidityModal)
- [x] Portfolio management dashboard (PortfolioPage with useUserPortfolio)
- [ ] Automatic claim processing (partially implemented via SettlementEngine)

### Phase 4: Production
- [ ] Security audit
- [ ] Mainnet deployment
- [x] Yield integration via YieldRouter
- [ ] Analytics dashboard

## UI/UX Guidelines

### Design System
- **Primary Color**: #0EA5E9 (Kaia Blue)
- **Background**: #0F172A (Dark theme)
- **Typography**: Inter for UI, Space Mono for numbers
- **Components**: Rounded cards with subtle shadows

### Key User Flows
1. **Insurance Purchase**: Browse → Select Tranche → Review → Confirm → Receipt
2. **Liquidity Provision**: Select Pool → Deposit → Monitor → Withdraw
3. **Claim Process**: Automatic trigger → Oracle verification → Auto-payout

## Insurance Products

### Tranche Structure
Each insurance product offers multiple risk tranches:

| Tranche | Trigger | Premium | Risk Level |
|---------|---------|---------|------------|
| A | -5% | 2% | Low |
| B | -10% | 5% | Medium |
| C | -15% | 10% | High |

### Round Lifecycle

#### States and Transitions
1. **ANNOUNCED**: Round created, not yet open for sales
2. **OPEN**: Accepting buyer purchases and seller deposits
3. **ACTIVE**: Insurance coverage active, monitoring triggers
4. **MATURED**: Coverage period ended, awaiting settlement
5. **SETTLED**: Claims processed, payouts distributed
6. **CANCELED**: Emergency cancellation, full refunds

#### Timing Windows
- **Sales Window**: Typically 3-7 days for deposits
- **Coverage Period**: 7-30 days of active insurance
- **Settlement Window**: 24-48 hours for claim processing
- **Dispute Period**: 24 hours for oracle challenges

#### Matching Logic
- **Matched Amount** = min(Total Buyer Purchases, Total Seller Collateral)
- **Buyer Filled** = (User Purchase / Total Purchases) * Matched Amount
- **Seller Filled** = (User Collateral / Total Collateral) * Matched Amount
- **Refunds**: Automatic for unmatched portions

## Security Considerations

1. **Multi-signature Controls**: Critical functions require 3/5 multisig
2. **Emergency Pause**: Circuit breaker for critical issues
3. **Oracle Redundancy**: Multiple oracle sources with fallback
4. **Audit Requirements**: All contracts must pass security audit

## Smart Contract Operations

### Contract Deployment (Hardhat Ignition)
The contracts are deployed using Hardhat Ignition modules in a phased approach:

1. **Phase 1: Basic Contracts** (`deployBasicContracts.js`)
   - DinRegistry with admin roles
   - DinToken (100M supply)
   - DinUSDT (test token, 6 decimals)
   - ProductCatalog
   - InsuranceToken (NFT)
   - FeeTreasury
   - OraklPriceFeed

2. **Phase 2: Registry-Dependent** (`deployRegistryDependentContracts.js`)
   - DinoOracle
   - TranchePoolFactory
   - OracleRouter
   - SettlementEngine

3. **Phase 3: Configuration** (`configureBasicSystem.js`)
   - Set all contract addresses in Registry
   - Grant operator roles
   - Configure oracle routes

### Operational Scripts

#### Insurance Product Management
- **`RegisterInsuranceProduct.js`**: JSON-driven product registration
- **`CreateTranchePools.js`**: Deploy pools for each tranche
- **`SyncPoolsWithCatalog.js`**: Sync pool addresses with ProductCatalog
- **Configuration**: `insurances.json` defines products and tranches

#### Round Management
- **`AnnounceRounds.js`**: Announce new insurance rounds
- **`CloseAndMatchRounds.js`**: Close sales and match buyers/sellers
- **`TriggerSettlement.js`**: Process claims and settlements

#### Yield Operations
- **`move-to-yield`**: Transfer idle funds to YieldRouter
- **`return-from-yield`**: Withdraw funds plus yield
- **`yield-admin-withdraw`**: Emergency withdrawal by admin
- **`yield-admin-deposit`**: Manual deposit for testing

#### Monitoring
- **`MonitorActiveInsurances.js`**: Track active insurance positions
- **`MonitorPools.js`**: Monitor pool health and NAV
- **`MonitorTranches.js`**: View tranche status and rounds
- **`MonitorYield.js`**: Track yield positions and APY
- **`MonitorOracles.js`**: Oracle price feeds and status

### Contract Interaction Patterns

#### Registry Pattern
All contracts reference the DinRegistry for addresses and parameters:
```solidity
IDinRegistry registry = IDinRegistry(registryAddress);
address catalog = registry.getProductCatalog();
uint256 maxPremium = registry.getMaxPremiumBps();
```

#### Round Lifecycle
```
ANNOUNCED → OPEN → ACTIVE → MATURED → SETTLED/CANCELED
```
- ProductCatalog owns the lifecycle state
- TranchePoolCore handles economics
- SettlementEngine processes claims
- YieldRouter manages idle capital during active periods

#### Order Flow
1. **Buyer**: Deposit USDT → Pay premium → Receive NFT
2. **Seller**: Provide collateral → Mint shares → Earn premiums
3. **Yield**: Idle collateral → YieldRouter → DeFi protocols → Returns
4. **Settlement**: Oracle trigger → Payout calculation → Distribution

#### Yield Management
The YieldRouter enables conservative yield strategies:
- Deposits idle collateral to vetted DeFi protocols
- Tracks yield performance and APY
- Returns principal + yield before settlement
- Admin controls for emergency withdrawals

## Implemented Components & Hooks

### Contract Package (@dinsure/contracts)
The package provides comprehensive TypeScript interfaces and React hooks for all smart contract interactions:

#### Core Hooks
- **`useContracts`**: Provides contract instances with proper typing
- **`useProductManagement`**: Product and tranche registration and management
- **`useRoundManagement`**: Round lifecycle operations (announce, open, close, settle)
- **`useBuyerOperations`**: Insurance purchase calculations and order placement
- **`useSellerOperations`**: Liquidity provision, NAV tracking, and yield analysis
- **`useMonitoring`**: System health, pool metrics, and risk analysis
- **`useSettlement`**: Claim processing and payout distribution
- **`useUserPortfolio`**: User's insurance and liquidity positions

#### Services
- **`ProductCatalogService`**: Centralized service for product/tranche/round data fetching

### UI Components

#### Pages
- **`/`**: Home page with product showcase
- **`/insurance`**: Insurance marketplace with product cards
- **`/tranches`**: Tranche listing with filtering and sorting
- **`/tranches/[productId]/[trancheId]`**: Detailed tranche view with buy/sell forms
- **`/portfolio`**: User's positions and earnings dashboard
- **`/debug`**: Development tools and contract state viewer

#### Insurance Components
- **`ProductCard`**: Display insurance product with key metrics
- **`TrancheCard`**: Show tranche details with risk/reward info
- **`EnhancedTrancheCard`**: Advanced tranche display with round status
- **`BuyInsuranceForm`**: Purchase interface with amount calculation
- **`ProvideLiquidityForm`**: Deposit interface for liquidity providers
- **`EnhancedPurchaseModal`**: Complete purchase flow with confirmations
- **`LiquidityModal`**: Liquidity provision with yield projections
- **`PositionCard`**: Display user's insurance/liquidity positions

#### Web3 Components
- **`WalletButton`**: Wallet connection with network switching
- **`AppProviders`**: Web3 context and session persistence

## Common Patterns

- Use ESM modules (`"type": "module"`)
- TypeScript configurations extend from `@dinsure/tsconfig`
- Prettier configurations extend from `@dinsure/prettier-config`
- ESLint configurations use the new flat config format
- Tailwind configurations extend from `@dinsure/tailwind-config`
- Web3 hooks follow `use{ContractName}` pattern
- All amounts handle BigNumber/BigInt properly
- Contract calls use typed interfaces from ABIs
- Gas estimation with 10% buffer for safety
- Error handling with ContractError type and user-friendly messages
- Caching layer for frequently accessed data (5-minute TTL)

## Contract Testing & Development

### Local Development Setup
```bash
# Clone the din-contract repository
cd ../din-contract

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to testnet
npm run deploy:kairos
```

### Contract Verification
```bash
# Verify deployment order
node scripts/debug/VerifyDeploymentOrder.js

# Verify contract configurations
node scripts/debug/VerifyContracts.js

# Test oracle integration
node scripts/test/TestOracles.js
```

### Gas Optimization
- Batch operations in single transaction
- Use mappings over arrays for lookups
- Pack struct variables efficiently
- Minimize storage writes
- Use events for off-chain data

## References

- **Whitepaper**: `@docs/whitepaper.md` - Full protocol specification
- **UI Architecture**: `@docs/ui-architecture.md` - Complete UI/UX flows with contract integration
- **Technical Architecture**: `@docs/din-architecture.md` - Web3 technical architecture and implementation guide
- **Smart Contracts**: `../din-contract/` - Solidity contracts and deployment scripts
- **Contract Docs**: `../din-contract/README.md` - Contract architecture and deployment guide