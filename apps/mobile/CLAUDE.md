# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native Expo application called "Homestay" built with TypeScript. The app uses Expo Router for file-based routing and React Native Unistyles for theming.

## Common Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start
# or
npx expo start --dev-client

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web

# Lint code
npm run lint

# Reset project (moves starter code to app-example)
npm run reset-project

# Generate API client code from OpenAPI specs
npm run generate-api
# or
orval
```

## Architecture

### Routing Structure

- **File-based routing** via Expo Router
- Main layout at `app/_layout.tsx` - Sets up theme provider and navigation stack
- Tab navigation at `app/(tabs)/_layout.tsx` - Defines bottom tab structure
- Tab screens: `index.tsx` (Home), `explore.tsx` (Explore)

### Styling System

- **React Native Unistyles** configured in `unistyles.ts`
- Theme definitions in `theme/` directory with modular structure:
  - `colors.ts` - Light/dark color palettes
  - `typography.ts` - Font families, sizes, weights
  - `spacing.ts` - Spacing scales and utilities
  - `borders.ts` - Border radii and utilities
  - `shadows.ts` - Shadow presets for light/dark modes
  - `index.ts` - Composes and exports complete theme objects

### State Management

- **TanStack React Query** for server state management
- **Axios** for HTTP requests

### API Integration

- **Orval** generates TypeScript API clients from OpenAPI specifications
- Separate configurations for public and protected API endpoints in `orval.config.ts`
- Generated code is organized into:
  - `api/queries/public/` - Public API queries (no auth required)
  - `api/queries/protected/` - Protected API queries (auth required)
  - `api/models/public/` and `api/models/protected/` - TypeScript models
- Custom Axios instance with interceptors in `api/axios.ts`

### Authentication Flow

- Authentication context provided by `hooks/use-auth`
- Route protection logic in `app/_layout.tsx`
- Automatic redirects between auth screens `(auth)` and main app `(tabs)`
- Initial route set to `(auth)` group

### Key Dependencies

- `expo-router` - File-based navigation
- `react-native-unistyles` - Theming and styling (v3.0.13)
- `@tanstack/react-query` - Data fetching and caching
- `react-native-reanimated` - Animation library
- `orval` - API client code generation (dev dependency)

### Configuration

- TypeScript strict mode enabled
- Path alias `@/*` configured for absolute imports from project root
- React Compiler experimental feature enabled
- Typed routes enabled for type-safe navigation
- Plus Jakarta Sans font family loaded with multiple weights
- Environment variables configured via `.env` files (see `.env.example`)

### Component Structure

- UI components in `components/ui/` with index barrel export
- Haptic feedback integration for tab navigation
- Icon system using Expo Symbols with platform-specific implementations
