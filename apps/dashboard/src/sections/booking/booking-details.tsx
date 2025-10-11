'use client';

import React, { useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fDateTime } from 'src/utils/format-time';

import {
  useBookingsAdminControllerGetBookingById,
  useBookingsAdminControllerConfirmBooking,
  useBookingsAdminControllerCheckInBooking,
  useBookingsAdminControllerCheckOutBooking,
  useBookingsAdminControllerForceCancelBooking,
} from 'src/api/queries/admin/bookings-management/bookings-management';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ErrorState } from 'src/components/error-state';
import { LoadingState } from 'src/components/loading-state';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'confirmed':
      return 'info';
    case 'checked_in':
      return 'success';
    case 'checked_out':
      return 'default';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getPaymentStatusColor = (paymentStatus: string) => {
  switch (paymentStatus) {
    case 'pending':
      return 'warning';
    case 'paid':
      return 'success';
    case 'refunded':
      return 'info';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

// ----------------------------------------------------------------------

interface Props {
  bookingId: string;
}

export function BookingDetails({ bookingId }: Props) {
  const confirmBookingDialog = useBoolean();
  const checkInDialog = useBoolean();
  const checkOutDialog = useBoolean();
  const cancelDialog = useBoolean();
  const { data, isLoading, error, refetch } = useBookingsAdminControllerGetBookingById(bookingId);

  const { mutate: confirmBooking } = useBookingsAdminControllerConfirmBooking();
  const { mutate: checkInBooking } = useBookingsAdminControllerCheckInBooking();
  const { mutate: checkOutBooking } = useBookingsAdminControllerCheckOutBooking();
  const { mutate: cancelBooking } = useBookingsAdminControllerForceCancelBooking();

  const booking = data?.data;

  const handleConfirmBooking = useCallback(() => {
    if (!booking) return;
    confirmBooking(
      { id: booking._id },
      {
        onSuccess: () => {
          toast.success('Booking confirmed successfully');
          refetch();
          confirmBookingDialog.onFalse();
        },
        onError: () => {
          toast.error('Failed to confirm booking');
        },
      }
    );
  }, [booking, confirmBooking, refetch, confirmBookingDialog]);

  const handleCheckIn = useCallback(() => {
    if (!booking) return;
    checkInBooking(
      { id: booking._id },
      {
        onSuccess: () => {
          toast.success('Guest checked in successfully');
          refetch();
          checkInDialog.onFalse();
        },
        onError: () => {
          toast.error('Failed to check in guest');
        },
      }
    );
  }, [booking, checkInBooking, refetch, checkInDialog]);

  const handleCheckOut = useCallback(() => {
    if (!booking) return;
    checkOutBooking(
      { id: booking._id },
      {
        onSuccess: () => {
          toast.success('Guest checked out successfully');
          refetch();
          checkOutDialog.onFalse();
        },
        onError: () => {
          toast.error('Failed to check out guest');
        },
      }
    );
  }, [booking, checkOutBooking, refetch, checkOutDialog]);

  const handleCancelBooking = useCallback(() => {
    if (!booking) return;
    cancelBooking(
      { id: booking._id },
      {
        onSuccess: () => {
          toast.success('Booking cancelled successfully');
          refetch();
          cancelDialog.onFalse();
        },
        onError: () => {
          toast.error('Failed to cancel booking');
        },
      }
    );
  }, [booking, cancelBooking, refetch, cancelDialog]);

  const renderActionButtons = () => {
    if (!booking) return null;

    const actions = [];

    // Status-based actions
    if (booking.status === 'pending') {
      actions.push(
        <Button
          key="confirm"
          variant="contained"
          color="info"
          size="large"
          startIcon={<Iconify icon="solar:check-circle-bold" />}
          onClick={confirmBookingDialog.onTrue}
          sx={{ minWidth: 160 }}
        >
          Confirm Booking
        </Button>
      );
    }

    if (booking.status === 'confirmed') {
      actions.push(
        <Button
          key="checkin"
          variant="contained"
          color="success"
          size="large"
          startIcon={<Iconify icon="solar:login-3-bold" />}
          onClick={checkInDialog.onTrue}
          sx={{ minWidth: 140 }}
        >
          Check In
        </Button>
      );
    }

    if (booking.status === 'checked_in') {
      actions.push(
        <Button
          key="checkout"
          variant="contained"
          color="warning"
          size="large"
          startIcon={<Iconify icon="solar:logout-3-bold" />}
          onClick={checkOutDialog.onTrue}
          sx={{ minWidth: 140 }}
        >
          Check Out
        </Button>
      );
    }

    // Cancel action (for all non-completed statuses)
    if (booking.status !== 'cancelled' && booking.status !== 'checked_out') {
      actions.push(
        <Button
          key="cancel"
          variant="outlined"
          color="error"
          size="large"
          startIcon={<Iconify icon="solar:close-circle-bold" />}
          onClick={cancelDialog.onTrue}
          sx={{ minWidth: 140 }}
        >
          Cancel Booking
        </Button>
      );
    }

    return actions.length > 0 ? (
      <Stack direction="row" spacing={2}>
        {actions}
      </Stack>
    ) : null;
  };

  const renderConfirmDialogs = () => (
    <>
      <ConfirmDialog
        open={confirmBookingDialog.value}
        onClose={confirmBookingDialog.onFalse}
        title="Confirm Booking"
        content={
          <>
            Are you sure you want to confirm this booking?
            <br />
            <strong>Guest:</strong> {booking?.guest?.firstName} {booking?.guest?.lastName}
            <br />
            <strong>Dates:</strong> {booking ? fDate(booking.checkIn) : ''} -{' '}
            {booking ? fDate(booking.checkOut) : ''}
          </>
        }
        action={
          <Button variant="contained" color="info" onClick={handleConfirmBooking}>
            Confirm Booking
          </Button>
        }
      />

      <ConfirmDialog
        open={checkInDialog.value}
        onClose={checkInDialog.onFalse}
        title="Check In Guest"
        content={
          <>
            Are you sure you want to check in this guest?
            <br />
            <strong>Guest:</strong> {booking?.guest?.firstName} {booking?.guest?.lastName}
            <br />
            <strong>Check-in Date:</strong> {booking ? fDate(booking.checkIn) : ''}
          </>
        }
        action={
          <Button variant="contained" color="success" onClick={handleCheckIn}>
            Check In
          </Button>
        }
      />

      <ConfirmDialog
        open={checkOutDialog.value}
        onClose={checkOutDialog.onFalse}
        title="Check Out Guest"
        content={
          <>
            Are you sure you want to check out this guest?
            <br />
            <strong>Guest:</strong> {booking?.guest?.firstName} {booking?.guest?.lastName}
            <br />
            <strong>Check-out Date:</strong> {booking ? fDate(booking.checkOut) : ''}
          </>
        }
        action={
          <Button variant="contained" color="warning" onClick={handleCheckOut}>
            Check Out
          </Button>
        }
      />

      <ConfirmDialog
        open={cancelDialog.value}
        onClose={cancelDialog.onFalse}
        title="Cancel Booking"
        content={
          <>
            Are you sure you want to cancel this booking? This action cannot be undone.
            <br />
            <strong>Guest:</strong> {booking?.guest?.firstName} {booking?.guest?.lastName}
            <br />
            <strong>Total Amount:</strong>{' '}
            {booking?.pricing ? fCurrency(booking.pricing.totalAmount) : ''}
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={handleCancelBooking}>
            Cancel Booking
          </Button>
        }
      />
    </>
  );

  if (isLoading) {
    return (
      <LoadingState
        title="Loading booking details..."
        subtitle="Please wait while we fetch the booking information"
        size="large"
        fullHeight
      />
    );
  }

  if (error || !booking) {
    return (
      <ErrorState
        fullHeight
        size="large"
        title="Error loading booking details"
        subtitle="We couldn't load the booking information. Please try again."
        onRetry={() => refetch()}
        icon="solar:file-corrupted-bold-duotone"
      />
    );
  }

  return (
    <>
      {/* Actions Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>{renderActionButtons()}</Box>

      <Grid container spacing={3}>
        {/* Booking Overview */}
        <Grid size={12}>
          <Card>
            <CardHeader
              title={
                <Stack spacing={1}>
                  <Typography variant="h4" fontWeight={700}>
                    Booking #{booking._id.slice(-8).toUpperCase()}
                  </Typography>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Status:
                      </Typography>
                      <Chip
                        label={(booking.status || 'unknown')
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        variant="filled"
                        size="small"
                        color={getStatusColor(booking.status || '') as any}
                      />
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Payment:
                      </Typography>
                      <Chip
                        label={(booking.paymentStatus || 'unknown')
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        variant="filled"
                        size="small"
                        color={getPaymentStatusColor(booking.paymentStatus || '') as any}
                      />
                    </Stack>
                  </Stack>
                </Stack>
              }
              action={
                <Typography variant="h3" fontWeight={600} color="primary.main">
                  {fCurrency(booking.pricing?.totalAmount || 0)}
                </Typography>
              }
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Iconify icon="solar:login-3-bold" width={16} />
                    <Typography variant="subtitle2">Check-in Date</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {fDate(booking.checkIn)} at {booking.estimatedArrivalTime || 'Not specified'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Iconify icon="solar:logout-3-bold" width={16} />
                    <Typography variant="subtitle2">Check-out Date</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {fDate(booking.checkOut)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Iconify icon="solar:clock-circle-bold" width={16} />
                    <Typography variant="subtitle2">Duration</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {booking.nights} night{booking.nights !== 1 ? 's' : ''}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Iconify icon="solar:calendar-add-bold" width={16} />
                    <Typography variant="subtitle2">Booked On</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {fDateTime(booking.createdAt)}
                  </Typography>
                </Grid>
                {booking.confirmedAt && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Iconify icon="solar:check-circle-bold" width={16} />
                      <Typography variant="subtitle2">Confirmed On</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {fDateTime(booking.confirmedAt)}
                    </Typography>
                  </Grid>
                )}
                {booking.cancelledAt && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Iconify icon="solar:close-circle-bold" width={16} />
                      <Typography variant="subtitle2">Cancelled On</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {fDateTime(booking.cancelledAt)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Property Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:home-smile-bold" width={20} />
                  <Typography variant="h6">Property Details</Typography>
                </Stack>
              }
              action={
                <Button
                  component={RouterLink}
                  href={paths.dashboard.properties.details(booking.property._id)}
                  startIcon={<Iconify icon="solar:eye-bold" />}
                >
                  View Property
                </Button>
              }
            />
            <CardContent>
              <Stack direction="row" spacing={3}>
                {/* Property Image */}
                {booking.property.images && booking.property.images.length > 0 && (
                  <Box
                    component="img"
                    src={booking.property.images[0].url}
                    alt={booking.property.name}
                    sx={{
                      width: 180,
                      height: 120,
                      borderRadius: 1.5,
                      objectFit: 'cover',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      flexShrink: 0,
                    }}
                  />
                )}

                {/* Property Info */}
                <Stack spacing={2} sx={{ flex: 1 }}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Iconify icon="solar:home-bold" width={16} />
                      <Typography variant="subtitle2">Name</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {booking.property?.name || 'Unknown Property'}
                    </Typography>
                  </Box>

                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Iconify icon="solar:buildings-3-bold" width={16} />
                      <Typography variant="subtitle2">Property Type</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {booking.property.propertyType || 'N/A'} •{' '}
                      {booking.property.roomType || 'N/A'}
                    </Typography>
                  </Box>

                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Iconify icon="solar:users-group-rounded-bold" width={16} />
                      <Typography variant="subtitle2">Capacity</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      <Iconify
                        icon="solar:user-bold"
                        width={14}
                        sx={{ mr: 0.5, verticalAlign: 'middle' }}
                      />
                      {booking.property.accommodates || 0} guests •
                      <Iconify
                        icon="solar:bed-bold"
                        width={14}
                        sx={{ mx: 0.5, verticalAlign: 'middle' }}
                      />
                      {booking.property.bedrooms || 0} bedrooms •
                      <Iconify
                        icon="solar:sleeping-square-bold"
                        width={14}
                        sx={{ mx: 0.5, verticalAlign: 'middle' }}
                      />
                      {booking.property.beds || 0} beds •
                      <Iconify
                        icon="solar:bath-bold"
                        width={14}
                        sx={{ mx: 0.5, verticalAlign: 'middle' }}
                      />
                      {booking.property.bathrooms || 0} bathrooms
                    </Typography>
                  </Box>

                  {booking.property.address && (
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Iconify icon="solar:map-point-bold" width={16} />
                        <Typography variant="subtitle2">Address</Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {`${booking.property.address.street || ''}, ${booking.property.address?.location?.city || ''}, ${booking.property.address.country || ''}`}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Guest Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:user-check-bold" width={20} />
                  <Typography variant="h6">Guest Information</Typography>
                </Stack>
              }
            />
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar>
                    {booking.guest?.firstName?.[0]}
                    {booking.guest?.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">
                      {booking.guest?.firstName} {booking.guest?.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Guest
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Iconify icon="solar:letter-bold" width={16} />
                    <Typography variant="subtitle2">Email</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {booking.guestEmail || booking.guest?.email || 'N/A'}
                  </Typography>
                </Box>

                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Iconify icon="solar:phone-bold" width={16} />
                    <Typography variant="subtitle2">Phone</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {booking.guestPhone || 'N/A'}
                  </Typography>
                </Box>

                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Iconify icon="solar:users-group-rounded-bold" width={16} />
                    <Typography variant="subtitle2">Number of Guests</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label={`${booking.guests?.adults || 0} Adults`} />
                    <Chip size="small" label={`${booking.guests?.children || 0} Children`} />
                    {(booking.guests?.infants || 0) > 0 && (
                      <Chip size="small" label={`${booking.guests.infants} Infants`} />
                    )}
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Host Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:user-speak-bold" width={20} />
                  <Typography variant="h6">Host Information</Typography>
                </Stack>
              }
            />
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar>
                    {booking.host?.firstName?.[0]}
                    {booking.host?.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">
                      {booking.host?.firstName} {booking.host?.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Host
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Iconify icon="solar:letter-bold" width={16} />
                    <Typography variant="subtitle2">Email</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {booking.host?.email || 'N/A'}
                  </Typography>
                </Box>

                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Iconify icon="solar:phone-bold" width={16} />
                    <Typography variant="subtitle2">Phone</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    N/A
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Pricing Details */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:dollar-minimalistic-bold" width={20} />
                  <Typography variant="h6">Pricing Details</Typography>
                </Stack>
              }
            />
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Base Price per Night</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
                    {fCurrency(booking.pricing?.baseAmount || 0)}
                  </Typography>
                </Box>

                {(booking.pricing?.cleaningFee || 0) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Cleaning Fee</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
                      {fCurrency(booking.pricing.cleaningFee)}
                    </Typography>
                  </Box>
                )}

                {(booking.pricing?.serviceFee || 0) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Service Fee</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
                      {fCurrency(booking.pricing.serviceFee)}
                    </Typography>
                  </Box>
                )}

                {(booking.pricing?.occupancyTaxes || 0) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Taxes</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
                      {fCurrency(booking.pricing.occupancyTaxes)}
                    </Typography>
                  </Box>
                )}

                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2">Total Amount</Typography>
                  <Typography
                    variant="subtitle2"
                    color="primary"
                    sx={{ fontWeight: 'fontWeightBold' }}
                  >
                    {fCurrency(booking.pricing?.totalAmount || 0)}
                  </Typography>
                </Box>

                {booking.refundAmount && (
                  <>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="error.main">
                        Refund Amount
                      </Typography>
                      <Typography
                        variant="body2"
                        color="error.main"
                        sx={{ fontWeight: 'fontWeightMedium' }}
                      >
                        {fCurrency(booking.refundAmount)}
                      </Typography>
                    </Box>
                    {booking.refundDate && (
                      <Typography variant="caption" color="text.secondary">
                        Refunded on: {fDateTime(booking.refundDate)}
                      </Typography>
                    )}
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Information */}
        <Grid size={12}>
          <Card>
            <CardHeader
              title={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="solar:info-circle-bold" width={20} />
                  <Typography variant="h6">Additional Information</Typography>
                </Stack>
              }
            />
            <CardContent>
              <Grid container spacing={3}>
                {booking.specialRequests && (
                  <Grid size={12}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Iconify icon="solar:notes-bold" width={16} />
                      <Typography variant="subtitle2">Special Requests</Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: 'pre-wrap' }}
                    >
                      {booking.specialRequests}
                    </Typography>
                  </Grid>
                )}

                {booking.cancellationReason && (
                  <Grid size={12}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Iconify icon="solar:danger-bold" width={16} color="error.main" />
                      <Typography variant="subtitle2" color="error.main">
                        Cancellation Reason
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {booking.cancellationReason}
                    </Typography>
                    {booking.cancelledBy && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: 'block' }}
                      >
                        Cancelled by: {booking.cancelledBy}
                      </Typography>
                    )}
                  </Grid>
                )}

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Iconify icon="solar:star-bold" width={16} />
                    <Typography variant="subtitle2">Guest Review Status</Typography>
                  </Stack>
                  <Chip
                    size="small"
                    label={booking.guestReviewed ? 'Reviewed' : 'Not Reviewed'}
                    color={booking.guestReviewed ? 'success' : 'default'}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Iconify icon="solar:medal-star-bold" width={16} />
                    <Typography variant="subtitle2">Host Review Status</Typography>
                  </Stack>
                  <Chip
                    size="small"
                    label={booking.hostReviewed ? 'Reviewed' : 'Not Reviewed'}
                    color={booking.hostReviewed ? 'success' : 'default'}
                  />
                </Grid>

                {booking.paymentIntentId && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Iconify icon="solar:card-2-bold" width={16} />
                      <Typography variant="subtitle2">Payment Intent ID</Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontFamily: 'monospace' }}
                    >
                      {booking.paymentIntentId}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {renderConfirmDialogs()}
    </>
  );
}
