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
- **Multi-wallet Support**: MetaMask and Kaikas compatibility
- **Session Persistence**: Maintains wallet state across refreshes
- **Responsive Design**: Mobile-friendly dark theme interface
- **Real-time Updates**: Live price feeds and position tracking

## Tech Stack

- **Blockchain**: Kaia Mainnet (Chain ID: 8217)
- **Frontend**: Next.js 15, React 19, TypeScript
- **Web3**: @kaiachain/ethers-ext v1.1.1, ethers.js v6
- **Styling**: Tailwind CSS, shadcn/ui components
- **Build**: Turborepo monorepo orchestration

## Quick Start

### Prerequisites
- Node.js 20+ and pnpm 9.6.0+
- MetaMask or Kaikas wallet
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
NEXT_PUBLIC_CHAIN_ID=8217
NEXT_PUBLIC_RPC_URL=https://public-en.node.kaia.io

# Smart Contract Addresses (Deploy your own or use mocks)
NEXT_PUBLIC_INSURANCE_CONTRACT=0x...
NEXT_PUBLIC_TREASURY_CONTRACT=0x...
NEXT_PUBLIC_TRANCHE_POOL_CONTRACT=0x...

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
│   └── nextjs/          # Main web application
│       ├── src/
│       │   ├── app/     # Next.js app router pages
│       │   ├── components/ # React components
│       │   ├── context/ # Web3Provider and other contexts
│       │   └── lib/     # Utilities and constants
│       └── public/      # Static assets
├── packages/
│   ├── ui/             # Shared UI components
│   ├── tailwind-config/ # Shared Tailwind configuration
│   └── tsconfig/       # Shared TypeScript configs
└── docs/               # Documentation and specifications
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

### Core Contracts (To be deployed)

- **Insurance.sol**: Main insurance logic and product management
- **TranchePool.sol**: Liquidity pool for each risk tranche
- **Treasury.sol**: Protocol fee collection and distribution
- **OracleRouter.sol**: Price feed aggregation from multiple oracles

### Deployment

```bash
# Deploy contracts (coming soon)
pnpm contracts:deploy

# Verify contracts
pnpm contracts:verify
```

## Wallet Configuration

### Adding Kaia Network to MetaMask

1. Open MetaMask
2. Click "Add Network"
3. Enter the following details:
   - Network Name: Kaia
   - RPC URL: https://public-en.node.kaia.io
   - Chain ID: 8217
   - Currency Symbol: KAIA
   - Block Explorer: https://kaiascan.io

### Supported Wallets

- MetaMask (recommended)
- Kaikas (Kaia native wallet)
- WalletConnect (coming soon)

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
- [x] Wallet connection (MetaMask/Kaikas)
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