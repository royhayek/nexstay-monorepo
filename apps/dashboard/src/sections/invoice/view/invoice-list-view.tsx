'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { InvoiceResponseDto } from 'src/api/models/admin';

import { sumBy } from 'es-toolkit';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean, useSetState } from 'minimal-shared/hooks';
import React, { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fIsAfter } from 'src/utils/format-time';

import { INVOICE_SERVICE_OPTIONS } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';
import { useInvoicesAdminControllerGetAllInvoices } from 'src/api/queries/admin/invoices-management/invoices-management';

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

import { InvoiceAnalytic } from '../invoice-analytic';
import { InvoiceTableRow } from '../invoice-table-row';
import { InvoiceTableToolbar } from '../invoice-table-toolbar';
import { InvoiceTableFiltersResult } from '../invoice-table-filters-result';

// ----------------------------------------------------------------------

// Transform API data to match the expected format
const transformInvoiceData = (invoice: InvoiceResponseDto) => ({
  id: invoice._id,
  invoiceNumber: invoice.invoiceNumber,
  createDate: invoice.createdAt,
  dueDate: invoice.dueDate,
  status: invoice.status,
  sent: invoice.emailSent,
  totalAmount: invoice.pricing?.totalAmount || 0,
  invoiceTo: {
    name: invoice.toAddress?.name || 'N/A',
    company: invoice.toAddress?.email || 'N/A', // Using email as company fallback
    phoneNumber: invoice.toAddress?.phone || 'N/A',
  },
  items:
    invoice.lineItems?.map((item) => ({
      service: item.description || 'Service',
    })) || [],
});

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'invoiceNumber', label: 'Customer' },
  { id: 'createDate', label: 'Create' },
  { id: 'dueDate', label: 'Due' },
  { id: 'price', label: 'Amount' },
  { id: 'sent', label: 'Sent', align: 'center' },
  { id: 'status', label: 'Status' },
  { id: '' },
];

// ----------------------------------------------------------------------

export function InvoiceListView() {
  const theme = useTheme();

  const table = useTable();

  const [tableData, setTableData] = useState<InvoiceResponseDto[]>([]);

  const confirmDialog = useBoolean();

  const [queryParams, setQueryParams] = useState<InvoicesControllerSearchInvoicesV1Params>({
    page: table.page,
    limit: table.rowsPerPage,
  });

  const filters = useSetState({
    name: '',
    service: [],
    status: 'all' as string,
    startDate: null as Date | null,
    endDate: null as Date | null,
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Fetch invoices using React Query
  const { data: invoiceResponse, isLoading } = useInvoicesAdminControllerGetAllInvoices(
    queryParams,
    {
      query: {
        refetchOnWindowFocus: false,
      },
    }
  );

  const invoicesList = useMemo(
    () => invoiceResponse?.data?.invoices || [],
    [invoiceResponse?.data?.invoices]
  );

  const totalCount = invoiceResponse?.data?.total || 0;

  const dateError = fIsAfter(currentFilters.startDate, currentFilters.endDate);

  useEffect(() => {
    if (invoicesList) setTableData(invoicesList);
  }, [invoicesList]);

  // Update query params when filters change
  const updateQueryParams = useCallback(() => {
    const newParams: InvoicesControllerSearchInvoicesV1Params = {
      page: table.page,
      limit: table.rowsPerPage,
    };

    if (currentFilters.name) {
      newParams.search = currentFilters.name;
    }

    if (currentFilters.status !== 'all') {
      newParams.status = currentFilters.status as any;
    }

    if (currentFilters.startDate && !dateError) {
      newParams.dateFrom = currentFilters.startDate.toISOString();
    }

    if (currentFilters.endDate && !dateError) {
      newParams.dateTo = currentFilters.endDate.toISOString();
    }

    setQueryParams(newParams);
  }, [table.page, table.rowsPerPage, currentFilters, dateError]);

  // Transform API data for table rendering
  const transformedData = tableData.map(transformInvoiceData);

  const canReset =
    !!currentFilters.name ||
    currentFilters.service.length > 0 ||
    currentFilters.status !== 'all' ||
    (!!currentFilters.startDate && !!currentFilters.endDate);

  const notFound = (!transformedData.length && canReset) || (!transformedData.length && !isLoading);

  const getInvoiceLength = (status: string) =>
    tableData.filter((item) => item.status === status).length;

  const getTotalAmount = (status: string) =>
    sumBy(
      tableData.filter((item) => item.status === status),
      (invoice) => invoice.pricing?.totalAmount || 0
    );

  const getPercentByStatus = (status: string) =>
    tableData.length > 0 ? (getInvoiceLength(status) / tableData.length) * 100 : 0;

  // Update query params when dependencies change
  useEffect(() => {
    updateQueryParams();
  }, [updateQueryParams]);

  const TABS = [
    {
      value: 'all',
      label: 'All',
      color: 'default',
      count: totalCount || tableData.length,
    },
    {
      value: 'paid',
      label: 'Paid',
      color: 'success',
      count: getInvoiceLength('paid'),
    },
    {
      value: 'pending',
      label: 'Pending',
      color: 'warning',
      count: getInvoiceLength('pending'),
    },
    {
      value: 'overdue',
      label: 'Overdue',
      color: 'error',
      count: getInvoiceLength('overdue'),
    },
    {
      value: 'draft',
      label: 'Draft',
      color: 'default',
      count: getInvoiceLength('draft'),
    },
  ] as const;

  const handleDeleteRow = useCallback((id: string) => {
    // TODO: Implement delete API call
    toast.success('Delete functionality not implemented yet!');
    // After successful delete, refetch data
    // refetch();
  }, []);

  const handleDeleteRows = useCallback(() => {
    // TODO: Implement bulk delete API call
    toast.success('Bulk delete functionality not implemented yet!');
    // After successful delete, refetch data
    // refetch();
  }, []);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Delete"
      content={
        <>
          Are you sure want to delete <strong> {table.selected.length} </strong> items?
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteRows();
            confirmDialog.onFalse();
          }}
        >
          Delete
        </Button>
      }
    />
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="List"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Invoice', href: paths.dashboard.invoices.root },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.invoices.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New invoice
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card sx={{ mb: { xs: 3, md: 5 } }}>
          <Scrollbar sx={{ minHeight: 108 }}>
            <Stack
              divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
              sx={{ py: 2, flexDirection: 'row' }}
            >
              <InvoiceAnalytic
                title="Total"
                total={tableData.length}
                percent={100}
                price={sumBy(tableData, (invoice) => invoice.pricing?.totalAmount || 0)}
                icon="solar:bill-list-bold-duotone"
                color={theme.vars.palette.info.main}
              />

              <InvoiceAnalytic
                title="Paid"
                total={getInvoiceLength('paid')}
                percent={getPercentByStatus('paid')}
                price={getTotalAmount('paid')}
                icon="solar:file-check-bold-duotone"
                color={theme.vars.palette.success.main}
              />

              <InvoiceAnalytic
                title="Pending"
                total={getInvoiceLength('pending')}
                percent={getPercentByStatus('pending')}
                price={getTotalAmount('pending')}
                icon="solar:sort-by-time-bold-duotone"
                color={theme.vars.palette.warning.main}
              />

              <InvoiceAnalytic
                title="Overdue"
                total={getInvoiceLength('overdue')}
                percent={getPercentByStatus('overdue')}
                price={getTotalAmount('overdue')}
                icon="solar:bell-bing-bold-duotone"
                color={theme.vars.palette.error.main}
              />

              <InvoiceAnalytic
                title="Draft"
                total={getInvoiceLength('draft')}
                percent={getPercentByStatus('draft')}
                price={getTotalAmount('draft')}
                icon="solar:file-corrupted-bold-duotone"
                color={theme.vars.palette.text.secondary}
              />
            </Stack>
          </Scrollbar>
        </Card>

        <Card>
          <Tabs
            value={currentFilters.status}
            onChange={handleFilterStatus}
            sx={{
              px: 2.5,
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }}
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                iconPosition="end"
                icon={
                  <Label
                    variant={
                      ((tab.value === 'all' || tab.value === currentFilters.status) && 'filled') ||
                      'soft'
                    }
                    color={tab.color}
                  >
                    {tab.count}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <InvoiceTableToolbar
            filters={filters}
            dateError={dateError}
            onResetPage={table.onResetPage}
            options={{ services: INVOICE_SERVICE_OPTIONS.map((option) => option.name) }}
          />

          {canReset && (
            <InvoiceTableFiltersResult
              filters={filters}
              onResetPage={table.onResetPage}
              totalResults={transformedData.length}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={transformedData.length}
              onSelectAllRows={(checked) => {
                table.onSelectAllRows(
                  checked,
                  transformedData.map((row) => row.id)
                );
              }}
              action={
                <Box sx={{ display: 'flex' }}>
                  <Tooltip title="Sent">
                    <IconButton color="primary">
                      <Iconify icon="custom:send-fill" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Download">
                    <IconButton color="primary">
                      <Iconify icon="solar:download-bold" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Print">
                    <IconButton color="primary">
                      <Iconify icon="solar:printer-minimalistic-bold" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete">
                    <IconButton color="primary" onClick={confirmDialog.onTrue}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            />

            <Scrollbar sx={{ minHeight: 444 }}>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={transformedData.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      transformedData.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {transformedData.map((row) => (
                    <InvoiceTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                      editHref={paths.dashboard.invoices.edit(row.id)}
                      detailsHref={paths.dashboard.invoices.details(row.id)}
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
            count={totalCount}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}
