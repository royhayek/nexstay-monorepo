# Dynamic Form Tests

This directory contains comprehensive test files for the dynamic form components.

## Test Files

### `dynamic-form.test.tsx`
- Tests the main `DynamicForm` component
- Covers form rendering, validation, submission, and error handling
- Tests sections, actions, conditional rendering, and loading states
- Verifies correct form structure and layout

### `dynamic-form-field.test.tsx`
- Tests the `DynamicFormField` component
- Covers all field types: text, select, checkbox, switch, date, autocomplete
- Tests field groups, conditional rendering, validation, and grid layout
- Verifies correct field rendering and user interactions

### `utils.test.ts`
- Tests utility functions for dynamic forms
- Covers condition evaluation, field visibility, value transformations
- Tests dependency validation and validation rule building
- Verifies helper functions work correctly with various data types

## Field Types Tested

### Basic Fields
- ✅ Text input
- ✅ Email input
- ✅ Password input
- ✅ Number input
- ✅ Textarea

### Selection Fields
- ✅ Select dropdown
- ✅ Multi-select
- ✅ Autocomplete
- ✅ Checkbox
- ✅ Switch
- ✅ Radio buttons

### Date/Time Fields
- ✅ Date picker
- ✅ Time picker
- ✅ DateTime picker
- ✅ Date range picker

### Complex Fields
- ✅ Field groups
- ✅ Arrays/repeated fields
- ✅ File uploads
- ✅ Rich text editor

## Running Tests

To run these tests, you'll need to install the required testing dependencies:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest @types/jest react-hook-form
```

Then run the tests:

```bash
# Run all dynamic form tests
npm test -- dynamic-form

# Run specific test file
npm test -- dynamic-form.test.tsx

# Run tests in watch mode
npm test -- --watch dynamic-form
```

## Test Coverage

The tests cover:

### Core Functionality
- ✅ Form rendering with sections
- ✅ Field rendering and validation
- ✅ Form submission and data handling
- ✅ Loading and error states
- ✅ Custom styling and layout

### Advanced Features
- ✅ Conditional field rendering
- ✅ Field dependencies and transformations
- ✅ Custom validation rules
- ✅ Dynamic field groups
- ✅ Grid-based layouts

### Utility Functions
- ✅ Condition evaluation (equals, contains, in, exists, etc.)
- ✅ Field visibility determination
- ✅ Value transformations and calculations
- ✅ Dependency validation
- ✅ Validation rule building

### Edge Cases
- ✅ Missing or invalid field configurations
- ✅ Null/undefined values
- ✅ Complex nested data structures
- ✅ Performance with large forms
- ✅ Error boundary handling

## Mocking Strategy

The tests use comprehensive mocking for:
- React Hook Form components
- MUI form components
- Date picker components
- File upload components
- Rich text editors

This ensures tests run fast and focus on form logic rather than external dependencies.

## Test Data

Tests use realistic form configurations:
- User registration forms
- Profile update forms
- Settings forms
- Multi-step wizards
- Complex business forms

## Best Practices

1. **Form Provider**: All field tests are wrapped in FormProvider for realistic context
2. **User Interactions**: Tests simulate actual user interactions (typing, selecting, etc.)
3. **Validation Testing**: Both client-side and custom validation rules are tested
4. **Accessibility**: Tests include accessibility considerations
5. **Performance**: Tests verify form performance with large datasets

## Validation Testing

The tests cover various validation scenarios:
- Required field validation
- Pattern matching (email, phone, etc.)
- Min/max length validation
- Custom validation functions
- Cross-field validation
- Async validation

## Conditional Logic Testing

Tests verify conditional behavior:
- Field visibility based on other field values
- Dynamic field options
- Conditional validation rules
- Dependent field relationships
- Complex boolean logic

## Integration Testing

While these are unit tests, they also cover:
- Form-to-field communication
- Field-to-field dependencies
- Validation error propagation
- Submit flow and data transformation