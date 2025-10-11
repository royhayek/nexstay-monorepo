'use client';

import type { DynamicTableColumn } from 'src/components/dynamic-table';
import type {
  TaxReportDataDto,
  GenerateTaxReportDto,
  GenerateReportFileDtoFormat,
  TaxAdminControllerGetTaxReportsParams,
} from 'src/api/models/admin';

import { useSetState } from 'minimal-shared/hooks';
import React, { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  GenerateTaxReportDtoReportingPeriod,
  TaxAdminControllerGetTaxReportsComplianceStatus,
} from 'src/api/models/admin';
import {
  useTaxAdminControllerGetTaxReports,
  useTaxAdminControllerGenerateTaxReport,
  taxAdminControllerGetReportDownloadUrl,
  useTaxAdminControllerGenerateReportFile,
  useTaxAdminControllerGetJurisdictionOptions,
} from 'src/api/queries/admin/tax-management/tax-management';

import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { Iconify } from 'src/components/iconify';
import { ErrorState } from 'src/components/error-state';
import { DynamicTable } from 'src/components/dynamic-table';
import { LoadingState } from 'src/components/loading-state';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

// Using TaxReportDataDto from API instead of local interface

const createTableColumns = (): DynamicTableColumn<TaxReportDataDto>[] => [
  {
    id: 'reportId',
    label: 'Report',
    width: 400,
    render: (report) => (
      <Stack spacing={0.5}>
        <Box sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{report.reportId}</Box>
        <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
          {typeof report.jurisdictionId === 'string'
            ? report.jurisdictionId
            : (report.jurisdictionId as any)?.name || (report.jurisdictionId as any)?._id || 'N/A'}
        </Box>
      </Stack>
    ),
  },
  {
    id: 'reportingPeriod',
    label: 'Reporting Period',
    width: 120,
    render: (report) => (
      <Chip
        label={
          report.reportingPeriod?.charAt(0).toUpperCase() + report.reportingPeriod?.slice(1) ||
          'N/A'
        }
        size="small"
        variant="outlined"
        color="info"
      />
    ),
  },
  {
    id: 'periodStart',
    label: 'Period',
    width: 300,
    render: (report) => (
      <Stack spacing={0.25}>
        <Box sx={{ typography: 'caption' }}>
          From: {new Date(report.periodStart).toLocaleDateString()}
        </Box>
        <Box sx={{ typography: 'caption' }}>
          To: {new Date(report.periodEnd).toLocaleDateString()}
        </Box>
      </Stack>
    ),
  },
  {
    id: 'totalTaxCollected',
    label: 'Tax Collected',
    width: 140,
    align: 'right',
    render: (report) => (
      <Box sx={{ fontWeight: 600, color: 'success.main' }}>
        {fCurrency(report.totalTaxCollected || 0)}
      </Box>
    ),
  },
  {
    id: 'numberOfBookings',
    label: 'Bookings',
    width: 120,
    align: 'center',
  },
  {
    id: 'complianceStatus',
    label: 'Status',
    width: 120,
    align: 'center',
    render: (report) => {
      const statusConfig = {
        compliant: { color: 'success' as const, label: 'Compliant' },
        non_compliant: { color: 'error' as const, label: 'Non-Compliant' },
        pending_review: { color: 'warning' as const, label: 'Pending Review' },
        exempted: { color: 'info' as const, label: 'Exempted' },
      };

      const config = statusConfig[report.complianceStatus as keyof typeof statusConfig] || {
        color: 'default' as const,
        label: 'Unknown',
      };

      return <Chip label={config.label} color={config.color} variant="soft" size="small" />;
    },
  },
  {
    id: 'createdAt',
    label: 'Booked',
    width: 140,
    render: (booking) => (
      <ListItemText
        primary={fDate(booking.createdAt)}
        secondary={fTime(booking.createdAt)}
        slotProps={{
          primary: {
            noWrap: true,
            sx: { typography: 'body2' },
          },
          secondary: {
            sx: { mt: 0.5, typography: 'caption' },
          },
        }}
      />
    ),
  },
];

// ----------------------------------------------------------------------

interface TaxReportFilter extends Record<string, unknown> {
  search: string;
  type: string[];
  jurisdiction: string[];
  status: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: TaxAdminControllerGetTaxReportsComplianceStatus.compliant, label: 'Compliant' },
  { value: TaxAdminControllerGetTaxReportsComplianceStatus.non_compliant, label: 'Non-Compliant' },
  {
    value: TaxAdminControllerGetTaxReportsComplianceStatus.pending_review,
    label: 'Pending Review',
  },
  { value: TaxAdminControllerGetTaxReportsComplianceStatus.exempted, label: 'Exempted' },
];

const REPORTING_PERIOD_OPTIONS = [
  { value: GenerateTaxReportDtoReportingPeriod.monthly, label: 'Monthly' },
  { value: GenerateTaxReportDtoReportingPeriod.quarterly, label: 'Quarterly' },
  { value: GenerateTaxReportDtoReportingPeriod.annually, label: 'Annually' },
  { value: GenerateTaxReportDtoReportingPeriod.weekly, label: 'Weekly' },
  { value: GenerateTaxReportDtoReportingPeriod.daily, label: 'Daily' },
];

export function TaxReportsView() {
  const table = useTable();
  const [reportForm, setReportForm] = useState({
    jurisdictionId: '',
    reportingPeriod: GenerateTaxReportDtoReportingPeriod.monthly,
    periodStart: '',
    periodEnd: '',
  });

  const filters = useSetState<TaxReportFilter>({
    search: '',
    type: [],
    jurisdiction: [],
    status: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const tableColumns = useMemo(() => createTableColumns(), []);

  const queryParams = useMemo((): TaxAdminControllerGetTaxReportsParams => {
    const params: TaxAdminControllerGetTaxReportsParams = {
      page: table.page,
      limit: table.rowsPerPage,
    };

    if (currentFilters.jurisdiction.length > 0) {
      params.jurisdictionId = currentFilters.jurisdiction[0]; // Take first jurisdiction ID
    }

    if (currentFilters.status !== 'all') {
      params.complianceStatus = currentFilters.status as any;
    }

    return params;
  }, [table.page, table.rowsPerPage, currentFilters]);

  const { data, isLoading, error, refetch } = useTaxAdminControllerGetTaxReports(queryParams);
  const { mutate: generateReport, isPending: isGenerating } =
    useTaxAdminControllerGenerateTaxReport();
  const { mutate: generateReportFile, isPending: isGeneratingFile } =
    useTaxAdminControllerGenerateReportFile();

  // Fetch jurisdictions for dropdown
  const { data: jurisdictionsData } = useTaxAdminControllerGetJurisdictionOptions({
    country: 'LB', // Filter by Lebanon
  });

  const reportsList = useMemo(() => data?.data?.items || [], [data]);

  const jurisdictionOptions = useMemo(() => {
    const jurisdictions = jurisdictionsData?.data || [];
    return jurisdictions.map((jurisdiction) => ({
      value: jurisdiction.id,
      label: jurisdiction.displayName,
    }));
  }, [jurisdictionsData]);

  const canResetFilters = useCallback(
    (filterState: TaxReportFilter) =>
      !!filterState.search ||
      filterState.type.length > 0 ||
      filterState.jurisdiction.length > 0 ||
      filterState.status !== 'all',
    []
  );

  const handleTabChange = useCallback(
    (newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleGenerateReport = useCallback(() => {
    if (!reportForm.jurisdictionId || !reportForm.periodStart || !reportForm.periodEnd) {
      toast.error('Please fill in all required fields');
      return;
    }

    const reportData: GenerateTaxReportDto = {
      jurisdictionId: reportForm.jurisdictionId,
      reportingPeriod: reportForm.reportingPeriod,
      periodStart: reportForm.periodStart,
      periodEnd: reportForm.periodEnd,
    };

    generateReport(
      { data: reportData },
      {
        onSuccess: () => {
          toast.success('Tax report generation started');
          refetch();
          setReportForm({
            jurisdictionId: '',
            reportingPeriod: GenerateTaxReportDtoReportingPeriod.monthly,
            periodStart: '',
            periodEnd: '',
          });
        },
        onError: () => {
          toast.error('Failed to generate tax report');
        },
      }
    );
  }, [generateReport, reportForm, refetch]);

  const handleDownloadReport = useCallback(
    (report: TaxReportDataDto, format: 'pdf' | 'xlsx' | 'csv' = 'pdf') => {
      // First generate the report file in the specified format
      generateReportFile(
        {
          reportId: report._id,
          data: { format: format as GenerateReportFileDtoFormat },
        },
        {
          onSuccess: async () => {
            try {
              // Use the proper API client to get download URL
              const downloadResponse = await taxAdminControllerGetReportDownloadUrl(report._id);

              if (downloadResponse.data?.downloadUrl) {
                // Create a temporary anchor element to trigger download
                const link = document.createElement('a');
                link.href = downloadResponse.data.downloadUrl;
                link.download = `tax-report-${report.reportId}-${format}.${format}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast.success(`${format.toUpperCase()} report downloaded successfully`);
              } else {
                toast.error('Download URL not available');
              }
            } catch (downloadError) {
              toast.error('Failed to get download URL');
            }
          },
          onError: () => {
            toast.error(`Failed to generate ${format.toUpperCase()} report`);
          },
        }
      );
    },
    [generateReportFile]
  );

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Tax Reports"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Tax Administration', href: paths.dashboard.taxAdministration.root },
            { name: 'Reports' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <ErrorState
          title="Failed to load tax reports"
          subtitle="There was an error loading the tax reports. Please try again."
          onRetry={refetch}
          variant="card"
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Tax Reports"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Tax Administration', href: paths.dashboard.taxAdministration.root },
          { name: 'Reports' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 3 }}>
          <Card>
            <CardHeader title="Generate New Report" />
            <CardContent>
              <Stack spacing={3}>
                <TextField
                  select
                  fullWidth
                  label="Reporting Period"
                  value={reportForm.reportingPeriod}
                  onChange={(e) =>
                    setReportForm({
                      ...reportForm,
                      reportingPeriod: e.target.value as any,
                    })
                  }
                >
                  {REPORTING_PERIOD_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  label="Jurisdiction"
                  value={reportForm.jurisdictionId}
                  onChange={(e) => setReportForm({ ...reportForm, jurisdictionId: e.target.value })}
                  disabled={!jurisdictionOptions.length}
                  helperText={!jurisdictionOptions.length ? 'Loading jurisdictions...' : ''}
                  required
                >
                  {jurisdictionOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  type="date"
                  fullWidth
                  label="Period Start"
                  value={reportForm.periodStart}
                  onChange={(e) => setReportForm({ ...reportForm, periodStart: e.target.value })}
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                  required
                />

                <TextField
                  type="date"
                  fullWidth
                  label="Period End"
                  value={reportForm.periodEnd}
                  onChange={(e) => setReportForm({ ...reportForm, periodEnd: e.target.value })}
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                  required
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  startIcon={
                    isGenerating ? (
                      <LoadingState variant="circular" size="small" />
                    ) : (
                      <Iconify icon="solar:document-add-bold" />
                    )
                  }
                >
                  {isGenerating ? 'Generating...' : 'Generate Report'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <DynamicTable
            data={reportsList}
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
              searchKey: 'search',
              searchPlaceholder: 'Search reports...',
              showFiltersResult: true,
              canResetFilters,
              filterFields: [
                {
                  id: 'type',
                  label: 'Reporting Period',
                  type: 'multiselect',
                  name: 'type',
                  options: REPORTING_PERIOD_OPTIONS,
                },
                {
                  id: 'jurisdiction',
                  label: 'Jurisdiction',
                  type: 'multiselect',
                  name: 'jurisdiction',
                  options: jurisdictionOptions,
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
              minWidth: 900,
            }}
            rowActions={[
              {
                label: 'Download PDF',
                icon: 'solar:download-bold',
                onClick: (report: any) => handleDownloadReport(report as TaxReportDataDto, 'pdf'),
                color: 'primary',
                disabled: () => isGeneratingFile,
              },
              {
                label: 'Download Excel',
                icon: 'solar:file-excel-bold',
                onClick: (report: any) => handleDownloadReport(report as TaxReportDataDto, 'xlsx'),
                color: 'success',
                disabled: () => isGeneratingFile,
              },
              {
                label: 'Download CSV',
                icon: 'solar:file-csv-bold',
                onClick: (report: any) => handleDownloadReport(report as TaxReportDataDto, 'csv'),
                color: 'info',
                disabled: () => isGeneratingFile,
              },
              {
                label: 'Retry',
                icon: 'solar:refresh-bold',
                onClick: () => handleGenerateReport(),
                color: 'warning',
              },
            ]}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
