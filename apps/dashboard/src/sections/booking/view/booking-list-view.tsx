'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type {
  BookingResponseDto,
  BookingsControllerGetAllBookingsAdminV1Status,
} from 'src/api/models';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useBookingsControllerCancelV1,
  useBookingsControllerGetAllBookingsAdminV1,
} from 'src/api/queries/bookings/bookings';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { BookingTableRow } from '../booking-table-row';
import { BookingTableToolbar } from '../booking-table-toolbar';
import { BookingTableFiltersResult } from '../booking-table-filters-result';

interface IBookingTableFilters {
  search: string;
  status: 'all' | string;
  paymentStatus: 'all' | string;
}

// ----------------------------------------------------------------------

const BOOKING_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'All Payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'confirmation_code', label: 'Confirmation' },
  { id: 'property', label: 'Property', width: 300 },
  { id: 'guest_name', label: 'Guest', width: 180 },
  { id: 'check_in', label: 'Check In', width: 140 },
  { id: 'check_out', label: 'Check Out', width: 140 },
  { id: 'nights', label: 'Nights', width: 80 },
  { id: 'total_amount', label: 'Total', width: 120 },
  { id: 'status', label: 'Status', width: 120 },
  { id: 'payment_status', label: 'Payment', width: 120 },
  { id: 'createdAt', label: 'Booked', width: 140 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function BookingListView() {
  const table = useTable();

  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState<BookingResponseDto[]>([]);

  const filters = useSetState<IBookingTableFilters>({
    search: '',
    status: 'all',
    paymentStatus: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const { data: bookingsData, isLoading } = useBookingsControllerGetAllBookingsAdminV1({
    page: table.page,
    limit: table.rowsPerPage,
    search: currentFilters.search || undefined,
    status:
      currentFilters.status !== 'all'
        ? (currentFilters.status as BookingsControllerGetAllBookingsAdminV1Status)
        : undefined,
    payment_status: currentFilters.paymentStatus !== 'all' ? currentFilters.paymentStatus : '',
  });

  const bookingsList = useMemo(() => bookingsData?.data?.data || [], [bookingsData?.data?.data]);

  const { mutate: cancelBooking } = useBookingsControllerCancelV1();

  useEffect(() => {
    if (bookingsList) setTableData(bookingsList);
  }, [bookingsList]);

  const canReset =
    !!currentFilters.search ||
    currentFilters.status !== 'all' ||
    currentFilters.paymentStatus !== 'all';

  const notFound = (!tableData.length && canReset) || !tableData.length;

  const handleCancelBooking = useCallback(
    (id: string) => {
      cancelBooking(
        {
          id,
          data: {
            cancellation_reason: 'Cancelled by host',
          },
        },
        {
          onSuccess: () => {
            toast.success('Booking cancelled successfully');
            // Refetch data
            window.location.reload();
          },
          onError: () => {
            toast.error('Failed to cancel booking');
          },
        }
      );
    },
    [cancelBooking]
  );

  const handleCancelSelected = useCallback(() => {
    const selectedBookings = tableData.filter((row) => table.selected.includes(row._id));

    Promise.all(
      selectedBookings.map(
        (booking) =>
          new Promise((resolve, reject) => {
            cancelBooking(
              {
                id: booking._id,
                data: {
                  cancellation_reason: 'Bulk cancellation by host',
                },
              },
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
  }, [cancelBooking, table, tableData]);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      console.log('Filter status changed:', newValue);
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      all: tableData.length,
      pending: 0,
      confirmed: 0,
      checked_in: 0,
      checked_out: 0,
      cancelled: 0,
    };

    tableData.forEach((booking) => {
      counts[booking.status] = (counts[booking.status] || 0) + 1;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
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
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Bookings"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Bookings' },
            { name: 'List' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={currentFilters.status || 'all'}
            onChange={handleFilterStatus}
            sx={[
              (theme) => ({
                px: 2.5,
                boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }),
            ]}
          >
            {BOOKING_STATUS_OPTIONS.map((tab) => (
              <Tab
                key={tab.value}
                iconPosition="end"
                value={tab.value}
                label={tab.label}
                icon={
                  currentFilters.status === tab.value ? (
                    <Label variant="filled" color="default">
                      {statusCounts[tab.value] || 0}
                    </Label>
                  ) : undefined
                }
              />
            ))}
          </Tabs>

          <BookingTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            paymentStatusOptions={PAYMENT_STATUS_OPTIONS}
          />

          {canReset && (
            <BookingTableFiltersResult
              filters={filters}
              totalResults={tableData.length}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            {isLoading && (
              <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />
            )}

            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={tableData.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  tableData.map((row) => row._id)
                )
              }
              action={
                <Tooltip title="Cancel Selected">
                  <IconButton color="primary" onClick={confirmDialog.onTrue}>
                    <Iconify icon="solar:close-circle-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 1400 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={tableData.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      tableData.map((row) => row._id)
                    )
                  }
                />

                <TableBody>
                  {tableData.map((row) => (
                    <BookingTableRow
                      key={row._id}
                      row={row}
                      selected={table.selected.includes(row._id)}
                      onSelectRow={() => table.onSelectRow(row._id)}
                      onCancelBooking={() => handleCancelBooking(row._id)}
                      detailsHref={paths.dashboard.bookings.details(row._id)}
                      propertyHref={paths.dashboard.properties.details(row.property.id)}
                    />
                  ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 56 + 20}
                    emptyRows={emptyRows(0, table.rowsPerPage, tableData.length)}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={table.page - 1}
            dense={table.dense}
            rowsPerPage={table.rowsPerPage}
            onPageChange={(event, newPage) => table.onChangePage(event, newPage + 1)}
            count={bookingsData?.data?.total || 0}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}
