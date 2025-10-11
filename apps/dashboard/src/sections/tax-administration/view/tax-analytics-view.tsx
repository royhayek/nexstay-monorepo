'use client';

import type {
  MonthlyTrendDto,
  TaxTypeBreakdownDto,
  TaxAdminControllerGetTaxAnalyticsParams,
} from 'src/api/models/admin';

import React, { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';

import { fPercent, fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useTaxAdminControllerGetTaxAnalytics,
  useTaxAdminControllerGetJurisdictionOptions,
} from 'src/api/queries/admin/tax-management/tax-management';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';
import { ErrorState } from 'src/components/error-state';
import { LoadingState } from 'src/components/loading-state';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 3 months' },
  { value: '1y', label: 'Last year' },
  { value: 'ytd', label: 'Year to date' },
];

export function TaxAnalyticsView() {
  const [period, setPeriod] = useState('30d');
  const [jurisdictionId, setJurisdictionId] = useState('all');

  const queryParams = useMemo((): TaxAdminControllerGetTaxAnalyticsParams => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      jurisdictionId: jurisdictionId !== 'all' ? jurisdictionId : undefined,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    };
  }, [period, jurisdictionId]);

  const { data, isLoading, error, refetch } = useTaxAdminControllerGetTaxAnalytics(queryParams);

  // Fetch jurisdictions for dropdown
  const { data: jurisdictionsData } = useTaxAdminControllerGetJurisdictionOptions({
    country: 'LB', // Filter by Lebanon
  });

  const analyticsData = useMemo(() => data?.data, [data]);

  const jurisdictionOptions = useMemo(() => {
    const jurisdictions = jurisdictionsData?.data || [];
    return [
      { value: 'all', label: 'All Jurisdictions' },
      ...jurisdictions.map((jurisdiction) => ({
        value: jurisdiction.id,
        label: jurisdiction.displayName,
      })),
    ];
  }, [jurisdictionsData]);

  const timelineChartOptions = useChart({
    xaxis: {
      categories:
        analyticsData?.monthlyTrends?.map((item: MonthlyTrendDto) =>
          new Date(item.month + '-01').toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
          })
        ) || [],
    },
    yaxis: [
      {
        title: { text: 'Tax Amount ($)' },
        labels: {
          formatter: (val: number) => fCurrency(val),
        },
      },
    ],
  });

  const topTaxTypesChartOptions = useChart({
    chart: { type: 'donut' },
    labels: analyticsData?.topTaxTypes?.map((item: TaxTypeBreakdownDto) => item.type) || [],
    legend: { position: 'bottom' },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => fCurrency(analyticsData?.totalTaxCollected || 0),
            },
          },
        },
      },
    },
  });

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Tax Analytics"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Tax Administration', href: paths.dashboard.taxAdministration.root },
            { name: 'Analytics' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <ErrorState
          title="Failed to load tax analytics"
          subtitle="There was an error loading the tax analytics. Please try again."
          onRetry={refetch}
          variant="card"
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Tax Analytics"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Tax Administration', href: paths.dashboard.taxAdministration.root },
          { name: 'Analytics' },
        ]}
        action={
          <Stack direction="row" spacing={2}>
            <TextField
              select
              size="small"
              label="Period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {PERIOD_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Jurisdiction"
              value={jurisdictionId}
              onChange={(e) => setJurisdictionId(e.target.value)}
              sx={{ minWidth: 160 }}
              disabled={!jurisdictionOptions.length}
            >
              {jurisdictionOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {isLoading ? (
        <LoadingState title="Loading analytics..." variant="card" size="large" fullHeight />
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: 'success.lighter',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify
                        icon="solar:dollar-minimalistic-bold"
                        width={32}
                        color="success.main"
                      />
                    </Box>
                    <Stack>
                      <Typography variant="h4">
                        {fCurrency(analyticsData?.totalTaxCollected || 0)}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Tax Collected
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: 'info.lighter',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="solar:bill-list-bold" width={32} color="info.main" />
                    </Box>
                    <Stack>
                      <Typography variant="h4">
                        {fCurrency(analyticsData?.totalTaxRemitted || 0)}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Tax Remitted
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: 'warning.lighter',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="solar:percent-bold" width={32} color="warning.main" />
                    </Box>
                    <Stack>
                      <Typography variant="h4">
                        {fCurrency(analyticsData?.totalTaxOwed || 0)}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Tax Owed
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: 'primary.lighter',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="solar:shield-check-bold" width={32} color="primary.main" />
                    </Box>
                    <Stack>
                      <Typography variant="h4">
                        {fPercent(analyticsData?.complianceRate || 0)}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Compliance Rate
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            {analyticsData?.monthlyTrends && analyticsData.monthlyTrends.length > 0 && (
              <Grid size={{ xs: 12, lg: 8 }}>
                <Card>
                  <CardHeader title="Monthly Tax Trends" />
                  <CardContent>
                    <Chart
                      type="line"
                      series={[
                        {
                          name: 'Tax Amount',
                          type: 'column',
                          data:
                            analyticsData?.monthlyTrends?.map(
                              (item: MonthlyTrendDto) => item.amount
                            ) || [],
                        },
                      ]}
                      options={timelineChartOptions}
                      sx={{ height: 320 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            )}

            {analyticsData?.topTaxTypes && analyticsData.topTaxTypes.length > 0 && (
              <Grid
                size={{
                  xs: 12,
                  lg:
                    analyticsData?.monthlyTrends && analyticsData.monthlyTrends.length > 0 ? 4 : 6,
                }}
              >
                <Card sx={{ height: '100%' }}>
                  <CardHeader title="Top Tax Types" />
                  <CardContent>
                    <Chart
                      type="donut"
                      series={
                        analyticsData?.topTaxTypes?.map(
                          (item: TaxTypeBreakdownDto) => item.amount
                        ) || []
                      }
                      options={topTaxTypesChartOptions}
                      sx={{ height: 280 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            )}

            {analyticsData?.topTaxTypes && analyticsData.topTaxTypes.length > 0 && (
              <Grid size={{ xs: 12, lg: 6 }}>
                <Card>
                  <CardHeader title="Tax Types Breakdown" />
                  <CardContent>
                    <Stack spacing={2}>
                      {analyticsData.topTaxTypes.map((item: TaxTypeBreakdownDto, index: number) => (
                        <Stack key={index} spacing={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2">{item.type}</Typography>
                            <Stack alignItems="flex-end">
                              <Typography variant="subtitle2" color="primary.main">
                                {fCurrency(item.amount)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {fPercent(item.percentage)}
                              </Typography>
                            </Stack>
                          </Stack>
                          <Divider />
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </DashboardContent>
  );
}
