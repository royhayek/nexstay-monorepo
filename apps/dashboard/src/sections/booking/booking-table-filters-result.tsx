import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

interface IBookingTableFilters {
  search: string;
  status: 'all' | string;
  paymentStatus: 'all' | string;
}

type Props = FiltersResultProps & {
  onResetPage: () => void;
  filters: UseSetStateReturn<IBookingTableFilters>;
};

export function BookingTableFiltersResult({ filters, onResetPage, totalResults, sx }: Props) {
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const handleRemoveSearch = useCallback(() => {
    onResetPage();
    updateFilters({ search: '' });
  }, [onResetPage, updateFilters]);

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    updateFilters({ status: 'all' });
  }, [onResetPage, updateFilters]);

  const handleRemovePaymentStatus = useCallback(() => {
    onResetPage();
    updateFilters({ paymentStatus: 'all' });
  }, [onResetPage, updateFilters]);

  const handleReset = useCallback(() => {
    onResetPage();
    resetFilters();
  }, [onResetPage, resetFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Search:" isShow={!!currentFilters.search}>
        <Chip {...chipProps} label={currentFilters.search} onDelete={handleRemoveSearch} />
      </FiltersBlock>

      <FiltersBlock label="Status:" isShow={currentFilters.status !== 'all'}>
        <Chip
          {...chipProps}
          label={currentFilters.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          onDelete={handleRemoveStatus}
        />
      </FiltersBlock>

      <FiltersBlock label="Payment:" isShow={currentFilters.paymentStatus !== 'all'}>
        <Chip
          {...chipProps}
          label={currentFilters.paymentStatus
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())}
          onDelete={handleRemovePaymentStatus}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}
