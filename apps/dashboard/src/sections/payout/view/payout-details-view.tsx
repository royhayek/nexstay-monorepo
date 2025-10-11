'use client';

import type { PayoutResponseDto } from 'src/api/models/admin';

import { useState, useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import ButtonGroup from '@mui/material/ButtonGroup';

import { paths } from 'src/routes/paths';

import { fDateTime } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { usePayoutsAdminControllerGetPayoutById } from 'src/api/queries/admin/payouts-management/payouts-management';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ErrorState } from 'src/components/error-state';
import { LoadingState } from 'src/components/loading-state';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

interface PayoutDetailsViewProps {
  id: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'processing':
      return 'info';
    case 'in_transit':
      return 'primary';
    case 'completed':
      return 'success';
    case 'failed':
      return 'error';
    case 'cancelled':
      return 'default';
    case 'returned':
      return 'secondary';
    default:
      return 'default';
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'instant':
      return 'success';
    case 'standard':
      return 'primary';
    case 'manual':
      return 'warning';
    case 'emergency':
      return 'error';
    default:
      return 'default';
  }
};

const getProviderColor = (provider: string) => {
  switch (provider) {
    case 'stripe':
      return 'primary';
    case 'paypal':
      return 'info';
    case 'aps':
      return 'secondary';
    case 'bank_transfer':
      return 'success';
    case 'manual':
      return 'warning';
    default:
      return 'default';
  }
};

export function PayoutDetailsView({ id }: PayoutDetailsViewProps) {
  const [statusUpdateReason, setStatusUpdateReason] = useState('');
  const confirmStatusUpdate = useBoolean();

  const { data, isLoading, error, refetch } = usePayoutsAdminControllerGetPayoutById(id);

  const payout = data;

  const handleUpdateStatus = useCallback(() => {
    if (!payout) return;

    updatePayoutStatus({ payoutId: payout.id });
  }, [payout, updatePayoutStatus]);

  const renderAmountCard = (
    title: string,
    amount: number,
    currency: string,
    icon: string,
    color = 'primary'
  ) => (
    <Card sx={{ textAlign: 'center', py: 2 }}>
      <Stack spacing={1} alignItems="center">
        <Iconify icon={icon} width={32} sx={{ color: `${color}.main` }} />
        <Typography variant="h4" sx={{ color: 'text.primary' }}>
          {fCurrency(amount)}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {title} ({currency})
        </Typography>
      </Stack>
    </Card>
  );

  const renderStatusCard = (payoutData: PayoutResponseDto) => (
    <Card>
      <CardHeader
        title="Payout Status"
        avatar={
          <Iconify icon="solar:wallet-money-bold" width={24} sx={{ color: 'primary.main' }} />
        }
      />
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
              Status:
            </Typography>
            <Label variant="soft" color={getStatusColor(payoutData.status)}>
              {payoutData.status.replace('_', ' ')}
            </Label>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
              Type:
            </Typography>
            <Label variant="soft" color={getTypeColor(payoutData.type)}>
              {payoutData.type}
            </Label>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
              Provider:
            </Typography>
            <Label variant="soft" color={getProviderColor(payoutData.provider)}>
              {payoutData.provider.replace('_', ' ')}
            </Label>
          </Box>

          {payoutData.providerPayoutId && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
                Provider Payout ID:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {payoutData.providerPayoutId}
              </Typography>
            </Box>
          )}

          <Divider />

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
              Reference:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {payoutData.reference}
            </Typography>
          </Box>

          {payoutData.description && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
                Description:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {payoutData.description}
              </Typography>
            </Box>
          )}

          {(payoutData.failureReason || payoutData.failureCode) && (
            <>
              <Divider />
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'fontWeightMedium', color: 'error.main' }}
                >
                  Failure Information:
                </Typography>
                {payoutData.failureReason && (
                  <Typography variant="body2" color="error.main">
                    Reason: {payoutData.failureReason}
                  </Typography>
                )}
                {payoutData.failureCode && (
                  <Typography variant="body2" color="error.main">
                    Code: {payoutData.failureCode}
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  const renderDatesCard = (payoutData: PayoutResponseDto) => (
    <Card>
      <CardHeader
        title="Timeline"
        avatar={<Iconify icon="solar:calendar-bold" width={24} sx={{ color: 'primary.main' }} />}
      />
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
              Payout Date:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fDateTime(payoutData.payoutDate)}
            </Typography>
          </Box>

          {payoutData.expectedArrival && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
                Expected Arrival:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {fDateTime(payoutData.expectedArrival)}
              </Typography>
            </Box>
          )}

          {payoutData.completedAt && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
                Completed At:
              </Typography>
              <Typography variant="body2" color="success.main">
                {fDateTime(payoutData.completedAt)}
              </Typography>
            </Box>
          )}

          {payoutData.failedAt && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
                Failed At:
              </Typography>
              <Typography variant="body2" color="error.main">
                {fDateTime(payoutData.failedAt)}
              </Typography>
            </Box>
          )}

          <Divider />

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
              Created:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fDateTime(payoutData.createdAt)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
              Last Updated:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {fDateTime(payoutData.updatedAt)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  const renderBookingsCard = (payoutData: PayoutResponseDto) => (
    <Card>
      <CardHeader
        title={`Associated Bookings (${payoutData.bookings.length})`}
        avatar={<Iconify icon="solar:bookmark-bold" width={24} sx={{ color: 'primary.main' }} />}
      />
      <CardContent>
        <Stack spacing={2}>
          {payoutData.bookings.map((booking, index) => (
            <Box key={index} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
                Booking ID: {booking.bookingId}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Amount: {fCurrency(booking.amount)} {booking.currency}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );

  const renderFeesCard = (payoutData: PayoutResponseDto) => (
    <Card>
      <CardHeader
        title="Fee Breakdown"
        avatar={<Iconify icon="solar:calculator-bold" width={24} sx={{ color: 'primary.main' }} />}
      />
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Platform Fee:</Typography>
            <Typography variant="body2">
              {fCurrency(payoutData.fees.platformFee)} {payoutData.fees.currency}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Processing Fee:</Typography>
            <Typography variant="body2">
              {fCurrency(payoutData.fees.processingFee)} {payoutData.fees.currency}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
              Total Fees:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
              {fCurrency(payoutData.fees.platformFee + payoutData.fees.processingFee)}{' '}
              {payoutData.fees.currency}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <LoadingState title="Loading payout details..." variant="card" size="large" fullHeight />
    );
  }

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Payout Details"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Payouts', href: paths.dashboard.payouts.list },
            { name: 'Details' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <ErrorState
          title="Failed to load payout details"
          description="There was an error loading the payout information."
          onRetry={() => refetch()}
          variant="card"
        />
      </DashboardContent>
    );
  }

  if (!payout) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Payout Details"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Payouts', href: paths.dashboard.payouts.list },
            { name: 'Details' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <ErrorState
          title="Payout not found"
          description="The requested payout could not be found."
          variant="card"
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`Payout: ${payout.reference}`}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Payouts', href: paths.dashboard.payouts.list },
          { name: payout.reference },
        ]}
        action={
          <ButtonGroup
            variant="contained"
            disabled={payout.status === 'completed' || payout.status === 'cancelled'}
          >
            <Button
              onClick={confirmStatusUpdate.onTrue}
              startIcon={<Iconify icon="solar:refresh-bold" />}
              disabled={updatingStatus}
            >
              Update Status
            </Button>
          </ButtonGroup>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          {renderAmountCard(
            'Gross Amount',
            payout.grossAmount.amount,
            payout.grossAmount.currency,
            'solar:wallet-bold',
            'info'
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {renderAmountCard(
            'Net Amount',
            payout.netAmount.amount,
            payout.netAmount.currency,
            'solar:wallet-money-bold',
            'success'
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          {renderAmountCard(
            'Total Fees',
            payout.fees.platformFee + payout.fees.processingFee,
            payout.fees.currency,
            'solar:calculator-bold',
            'warning'
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          {renderStatusCard(payout)}
        </Grid>

        <Grid item xs={12} md={6}>
          {renderDatesCard(payout)}
        </Grid>

        <Grid item xs={12} md={6}>
          {renderFeesCard(payout)}
        </Grid>

        <Grid item xs={12} md={6}>
          {renderBookingsCard(payout)}
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirmStatusUpdate.value}
        onClose={confirmStatusUpdate.onFalse}
        title="Update Payout Status"
        content={
          <Stack spacing={2}>
            <Typography>
              Are you sure you want to update the status of this payout? This action will attempt to
              process the next step in the payout lifecycle.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason (optional)"
              value={statusUpdateReason}
              onChange={(e) => setStatusUpdateReason(e.target.value)}
              placeholder="Enter reason for status update..."
            />
          </Stack>
        }
        action={
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdateStatus}
            disabled={updatingStatus}
          >
            {updatingStatus ? 'Updating...' : 'Update Status'}
          </Button>
        }
      />
    </DashboardContent>
  );
}
