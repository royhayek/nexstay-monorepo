'use client';

import type { DynamicTableColumn } from 'src/components/dynamic-table';
import type {
  BookingResponseDto,
  BookingsAdminControllerGetUserBookingsSortBy,
} from 'src/api/models/admin';

import React, { useMemo, useState, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useEnumDisplayOptions } from 'src/hooks/use-enum-display-options';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fTime } from 'src/utils/format-time';

import {
  useBookingsAdminControllerConfirmBooking,
  useBookingsAdminControllerCheckInBooking,
  useBookingsAdminControllerGetUserBookings,
  useBookingsAdminControllerCheckOutBooking,
  useBookingsAdminControllerForceCancelBooking,
} from 'src/api/queries/admin/bookings-management/bookings-management';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { DynamicTable } from 'src/components/dynamic-table';
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

const TABLE_COLUMNS: DynamicTableColumn<BookingResponseDto>[] = [
  {
    id: 'confirmationCode',
    label: 'Confirmation',
    width: 140,
    render: (booking) => (
      <Link
        component={RouterLink}
        href={paths.dashboard.bookings.details(booking._id)}
        color="inherit"
        sx={{ cursor: 'pointer' }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
          {booking.confirmationCode || 'N/A'}
        </Typography>
      </Link>
    ),
  },
  {
    id: 'property',
    label: 'Property',
    width: 200,
    render: (booking) => (
      <Link
        component={RouterLink}
        href={paths.dashboard.properties.details(booking.property._id)}
        color="inherit"
        sx={{ cursor: 'pointer' }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
          {booking.property?.name || 'Unknown Property'}
        </Typography>
      </Link>
    ),
  },
  {
    id: 'host.firstName',
    label: 'Owned By',
    width: 150,
    render: (booking) => (
      <Typography variant="subtitle2">
        {booking.host?.firstName + ' ' + booking.host?.lastName || 'Unknown Host'}
      </Typography>
    ),
  },
  {
    id: 'checkIn',
    label: 'Check In',
    width: 140,
    render: (booking) => <Typography variant="body2">{fDate(booking.checkIn)}</Typography>,
  },
  {
    id: 'checkOut',
    label: 'Check Out',
    width: 140,
    render: (booking) => <Typography variant="body2">{fDate(booking.checkOut)}</Typography>,
  },
  {
    id: 'nights',
    label: 'Nights',
    width: 80,
    align: 'center',
    render: (booking) => (
      <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
        {booking.nights}
      </Typography>
    ),
  },
  {
    id: 'pricing',
    label: 'Total',
    width: 120,
    render: (booking) => (
      <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
        {fCurrency(booking.pricing?.totalAmount || 0)}
      </Typography>
    ),
  },
  {
    id: 'status',
    label: 'Status',
    width: 120,
    render: (booking) => (
      <Label variant="soft" color={getStatusColor(booking.status) as any}>
        {booking.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </Label>
    ),
  },
  {
    id: 'paymentStatus',
    label: 'Payment',
    width: 120,
    render: (booking) => (
      <Label variant="soft" color={getPaymentStatusColor(booking.paymentStatus) as any}>
        {booking.paymentStatus.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </Label>
    ),
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

interface BookingTableFilter extends Record<string, unknown> {
  search: string;
  status: string;
  paymentStatus: string[];
}

interface Props {
  id: string;
}

export function AccountBooking({ id }: Props) {
  const bookingStatusOptions = useEnumDisplayOptions('BookingStatus', {
    prependOptions: [{ value: 'all', label: 'All' }],
  });

  const paymentStatusOptions = useEnumDisplayOptions('PaymentStatus');

  const router = useRouter();
  const table = useTable();
  const confirmDialog = useBoolean();
  const confirmBookingDialog = useBoolean();
  const checkInDialog = useBoolean();
  const checkOutDialog = useBoolean();

  const filters = useSetState<BookingTableFilter>({
    search: '',
    status: 'all',
    paymentStatus: [],
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const { data, isLoading, error } = useBookingsAdminControllerGetUserBookings(id, {
    page: table.page,
    limit: table.rowsPerPage,
    status: currentFilters.status !== 'all' ? currentFilters.status : undefined,
    sortBy: table.orderBy as BookingsAdminControllerGetUserBookingsSortBy,
    sortDirection: table.order,
  });

  const { mutate: confirmBooking } = useBookingsAdminControllerConfirmBooking();
  const { mutate: checkInBooking } = useBookingsAdminControllerCheckInBooking();
  const { mutate: checkOutBooking } = useBookingsAdminControllerCheckOutBooking();
  const { mutate: cancelBooking } = useBookingsAdminControllerForceCancelBooking();

  // Transform the API response and apply client-side filtering
  const bookings = useMemo(() => {
    let filteredBookings = data?.data?.items || [];

    // Apply client-side search filter
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      filteredBookings = filteredBookings.filter(
        (booking) =>
          booking.confirmationCode?.toLowerCase().includes(searchTerm) ||
          booking.property?.name?.toLowerCase().includes(searchTerm) ||
          booking.guest?.firstName?.toLowerCase().includes(searchTerm) ||
          booking.guest?.lastName?.toLowerCase().includes(searchTerm) ||
          booking.guestEmail?.toLowerCase().includes(searchTerm) ||
          booking.host?.firstName?.toLowerCase().includes(searchTerm) ||
          booking.host?.lastName?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply client-side payment status filter
    if (currentFilters.paymentStatus.length > 0) {
      filteredBookings = filteredBookings.filter((booking) =>
        currentFilters.paymentStatus.includes(booking.paymentStatus)
      );
    }

    return filteredBookings;
  }, [data?.data?.items, currentFilters.search, currentFilters.paymentStatus]);

  const canResetFilters = useCallback(
    (filterState: BookingTableFilter) =>
      !!filterState.search || filterState.paymentStatus.length > 0 || filterState.status !== 'all',
    []
  );

  const [selectedBooking, setSelectedBooking] = useState<BookingResponseDto | null>(null);

  const handleConfirmBooking = useCallback(
    (bookingId: string) => {
      const booking = bookings.find((b) => b._id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        confirmBookingDialog.onTrue();
      }
    },
    [bookings, confirmBookingDialog]
  );

  const executeConfirmBooking = useCallback(() => {
    if (!selectedBooking) return;

    confirmBooking(
      { id: selectedBooking._id },
      {
        onSuccess: () => {
          toast.success('Booking confirmed successfully');
          window.location.reload();
        },
        onError: () => {
          toast.error('Failed to confirm booking');
        },
      }
    );
  }, [selectedBooking, confirmBooking]);

  const handleCheckIn = useCallback(
    (bookingId: string) => {
      const booking = bookings.find((b) => b._id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        checkInDialog.onTrue();
      }
    },
    [bookings, checkInDialog]
  );

  const executeCheckIn = useCallback(() => {
    if (!selectedBooking) return;

    checkInBooking(
      { id: selectedBooking._id },
      {
        onSuccess: () => {
          toast.success('Guest checked in successfully');
          window.location.reload();
        },
        onError: () => {
          toast.error('Failed to check in guest');
        },
      }
    );
  }, [selectedBooking, checkInBooking]);

  const handleCheckOut = useCallback(
    (bookingId: string) => {
      const booking = bookings.find((b) => b._id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        checkOutDialog.onTrue();
      }
    },
    [bookings, checkOutDialog]
  );

  const executeCheckOut = useCallback(() => {
    if (!selectedBooking) return;

    checkOutBooking(
      { id: selectedBooking._id },
      {
        onSuccess: () => {
          toast.success('Guest checked out successfully');
          window.location.reload();
        },
        onError: () => {
          toast.error('Failed to check out guest');
        },
      }
    );
  }, [selectedBooking, checkOutBooking]);

  const handleCancelBooking = useCallback(
    (bookingId: string) => {
      const booking = bookings.find((b) => b._id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        confirmDialog.onTrue();
      }
    },
    [bookings, confirmDialog]
  );

  const executeCancelBooking = useCallback(() => {
    if (!selectedBooking) return;

    cancelBooking(
      { id: selectedBooking._id },
      {
        onSuccess: () => {
          toast.success('Booking cancelled successfully');
          window.location.reload();
        },
        onError: () => {
          toast.error('Failed to cancel booking');
        },
      }
    );
  }, [selectedBooking, cancelBooking]);

  const handleCancelSelected = useCallback(() => {
    const selectedBookings = bookings.filter((row) => table.selected.includes(row._id));

    Promise.all(
      selectedBookings.map(
        (booking) =>
          new Promise((resolve, reject) => {
            cancelBooking(
              { id: booking._id },
              {
                onSuccess: resolve,
                onError: reject,
              }
            );
          })
      )
    )
      .then(() => {
        toast.success(`${selectedBookings.length} bookings cancelled successfully`);
        window.location.reload();
      })
      .catch(() => {
        toast.error('Failed to cancel some bookings');
      });
  }, [cancelBooking, table.selected, bookings]);

  const handleTabChange = useCallback(
    (newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const rowActions = useMemo(
    () => [
      {
        label: 'View Details',
        icon: 'solar:eye-bold',
        onClick: (booking: BookingResponseDto) =>
          router.push(paths.dashboard.bookings.details(booking._id)),
      },
      {
        label: 'Confirm Booking',
        icon: 'solar:check-circle-bold',
        color: 'info' as const,
        onClick: (booking: BookingResponseDto) => handleConfirmBooking(booking._id),
        disabled: (booking: BookingResponseDto) => booking.status !== 'pending',
      },
      {
        label: 'Check In',
        icon: 'solar:login-3-bold',
        color: 'success' as const,
        onClick: (booking: BookingResponseDto) => handleCheckIn(booking._id),
        disabled: (booking: BookingResponseDto) => booking.status !== 'confirmed',
      },
      {
        label: 'Check Out',
        icon: 'solar:logout-3-bold',
        color: 'warning' as const,
        onClick: (booking: BookingResponseDto) => handleCheckOut(booking._id),
        disabled: (booking: BookingResponseDto) => booking.status !== 'checked_in',
      },
      {
        label: 'Cancel Booking',
        icon: 'solar:close-circle-bold',
        color: 'error' as const,
        onClick: (booking: BookingResponseDto) => handleCancelBooking(booking._id),
        disabled: (booking: BookingResponseDto) =>
          booking.status === 'cancelled' || booking.status === 'checked_out',
      },
    ],
    [router, handleConfirmBooking, handleCheckIn, handleCheckOut, handleCancelBooking]
  );

  // Create filter fields for client-side filtering
  const createFilterFields = useCallback(
    () => [
      {
        id: 'paymentStatus',
        label: 'Payment Status',
        type: 'multiselect' as const,
        name: 'paymentStatus',
        options: paymentStatusOptions,
      },
    ],
    [paymentStatusOptions]
  );

  const renderConfirmDialogs = () => (
    <>
      {/* Bulk Cancel Dialog */}
      <ConfirmDialog
        open={confirmDialog.value && !selectedBooking}
        onClose={confirmDialog.onFalse}
        title="Cancel Bookings"
        content={
          <>
            Are you sure want to cancel <strong> {table.selected.length} </strong> booking(s)?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleCancelSelected();
              confirmDialog.onFalse();
            }}
          >
            Cancel Bookings
          </Button>
        }
      />

      {/* Single Cancel Dialog */}
      <ConfirmDialog
        open={confirmDialog.value && !!selectedBooking}
        onClose={() => {
          confirmDialog.onFalse();
          setSelectedBooking(null);
        }}
        title="Cancel Booking"
        content={
          <>
            Are you sure you want to cancel booking{' '}
            <strong>{selectedBooking?.confirmationCode}</strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              executeCancelBooking();
              confirmDialog.onFalse();
              setSelectedBooking(null);
            }}
          >
            Cancel Booking
          </Button>
        }
      />

      {/* Confirm Booking Dialog */}
      <ConfirmDialog
        open={confirmBookingDialog.value}
        onClose={() => {
          confirmBookingDialog.onFalse();
          setSelectedBooking(null);
        }}
        title="Confirm Booking"
        content={
          <>
            Are you sure you want to confirm booking{' '}
            <strong>{selectedBooking?.confirmationCode}</strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="info"
            onClick={() => {
              executeConfirmBooking();
              confirmBookingDialog.onFalse();
              setSelectedBooking(null);
            }}
          >
            Confirm Booking
          </Button>
        }
      />

      {/* Check In Dialog */}
      <ConfirmDialog
        open={checkInDialog.value}
        onClose={() => {
          checkInDialog.onFalse();
          setSelectedBooking(null);
        }}
        title="Check In Guest"
        content={
          <>
            Are you sure you want to check in the guest for booking{' '}
            <strong>{selectedBooking?.confirmationCode}</strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              executeCheckIn();
              checkInDialog.onFalse();
              setSelectedBooking(null);
            }}
          >
            Check In
          </Button>
        }
      />

      {/* Check Out Dialog */}
      <ConfirmDialog
        open={checkOutDialog.value}
        onClose={() => {
          checkOutDialog.onFalse();
          setSelectedBooking(null);
        }}
        title="Check Out Guest"
        content={
          <>
            Are you sure you want to check out the guest for booking{' '}
            <strong>{selectedBooking?.confirmationCode}</strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              executeCheckOut();
              checkOutDialog.onFalse();
              setSelectedBooking(null);
            }}
          >
            Check Out
          </Button>
        }
      />
    </>
  );

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Box sx={{ typography: 'h6', color: 'error.main' }}>Error loading bookings</Box>
        <Box sx={{ typography: 'body2', color: 'text.secondary', mt: 1 }}>
          Please try again later
        </Box>
      </Box>
    );
  }

  return (
    <>
      <DynamicTable
        data={bookings}
        loading={isLoading}
        columns={TABLE_COLUMNS}
        getRowId={(row) => row._id}
        pagination={{
          page: table.page,
          rowsPerPage: table.rowsPerPage,
          totalCount: data?.data?.total || 0,
          onPageChange: table.onChangePage,
          onRowsPerPageChange: table.onChangeRowsPerPage,
        }}
        sorting={{
          orderBy: table.orderBy,
          order: table.order,
          onSort: table.onSort,
        }}
        selection={{
          selected: table.selected,
          onSelectRow: table.onSelectRow,
          onSelectAllRows: (checked) =>
            table.onSelectAllRows(
              checked,
              bookings.map((row) => row._id)
            ),
          bulkActions: [
            {
              label: 'Cancel Selected',
              icon: 'solar:close-circle-bold',
              color: 'error',
              onClick: () => {
                setSelectedBooking(null);
                confirmDialog.onTrue();
              },
            },
          ],
        }}
        filtering={{
          state: currentFilters,
          setState: updateFilters,
          searchKey: 'search',
          searchPlaceholder: 'Search by confirmation no., guest, host or property name...',
          showFiltersResult: true,
          canResetFilters,
          filterFields: createFilterFields(),
        }}
        tabs={{
          tabs: bookingStatusOptions,
          activeTab: currentFilters.status,
          onTabChange: handleTabChange,
        }}
        options={{
          dense: table.dense,
          onChangeDense: table.onChangeDense,
          minWidth: 1400,
        }}
        rowActions={rowActions}
      />

      {renderConfirmDialogs()}
    </>
  );
}
