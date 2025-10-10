'use client';

import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';

import { DashboardContent } from 'src/layouts/dashboard';
import { useAnalyticsControllerGetDashboardOverviewV1 } from 'src/api/queries/analytics/analytics';

import { AppNewInvoice } from '../app-new-invoice';
import { AppTopAuthors } from '../app-top-authors';
import { AppAreaInstalled } from '../app-area-installed';
import { AppWidgetSummary } from '../app-widget-summary';
import { AppCurrentDownload } from '../app-current-download';
import { AppTopInstalledCountries } from '../app-top-installed-countries';

// ----------------------------------------------------------------------

export function OverviewAppView() {
  const theme = useTheme();

  const { data: dashboardData } = useAnalyticsControllerGetDashboardOverviewV1();

  const metrics = dashboardData?.data?.metrics || [];
  const platformDistribution = dashboardData?.data?.platformDistribution || [];
  const regionalData = dashboardData?.data?.regionalData || [];
  const monthlyTrends = dashboardData?.data?.monthlyTrends || [];
  const topHosts = dashboardData?.data?.topHosts || [];
  const recentInvoices = dashboardData?.data?.recentInvoices || [];

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        {/* Render metrics from analytics API */}
        {metrics.slice(0, 3).map((metric, index) => {
          const colors = [
            theme.palette.primary.main,
            theme.palette.info.main,
            theme.palette.error.main,
          ];

          return (
            <Grid key={metric.label} size={{ xs: 12, md: 4 }}>
              <AppWidgetSummary
                title={metric.label}
                percent={metric.change}
                total={metric.value}
                chart={{
                  colors: [colors[index % 3]],
                  categories: monthlyTrends.map((trend) => trend.period),
                  series: monthlyTrends.map((trend) => trend.value),
                }}
              />
            </Grid>
          );
        })}

        {/* Fallback widgets if no metrics available */}
        {metrics.length === 0 && (
          <>
            <Grid size={{ xs: 12, md: 4 }}>
              <AppWidgetSummary
                title="Total Users"
                percent={0}
                total={0}
                chart={{
                  categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                  series: [0, 0, 0, 0, 0, 0, 0, 0],
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <AppWidgetSummary
                title="Total Bookings"
                percent={0}
                total={0}
                chart={{
                  colors: [theme.palette.info.main],
                  categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                  series: [0, 0, 0, 0, 0, 0, 0, 0],
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <AppWidgetSummary
                title="Total Revenue"
                percent={0}
                total={0}
                chart={{
                  colors: [theme.palette.error.main],
                  categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                  series: [0, 0, 0, 0, 0, 0, 0, 0],
                }}
              />
            </Grid>
          </>
        )}

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AppCurrentDownload
            title="Platform Distribution"
            subheader="Bookings by platform"
            chart={{
              series:
                platformDistribution.length > 0
                  ? platformDistribution.map((item) => ({
                      label: item.platform,
                      value: item.value,
                    }))
                  : [
                      { label: 'Web', value: 0 },
                      { label: 'Mobile', value: 0 },
                      { label: 'Tablet', value: 0 },
                      { label: 'Desktop', value: 0 },
                    ],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <AppAreaInstalled
            title="Regional Performance"
            subheader={
              regionalData.length > 0 ? `Top regions by bookings` : 'No regional data available'
            }
            chart={{
              categories: monthlyTrends.map((trend) => trend.period),
              series:
                regionalData.length > 0
                  ? regionalData.slice(0, 3).map((region) => ({
                      name: region.region || '',
                      data: [
                        { name: region.region || '', data: monthlyTrends.map(() => region.value) },
                      ],
                    }))
                  : [
                      {
                        name: 'No Data',
                        data: [
                          { name: 'Region 1', data: Array(12).fill(0) },
                          { name: 'Region 2', data: Array(12).fill(0) },
                          { name: 'Region 3', data: Array(12).fill(0) },
                        ],
                      },
                    ],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <AppNewInvoice
            title="Recent Invoices"
            tableData={recentInvoices}
            headCells={[
              { id: 'id', label: 'Invoice ID' },
              { id: 'category', label: 'Category' },
              { id: 'price', label: 'Price' },
              { id: 'status', label: 'Status' },
              { id: '' },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AppTopAuthors title="Top Hosts" list={topHosts} />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AppTopInstalledCountries title="Top Regions" list={regionalData} />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
