# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a T3 Turbo monorepo that implements a full-stack TypeScript application with the following structure:

### Apps
- **Next.js (`apps/nextjs`)**: Web application with Next.js 15, React 19, tRPC client, and Tailwind CSS
- **Expo (`apps/expo`)**: React Native mobile app with Expo SDK 53, NativeWind for styling, and tRPC client

### Core Packages
- **`@acme/api`**: tRPC v11 router definitions and API endpoints
- **`@acme/auth`**: Authentication layer using better-auth with Discord OAuth support
- **`@acme/db`**: Database layer using Drizzle ORM with Supabase/Vercel Postgres
- **`@acme/ui`**: Shared UI components using shadcn/ui
- **`@acme/validators`**: Shared validation schemas using Zod

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

1. **Edge-First Database**: The database package uses Vercel Postgres driver optimized for edge runtime. All API routes export `runtime = "edge"` for optimal performance.

2. **Authentication Proxy**: Better-auth includes an OAuth proxy plugin for handling authentication in preview deployments and local development, especially for Expo apps.

3. **Type-Safe API**: tRPC provides end-to-end type safety between backend and frontend without code generation.

4. **Shared Validation**: Validators package ensures consistent data validation across client and server using Zod schemas.

5. **Monorepo Structure**: Turborepo manages dependencies and build orchestration, with workspace protocol (`workspace:*`) for internal packages.

## Environment Setup

1. Copy `.env.example` to `.env`
2. Configure `POSTGRES_URL` with your Supabase connection string
3. Set `AUTH_SECRET` (generate with `openssl rand -base64 32`)
4. Configure OAuth providers (`AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET`)

## Testing Approach

Check individual package.json files in apps and packages directories for specific test commands. The monorepo uses Turborepo to orchestrate test runs across packages.

## Common Patterns

- All packages use ESM modules (`"type": "module"`)
- TypeScript configurations extend from `@acme/tsconfig`
- Prettier configurations extend from `@acme/prettier-config`
- ESLint configurations use the new flat config format
- Tailwind configurations extend from `@acme/tailwind-config`