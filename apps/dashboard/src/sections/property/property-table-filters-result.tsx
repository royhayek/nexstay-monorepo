import type { UseSetStateReturn } from 'minimal-shared/hooks';
import type { FiltersResultProps } from 'src/components/filters-result';

import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

interface IPropertyTableFilters {
  name: string;
  propertyType: 'all' | string;
}

type Props = FiltersResultProps & {
  onResetPage: () => void;
  filters: UseSetStateReturn<IPropertyTableFilters>;
};

export function PropertyTableFiltersResult({ filters, onResetPage, totalResults, sx }: Props) {
  const { state: currentFilters, setState: updateFilters, resetState: resetFilters } = filters;

  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    updateFilters({ name: '' });
  }, [onResetPage, updateFilters]);

  const handleRemovePropertyType = useCallback(() => {
    onResetPage();
    updateFilters({ propertyType: 'all' });
  }, [onResetPage, updateFilters]);

  const handleReset = useCallback(() => {
    onResetPage();
    resetFilters();
  }, [onResetPage, resetFilters]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Keyword:" isShow={!!currentFilters.name}>
        <Chip {...chipProps} label={currentFilters.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock label="Property Type:" isShow={currentFilters.propertyType !== 'all'}>
        <Chip
          {...chipProps}
          label={currentFilters.propertyType}
          onDelete={handleRemovePropertyType}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}
