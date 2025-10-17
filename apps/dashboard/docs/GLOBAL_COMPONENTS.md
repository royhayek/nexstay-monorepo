# Global Components Documentation

This document outlines the global reusable components available in the codebase for consistent UI patterns.

## LoadingState Component

**Location**: `src/components/loading-state/`

A flexible loading state component that provides consistent loading indicators across the application.

### Usage

```tsx
import { LoadingState } from 'src/components/loading-state';

// Basic usage
<LoadingState />

// Custom loading with card variant
<LoadingState
  title="Loading booking details..."
  subtitle="Please wait while we fetch the booking information"
  variant="card"
  size="large"
  fullHeight
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `"Loading..."` | Primary loading message |
| `subtitle` | `string` | `undefined` | Optional secondary message |
| `variant` | `'linear' \| 'circular' \| 'skeleton' \| 'card'` | `'linear'` | Loading indicator style |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Component size |
| `fullHeight` | `boolean` | `false` | Whether to use full height (400px minimum) |
| `sx` | `object` | `{}` | Custom MUI sx styling |

### Variants

#### Linear (`variant="linear"`)
- Horizontal progress bar
- Good for page-level loading
- Minimal visual footprint

#### Circular (`variant="circular"`)
- Spinning circular progress
- Good for button/action loading
- Compact design

#### Skeleton (`variant="skeleton"`)
- Content placeholder loading
- Good for lists/cards loading
- Shows expected content structure

#### Card (`variant="card"`)
- Full card with animated icon
- Good for major content loading
- Most visually prominent

### Examples

```tsx
// Page loading
<LoadingState
  title="Loading dashboard..."
  variant="linear"
  fullHeight
/>

// Button loading
<LoadingState
  title="Saving..."
  variant="circular"
  size="small"
/>

// Content loading
<LoadingState
  title="Loading bookings..."
  subtitle="Fetching your recent bookings"
  variant="skeleton"
/>

// Major feature loading
<LoadingState
  title="Loading booking details..."
  subtitle="Please wait while we fetch the booking information"
  variant="card"
  size="large"
  fullHeight
/>
```

## ErrorState Component

**Location**: `src/components/error-state/`

A comprehensive error state component that provides consistent error handling UI with retry functionality.

### Usage

```tsx
import { ErrorState } from 'src/components/error-state';

// Basic usage
<ErrorState onRetry={() => refetch()} />

// Custom error with card variant
<ErrorState
  title="Error loading booking details"
  subtitle="We couldn't load the booking information. Please try again."
  variant="card"
  size="large"
  fullHeight
  onRetry={() => refetch()}
  icon="solar:file-corrupted-bold-duotone"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `"Something went wrong"` | Primary error message |
| `subtitle` | `string` | `"Please try again later"` | Secondary error message |
| `variant` | `'default' \| 'card' \| 'minimal'` | `'default'` | Error display style |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Component size |
| `fullHeight` | `boolean` | `false` | Whether to use full height (400px minimum) |
| `showRetry` | `boolean` | `true` | Whether to show retry button |
| `retryText` | `string` | `"Try Again"` | Retry button text |
| `onRetry` | `() => void` | `undefined` | Retry callback function |
| `icon` | `string` | `"solar:danger-triangle-bold-duotone"` | Iconify icon name |
| `sx` | `object` | `{}` | Custom MUI sx styling |

### Variants

#### Default (`variant="default"`)
- Full error display with icon background
- Good for page-level errors
- Complete error information

#### Card (`variant="card"`)
- Elevated card styling
- Good for component-level errors
- Most visually prominent

#### Minimal (`variant="minimal"`)
- Compact error display
- Good for inline/small errors
- Space-efficient

### Common Error Scenarios

```tsx
// API/Data loading errors
<ErrorState
  title="Failed to load data"
  subtitle="Check your connection and try again"
  onRetry={() => refetch()}
  icon="solar:wifi-router-bold-duotone"
/>

// File/Resource errors
<ErrorState
  title="File not found"
  subtitle="The requested file could not be found"
  icon="solar:file-corrupted-bold-duotone"
  showRetry={false}
/>

// Permission errors
<ErrorState
  title="Access denied"
  subtitle="You don't have permission to view this content"
  icon="solar:shield-cross-bold-duotone"
  showRetry={false}
/>

// Network errors
<ErrorState
  title="Connection error"
  subtitle="Unable to connect to server"
  onRetry={() => refetch()}
  icon="solar:server-bold-duotone"
/>

// Validation errors
<ErrorState
  title="Invalid data"
  subtitle="Please check your input and try again"
  variant="minimal"
  icon="solar:danger-bold-duotone"
/>
```

## Best Practices

### When to use LoadingState
1. **Initial data fetching**: Page loads, API calls
2. **User actions**: Form submissions, file uploads
3. **Navigation**: Route changes, component mounting
4. **Background processes**: Auto-saves, sync operations

### When to use ErrorState
1. **API failures**: Network errors, server errors
2. **Data validation**: Form validation, input errors
3. **Permission issues**: Unauthorized access
4. **Resource not found**: 404 errors, missing files
5. **User recoverable errors**: Retry-able operations

### Variant Selection Guide

| Scenario | LoadingState Variant | ErrorState Variant |
|----------|---------------------|-------------------|
| Page-level loading/errors | `card` or `linear` | `card` or `default` |
| Component loading/errors | `circular` or `skeleton` | `default` |
| Inline/small errors | `linear` | `minimal` |
| Form loading/errors | `circular` | `minimal` |
| Critical errors | `card` | `card` |

### Size Guidelines

- **Small**: Buttons, inline elements, compact spaces
- **Medium**: Standard components, cards, modals
- **Large**: Page-level states, major features, full-screen

## Implementation Examples

### React Query Integration
```tsx
const { data, isLoading, error, refetch } = useQuery(...);

if (isLoading) {
  return (
    <LoadingState
      title="Loading bookings..."
      subtitle="Fetching your latest bookings"
      variant="card"
      size="large"
      fullHeight
    />
  );
}

if (error) {
  return (
    <ErrorState
      title="Failed to load bookings"
      subtitle="We couldn't fetch your bookings. Please try again."
      variant="card"
      size="large"
      fullHeight
      onRetry={() => refetch()}
    />
  );
}

return <BookingsList data={data} />;
```

### Form Validation
```tsx
{formError && (
  <ErrorState
    title="Validation Error"
    subtitle={formError.message}
    variant="minimal"
    size="small"
    showRetry={false}
  />
)}
```

### Button Loading
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <LoadingState
      title="Saving..."
      variant="circular"
      size="small"
    />
  ) : (
    'Save Changes'
  )}
</Button>
```

## Customization

Both components support full MUI theming and custom styling through the `sx` prop:

```tsx
<LoadingState
  sx={{
    bgcolor: 'background.neutral',
    border: 1,
    borderColor: 'divider',
    borderRadius: 2,
  }}
/>

<ErrorState
  sx={{
    bgcolor: 'error.lighter',
    '& .MuiButton-root': {
      bgcolor: 'error.main',
    },
  }}
/>
```

## Future Enhancements

Potential improvements for these components:
1. **Progress indication**: Percentage-based loading states
2. **Timeout handling**: Auto-retry after timeout
3. **Accessibility**: Enhanced screen reader support
4. **Animation controls**: Custom animation timing
5. **Themed variants**: Success, warning, info states
6. **Internationalization**: Multi-language support

---

**Note**: Always import these components from their index files for clean imports:
```tsx
import { LoadingState } from 'src/components/loading-state';
import { ErrorState } from 'src/components/error-state';
```