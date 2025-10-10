import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

interface IReviewTableFilters {
  search: string;
  reviewType: 'all' | string;
  rating: 'all' | string;
}

type Props = FiltersResultProps & {
  onResetPage: () => void;
  filters: UseSetStateReturn<IReviewTableFilters>;
};

export function ReviewTableFiltersResult({ filters, onResetPage, totalResults, sx }: Props) {
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const handleRemoveSearch = useCallback(() => {
    onResetPage();
    updateFilters({ search: '' });
  }, [onResetPage, updateFilters]);

  const handleRemoveReviewType = useCallback(() => {
    onResetPage();
    updateFilters({ reviewType: 'all' });
  }, [onResetPage, updateFilters]);

  const handleRemoveRating = useCallback(() => {
    onResetPage();
    updateFilters({ rating: 'all' });
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

      <FiltersBlock label="Type:" isShow={currentFilters.reviewType !== 'all'}>
        <Chip
          {...chipProps}
          label={currentFilters.reviewType
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase())}
          onDelete={handleRemoveReviewType}
        />
      </FiltersBlock>

      <FiltersBlock label="Rating:" isShow={currentFilters.rating !== 'all'}>
        <Chip
          {...chipProps}
          label={`${currentFilters.rating}+ Stars`}
          onDelete={handleRemoveRating}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}
