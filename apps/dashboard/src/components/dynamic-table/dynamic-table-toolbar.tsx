import type { DynamicTableFilter, DynamicTableToolbarProps } from './types';

import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

import { DynamicTableFilterFields } from './dynamic-table-filter-fields';

// ----------------------------------------------------------------------

export function DynamicTableToolbar<TFilters extends DynamicTableFilter = DynamicTableFilter>({
  filters,
  onResetPage,
  placeholder = 'Search...',
  searchKey,
  additionalFilters,
  filterFields = [],
}: DynamicTableToolbarProps<TFilters>) {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Logic: if 2 or fewer fields, show inline; if more than 2, show all in expandable section
  const { inlineFilterFields, expandableFilterFields, hasExpandableFilters } = useMemo(() => {
    const shouldShowInline = filterFields.length <= 2;
    const inline = shouldShowInline ? filterFields : [];
    const expandable = shouldShowInline ? [] : filterFields;
    const hasExpandable = expandable.length > 0 || additionalFilters;
    
    return {
      inlineFilterFields: inline,
      expandableFilterFields: expandable,
      hasExpandableFilters: hasExpandable,
    };
  }, [filterFields, additionalFilters]);

  const searchValue = searchKey ? (filters.state[searchKey] as string) || '' : '';

  // Count active filters (inline + expandable)
  const activeFilterCount = useMemo(() => {
    let count = 0;

    // Check each filter field
    filterFields.forEach((field) => {
      const value = filters.state[field.name];

      // Check if filter has a value
      if (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        value !== 'all' &&
        (!Array.isArray(value) || value.length > 0) &&
        (typeof value !== 'boolean' || value === true)
      ) {
        count++;
      }
    });

    return count;
  }, [filters.state, filterFields]);

  // Count active expandable filters (for badge display)
  const activeExpandableFilterCount = useMemo(() => {
    let count = 0;

    // Check expandable filter fields only
    expandableFilterFields.forEach((field) => {
      const value = filters.state[field.name];

      // Check if filter has a value
      if (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        value !== 'all' &&
        (!Array.isArray(value) || value.length > 0) &&
        (typeof value !== 'boolean' || value === true)
      ) {
        count++;
      }
    });

    return count;
  }, [filters.state, expandableFilterFields]);

  const hasActiveFilters = activeFilterCount > 0;

  const handleFilterSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!searchKey) return;

      // Don't reset page here - let the parent component handle it through debounced API calls
      filters.setState({ [searchKey]: event.target.value } as Partial<TFilters>);
    },
    [filters, searchKey]
  );

  const handleToggleFilters = useCallback(() => {
    setFiltersExpanded((prev) => !prev);
  }, []);

  return (
    <Stack spacing={2} sx={{ p: 2.5 }}>
      {/* Search Field with Inline Filters and Toggle Button */}
      <Box sx={{ width: '100%' }}>
        {/* Desktop: Search + Inline Filters + Toggle Button in one row */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
          {/* Search Field */}
          {searchKey && (
            <Box sx={{ flex: '1 1 350px', minWidth: 300, maxWidth: 500 }}>
              <TextField
                fullWidth
                value={searchValue}
                onChange={handleFilterSearch}
                placeholder={placeholder}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
          )}

          {/* Inline Filter Fields (first 2) */}
          {inlineFilterFields.length > 0 && (
            <DynamicTableFilterFields
              filterFields={inlineFilterFields}
              filters={filters}
              onResetPage={onResetPage}
              inline
            />
          )}

          {/* Filters Toggle Button (only show if there are expandable filters) */}
          {hasExpandableFilters && (
            <Badge 
              badgeContent={activeExpandableFilterCount} 
              color="error" 
              invisible={activeExpandableFilterCount === 0}
            >
              <Button
                variant={activeExpandableFilterCount > 0 ? 'contained' : 'outlined'}
                color={activeExpandableFilterCount > 0 ? 'primary' : 'inherit'}
                onClick={handleToggleFilters}
                startIcon={
                  <Iconify
                    icon={
                      activeExpandableFilterCount > 0 || filtersExpanded ? 'eva:funnel-fill' : 'eva:funnel-outline'
                    }
                  />
                }
                endIcon={
                  <Iconify
                    icon={filtersExpanded ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
                    width={20}
                  />
                }
                sx={{
                  minWidth: 120,
                  px: 2,
                  whiteSpace: 'nowrap',
                  ...(activeExpandableFilterCount === 0
                    ? {
                        borderColor: 'divider',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          borderColor: 'divider',
                        },
                      }
                    : {}),
                }}
              >
                More Filters
              </Button>
            </Badge>
          )}
        </Box>

        {/* Mobile: Stack all elements vertically */}
        <Stack spacing={2} sx={{ display: { xs: 'flex', md: 'none' } }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Search Field on mobile */}
            {searchKey && (
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  value={searchValue}
                  onChange={handleFilterSearch}
                  placeholder={placeholder}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            )}

            {/* Filters Toggle Button on mobile (show if there are any filters) */}
            {(inlineFilterFields.length > 0 || hasExpandableFilters) && (
              <Badge badgeContent={activeFilterCount} color="error" invisible={!hasActiveFilters}>
                <Button
                  variant={hasActiveFilters ? 'contained' : 'outlined'}
                  color={hasActiveFilters ? 'primary' : 'inherit'}
                  onClick={handleToggleFilters}
                  startIcon={
                    <Iconify
                      icon={
                        hasActiveFilters || filtersExpanded ? 'eva:funnel-fill' : 'eva:funnel-outline'
                      }
                    />
                  }
                  endIcon={
                    <Iconify
                      icon={filtersExpanded ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
                      width={20}
                    />
                  }
                  sx={{
                    minWidth: 'auto',
                    px: 1,
                    '& .MuiButton-startIcon': {
                      marginRight: 0.5,
                      marginLeft: -0.5,
                    },
                    '& .MuiButton-endIcon': {
                      marginLeft: 0.5,
                      marginRight: -0.5,
                    },
                    ...(hasActiveFilters
                      ? {}
                      : {
                          borderColor: 'divider',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                            borderColor: 'divider',
                          },
                        }),
                  }}
                />
              </Badge>
            )}
          </Stack>

          {/* Mobile: Show inline filters in expanded state */}
          <Collapse in={filtersExpanded && inlineFilterFields.length > 0} timeout="auto" unmountOnExit>
            <Box sx={{ width: '100%' }}>
              <DynamicTableFilterFields
                filterFields={inlineFilterFields}
                filters={filters}
                onResetPage={onResetPage}
              />
            </Box>
          </Collapse>
        </Stack>
      </Box>

      {/* Collapsible Filter Fields (remaining filters after first 2) */}
      <Collapse in={filtersExpanded} timeout="auto" unmountOnExit>
        <Stack spacing={2}>
          {/* Expandable Filter Fields (3rd+ fields) - Desktop Only */}
          {expandableFilterFields.length > 0 && (
            <Box sx={{ width: '100%', display: { xs: 'none', md: 'block' } }}>
              <DynamicTableFilterFields
                filterFields={expandableFilterFields}
                filters={filters}
                onResetPage={onResetPage}
              />
            </Box>
          )}

          {/* Mobile: Show all filter fields when expanded */}
          {filterFields.length > 0 && (
            <Box sx={{ width: '100%', display: { xs: 'block', md: 'none' } }}>
              <DynamicTableFilterFields
                filterFields={filterFields}
                filters={filters}
                onResetPage={onResetPage}
              />
            </Box>
          )}

          {/* Additional Custom Filters */}
          {additionalFilters && <Box sx={{ width: '100%' }}>{additionalFilters}</Box>}
        </Stack>
      </Collapse>
    </Stack>
  );
}
