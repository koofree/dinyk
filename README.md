# DIN (Dinyk) - Decentralized Insurance Platform

A decentralized parametric insurance platform built on the Kaia blockchain, providing automated risk protection through smart contracts and oracle-based settlements.

## Overview

DIN enables users to:
- **Purchase Insurance**: Protect against crypto price drops with automatic payouts
- **Provide Liquidity**: Earn premiums and staking rewards by backing insurance pools
- **Automatic Claims**: Oracle-triggered settlements without manual intervention
- **Risk Segmentation**: Choose from multiple risk tranches with different trigger levels

## Features

### Core Functionality
- **Parametric Insurance Products**: BTC, ETH, and KAIA price protection
- **Tranche-based Risk Levels**: -5%, -10%, -15% price drop triggers
- **100% Collateralization**: Full backing of all insurance payouts
- **Round-based Sales**: Fixed funding periods with automatic refunds
- **Re-staking Integration**: Conservative yield generation on locked collateral

### Technical Features
- **Web3 Integration**: Direct blockchain interaction with no backend
- **Multi-wallet Support**: MetaMask, Kaikas, and WalletConnect compatibility
- **Session Persistence**: Maintains wallet state across refreshes
- **Responsive Design**: Mobile-friendly dark theme interface
- **Real-time Updates**: Live price feeds and position tracking
- **Yield Generation**: Automated yield strategies via YieldRouter
- **NFT Positions**: ERC-721 tokens representing insurance coverage

## Tech Stack

- **Blockchain**: Kaia Testnet (Chain ID: 1001) / Mainnet (Chain ID: 8217)
- **Frontend**: Next.js 15, React 19, TypeScript
- **Web3**: @kaiachain/ethers-ext v1.1.1, ethers.js v6
- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin
- **Oracles**: Orakl Network, DINO (Optimistic Oracle)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Build**: Turborepo monorepo orchestration

## Quick Start

### Prerequisites
- Node.js 20+ and pnpm 9.6.0+
- MetaMask or Kaia Wallet
- KAIA tokens for transactions

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/dinyk.git
cd dinyk

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start development server
pnpm dev
```

The application will be available at http://localhost:3000

### Environment Configuration

Create a `.env` file with:

```bash
# Kaia Network Configuration
NEXT_PUBLIC_CHAIN_ID=1001  # Testnet (use 8217 for Mainnet)
NEXT_PUBLIC_RPC_URL=https://public-en-kairos.node.kaia.io

# Core Smart Contract Addresses (Testnet deployed)
NEXT_PUBLIC_REGISTRY_ADDRESS=0xCD2B28186b257869B3C2946ababB56683F4304C3
NEXT_PUBLIC_PRODUCT_CATALOG_ADDRESS=0x145E2f2e2B9C6Bdd22D8cE21504f6d5fca0Cc72D
NEXT_PUBLIC_INSURANCE_TOKEN_ADDRESS=0x3bEDE5f043E8D0597F9F0b60eCfc52B134d8E934
NEXT_PUBLIC_SETTLEMENT_ENGINE_ADDRESS=0x1d3975e61A50e9dd0e4995F837F051A94F36fdd8
NEXT_PUBLIC_FEE_TREASURY_ADDRESS=0xb96D484cB71A5d5C3C3AB1Ac18dF587cC6AC6914
NEXT_PUBLIC_POOL_FACTORY_ADDRESS=0x3810066EfEAc98F18cF6A1E62FF3f089CC30Fb01
NEXT_PUBLIC_ORACLE_ROUTER_ADDRESS=0x5F54ce2BFE2A63472a9462FFe2Cf89Da59b29D72
NEXT_PUBLIC_YIELD_ROUTER_ADDRESS=0xC5dB540bca54FAce539AF2d2a7c5ac717795fb11

# Token Addresses
NEXT_PUBLIC_USDT_ADDRESS=0x3372BE45687b2d85F010f6245d3b6284E13327ea
NEXT_PUBLIC_DIN_TOKEN_ADDRESS=0x2e401e83087E96341E292f6B987cB7440860CE53

# Development Flags
NEXT_PUBLIC_ENABLE_TESTNETS=true
NEXT_PUBLIC_SHOW_DEBUG_INFO=true
```

## Development

### Available Commands

```bash
# Development
pnpm dev              # Start all apps in dev mode
pnpm dev:next         # Start only Next.js app

# Code Quality
pnpm lint            # Run ESLint
pnpm lint:fix        # Fix linting issues
pnpm typecheck       # Run TypeScript type checking
pnpm format          # Check code formatting
pnpm format:fix      # Fix formatting issues

# Build
pnpm build           # Build all packages
pnpm clean           # Clean all node_modules
pnpm clean:workspaces # Clean build artifacts

# UI Components
pnpm ui-add          # Add new shadcn/ui component
```

### Project Structure

```
dinyk/
├── apps/
│   ├── nextjs/          # Main web application
│   │   ├── src/
│   │   │   ├── app/     # Next.js app router pages
│   │   │   │   ├── insurance/    # Insurance marketplace
│   │   │   │   ├── portfolio/    # User portfolio dashboard
│   │   │   │   ├── tranche/      # Tranche listing
│   │   │   │   └── tranches/     # Tranche details
│   │   │   ├── components/       # React components
│   │   │   │   ├── insurance/    # Insurance-specific components
│   │   │   │   ├── liquidity/    # Liquidity provision components
│   │   │   │   ├── tranche/      # Tranche display components
│   │   │   │   └── web3/         # Web3 integration components
│   │   │   ├── context/          # Web3Provider and other contexts
│   │   │   └── lib/              # Utilities and constants
│   │   └── public/               # Static assets
│   └── expo/            # React Native app (deprecated)
├── packages/
│   ├── contracts/       # Smart contract interfaces and hooks
│   │   ├── src/
│   │   │   ├── config/  # Contract addresses and network config
│   │   │   ├── hooks/   # React hooks for contract interaction
│   │   │   ├── services/# Contract service layer
│   │   │   ├── types/   # TypeScript type definitions
│   │   │   └── utils/   # Helper functions and formatters
│   │   └── abis/        # Contract ABIs
│   ├── ui/              # Shared UI components
│   ├── tailwind-config/ # Shared Tailwind configuration
│   └── tsconfig/        # Shared TypeScript configs
└── docs/                # Documentation and specifications
    ├── whitepaper.md    # Protocol specification
    ├── ui-architecture.md # UI/UX flows
    └── din-architecture.md # Technical architecture
```

## Insurance Products

### Available Tranches

| Asset | Trigger | Premium | Coverage Period |
|-------|---------|---------|-----------------|
| BTC   | -5%     | 2%      | 7 days         |
| BTC   | -10%    | 5%      | 7 days         |
| BTC   | -15%    | 10%     | 7 days         |
| ETH   | -5%     | 2.5%    | 14 days        |
| ETH   | -10%    | 6%      | 14 days        |
| ETH   | -15%    | 12%     | 14 days        |
| KAIA  | -10%    | 4%      | 30 days        |
| KAIA  | -20%    | 12%     | 30 days        |

### Round Lifecycle

1. **Funding Phase** (3 days): Users deposit liquidity or purchase insurance
2. **Matching Phase** (1 hour): System matches buyers with available liquidity
3. **Active Phase** (7-30 days): Insurance coverage is active
4. **Settlement Phase** (1 day): Claims are processed and settled

## Smart Contracts

### Core Contracts (Deployed on Testnet)

- **DinRegistry** (`0xCD2B28186b257869B3C2946ababB56683F4304C3`): Central registry for all contracts
- **ProductCatalog** (`0x145E2f2e2B9C6Bdd22D8cE21504f6d5fca0Cc72D`): Product and round management
- **TranchePoolCore**: Per-tranche pool for economics (deployed via factory)
- **InsuranceToken** (`0x3bEDE5f043E8D0597F9F0b60eCfc52B134d8E934`): NFT insurance positions
- **SettlementEngine** (`0x1d3975e61A50e9dd0e4995F837F051A94F36fdd8`): Claim processing
- **YieldRouter** (`0xC5dB540bca54FAce539AF2d2a7c5ac717795fb11`): Yield generation
- **OracleRouter** (`0x5F54ce2BFE2A63472a9462FFe2Cf89Da59b29D72`): Price aggregation

### Contract Repository

The smart contracts are maintained in a separate repository:
- Location: `../din-contract/`
- Deployment: Hardhat with Ignition modules
- Testing: Comprehensive test suite with coverage

### Contract Operations

```bash
# From din-contract directory

# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to testnet
npm run deploy:basic
npm run deploy:registry-dependent
npm run configure:final

# Monitor operations
npm run monitor:insurances
npm run monitor:pools
npm run monitor:yield
```

## Wallet Configuration

### Adding Kaia Network to MetaMask

#### Testnet (Development)
1. Open MetaMask
2. Click "Add Network"
3. Enter the following details:
   - Network Name: Kaia Testnet
   - RPC URL: https://public-en-kairos.node.kaia.io
   - Chain ID: 1001
   - Currency Symbol: KAIA
   - Block Explorer: https://kairos.kaiascope.com

#### Mainnet (Production)
1. Open MetaMask
2. Click "Add Network"
3. Enter the following details:
   - Network Name: Kaia Mainnet
   - RPC URL: https://public-en-cypress.klaytn.net
   - Chain ID: 8217
   - Currency Symbol: KAIA
   - Block Explorer: https://kaiascope.com

### Supported Wallets

- MetaMask (recommended)
- Kaikas (Official Kaia wallet)
- WalletConnect (supported)

## Security

### Audit Status
- Smart contracts: Pending audit
- Frontend: Security best practices implemented
- No private keys or sensitive data stored client-side

### Security Features
- Multi-signature controls for critical functions
- Emergency pause mechanism
- Oracle redundancy with fallback options
- 100% collateralization requirement

## Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

### Phase 1: Foundation ✅
- [x] Web3 integration with Kaia
- [x] Wallet connection (MetaMask/Kaia Wallet)
- [x] Insurance catalog UI
- [x] Portfolio management dashboard

### Phase 2: Smart Contracts (In Progress)
- [ ] Deploy core insurance contracts
- [ ] Integrate oracle price feeds
- [ ] Implement automatic settlements
- [ ] Security audit

### Phase 3: Production Launch
- [ ] Mainnet deployment
- [ ] Re-staking integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app development

## Resources

- [Technical Architecture](./docs/din-architecture.md)
- [Whitepaper](./docs/whitepaper.md)
- [UI Wireframes](./docs/ui-flow-wireframe.md)
- [Kaia Documentation](https://docs.kaia.io)
- [Discord Community](https://discord.gg/dinyk)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Open an issue on GitHub
- Join our Discord server
- Email: support@dinyk.io

---

Built with ❤️ for the Kaia ecosystem