'use client';

import type { BookingResponseDto } from 'src/api/models/admin';
import type { DynamicTableColumn } from 'src/components/dynamic-table';

import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

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

import { propertiesAdminControllerSearchProperties } from 'src/api/queries/admin/properties-management/properties-management';
import {
  usersAdminControllerSearchHosts,
  usersAdminControllerSearchGuests,
} from 'src/api/queries/admin/users-management/users-management';
import {
  useBookingsAdminControllerGetAllBookings,
  useBookingsAdminControllerConfirmBooking,
  useBookingsAdminControllerCheckInBooking,
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
    width: 250,
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
    id: 'guestEmail',
    label: 'Guest',
    width: 150,
    render: (booking) => (
      <Link
        component={RouterLink}
        href={paths.dashboard.user.edit(booking.guest._id)}
        color="inherit"
        sx={{ cursor: 'pointer' }}
      >
        <Typography variant="subtitle2">
          {booking.guest?.firstName} {booking.guest?.lastName}
        </Typography>
      </Link>
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
  checkIn: Date | null;
  checkOut: Date | null;
  guestId: string | null;
  hostId: string | null;
  propertyId: string | null;
}

// Guest search function for autocomplete using React Query
const createGuestSearchFunction =
  () =>
  async (
    searchTerm: string
  ): Promise<
    Array<{
      value: string | number;
      label: string;
      disabled?: boolean;
    }>
  > => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      return [];
    }

    try {
      // Use the React Query function directly
      const data = await usersAdminControllerSearchGuests({ search: searchTerm.trim() });

      if (data?.data?.users) {
        return data.data.users.map((user) => ({
          value: user._id,
          label: `${user.firstName} ${user.lastName}`,
        }));
      }

      return [];
    } catch (error) {
      console.error('Guest search error:', error);
      return [];
    }
  };

// Host search function for autocomplete using React Query
const createHostSearchFunction =
  () =>
  async (
    searchTerm: string
  ): Promise<
    Array<{
      value: string | number;
      label: string;
      disabled?: boolean;
    }>
  > => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      return [];
    }

    try {
      // Use the React Query function directly
      const data = await usersAdminControllerSearchHosts({ search: searchTerm.trim() });

      if (data?.data?.users) {
        return data.data.users.map((user) => ({
          value: user._id,
          label: `${user.firstName} ${user.lastName}`,
        }));
      }

      return [];
    } catch (error) {
      console.error('Host search error:', error);
      return [];
    }
  };

// Property search function for autocomplete using React Query
const createPropertySearchFunction =
  () =>
  async (
    searchTerm: string
  ): Promise<
    Array<{
      value: string | number;
      label: string;
      disabled?: boolean;
    }>
  > => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      return [];
    }

    try {
      // Use the React Query function directly
      const data = await propertiesAdminControllerSearchProperties({ search: searchTerm.trim() });

      if (data?.data?.properties) {
        return data.data.properties.map((property) => ({
          value: property._id,
          label: property.name,
        }));
      }

      return [];
    } catch (error) {
      console.error('Property search error:', error);
      return [];
    }
  };

export function BookingList() {
  const bookingStatusOptions = useEnumDisplayOptions('BookingStatus', {
    prependOptions: [{ value: 'all', label: 'All' }],
  });

  const paymentStatusOptions = useEnumDisplayOptions('PaymentStatus');

  // State to store fetched guest options
  const [guestOptions, setGuestOptions] = useState<
    Array<{
      value: string | number;
      label: string;
      disabled?: boolean;
    }>
  >([]);

  // State to store fetched host options
  const [hostOptions, setHostOptions] = useState<
    Array<{
      value: string | number;
      label: string;
      disabled?: boolean;
    }>
  >([]);

  // State to store fetched property options
  const [propertyOptions, setPropertyOptions] = useState<
    Array<{
      value: string | number;
      label: string;
      disabled?: boolean;
    }>
  >([]);

  // Create search function that also updates guest options
  const baseSearchGuests = createGuestSearchFunction();
  const searchGuests = useCallback(
    async (searchTerm: string) => {
      const results = await baseSearchGuests(searchTerm);

      // Update guest options with the search results
      if (results.length > 0) {
        setGuestOptions((prevOptions) => {
          // Merge new results with existing options, avoiding duplicates
          const existingIds = new Set(prevOptions.map((opt) => opt.value));
          const newOptions = results.filter((opt) => !existingIds.has(opt.value));
          return [...prevOptions, ...newOptions];
        });
      }

      return results;
    },
    [baseSearchGuests]
  );

  // Create search function that also updates host options
  const baseSearchHosts = createHostSearchFunction();
  const searchHosts = useCallback(
    async (searchTerm: string) => {
      const results = await baseSearchHosts(searchTerm);

      // Update host options with the search results
      if (results.length > 0) {
        setHostOptions((prevOptions) => {
          // Merge new results with existing options, avoiding duplicates
          const existingIds = new Set(prevOptions.map((opt) => opt.value));
          const newOptions = results.filter((opt) => !existingIds.has(opt.value));
          return [...prevOptions, ...newOptions];
        });
      }

      return results;
    },
    [baseSearchHosts]
  );

  // Create search function that also updates property options
  const baseSearchProperties = createPropertySearchFunction();
  const searchProperties = useCallback(
    async (searchTerm: string) => {
      const results = await baseSearchProperties(searchTerm);

      // Update property options with the search results
      if (results.length > 0) {
        setPropertyOptions((prevOptions) => {
          // Merge new results with existing options, avoiding duplicates
          const existingIds = new Set(prevOptions.map((opt) => opt.value));
          const newOptions = results.filter((opt) => !existingIds.has(opt.value));
          return [...prevOptions, ...newOptions];
        });
      }

      return results;
    },
    [baseSearchProperties]
  );

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
    checkIn: null,
    checkOut: null,
    guestId: null,
    hostId: null,
    propertyId: null,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Load the selected guest on mount or when guestId changes
  useEffect(() => {
    if (currentFilters.guestId && guestOptions.length === 0) {
      // If we have a guestId but no options, try to fetch that specific guest
      // This ensures the selected value displays correctly
      searchGuests('');
    }
  }, [currentFilters.guestId, guestOptions.length, searchGuests]);

  const { data: bookingsData, isLoading } = useBookingsAdminControllerGetAllBookings({
    page: table.page,
    limit: table.rowsPerPage,
    search: currentFilters.search?.trim() || undefined,
    status: currentFilters.status !== 'all' ? currentFilters.status : undefined,
    paymentStatus:
      currentFilters.paymentStatus.length > 0 ? currentFilters.paymentStatus.join(',') : undefined,
    checkIn: currentFilters.checkIn ? fDate(currentFilters.checkIn, 'YYYY-MM-DD') : undefined,
    checkOut: currentFilters.checkOut ? fDate(currentFilters.checkOut, 'YYYY-MM-DD') : undefined,
    guestId: currentFilters.guestId || undefined,
    hostId: currentFilters.hostId || undefined,
    propertyId: currentFilters.propertyId || undefined,
  });

  const bookingsList = useMemo(() => bookingsData?.data?.items || [], [bookingsData?.data?.items]);

  const { mutate: confirmBooking } = useBookingsAdminControllerConfirmBooking();
  const { mutate: checkInBooking } = useBookingsAdminControllerCheckInBooking();
  const { mutate: checkOutBooking } = useBookingsAdminControllerCheckOutBooking();
  const { mutate: cancelBooking } = useBookingsAdminControllerForceCancelBooking();

  const canResetFilters = useCallback(
    (filterState: BookingTableFilter) =>
      !!filterState.search ||
      filterState.paymentStatus.length > 0 ||
      filterState.checkIn !== null ||
      filterState.checkOut !== null ||
      filterState.guestId !== null ||
      filterState.hostId !== null ||
      filterState.propertyId !== null,
    []
  );

  const [selectedBooking, setSelectedBooking] = useState<BookingResponseDto | null>(null);

  const handleConfirmBooking = useCallback(
    (bookingId: string) => {
      const booking = bookingsList.find((b) => b._id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        confirmBookingDialog.onTrue();
      }
    },
    [bookingsList, confirmBookingDialog]
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
      const booking = bookingsList.find((b) => b._id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        checkInDialog.onTrue();
      }
    },
    [bookingsList, checkInDialog]
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
      const booking = bookingsList.find((b) => b._id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        checkOutDialog.onTrue();
      }
    },
    [bookingsList, checkOutDialog]
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
      const booking = bookingsList.find((b) => b._id === bookingId);
      if (booking) {
        setSelectedBooking(booking);
        confirmDialog.onTrue();
      }
    },
    [bookingsList, confirmDialog]
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
    const selectedBookings = bookingsList.filter((row) => table.selected.includes(row._id));

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
  }, [cancelBooking, table.selected, bookingsList]);

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

  return (
    <>
      <DynamicTable
        data={bookingsList}
        loading={isLoading}
        columns={TABLE_COLUMNS}
        getRowId={(row) => row._id}
        pagination={{
          page: table.page,
          rowsPerPage: table.rowsPerPage,
          totalCount: bookingsData?.data?.total || 0,
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
              bookingsList.map((row) => row._id)
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
          filterFields: [
            {
              id: 'checkIn',
              label: 'Check In',
              type: 'date',
              name: 'checkIn',
            },
            {
              id: 'checkOut',
              label: 'Check Out',
              type: 'date',
              name: 'checkOut',
            },
            {
              id: 'guestId',
              label: 'Guest',
              type: 'select',
              name: 'guestId',
              autocomplete: true,
              onSearch: searchGuests,
              options: guestOptions,
              minSearchLength: 2,
              searchDelay: 500,
              noOptionsText: 'No guests found',
              loadingText: 'Searching guests...',
              placeholder: 'Search by guest name...',
            },
            {
              id: 'hostId',
              label: 'Host',
              type: 'select',
              name: 'hostId',
              autocomplete: true,
              onSearch: searchHosts,
              options: hostOptions,
              minSearchLength: 2,
              searchDelay: 500,
              noOptionsText: 'No hosts found',
              loadingText: 'Searching hosts...',
              placeholder: 'Search by host name...',
            },
            {
              id: 'propertyId',
              label: 'Property',
              type: 'select',
              name: 'propertyId',
              autocomplete: true,
              onSearch: searchProperties,
              options: propertyOptions,
              minSearchLength: 2,
              searchDelay: 500,
              noOptionsText: 'No properties found',
              loadingText: 'Searching properties...',
              placeholder: 'Search by property name...',
            },
            {
              id: 'paymentStatus',
              label: 'Payment Status',
              type: 'multiselect',
              name: 'paymentStatus',
              options: paymentStatusOptions,
            },
          ],
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
