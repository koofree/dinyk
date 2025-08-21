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

#### Smart Contracts (Deployed on Kaia Testnet - Chain ID: 1001)

##### Core Contracts
- **`DinRegistry`** (`0x0000760e713fed5b6F866d3Bad87927337DF61c0`): Central registry for all contract addresses and global parameters. Manages protocol-wide settings with bounded validation (premium rates 0-50%, protocol fees 0-10%, maturity windows 1hr-365days).
- **`ProductCatalog`** (`0x5c251A3561E47700a9bcbD6ec91e61fB52Eb50d2`): Manages insurance products, tranches, and rounds. Controls the full round lifecycle (ANNOUNCED → OPEN → MATCHED → ACTIVE → MATURED → SETTLED).
- **`TranchePoolCore`**: Economics-focused pool contract managing buyer orders, seller collateral, NAV calculation, and premium distribution. Deployed per tranche via factory.
- **`InsuranceToken`** (`0x147f4660515aE91c81FdB43Cf743C6faCACa9903`): ERC-721 NFT representing buyer insurance positions with metadata for coverage amount and round details.
- **`SettlementEngine`** (`0xAE3FA73652499Bf0aB0b79B8C309DD62137f142D`): Handles oracle-based claim processing, dispute resolution, and automatic payout distribution.
- **`FeeTreasury`** (`0x9C20316Ba669e762Fb43dbb6d3Ff63062b89945D`): Protocol fee collection, distribution to stakers, and treasury management.

##### Infrastructure Contracts
- **`TranchePoolFactory`** (`0x563e95673d4210148eD59eDb6310AC7d488F5Ec0`): Deploys isolated pool contracts for each tranche with proper integration.
- **`OracleRouter`** (`0x5d83444EBa6899f1B7abD34eF04dDF7Dd7b38a37`): Aggregates multiple oracle sources with median calculation and outlier detection.
- **`OraklPriceFeed`** (`0x1320682DCe0b0A52A09937d19b404901d32D5f68`): Primary oracle integration with Orakl Network for real-time price feeds.
- **`DinoOracle`** (`0x2480108C0dA6F7563a887D7d9d969630529340dD`): Secondary optimistic oracle for dispute resolution and special events.

##### Token Contracts
- **`DinUSDT`** (`0x53232164780a589dfAe08fB16D1962bD78591Aa0`): Test USDT token (6 decimals) for development.
- **`DinToken`** (`0x01200e08D6C522C288bE660eb7E8c82d5f095a42`): Protocol governance token (18 decimals, 100M supply).

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
3. Add contract addresses (Testnet deployed):
   ```bash
   # Core Contracts
   NEXT_PUBLIC_REGISTRY_ADDRESS=0x0000760e713fed5b6F866d3Bad87927337DF61c0
   NEXT_PUBLIC_PRODUCT_CATALOG_ADDRESS=0x5c251A3561E47700a9bcbD6ec91e61fB52Eb50d2
   NEXT_PUBLIC_INSURANCE_TOKEN_ADDRESS=0x147f4660515aE91c81FdB43Cf743C6faCACa9903
   NEXT_PUBLIC_SETTLEMENT_ENGINE_ADDRESS=0xAE3FA73652499Bf0aB0b79B8C309DD62137f142D
   NEXT_PUBLIC_FEE_TREASURY_ADDRESS=0x9C20316Ba669e762Fb43dbb6d3Ff63062b89945D
   
   # Infrastructure
   NEXT_PUBLIC_POOL_FACTORY_ADDRESS=0x563e95673d4210148eD59eDb6310AC7d488F5Ec0
   NEXT_PUBLIC_ORACLE_ROUTER_ADDRESS=0x5d83444EBa6899f1B7abD34eF04dDF7Dd7b38a37
   
   # Tokens
   NEXT_PUBLIC_USDT_ADDRESS=0x53232164780a589dfAe08fB16D1962bD78591Aa0
   NEXT_PUBLIC_DIN_TOKEN_ADDRESS=0x01200e08D6C522C288bE660eb7E8c82d5f095a42
   ```

### Kaia Network Configuration

#### Mainnet (Production)
- **Chain ID**: 8217 (0x2019 in hex)
- **RPC URL**: https://public-en-cypress.klaytn.net
- **Block Explorer**: https://kaiascope.com
- **Native Token**: KLAY

#### Testnet (Development)
- **Chain ID**: 1001 (0x3E9 in hex)
- **RPC URL**: https://public-en-kairos.node.kaia.io
- **Block Explorer**: https://kairos.kaiascope.com
- **Native Token**: Test KLAY
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
- [ ] Create `@dinsure/contracts` package with TypeScript interfaces
- [ ] Implement contract service layer (Registry, Products, Pools, Settlement)
- [ ] Build insurance catalog UI with live contract data
- [ ] Add wallet connection with session persistence
- [ ] Implement transaction builders with gas optimization

### Phase 3: Core Features
- [ ] Insurance purchase flow
- [ ] Liquidity provision interface
- [ ] Portfolio management dashboard
- [ ] Automatic claim processing

### Phase 4: Production
- [ ] Security audit
- [ ] Mainnet deployment
- [ ] Re-staking integration
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
3. **MATCHED**: Sales closed, matching buyers/sellers
4. **ACTIVE**: Insurance coverage active, monitoring triggers
5. **MATURED**: Coverage period ended, awaiting settlement
6. **SETTLED**: Claims processed, payouts distributed
7. **CANCELED**: Emergency cancellation, full refunds

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
- **Configuration**: `insurances.json` defines products and tranches

#### Round Management
- **`AnnounceRounds.js`**: Announce new insurance rounds
- **`CloseAndMatchRounds.js`**: Close sales and match buyers/sellers
- **`TriggerSettlement.js`**: Process claims and settlements

#### Monitoring
- **`MonitorActiveInsurances.js`**: Track active insurance positions
- **`MonitorPools.js`**: Monitor pool health and NAV
- **`MonitorTranches.js`**: View tranche status and rounds

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
ANNOUNCED → OPEN → MATCHED → ACTIVE → MATURED → SETTLED/CANCELED
```
- ProductCatalog owns the lifecycle state
- TranchePoolCore handles economics
- SettlementEngine processes claims

#### Order Flow
1. **Buyer**: Deposit USDT → Pay premium → Receive NFT
2. **Seller**: Provide collateral → Mint shares → Earn premiums
3. **Settlement**: Oracle trigger → Payout calculation → Distribution

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
- **Contract Integration**: `@docs/din-contracts-integration.md` - Smart contract integration and package design
- **Smart Contracts**: `../din-contract/` - Solidity contracts and deployment scripts
- **Contract Docs**: `../din-contract/README.md` - Contract architecture and deployment guide