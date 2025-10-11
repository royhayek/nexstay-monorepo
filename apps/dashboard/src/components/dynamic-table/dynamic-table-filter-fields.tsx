import type { DynamicTableFilter, DynamicTableFilterField } from './types';

import { useRef, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import Box from '@mui/material/Box';

import { DynamicFormField } from '../dynamic-form/dynamic-form-field';

// ----------------------------------------------------------------------

interface DynamicTableFilterFieldsProps<TFilters extends DynamicTableFilter = DynamicTableFilter> {
  filterFields: DynamicTableFilterField<TFilters>[];
  filters: {
    state: TFilters;
    setState: (filters: Partial<TFilters>) => void;
  };
  onResetPage: () => void;
  inline?: boolean; // New prop to indicate inline display
}

/**
 * Renders dynamic filter fields using real React Hook Form methods
 */
export function DynamicTableFilterFields<TFilters extends DynamicTableFilter = DynamicTableFilter>({
  filterFields,
  filters,
  onResetPage,
  inline = false,
}: DynamicTableFilterFieldsProps<TFilters>) {
  const { state: currentFilters, setState: updateFilters } = filters;

  // Ref to track if we're currently updating to prevent infinite loops
  const isUpdatingRef = useRef(false);
  const previousFiltersRef = useRef(currentFilters);

  // Create a real form instance for managing filter state
  const methods = useForm({
    defaultValues: currentFilters,
    mode: 'onChange',
  });

  const { watch, reset } = methods;

  // Stable comparison function
  const areFiltersEqual = useCallback((a: any, b: any) => {
    // Normalize values for comparison
    const normalizeValue = (val: any) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (Array.isArray(val) && val.length === 0) return undefined;
      return val;
    };

    const aValue = normalizeValue(a);
    const bValue = normalizeValue(b);

    // Deep comparison for arrays
    if (Array.isArray(aValue) && Array.isArray(bValue)) {
      if (aValue.length !== bValue.length) return false;
      return aValue.every((val, idx) => val === bValue[idx]);
    }

    return aValue === bValue;
  }, []);

  // Watch form changes and sync with external filter state
  useEffect(() => {
    const subscription = watch((formValues) => {
      // Prevent updates during reset operations
      if (isUpdatingRef.current) return;

      const hasChanges = Object.keys(formValues).some((key) => {
        const formValue = formValues[key];
        const filterValue = currentFilters[key as keyof TFilters];
        return !areFiltersEqual(formValue, filterValue);
      });

      if (hasChanges) {
        isUpdatingRef.current = true;
        onResetPage();

        // Convert empty strings to undefined to properly reset filters
        const normalizedFilters: Partial<TFilters> = {};
        Object.keys(formValues).forEach((key) => {
          const value = formValues[key];
          normalizedFilters[key as keyof TFilters] = (
            value === '' ? undefined : value
          ) as TFilters[keyof TFilters];
        });

        updateFilters(normalizedFilters);

        // Reset flag after update
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, currentFilters, onResetPage, updateFilters, areFiltersEqual]);

  // Keep form in sync with external filter state changes
  useEffect(() => {
    // Only reset if external filters have actually changed
    const hasExternalChanges = Object.keys(currentFilters).some((key) => {
      const currentValue = currentFilters[key as keyof TFilters];
      const previousValue = previousFiltersRef.current[key as keyof TFilters];
      return !areFiltersEqual(currentValue, previousValue);
    });

    if (hasExternalChanges) {
      isUpdatingRef.current = true;
      reset(currentFilters);
      previousFiltersRef.current = currentFilters;

      // Reset the flag after form update completes
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [currentFilters, reset, areFiltersEqual]);

  if (filterFields.length === 0) {
    return null;
  }

  // Determine grid layout based on number of fields and inline mode
  const getGridTemplateColumns = () => {
    const fieldCount = filterFields.length;
    
    if (inline) {
      // Inline mode: display fields in a row with max width constraint (smaller than search field)
      return {
        xs: '1fr', // Single column on mobile
        md: `repeat(${fieldCount}, minmax(180px, 250px))`, // Row layout with max 250px width per field
      };
    }
    
    if (fieldCount === 2) {
      // For exactly 2 fields, limit their max width on larger screens
      return {
        xs: '1fr', // Single column on mobile
        sm: 'repeat(auto-fit, minmax(200px, 1fr))', // Auto-fit on small screens
        md: 'repeat(2, minmax(220px, 300px))', // 2 columns with max width on medium
        lg: 'repeat(2, minmax(240px, 350px))', // 2 columns with max width on large
      };
    }
    
    // For 1, 3+ fields, use the current responsive behavior
    return {
      xs: '1fr', // Single column on mobile
      sm: 'repeat(auto-fit, minmax(200px, 1fr))', // Responsive grid on larger screens
      md: 'repeat(auto-fit, minmax(220px, 1fr))',
    };
  };

  return (
    <FormProvider {...methods}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: getGridTemplateColumns(),
          gap: 2,
          width: inline ? 'auto' : '100%', // Auto width for inline, full width for expanded
          ...(inline && {
            // For inline mode, don't stretch to full width
            justifyContent: 'start',
          }),
          ...(filterFields.length === 2 && !inline && {
            // Center the 2-column grid on larger screens (only for non-inline)
            md: {
              justifyContent: 'start',
            },
          }),
        }}
      >
        {filterFields.map((field) => {
          // Convert DynamicTableFilterField to DynamicFormField format
          const baseField = {
            id: field.id,
            name: String(field.name),
            label: field.label,
            placeholder: field.placeholder,
            sx: {
              width: '100%', // All fields take full width of their container
              // Ensure consistent height for all input types
              '& .MuiInputBase-root': {
                height: 56, // Standard MUI input height
              },
              // Add overflow handling for multiselect
              ...(field.type === 'multiselect' && {
                '& .MuiSelect-select': {
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.5,
                  overflow: 'hidden',
                  alignItems: 'center',
                  minHeight: 56,
                },
                '& .MuiChip-root': {
                  height: 24,
                  fontSize: '0.75rem',
                },
              }),
              // Ensure date picker has same width and height
              ...(field.type === 'date' && {
                width: '100%', // Force date picker to respect container width
                '& .MuiInputBase-input': {
                  padding: '16.5px 14px', // Match select field padding
                },
                '& .MuiTextField-root': {
                  width: '100%',
                },
              }),
              ...field.sx,
            },
            gridSize: field.gridSize || { xs: 'auto' as const },
            condition: field.condition
              ? {
                  field: String(field.condition.field),
                  operator: field.condition.operator,
                  value: field.condition.value,
                }
              : undefined,
          };

          // Create proper form field based on type
          let formField;

          switch (field.type) {
            case 'text':
            case 'number':
              formField = {
                ...baseField,
                type: field.type,
              };
              break;
            case 'select':
            case 'multiselect':
              formField = {
                ...baseField,
                type: field.type,
                options: field.options || [],
                // Add autocomplete properties if present
                autocomplete: field.autocomplete,
                onSearch: field.onSearch,
                freeSolo: field.freeSolo,
                loading: field.loading,
                minSearchLength: field.minSearchLength,
                searchDelay: field.searchDelay,
                noOptionsText: field.noOptionsText,
                loadingText: field.loadingText,
              };
              break;
            case 'date':
              formField = {
                ...baseField,
                type: 'date' as const,
                minDate: field.minDate,
                maxDate: field.maxDate,
              };
              break;
            case 'dateRange':
              // For now, treat dateRange as date - can be enhanced later
              formField = {
                ...baseField,
                type: 'date' as const,
                minDate: field.minDate,
                maxDate: field.maxDate,
              };
              break;
            default:
              formField = {
                ...baseField,
                type: 'text' as const,
              };
          }

          return <DynamicFormField key={field.id} field={formField} formMethods={methods as any} />;
        })}
      </Box>
    </FormProvider>
  );
}
