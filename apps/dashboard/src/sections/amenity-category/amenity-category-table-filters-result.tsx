'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: {
    name: string;
    status: string;
  };
  totalResults: number;
  onResetFilters: () => void;
  sx?: SxProps<Theme>;
};

export function AmenityCategoryTableFiltersResult({
  filters,
  totalResults,
  onResetFilters,
  sx,
}: Props) {
  const handleRemoveKeyword = useCallback(() => {
    // Handle remove keyword logic here
  }, []);

  const handleRemoveStatus = useCallback(() => {
    // Handle remove status logic here
  }, []);

  return (
    <Box sx={sx}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{totalResults}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          results found
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
        {filters.status !== 'all' && (
          <Chip
            key="status"
            label={filters.status}
            size="small"
            onDelete={handleRemoveStatus}
            variant="soft"
          />
        )}

        {filters.name && (
          <Chip
            key="name"
            label={filters.name}
            size="small"
            onDelete={handleRemoveKeyword}
            variant="soft"
          />
        )}

        <Button
          color="error"
          onClick={onResetFilters}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Clear
        </Button>
      </Box>
    </Box>
  );
}
