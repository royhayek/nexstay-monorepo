# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (runs on port 8081 with Turbopack)
- **Production build**: `npm run build`
- **Production start**: `npm run start` (port 8081)
- **Linting**: `npm run lint` (ESLint check), `npm run lint:fix` (ESLint fix)
- **Formatting**: `npm run fm:check` (Prettier check), `npm run fm:fix` (Prettier format)
- **Fix all**: `npm run fix:all` (runs lint:fix and fm:fix)
- **TypeScript check**: `npm run tsc:watch` (watch mode), `npm run tsc:dev` (dev + watch)
- **API generation**: `npm run generate-api` (generates API client from OpenAPI spec at localhost:3000/docs-json)
- **Clean**: `npm run clean` (removes node_modules, .next, build artifacts)
- **Fresh install & dev**: `npm run re:dev` (clean, install, dev)
- **Fresh build**: `npm run re:build` (clean, install, build)

## Architecture Overview

This is a Next.js 15 dashboard application with App Router architecture for an Airbnb-style platform.

### Core Structure

- **Framework**: Next.js 15 with App Router pattern
- **Styling**: Material-UI v7 with custom theming and CSS-in-JS
- **State Management**: React Query (@tanstack/react-query) for server state
- **Authentication**: JWT-based auth with multiple provider support (Firebase, Supabase, Auth0, AWS Amplify)
- **API Client**: Auto-generated using Orval from OpenAPI specs (localhost:3000/docs-json)
- **Form Handling**: React Hook Form with Zod validation
- **Internationalization**: i18next with multiple language support

### Key Directories

- `src/app/` - Next.js App Router pages and layouts
- `src/api/` - Auto-generated API client (models, queries) via Orval
- `src/auth/` - Authentication system with JWT provider
- `src/components/` - Reusable UI components (40+ component libraries)
- `src/layouts/` - Layout components (dashboard, auth, simple)
- `src/sections/` - Page-specific sections and views
- `src/theme/` - Material-UI theme configuration and overrides
- `src/locales/` - i18n translations and locale management

### Authentication System

- JWT-based authentication with support for multiple providers
- Configuration in `src/global-config.ts` allows switching between:
  - JWT (default)
  - Firebase
  - Supabase
  - Auth0
  - AWS Amplify
- Auth context provides user state and authentication methods
- Role-based access control implemented throughout navigation

### API Integration

- Uses Orval to generate React Query hooks from OpenAPI specification (localhost:3000/docs-json)
- API models and queries auto-generated in `src/api/` with tag-split mode
- Custom Axios instance configured in `src/lib/axios.ts` (used as mutator for Orval)
- Mock data provided for development in `src/_mock/`
- API generation includes both TypeScript models (`src/api/models/`) and React Query hooks (`src/api/queries/`)

### Component System

The application includes extensive reusable components:

- Advanced data tables with MUI X DataGrid
- Rich text editor with TipTap
- File upload with drag & drop
- Charts with ApexCharts integration
- Maps with Mapbox GL integration
- Carousel with Embla Carousel
- Form components with React Hook Form integration

### Layout System

- Dashboard layout with configurable navigation (vertical, horizontal, mini)
- Responsive design with Material-UI breakpoints
- Theme customization with dark/light mode support
- Settings drawer for layout and theme preferences

## Development Notes

- TypeScript strict mode enabled
- ESLint with comprehensive custom configuration:
  - React and React Hooks rules
  - Import sorting and organization with Perfectionist plugin
  - Unused imports detection
  - TypeScript-specific rules
  - Custom import groups for project structure
- Prettier for code formatting
- Node.js >=20 required
- Uses npm as package manager

## Environment Variables

Configuration expects various environment variables for:

- API server URL
- Authentication providers (Firebase, Supabase, Auth0, Amplify)
- Mapbox API key
- Build settings (static export)

Check `src/global-config.ts` for all expected environment variables.

## Global Components Library

### Loading and Error States
- **LoadingState Component**: `src/components/loading-state/` - Use for all loading states
- **ErrorState Component**: `src/components/error-state/` - Use for all error handling
- **Documentation**: See `GLOBAL_COMPONENTS.md` for complete usage guide, props, variants, and examples
- **Usage**: Always prefer these global components over custom loading/error implementations

**Quick Reference:**
```tsx
import { LoadingState } from 'src/components/loading-state';
import { ErrorState } from 'src/components/error-state';

// Loading: Use 'card' variant for pages, 'circular' for buttons, 'skeleton' for content
<LoadingState title="Loading..." variant="card" size="large" fullHeight />

// Errors: Use 'card' for pages, 'minimal' for inline, always include onRetry when applicable
<ErrorState title="Error" onRetry={() => refetch()} variant="card" />
```

### Tables and Forms
- **DynamicTable Component**: Use for all table implementations instead of creating custom tables
- **DynamicForm Component**: Use for all form implementations instead of creating custom forms
- **Location**: Check existing implementations in `src/sections/` for usage patterns
- **Usage**: Always prefer these components over Material-UI Table or custom form implementations

**Quick Reference:**
```tsx
import { DynamicTable } from 'path/to/dynamic-table';
import { DynamicForm } from 'path/to/dynamic-form';

// Tables: Use for data lists, admin tables, etc.
<DynamicTable
  columns={columns}
  data={data}
  onRowClick={handleRowClick}
  // ... other props
/>

// Forms: Use for all form implementations
<DynamicForm
  schema={formSchema}
  onSubmit={handleSubmit}
  // ... other props
/>
```

## Important Development Guidelines

- ALWAYS prefer editing existing files over creating new ones
- NEVER create files unless absolutely necessary for achieving the goal
- NEVER proactively create documentation files (\*.md) or README files unless explicitly requested
- Follow existing code patterns and conventions when making changes
- Use the existing component libraries and utilities available in the codebase
- **ALWAYS use LoadingState and ErrorState components for loading/error handling instead of creating custom implementations**
- **ALWAYS use DynamicTable component for table implementations instead of Material-UI Table or custom table components**
- **ALWAYS use DynamicForm component for form implementations instead of custom form components**
