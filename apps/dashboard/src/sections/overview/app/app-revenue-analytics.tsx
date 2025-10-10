'use client';

import type { AnalyticsControllerGetRevenueMetricsV1Params } from 'src/api/models';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useAnalyticsControllerGetRevenueMetricsV1 } from 'src/api/queries/analytics/analytics';

// ----------------------------------------------------------------------

const PERIOD_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

// ----------------------------------------------------------------------

export function AppRevenueAnalytics() {
  const [period, setPeriod] = useState<string>('month');

  const {
    data: revenueMetrics,
    isLoading,
    error,
  } = useAnalyticsControllerGetRevenueMetricsV1({
    period: period as AnalyticsControllerGetRevenueMetricsV1Params['period'],
  });

  const handlePeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPeriod(event.target.value);
  };

  return (
    <Card>
      <CardHeader
        title="Revenue Analytics"
        subheader="Revenue tracking and financial metrics"
        action={
          <TextField
            select
            size="small"
            value={period}
            onChange={handlePeriodChange}
            sx={{ minWidth: 120 }}
            SelectProps={{ native: false }}
          >
            {PERIOD_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        }
      />

      <Box sx={{ p: 3 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography variant="body2" color="error.main" sx={{ textAlign: 'center', py: 4 }}>
            Failed to load revenue analytics data
          </Typography>
        )}

        {!isLoading && !error && (
          <>
            {revenueMetrics?.data ? (
              <Typography variant="body2" color="text.secondary">
                Revenue analytics data loaded successfully for{' '}
                {PERIOD_OPTIONS.find((p) => p.value === period)?.label?.toLowerCase()} period
              </Typography>
            ) : (
              <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>
                No revenue analytics data available for the selected period
              </Typography>
            )}
          </>
        )}
      </Box>
    </Card>
  );
}
