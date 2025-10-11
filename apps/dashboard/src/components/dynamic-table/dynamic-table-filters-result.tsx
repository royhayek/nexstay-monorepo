import type { StackProps } from '@mui/material/Stack';
import type { Theme, SxProps } from '@mui/material/styles';
import type { DynamicTableFilter, DynamicTableFiltersResultProps } from './types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const chipProps = {
  size: 'small' as const,
  variant: 'soft' as const,
  color: 'info' as const,
};

export function FiltersBlock({
  label,
  isShow,
  sx,
  children,
  ...other
}: {
  label: string;
  isShow: boolean;
  sx?: SxProps<Theme>;
  children: React.ReactNode;
}) {
  return isShow ? (
    <BlockRoot sx={sx} {...other}>
      <BlockLabel>{label}</BlockLabel>
      <BlockContent>{children}</BlockContent>
    </BlockRoot>
  ) : null;
}

// ----------------------------------------------------------------------

const BlockRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  overflow: 'hidden',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  border: `dashed 1px ${theme.vars.palette.divider}`,
}));

const BlockLabel = styled('span')(({ theme }) => ({
  height: 24,
  lineHeight: '24px',
  fontSize: theme.typography.subtitle2.fontSize,
  fontWeight: theme.typography.subtitle2.fontWeight,
}));

const BlockContent = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
}));

// ----------------------------------------------------------------------

export function DynamicTableFiltersResult<
  TFilters extends DynamicTableFilter = DynamicTableFilter,
>({
  filters,
  totalResults,
  onResetPage,
  sx,
  getFilterLabels,
  filterFields,
  ...other
}: DynamicTableFiltersResultProps<TFilters> & StackProps) {
  const handleRemoveFilter = (filterKey: string) => {
    onResetPage();

    // Get allowed field keys from filterFields
    const allowedKeys = filterFields
      ? filterFields.map((field) => String(field.name))
      : Object.keys(filters.state);

    // Only proceed if this field is in the allowed filterFields
    if (!allowedKeys.includes(filterKey)) {
      return;
    }

    const newFilters = { ...filters.state };
    if (filterKey in newFilters) {
      const value = newFilters[filterKey];

      // Check special field names FIRST before generic type checks
      if (typeof value === 'string') {
        (newFilters as any)[filterKey] = '';
      } else if (typeof value === 'boolean') {
        (newFilters as any)[filterKey] = false;
      } else if (Array.isArray(value)) {
        (newFilters as any)[filterKey] = [];
      } else if (typeof value === 'number') {
        (newFilters as any)[filterKey] = 0;
      } else {
        (newFilters as any)[filterKey] = null;
      }
    }

    // Use setTimeout to batch the state update
    setTimeout(() => {
      filters.setState(newFilters);
    }, 0);
  };

  const handleClearAll = () => {
    onResetPage();

    // Get allowed field keys from filterFields
    const allowedKeys = filterFields
      ? filterFields.map((field) => String(field.name))
      : Object.keys(filters.state);

    // Create a new filter state with default values only for allowed fields
    const clearedFilters = Object.keys(filters.state).reduce((acc, key) => {
      // Only clear fields that are in filterFields
      if (allowedKeys.includes(key)) {
        const value = filters.state[key];

        // Clear the field value based on its type
        if (typeof value === 'string') {
          (acc as any)[key] = '';
        } else if (typeof value === 'boolean') {
          (acc as any)[key] = false;
        } else if (Array.isArray(value)) {
          (acc as any)[key] = [];
        } else if (typeof value === 'number') {
          (acc as any)[key] = 0;
        } else {
          (acc as any)[key] = null;
        }
      } else {
        // Keep the original value for fields not in filterFields
        (acc as any)[key] = filters.state[key];
      }
      return acc;
    }, {} as Partial<TFilters>);

    // Use setTimeout to batch the state update and prevent flash
    setTimeout(() => {
      filters.setState(clearedFilters);
    }, 0);
  };

  const getDefaultFilterLabels = (filterState: TFilters) => {
    const labels: { key: string; label: string; value: any }[] = [];

    // Get allowed field keys from filterFields
    const allowedKeys = filterFields
      ? filterFields.map((field) => String(field.name))
      : Object.keys(filterState);

    Object.keys(filterState).forEach((key) => {
      // Skip if this field is not in the allowed filterFields
      if (!allowedKeys.includes(key)) {
        return;
      }

      const value = filterState[key];

      if (
        value !== null &&
        value !== undefined &&
        value !== 'all' &&
        value !== '' &&
        value !== 0 &&
        (!Array.isArray(value) || value.length > 0) &&
        (typeof value !== 'boolean' || value === true)
      ) {
        let displayValue = value;

        // Get the filter field configuration
        const filterField = filterFields?.find((field) => String(field.name) === key);

        // Convert values to display labels
        if (Array.isArray(value)) {
          // For arrays, map each value to its label
          displayValue = value
            .map((v) => {
              // Look up the label from options if available
              const option = filterField?.options?.find((opt) => opt.value === v);
              return option?.label || v;
            })
            .join(', ');
        } else if (filterField?.options) {
          // For single values, look up the label from options
          const option = filterField.options.find((opt) => opt.value === value);
          displayValue = option?.label || value;
        } else if (typeof value === 'object' && value !== null && 'label' in value) {
          // Handle cases where the value itself is an object with a label
          displayValue = value.label;
        } else if (typeof value === 'boolean') {
          // For boolean values, show Yes/No or True/False
          displayValue = value ? 'Yes' : 'No';
        }

        // Get field label from filterFields if available, otherwise use default formatting
        const label =
          filterField?.label ||
          key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

        labels.push({
          key,
          label,
          value: displayValue,
        });
      }
    });

    return labels;
  };

  const filterLabels = getFilterLabels
    ? getFilterLabels(filters.state)
    : getDefaultFilterLabels(filters.state);
  const hasFilters = filterLabels.length > 0;

  if (!hasFilters) {
    return null;
  }

  return (
    <Stack spacing={1.5} sx={{ p: 2.5, pt: 0, ...sx }} {...other}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{totalResults}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.5 }}>
          results found
        </Box>
      </Box>

      <Stack spacing={1} direction="row" flexWrap="wrap" alignItems="center">
        {filterLabels.map((filter) => (
          <FiltersBlock key={filter.key} label={`${filter.label}:`} isShow>
            <Chip
              {...chipProps}
              label={filter.value}
              onDelete={() => handleRemoveFilter(filter.key)}
            />
          </FiltersBlock>
        ))}

        {hasFilters && (
          <Button
            color="inherit"
            onClick={handleClearAll}
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
            sx={{ ml: 1 }}
          >
            Clear all
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
