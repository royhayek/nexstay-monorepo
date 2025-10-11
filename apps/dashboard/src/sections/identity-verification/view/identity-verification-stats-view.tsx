'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';

import { fNumber, fPercent } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { useIdentityVerificationAdminControllerGetVerificationStats } from 'src/api/queries/admin/identity-verification-management/identity-verification-management';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';
import { ErrorState } from 'src/components/error-state';
import { LoadingState } from 'src/components/loading-state';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function IdentityVerificationStatsView() {
  const { data, isLoading, error, refetch } =
    useIdentityVerificationAdminControllerGetVerificationStats();

  const stats = useMemo(() => data?.data, [data]);

  // Chart configurations
  const statusChartOptions = useChart({
    chart: { type: 'donut' },
    labels: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Expired'],
    legend: { position: 'bottom' },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => fNumber(stats?.totalVerifications || 0),
            },
          },
        },
      },
    },
    colors: ['#FFAB00', '#00B8D4', '#00C853', '#FF5252', '#9E9E9E'],
  });

  const documentTypeChartOptions = useChart({
    chart: { type: 'bar' },
    xaxis: {
      categories: ['Passport', 'National ID', "Driver's License", 'Residence Permit'],
    },
    yaxis: {
      title: { text: 'Count' },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
      },
    },
  });

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Verification Statistics"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Identity Verification', href: paths.dashboard.identityVerification.list },
            { name: 'Statistics' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <ErrorState
          title="Failed to load verification statistics"
          subtitle="There was an error loading the verification statistics. Please try again."
          onRetry={refetch}
          variant="card"
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Verification Statistics"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Identity Verification', href: paths.dashboard.identityVerification.list },
          { name: 'Statistics' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {isLoading ? (
        <LoadingState title="Loading statistics..." variant="card" size="large" fullHeight />
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
                        bgcolor: 'primary.lighter',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="solar:documents-bold" width={32} color="primary.main" />
                    </Box>
                    <Stack>
                      <Typography variant="h4">
                        {fNumber(stats?.totalVerifications || 0)}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Verifications
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
                      <Iconify icon="solar:clock-circle-bold" width={32} color="warning.main" />
                    </Box>
                    <Stack>
                      <Typography variant="h4">
                        {fNumber(stats?.pendingVerifications || 0)}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Pending Review
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
                        bgcolor: 'success.lighter',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify icon="solar:check-circle-bold" width={32} color="success.main" />
                    </Box>
                    <Stack>
                      <Typography variant="h4">
                        {fNumber(stats?.approvedVerifications || 0)}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Approved
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
                      <Iconify icon="solar:percent-bold" width={32} color="info.main" />
                    </Box>
                    <Stack>
                      <Typography variant="h4">{fPercent(stats?.approvalRate || 0)}</Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Approval Rate
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Card>
                <CardHeader title="Verification Status Distribution" />
                <CardContent>
                  <Chart
                    type="donut"
                    series={[
                      stats?.pendingVerifications || 0,
                      stats?.underReviewVerifications || 0,
                      stats?.approvedVerifications || 0,
                      stats?.rejectedVerifications || 0,
                      stats?.expiredVerifications || 0,
                    ]}
                    options={statusChartOptions}
                    sx={{ height: 320 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, lg: 6 }}>
              <Card>
                <CardHeader title="Document Types Distribution" />
                <CardContent>
                  <Chart
                    type="bar"
                    series={[
                      {
                        name: 'Count',
                        data: [
                          stats?.documentTypeStats?.passport || 0,
                          stats?.documentTypeStats?.national_id || 0,
                          stats?.documentTypeStats?.drivers_license || 0,
                          stats?.documentTypeStats?.residence_permit || 0,
                        ],
                      },
                    ]}
                    options={documentTypeChartOptions}
                    sx={{ height: 320 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Additional Stats */}
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardHeader title="Additional Statistics" />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Stack spacing={1} alignItems="center" sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="error.main">
                          {fNumber(stats?.rejectedVerifications || 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Rejected Verifications
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Stack spacing={1} alignItems="center" sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="text.secondary">
                          {fNumber(stats?.expiredVerifications || 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Expired Verifications
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Stack spacing={1} alignItems="center" sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="info.main">
                          {fNumber(stats?.underReviewVerifications || 0)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Under Review
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Stack spacing={1} alignItems="center" sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="primary.main">
                          {stats?.averageProcessingTime || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Avg. Processing Time
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </DashboardContent>
  );
}
