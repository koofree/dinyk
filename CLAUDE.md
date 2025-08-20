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

#### Smart Contracts (To be implemented)
- **`Insurance.sol`**: Core insurance logic and product management
- **`TranchePool.sol`**: Liquidity pool management for each risk tranche
- **`Treasury.sol`**: Protocol fee collection and distribution
- **`OracleRouter.sol`**: Multi-oracle price feed aggregation

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
3. Add contract addresses (after deployment):
   ```bash
   NEXT_PUBLIC_INSURANCE_CONTRACT=0x...
   NEXT_PUBLIC_TRANCHE_POOL_CONTRACT=0x...
   NEXT_PUBLIC_TREASURY_CONTRACT=0x...
   ```

### Kaia Network Configuration
- **Mainnet Chain ID**: 8217 (0x2019 in hex)
- **RPC URL**: https://public-en-cypress.klaytn.net
- **Block Explorer**: https://kaiascope.com
- **Native Token**: KLAY

## Implementation Roadmap

### Phase 1: Foundation (Current)
- [ ] Remove server-side dependencies (tRPC, auth, database)
- [ ] Set up Web3 provider with Kaia support
- [ ] Implement wallet connection (MetaMask, Kaikas)
- [ ] Create basic insurance catalog UI

### Phase 2: Smart Contracts
- [ ] Deploy Insurance.sol contract
- [ ] Deploy TranchePool.sol for liquidity management
- [ ] Deploy Treasury.sol for fee handling
- [ ] Integrate Oracle Router for price feeds

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
1. **Funding Phase** (3 days): Users deposit or purchase
2. **Matching Phase** (1 hour): System matches buyers and sellers
3. **Active Phase** (7-30 days): Insurance coverage active
4. **Settlement Phase** (1 day): Claims processed and settled

## Security Considerations

1. **Multi-signature Controls**: Critical functions require 3/5 multisig
2. **Emergency Pause**: Circuit breaker for critical issues
3. **Oracle Redundancy**: Multiple oracle sources with fallback
4. **Audit Requirements**: All contracts must pass security audit

## Common Patterns

- Use ESM modules (`"type": "module"`)
- TypeScript configurations extend from `@acme/tsconfig`
- Prettier configurations extend from `@acme/prettier-config`
- ESLint configurations use the new flat config format
- Tailwind configurations extend from `@acme/tailwind-config`
- Web3 hooks follow `use{ContractName}` pattern
- All amounts handle BigNumber/BigInt properly

## References

- **Whitepaper**: `@docs/whitepaper.md` - Full protocol specification
- **UI Wireframes**: `@docs/ui-flow-wireframe.md` - Detailed UI flows
- **Architecture**: `@docs/din-architecture.md` - Complete Web3 technical architecture and implementation guide