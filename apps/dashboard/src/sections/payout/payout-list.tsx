'use client';

import type { PayoutResponseDto } from 'src/api/models/admin';
import type { DynamicTableColumn } from 'src/components/dynamic-table';

import { useMemo, useCallback } from 'react';
import { useSetState } from 'minimal-shared/hooks';

import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { PayoutResponseDtoStatus } from 'src/api/models/admin';
import {
  usePayoutsAdminControllerGetAllPayouts,
  usePayoutsAdminControllerRetryFailedPayout,
} from 'src/api/queries/admin/payouts-management/payouts-management';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { DynamicTable } from 'src/components/dynamic-table';

// ----------------------------------------------------------------------

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

const TABLE_COLUMNS: DynamicTableColumn<PayoutResponseDto>[] = [
  {
    id: 'reference',
    label: 'Reference',
    width: 140,
    render: (payout) => (
      <Link
        component={RouterLink}
        href={paths.dashboard.payouts.details(payout.id)}
        color="inherit"
        sx={{ cursor: 'pointer' }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
          {payout.reference}
        </Typography>
      </Link>
    ),
  },
  {
    id: 'hostId',
    label: 'Host ID',
    width: 120,
    render: (payout) => (
      <Typography variant="body2" color="text.secondary">
        {payout.hostId}
      </Typography>
    ),
  },
  {
    id: 'status',
    label: 'Status',
    width: 120,
    render: (payout) => (
      <Label variant="soft" color={getStatusColor(payout.status)}>
        {payout.status}
      </Label>
    ),
  },
  {
    id: 'type',
    label: 'Type',
    width: 100,
    render: (payout) => (
      <Label variant="soft" color={getTypeColor(payout.type)}>
        {payout.type}
      </Label>
    ),
  },
  {
    id: 'provider',
    label: 'Provider',
    width: 120,
    render: (payout) => (
      <Label variant="soft" color={getProviderColor(payout.provider)}>
        {payout.provider}
      </Label>
    ),
  },
  {
    id: 'netAmount',
    label: 'Net Amount',
    width: 140,
    align: 'right',
    render: (payout) => (
      <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
        {fCurrency(payout.netAmount.amount)} {payout.netAmount.currency}
      </Typography>
    ),
  },
  {
    id: 'grossAmount',
    label: 'Gross Amount',
    width: 140,
    align: 'right',
    render: (payout) => (
      <Typography variant="body2">
        {fCurrency(payout.grossAmount.amount)} {payout.grossAmount.currency}
      </Typography>
    ),
  },
  {
    id: 'payoutDate',
    label: 'Payout Date',
    width: 140,
    render: (payout) => <Typography variant="body2">{fDate(payout.payoutDate)}</Typography>,
  },
  {
    id: 'expectedArrival',
    label: 'Expected Arrival',
    width: 140,
    render: (payout) => (
      <Typography variant="body2" color="text.secondary">
        {payout.expectedArrival ? fDate(payout.expectedArrival) : 'N/A'}
      </Typography>
    ),
  },
  {
    id: 'completedAt',
    label: 'Completed',
    width: 140,
    render: (payout) => (
      <Typography variant="body2" color="text.secondary">
        {payout.completedAt ? fDate(payout.completedAt) : 'N/A'}
      </Typography>
    ),
  },
  {
    id: 'bookings',
    label: 'Bookings',
    width: 100,
    align: 'center',
    render: (payout) => (
      <Chip label={payout.bookings.length} size="small" variant="outlined" color="primary" />
    ),
  },
];

// ----------------------------------------------------------------------

export function PayoutList() {
  const router = useRouter();
  const table = useTable();

  interface PayoutTableFilter {
    search: string;
    status: string;
    hostId: string;
    fromDate: string;
    toDate: string;
    [key: string]: string;
  }

  const filters = useSetState<PayoutTableFilter>({
    search: '',
    status: 'all',
    hostId: '',
    fromDate: '',
    toDate: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const { data: searchPayouts, isLoading } = usePayoutsAdminControllerGetAllPayouts({
    page: table.page,
    limit: table.rowsPerPage,
    status: currentFilters.status !== 'all' ? (currentFilters.status as any) : undefined,
    hostId: currentFilters.hostId || undefined,
    fromDate: currentFilters.fromDate || undefined,
    toDate: currentFilters.toDate || undefined,
  });

  const tableData = useMemo(() => searchPayouts?.payouts || [], [searchPayouts?.payouts]);

  const { mutate: retryFailedPayout } = usePayoutsAdminControllerRetryFailedPayout({
    mutation: {
      onSuccess: () => {
        toast.success('Payout retry initiated successfully');
      },
      onError: () => {
        toast.error('Failed to retry payout');
      },
    },
  });

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All' },
      ...Object.values(PayoutResponseDtoStatus).map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
        value: status,
      })),
    ],
    []
  );

  const canResetFilters = useCallback(
    (filterState: PayoutTableFilter) =>
      !!filterState.search ||
      filterState.status !== 'all' ||
      !!filterState.hostId ||
      !!filterState.fromDate ||
      !!filterState.toDate,
    []
  );

  const handleRetryPayout = useCallback(
    (payout: PayoutResponseDto) => {
      retryFailedPayout({ payoutId: payout.id });
    },
    [retryFailedPayout]
  );

  const rowActions = useMemo(
    () => [
      {
        label: 'View Details',
        icon: 'solar:eye-bold',
        onClick: (payout: PayoutResponseDto) =>
          router.push(paths.dashboard.payouts.details(payout.id)),
      },
      {
        label: 'Edit',
        icon: 'solar:pen-bold',
        onClick: (payout: PayoutResponseDto) =>
          router.push(paths.dashboard.payouts.edit(payout.id)),
        disabled: (payout: PayoutResponseDto) =>
          payout.status === 'completed' || payout.status === 'cancelled',
      },
      {
        label: 'Retry Payout',
        icon: 'solar:refresh-bold',
        onClick: (payout: PayoutResponseDto) => handleRetryPayout(payout),
        disabled: (payout: PayoutResponseDto) =>
          payout.status === 'completed' || payout.status === 'cancelled',
      },
    ],
    [router, handleRetryPayout]
  );

  return (
    <DynamicTable
      data={tableData}
      loading={isLoading}
      columns={TABLE_COLUMNS}
      getRowId={(row) => row.id}
      pagination={{
        page: table.page,
        rowsPerPage: table.rowsPerPage,
        totalCount: searchPayouts?.total || 0,
        onPageChange: table.onChangePage,
        onRowsPerPageChange: table.onChangeRowsPerPage,
      }}
      sorting={{
        orderBy: table.orderBy,
        order: table.order,
        onSort: table.onSort,
      }}
      rowActions={rowActions}
      filtering={{
        state: currentFilters,
        setState: updateFilters,
        searchKey: 'search',
        searchPlaceholder: 'Search payouts by reference, host ID...',
        showFiltersResult: true,
        canResetFilters,
        filterFields: [
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            name: 'status',
            options: statusOptions,
          },
          {
            id: 'hostId',
            label: 'Host ID',
            type: 'text',
            name: 'hostId',
            placeholder: 'Enter host ID...',
          },
          {
            id: 'fromDate',
            label: 'From Date',
            type: 'date',
            name: 'fromDate',
          },
          {
            id: 'toDate',
            label: 'To Date',
            type: 'date',
            name: 'toDate',
          },
        ],
      }}
    />
  );
}
