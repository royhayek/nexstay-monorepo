# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Nexstay**, a full-stack Airbnb clone monorepo managed by **Turborepo**. It consists of three main applications and two shared packages that work together to provide a complete property rental platform.

## Monorepo Structure

```
nexstay-monorepo/
├── apps/
│   ├── mobile/          # React Native Expo mobile app (@nexstay/mobile)
│   ├── dashboard/       # Next.js admin/host dashboard (@nexstay/dashboard)
│   └── backend/         # NestJS API server (@nexstay/backend)
├── packages/
│   ├── shared-types/    # Shared TypeScript types (@nexstay/shared-types)
│   └── ui-components/   # Shared UI components (placeholder)
├── turbo.json           # Turborepo pipeline configuration
└── package.json         # Root workspace configuration
```

## Development Commands

### Root Level Commands (Turborepo)

```bash
# Install all dependencies across the monorepo
npm install

# Start all apps in development mode
npm run dev

# Start specific app only
npm run mobile      # Start mobile app only
npm run dashboard   # Start dashboard only
npm run backend     # Start backend only

# Build all apps
npm run build

# Lint all apps
npm run lint

# Test all apps
npm run test
```

### Application-Specific Commands

Each application has its own `package.json` with specific commands. Navigate to the app directory or use Turborepo filters:

```bash
# Using Turborepo filter
turbo run dev --filter=@nexstay/mobile
turbo run build --filter=@nexstay/backend
turbo run lint --filter=@nexstay/dashboard

# Or navigate to specific app
cd apps/mobile && npm start
cd apps/dashboard && npm run dev
cd apps/backend && npm run start:dev
```

## Application Details

### Mobile App (`apps/mobile/`)
- **Framework**: React Native with Expo
- **Router**: Expo Router (file-based routing)
- **Styling**: React Native Unistyles v3
- **State**: TanStack React Query
- **API**: Orval-generated client from OpenAPI
- **Port**: Expo development server (default)
- **CLAUDE.md**: See `apps/mobile/CLAUDE.md` for detailed mobile-specific guidance

### Dashboard (`apps/dashboard/`)
- **Framework**: Next.js 15 with App Router
- **UI**: Material-UI v7
- **State**: TanStack React Query
- **Auth**: JWT with multiple provider support
- **API**: Orval-generated client from OpenAPI
- **Port**: 8083 (development and production)
- **CLAUDE.md**: See `apps/dashboard/CLAUDE.md` for detailed dashboard-specific guidance

### Backend (`apps/backend/`)
- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **Auth**: JWT with OAuth providers (Google, Facebook, Apple)
- **API Docs**: Swagger/OpenAPI at `/docs`
- **Storage**: AWS S3 with image processing
- **Real-time**: WebSocket support via Socket.IO
- **Port**: 3001 (implied from dashboard API generation config)
- **CLAUDE.md**: See `apps/backend/CLAUDE.md` for detailed backend-specific guidance

### Shared Packages

#### `packages/shared-types/`
- Shared TypeScript types and interfaces across frontend/backend
- Built with TypeScript compiler
- Imported as `@nexstay/shared-types` in other packages

#### `packages/ui-components/`
- Shared UI components (placeholder/minimal setup currently)
- Intended for cross-platform reusable components

## Turborepo Pipeline Configuration

The monorepo uses Turborepo for efficient task orchestration:

- **build**: Builds with dependency topological ordering (`^build`)
  - Outputs: `.next/**`, `dist/**`, `build/**`
- **dev**: Development mode (no cache, persistent)
- **lint**: Linting depends on build completion
- **test**: Testing depends on build completion
  - Outputs: `coverage/**`

## Key Integration Points

### API Code Generation (Orval)
- Both mobile and dashboard generate API clients from the backend's OpenAPI spec
- Backend exposes OpenAPI at `localhost:3001/docs-json`
- Generate clients:
  ```bash
  cd apps/mobile && npm run generate-api
  cd apps/dashboard && npm run generate-api
  ```

### Shared Types Package
- Central TypeScript types/interfaces used across all apps
- Changes to shared types require rebuilding: `npm run build --filter=@nexstay/shared-types`
- Apps automatically reference the compiled types from `packages/shared-types/dist/`

### Metro Configuration
- Root-level `metro.config.js` configures Metro for monorepo workspace support
- Enables React Native to resolve packages from workspace root

## Development Workflow

### Starting New Development Session

1. Install dependencies from root:
   ```bash
   npm install
   ```

2. Build shared packages first (if not already built):
   ```bash
   turbo run build --filter=@nexstay/shared-types
   ```

3. Start all apps or specific ones:
   ```bash
   npm run dev                    # All apps
   npm run mobile                 # Mobile only
   npm run dashboard              # Dashboard only
   npm run backend               # Backend only
   ```

### Making Changes to Shared Packages

1. Make changes to `packages/shared-types/src/`
2. Rebuild the package:
   ```bash
   turbo run build --filter=@nexstay/shared-types
   ```
3. Dependent apps will automatically pick up changes on next reload

### Working with API Changes

1. Update backend API code and ensure OpenAPI spec is current
2. Regenerate frontend API clients:
   ```bash
   cd apps/mobile && npm run generate-api
   cd apps/dashboard && npm run generate-api
   ```

## Application-Specific Development

For detailed application-specific guidance, **ALWAYS refer to the CLAUDE.md files in each app directory**:

- **Mobile Development**: `apps/mobile/CLAUDE.md`
- **Dashboard Development**: `apps/dashboard/CLAUDE.md`
- **Backend Development**: `apps/backend/CLAUDE.md`

These files contain comprehensive architecture details, patterns, conventions, and mandatory guidelines specific to each application.

## Important Notes

- **Package Manager**: npm@10.0.0 (specified in root `package.json`)
- **Node Version**: >=20 required (dashboard requirement)
- **Workspace Pattern**: Uses npm workspaces (`apps/*`, `packages/*`)
- **Environment Files**: Each app has its own `.env` files (not committed)
- **Git**: Clean working directory, main branch is `main`

## Cross-App Development Guidelines

1. **Type Safety**: Use shared types from `@nexstay/shared-types` wherever possible
2. **API Consistency**: Backend OpenAPI spec is source of truth for API contracts
3. **Code Quality**: Each app has its own linting/formatting rules - follow them
4. **Documentation**: Keep app-specific CLAUDE.md files updated with architectural changes
5. **Build Order**: Turborepo handles dependency ordering, but be aware shared packages must build first
