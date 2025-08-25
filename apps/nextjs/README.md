# DIN Insurance Platform - Next.js Application

The main web application for the DIN decentralized insurance platform, built with Next.js 15 and React 19.

## Features

### Core Functionality
- **Insurance Marketplace**: Browse and purchase parametric insurance products
- **Liquidity Provision**: Provide collateral to earn premiums and yields
- **Portfolio Management**: Track insurance positions and liquidity investments
- **Real-time Monitoring**: Live price feeds and position updates via oracles

### Technical Features
- **Web3 Integration**: Direct interaction with Kaia blockchain
- **Multi-wallet Support**: MetaMask, Kaikas, and WalletConnect
- **Session Persistence**: Maintains wallet state across page refreshes
- **Responsive Design**: Mobile-friendly dark theme interface
- **Type-safe Contracts**: Full TypeScript support for smart contract interactions

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19
- **Language**: TypeScript
- **Web3**: @kaiachain/ethers-ext v1.1.1, ethers.js v6
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **Contract Package**: @dinsure/contracts (local package)

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Home page
│   ├── insurance/         # Insurance marketplace
│   ├── portfolio/         # User portfolio dashboard
│   ├── tranche/          # Tranche listing
│   ├── tranches/         # Tranche detail pages
│   └── debug/            # Development tools
├── components/            # React components
│   ├── insurance/        # Insurance-specific components
│   │   ├── ProductCard.tsx
│   │   ├── BuyInsuranceForm.tsx
│   │   ├── EnhancedPurchaseModal.tsx
│   │   └── PositionCard.tsx
│   ├── liquidity/        # Liquidity provision components
│   │   └── LiquidityModal.tsx
│   ├── tranche/          # Tranche display components
│   │   ├── TrancheCard.tsx
│   │   └── EnhancedTrancheCard.tsx
│   ├── web3/             # Web3 integration
│   │   └── WalletButton.tsx
│   └── providers/        # Context providers
│       └── AppProviders.tsx
├── context/              # React contexts
│   └── Web3Provider.tsx # Wallet connection management
└── lib/                  # Utilities and constants
    ├── constants.ts      # App-wide constants
    └── utils.ts         # Helper functions
```

## Available Pages

### `/` - Home
Landing page with platform overview and featured products

### `/insurance` - Insurance Marketplace
Browse all available insurance products and tranches

### `/tranche` - Tranche Listing
View and filter all tranches across products

### `/tranches/[productId]/[trancheId]` - Tranche Details
Detailed view with buy/sell forms for specific tranche

### `/portfolio` - User Portfolio
Dashboard showing user's insurance positions and liquidity provisions

### `/debug` - Debug Tools
Development tools for contract state inspection (dev mode only)

## Key Components

### Insurance Components
- **ProductCard**: Displays insurance product with key metrics
- **TrancheCard**: Shows tranche details with risk/reward information
- **BuyInsuranceForm**: Purchase interface with premium calculation
- **ProvideLiquidityForm**: Deposit interface for liquidity providers
- **EnhancedPurchaseModal**: Complete purchase flow with confirmations
- **PositionCard**: Displays user's active positions

### Web3 Components
- **WalletButton**: Wallet connection with network switching
- **AppProviders**: Web3 context and session persistence

## Development

### Prerequisites
- Node.js 20+
- pnpm 9.6.0+
- MetaMask or Kaikas wallet

### Setup
```bash
# Install dependencies (from root)
pnpm install

# Start development server
pnpm dev:next

# Or start all apps
pnpm dev
```

### Environment Variables
Create `.env` file with:
```bash
# Kaia Network
NEXT_PUBLIC_CHAIN_ID=1001  # Testnet
NEXT_PUBLIC_RPC_URL=https://public-en-kairos.node.kaia.io

# Contract Addresses (see CLAUDE.md for full list)
NEXT_PUBLIC_REGISTRY_ADDRESS=0xCD2B28186b257869B3C2946ababB56683F4304C3
# ... (add other contract addresses)

# Development
NEXT_PUBLIC_ENABLE_TESTNETS=true
NEXT_PUBLIC_SHOW_DEBUG_INFO=true
```

### Commands
```bash
# Development
pnpm dev              # Start in dev mode

# Code Quality
pnpm lint            # Run ESLint
pnpm typecheck       # TypeScript checking
pnpm format          # Check formatting

# Build
pnpm build           # Production build
```

## Contract Integration

The app uses the `@dinsure/contracts` package for smart contract interaction:

### Available Hooks
- `useContracts()` - Contract instances
- `useProductManagement()` - Product/tranche operations
- `useRoundManagement()` - Round lifecycle
- `useBuyerOperations()` - Insurance purchases
- `useSellerOperations()` - Liquidity provision
- `useMonitoring()` - System monitoring
- `useSettlement()` - Claim processing
- `useUserPortfolio()` - User positions

### Example Usage
```typescript
import { useBuyerOperations } from '@dinsure/contracts';

function BuyInsurance() {
  const { buyInsurance, calculatePremium } = useBuyerOperations();
  
  // Calculate premium for coverage
  const premium = await calculatePremium(roundId, coverageAmount);
  
  // Purchase insurance
  const tx = await buyInsurance({
    roundId,
    amount: coverageAmount,
    maxPremium: premium
  });
}
```

## Deployment

### Production Build
```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

### Deployment Platforms
- **Vercel**: Recommended for Next.js apps
- **AWS Amplify**: Alternative with CI/CD
- **Docker**: Self-hosted deployment

## Testing

```bash
# Run tests (when available)
pnpm test

# E2E tests
pnpm test:e2e
```

## Contributing

1. Create feature branch
2. Make changes
3. Run `pnpm lint` and `pnpm typecheck`
4. Submit pull request

## License

See root LICENSE file for details.