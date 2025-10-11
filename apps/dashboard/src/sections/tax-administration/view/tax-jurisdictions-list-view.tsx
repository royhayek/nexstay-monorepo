'use client';

import type { DynamicTableColumn } from 'src/components/dynamic-table';
import type { TaxAdminControllerGetTaxJurisdictionsParams } from 'src/api/models/admin';

import { useSetState } from 'minimal-shared/hooks';
import React, { useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useTaxAdminControllerGetTaxJurisdictions,
  useTaxAdminControllerUpdateTaxJurisdiction,
} from 'src/api/queries/admin/tax-management/tax-management';

import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { Iconify } from 'src/components/iconify';
import { ErrorState } from 'src/components/error-state';
import { DynamicTable } from 'src/components/dynamic-table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

interface TaxJurisdiction {
  _id: string;
  name: string;
  code: string;
  country: string;
  state?: string;
  city?: string;
  description?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const createTableColumns = (): DynamicTableColumn<TaxJurisdiction>[] => [
  {
    id: 'name',
    label: 'Jurisdiction',
    render: (jurisdiction) => (
      <Stack spacing={0.25}>
        <Box sx={{ fontWeight: 600, fontSize: '0.875rem' }} title={jurisdiction.name}>
          {jurisdiction.name}
        </Box>
        {jurisdiction.description && (
          <Box
            sx={{ typography: 'caption', color: 'text.secondary' }}
            title={jurisdiction.description}
          >
            {jurisdiction.description}
          </Box>
        )}
      </Stack>
    ),
  },
  {
    id: 'code',
    label: 'Code',
    align: 'center',
    render: (jurisdiction) => (
      <Chip
        label={jurisdiction.code}
        size="small"
        variant="outlined"
        sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
      />
    ),
  },
  {
    id: 'country',
    label: 'Location',
    render: (jurisdiction) => (
      <Stack spacing={0.25}>
        <Box
          sx={{
            fontWeight: 500,
            fontSize: '0.875rem',
          }}
          title={jurisdiction.country}
        >
          {jurisdiction.country}
        </Box>
        {jurisdiction.state && (
          <Box
            sx={{
              typography: 'caption',
              color: 'text.secondary',
            }}
            title={jurisdiction.state}
          >
            {jurisdiction.state}
          </Box>
        )}
      </Stack>
    ),
  },
  {
    id: 'status',
    label: 'Status',
    align: 'center',
    render: (jurisdiction) => (
      <Chip
        label={jurisdiction.status.replace('_', ' ').toUpperCase()}
        color={
          jurisdiction.status === 'active'
            ? 'success'
            : jurisdiction.status === 'inactive'
              ? 'default'
              : 'warning'
        }
        variant="soft"
        size="small"
        sx={{ fontSize: '0.75rem' }}
      />
    ),
  },
  {
    id: 'createdAt',
    label: 'Created',
    format: 'date',
  },
];

// ----------------------------------------------------------------------

interface TaxJurisdictionFilter extends Record<string, unknown> {
  country: string;
  level: string;
  status: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
  { value: 'pending_approval', label: 'Pending Approval' },
];

export function TaxJurisdictionsListView() {
  const table = useTable();

  const filters = useSetState<TaxJurisdictionFilter>({
    country: '',
    level: '',
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const tableColumns = useMemo(() => createTableColumns(), []);

  const queryParams = useMemo((): TaxAdminControllerGetTaxJurisdictionsParams => {
    const params: TaxAdminControllerGetTaxJurisdictionsParams = {
      page: table.page,
      limit: table.rowsPerPage,
    };

    if (currentFilters.country) {
      params.country = currentFilters.country;
    }

    if (currentFilters.level) {
      params.level = currentFilters.level as any;
    }

    if (currentFilters.status !== 'all') {
      params.status = currentFilters.status as any;
    }

    return params;
  }, [table.page, table.rowsPerPage, currentFilters]);

  const { data, isLoading, error, refetch } = useTaxAdminControllerGetTaxJurisdictions(queryParams);

  const { mutate: updateJurisdiction } = useTaxAdminControllerUpdateTaxJurisdiction();

  const jurisdictionsList = useMemo(() => data?.data?.items || [], [data]);

  const canResetFilters = useCallback(
    (filterState: TaxJurisdictionFilter) =>
      !!filterState.country || !!filterState.level || filterState.status !== 'all',
    []
  );

  const handleTabChange = useCallback(
    (newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleToggleStatus = useCallback(
    (jurisdictionId: string, currentStatus: boolean) => {
      updateJurisdiction(
        { jurisdictionId },
        {
          onSuccess: () => {
            toast.success(
              `Jurisdiction ${currentStatus ? 'deactivated' : 'activated'} successfully`
            );
            refetch();
          },
          onError: () => {
            toast.error('Failed to update jurisdiction status');
          },
        }
      );
    },
    [updateJurisdiction, refetch]
  );

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Tax Jurisdictions"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Tax Administration', href: paths.dashboard.taxAdministration.root },
            { name: 'Jurisdictions' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <ErrorState
          title="Failed to load jurisdictions"
          subtitle="There was an error loading the tax jurisdictions. Please try again."
          onRetry={refetch}
          variant="card"
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Tax Jurisdictions"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Tax Administration', href: paths.dashboard.taxAdministration.root },
          { name: 'Jurisdictions' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.taxAdministration.jurisdictions.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            New Jurisdiction
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <DynamicTable
        data={jurisdictionsList}
        loading={isLoading}
        columns={tableColumns}
        getRowId={(row) => row._id}
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
          showFiltersResult: true,
          canResetFilters,
          filterFields: [
            {
              id: 'country',
              label: 'Country',
              type: 'select',
              name: 'country',
              options: [
                { value: 'US', label: 'United States' },
                { value: 'CA', label: 'Canada' },
                { value: 'UK', label: 'United Kingdom' },
                { value: 'DE', label: 'Germany' },
                { value: 'FR', label: 'France' },
              ],
            },
            {
              id: 'level',
              label: 'Level',
              type: 'select',
              name: 'level',
              options: [
                { value: 'country', label: 'Country' },
                { value: 'state', label: 'State' },
                { value: 'province', label: 'Province' },
                { value: 'city', label: 'City' },
                { value: 'county', label: 'County' },
                { value: 'district', label: 'District' },
                { value: 'municipality', label: 'Municipality' },
              ],
            },
          ],
        }}
        tabs={{
          tabs: STATUS_OPTIONS,
          activeTab: currentFilters.status,
          onTabChange: handleTabChange,
        }}
        options={{
          dense: table.dense,
          onChangeDense: table.onChangeDense,
        }}
        rowActions={[
          {
            label: 'Edit',
            icon: 'solar:pen-bold',
            onClick: (jurisdiction) => {
              window.location.href = paths.dashboard.taxAdministration.jurisdictions.edit(
                (jurisdiction as TaxJurisdiction)._id
              );
            },
            color: 'default',
          },
          {
            label: 'Toggle Status',
            icon: 'solar:eye-bold',
            onClick: (jurisdiction) =>
              handleToggleStatus(
                (jurisdiction as TaxJurisdiction)._id,
                (jurisdiction as TaxJurisdiction).status === 'active'
              ),
            color: 'warning',
          },
        ]}
      />
    </DashboardContent>
  );
}
