'use client';

import type { DynamicTableColumn } from 'src/components/dynamic-table';
import type { TaxAdminControllerGetTaxRatesParams } from 'src/api/models/admin';

import { useSetState } from 'minimal-shared/hooks';
import React, { useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fPercent, fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { TaxAdminControllerGetTaxRatesStatus } from 'src/api/models/admin';
import {
  useTaxAdminControllerGetTaxRates,
  useTaxAdminControllerDeactivateTaxRate,
} from 'src/api/queries/admin/tax-management/tax-management';

import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { Iconify } from 'src/components/iconify';
import { ErrorState } from 'src/components/error-state';
import { DynamicTable } from 'src/components/dynamic-table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

interface TaxRate {
  id: string;
  name: string;
  jurisdictionId: string;
  jurisdictionName: string;
  rate: number;
  type: 'percentage' | 'fixed';
  category: string;
  minimumAmount?: number;
  maximumAmount?: number;
  isActive: boolean;
  effectiveDate: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

const createTableColumns = (): DynamicTableColumn<TaxRate>[] => [
  {
    id: 'name',
    label: 'Tax Rate',
    width: 280,
    render: (taxRate) => (
      <Stack spacing={0.5}>
        <Box sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{taxRate.name}</Box>
        <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
          {taxRate.jurisdictionName}
        </Box>
      </Stack>
    ),
  },
  {
    id: 'rate',
    label: 'Rate',
    width: 120,
    align: 'center',
    render: (taxRate) => (
      <Box sx={{ fontWeight: 600, color: 'primary.main' }}>
        {taxRate.type === 'percentage' ? fPercent(taxRate.rate) : fCurrency(taxRate.rate)}
      </Box>
    ),
  },
  {
    id: 'type',
    label: 'Type',
    width: 100,
    align: 'center',
    render: (taxRate) => (
      <Chip
        label={taxRate.type === 'percentage' ? 'Rate' : 'Fixed'}
        size="small"
        variant="outlined"
        color={taxRate.type === 'percentage' ? 'primary' : 'secondary'}
      />
    ),
  },
  {
    id: 'category',
    label: 'Category',
    width: 140,
    render: (taxRate) => <Chip label={taxRate.category} size="small" variant="soft" color="info" />,
  },
  {
    id: 'limits',
    label: 'Limits',
    width: 180,
    render: (taxRate) => {
      if (!taxRate.minimumAmount && !taxRate.maximumAmount) {
        return <Box sx={{ typography: 'caption', color: 'text.disabled' }}>No limits</Box>;
      }
      return (
        <Stack spacing={0.25}>
          {taxRate.minimumAmount && (
            <Box sx={{ typography: 'caption' }}>Min: {fCurrency(taxRate.minimumAmount)}</Box>
          )}
          {taxRate.maximumAmount && (
            <Box sx={{ typography: 'caption' }}>Max: {fCurrency(taxRate.maximumAmount)}</Box>
          )}
        </Stack>
      );
    },
  },
  {
    id: 'effectiveDate',
    label: 'Effective Period',
    width: 180,
    render: (taxRate) => (
      <Stack spacing={0.25}>
        <Box sx={{ typography: 'caption' }}>
          From: {new Date(taxRate.effectiveDate).toLocaleDateString()}
        </Box>
        {taxRate.expiryDate && (
          <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
            Until: {new Date(taxRate.expiryDate).toLocaleDateString()}
          </Box>
        )}
      </Stack>
    ),
  },
  {
    id: 'isActive',
    label: 'Status',
    width: 120,
    align: 'center',
    render: (taxRate) => (
      <Chip
        label={taxRate.isActive ? 'Active' : 'Inactive'}
        color={taxRate.isActive ? 'success' : 'default'}
        variant="soft"
        size="small"
      />
    ),
  },
];

// ----------------------------------------------------------------------

interface TaxRateFilter extends Record<string, unknown> {
  search: string;
  jurisdictionId: string[];
  category: string[];
  type: string[];
  isActive: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: TaxAdminControllerGetTaxRatesStatus.active, label: 'Active' },
  { value: TaxAdminControllerGetTaxRatesStatus.inactive, label: 'Inactive' },
  { value: TaxAdminControllerGetTaxRatesStatus.archived, label: 'Archived' },
  { value: TaxAdminControllerGetTaxRatesStatus.pending_approval, label: 'Pending Approval' },
];

const TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed Amount' },
];

const CATEGORY_OPTIONS = [
  { value: 'sales', label: 'Sales Tax' },
  { value: 'occupancy', label: 'Occupancy Tax' },
  { value: 'tourism', label: 'Tourism Tax' },
  { value: 'vat', label: 'VAT' },
  { value: 'service', label: 'Service Tax' },
];

export function TaxRatesListView() {
  const table = useTable();

  const filters = useSetState<TaxRateFilter>({
    search: '',
    jurisdictionId: [],
    category: [],
    type: [],
    isActive: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const tableColumns = useMemo(() => createTableColumns(), []);

  const queryParams = useMemo((): TaxAdminControllerGetTaxRatesParams => {
    const params: TaxAdminControllerGetTaxRatesParams = {
      page: table.page,
      limit: table.rowsPerPage,
    };

    if (currentFilters.jurisdictionId.length > 0) {
      params.jurisdictionId = currentFilters.jurisdictionId[0]; // Take first jurisdiction ID
    }

    if (currentFilters.type.length > 0) {
      params.type = currentFilters.type[0]; // Take first type
    }

    if (currentFilters.isActive !== 'all') {
      params.status = currentFilters.isActive as any;
    }

    return params;
  }, [table.page, table.rowsPerPage, currentFilters]);

  const { data, isLoading, error, refetch } = useTaxAdminControllerGetTaxRates(queryParams);

  const { mutate: deactivateTaxRate } = useTaxAdminControllerDeactivateTaxRate();

  const taxRatesList = useMemo(() => data?.data?.items || [], [data]);

  const canResetFilters = useCallback(
    (filterState: TaxRateFilter) =>
      !!filterState.search ||
      filterState.jurisdictionId.length > 0 ||
      filterState.category.length > 0 ||
      filterState.type.length > 0 ||
      filterState.isActive !== 'all',
    []
  );

  const handleTabChange = useCallback(
    (newValue: string) => {
      table.onResetPage();
      updateFilters({ isActive: newValue });
    },
    [updateFilters, table]
  );

  const handleDeactivateRate = useCallback(
    (taxRateId: string) => {
      deactivateTaxRate(
        { taxRateId, params: { effectiveDate: new Date().toISOString() } },
        {
          onSuccess: () => {
            toast.success('Tax rate deactivated successfully');
            refetch();
          },
          onError: () => {
            toast.error('Failed to deactivate tax rate');
          },
        }
      );
    },
    [deactivateTaxRate, refetch]
  );

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Tax Rates"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Tax Administration', href: paths.dashboard.taxAdministration.root },
            { name: 'Tax Rates' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <ErrorState
          title="Failed to load tax rates"
          subtitle="There was an error loading the tax rates. Please try again."
          onRetry={refetch}
          variant="card"
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Tax Rates"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Tax Administration', href: paths.dashboard.taxAdministration.root },
          { name: 'Tax Rates' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.taxAdministration.rates.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            New Tax Rate
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <DynamicTable
        data={taxRatesList}
        loading={isLoading}
        columns={tableColumns}
        getRowId={(row) => row.id}
        pagination={{
          page: table.page,
          rowsPerPage: table.rowsPerPage,
          totalCount: (data as any)?.data?.total || 0,
          onPageChange: table.onChangePage,
          onRowsPerPageChange: table.onChangeRowsPerPage,
        }}
        sorting={{
          orderBy: table.orderBy,
          order: table.order,
          onSort: table.onSort,
        }}
        filtering={{
          state: currentFilters,
          setState: updateFilters,
          searchKey: 'search',
          searchPlaceholder: 'Search tax rates...',
          showFiltersResult: true,
          canResetFilters,
          filterFields: [
            {
              id: 'type',
              label: 'Type',
              type: 'multiselect',
              name: 'type',
              options: TYPE_OPTIONS,
            },
            {
              id: 'category',
              label: 'Category',
              type: 'multiselect',
              name: 'category',
              options: CATEGORY_OPTIONS,
            },
          ],
        }}
        tabs={{
          tabs: STATUS_OPTIONS,
          activeTab: currentFilters.isActive,
          onTabChange: handleTabChange,
        }}
        options={{
          dense: table.dense,
          onChangeDense: table.onChangeDense,
          minWidth: 1000,
        }}
        rowActions={[
          {
            label: 'Edit',
            icon: 'solar:pen-bold',
            onClick: (taxRate) => {
              window.location.href = paths.dashboard.taxAdministration.rates.edit(
                (taxRate as TaxRate).id
              );
            },
            color: 'default',
          },
          {
            label: 'Deactivate',
            icon: 'solar:eye-closed-bold',
            onClick: (taxRate) => {
              if ((taxRate as TaxRate).isActive) {
                handleDeactivateRate((taxRate as TaxRate).id);
              }
            },
            color: 'warning',
            disabled: (taxRate) => !(taxRate as TaxRate).isActive,
          },
        ]}
      />
    </DashboardContent>
  );
}
