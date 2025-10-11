# Dynamic Table Tests

This directory contains comprehensive test files for the dynamic table components.

## Test Files

### `dynamic-table.test.tsx`
- Tests the main `DynamicTable` component
- Covers pagination, sorting, filtering, tabs, bulk actions, and row actions
- Tests loading states, empty states, and error handling
- Verifies correct rendering of data and table structure

### `dynamic-table-toolbar.test.tsx`
- Tests the `DynamicTableToolbar` component
- Covers search functionality, filter fields, and additional toolbar content
- Tests debounced search behavior and filter state management
- Verifies correct rendering of search field and filter components

### `dynamic-table-filters-result.test.tsx`
- Tests the `DynamicTableFiltersResult` component
- Covers filter chip display, individual filter removal, and clear all functionality
- Tests different data types (strings, numbers, booleans, arrays)
- Tests custom filter labels and conditional rendering

## Running Tests

To run these tests, you'll need to install the required testing dependencies:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest @types/jest
```

Then run the tests:

```bash
# Run all dynamic table tests
npm test -- dynamic-table

# Run specific test file
npm test -- dynamic-table.test.tsx

# Run tests in watch mode
npm test -- --watch dynamic-table
```

## Test Coverage

The tests cover:

### Core Functionality
- ✅ Table rendering with data
- ✅ Loading and empty states
- ✅ Pagination controls and navigation
- ✅ Sorting functionality
- ✅ Row selection and bulk actions
- ✅ Individual row actions

### Filtering
- ✅ Search field with debounce
- ✅ Dynamic filter fields
- ✅ Filter result display
- ✅ Individual filter removal
- ✅ Clear all filters
- ✅ Custom filter labels

### Advanced Features
- ✅ Tabs with counts
- ✅ Conditional rendering
- ✅ Custom styling
- ✅ Error boundaries
- ✅ Complex data types

### Edge Cases
- ✅ Empty data sets
- ✅ Missing or invalid props
- ✅ Type safety
- ✅ Performance considerations

## Mocking Strategy

The tests use comprehensive mocking for:
- MUI components (simplified but functional)
- Icon components
- External dependencies
- Complex component interactions

This ensures tests run fast and focus on component logic rather than external dependencies.

## Test Data

Tests use realistic mock data that mirrors actual usage patterns:
- User data with names, emails, status
- Enum display data with multilingual labels
- Various filter types and configurations
- Complex nested data structures

## Best Practices

1. **Isolation**: Each test is independent and doesn't affect others
2. **Realistic Data**: Mock data closely resembles production data
3. **User-Centric**: Tests focus on user interactions and behaviors
4. **Performance**: Fast test execution with minimal external dependencies
5. **Coverage**: Comprehensive coverage of both happy paths and edge cases