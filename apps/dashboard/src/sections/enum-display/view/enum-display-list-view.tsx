'use client';

import type { EnumDisplayDataDto } from 'src/api/models';
import type { TableHeadCellProps } from 'src/components/table';
import type { IEnumDisplayTableFilters } from '../enum-display-table-toolbar';

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
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useEnumDisplaysControllerDeleteV1,
  useEnumDisplaysControllerFindAllPaginatedV1,
} from 'src/api/queries/enum-displays/enum-displays';

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

import { EnumDisplayTableRow } from '../enum-display-table-row';
import { EnumDisplayTableToolbar } from '../enum-display-table-toolbar';

// ----------------------------------------------------------------------

const VISIBILITY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'visible', label: 'Visible' },
  { value: 'hidden', label: 'Hidden' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'label', label: 'Label', width: 280 },
  { id: 'enumName', label: 'Enum', width: 160 },
  { id: 'languages', label: 'Languages', width: 200 },
  { id: 'sortOrder', label: 'Sort Order', width: 120, align: 'center' },
  { id: 'isVisible', label: 'Status', width: 120, align: 'center' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function EnumDisplayListView() {
  const table = useTable();
  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState<EnumDisplayDataDto[]>([]);

  const filters = useSetState<IEnumDisplayTableFilters>({
    name: '',
    enumName: '',
    isVisible: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Build query params
  const queryParams = useMemo(() => {
    const params: any = {
      page: table.page,
      limit: table.rowsPerPage,
    };

    if (currentFilters.name) {
      params.search = currentFilters.name;
    }

    if (currentFilters.enumName) {
      params.enumName = currentFilters.enumName;
    }

    if (currentFilters.isVisible !== 'all') {
      params.isVisible = currentFilters.isVisible === 'visible';
    }

    return params;
  }, [table.page, table.rowsPerPage, currentFilters]);

  const { data: enumDisplaysData, isLoading } =
    useEnumDisplaysControllerFindAllPaginatedV1(queryParams);

  const enumDisplaysList = useMemo(
    () => enumDisplaysData?.data?.data || [],
    [enumDisplaysData?.data?.data]
  );

  const { mutate: deleteEnumDisplay } = useEnumDisplaysControllerDeleteV1();

  useEffect(() => {
    if (enumDisplaysList) setTableData(enumDisplaysList);
  }, [enumDisplaysList]);

  // Get enum name options from data
  const enumNameOptions = useMemo(() => {
    const uniqueEnums = Array.from(new Set(tableData.map((item) => item.enumName))).sort();
    return uniqueEnums;
  }, [tableData]);

  // Filter counts
  const filteredDataCount = useMemo(
    () => ({
      all: tableData.length,
      visible: tableData.filter((item) => item.isVisible).length,
      hidden: tableData.filter((item) => !item.isVisible).length,
    }),
    [tableData]
  );

  const canReset =
    !!currentFilters.name || !!currentFilters.enumName || currentFilters.isVisible !== 'all';

  const notFound = (!tableData.length && canReset) || !tableData.length;

  const handleDeleteRow = useCallback(
    (row: EnumDisplayDataDto) => {
      const deleteRow = tableData.filter((item) => item._id !== row._id);

      deleteEnumDisplay(
        { enumName: row.enumName, key: row.key },
        {
          onSuccess: () => {
            toast.success('Enum display deleted successfully');
            setTableData(deleteRow);
            table.onUpdatePageDeleteRow(tableData.length);
          },
          onError: () => {
            toast.error('Failed to delete enum display');
          },
        }
      );
    },
    [deleteEnumDisplay, table, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const keptRows = tableData.filter((row) => !table.selected.includes(row._id));
    const deletedRows = tableData.filter((row) => table.selected.includes(row._id));

    // Delete selected rows one by one
    deletedRows.forEach((row) => {
      deleteEnumDisplay(
        { enumName: row.enumName, key: row.key },
        {
          onSuccess: () => {
            toast.success('Enum displays deleted successfully');
          },
          onError: () => {
            toast.error('Failed to delete some enum displays');
          },
        }
      );
    });

    setTableData(keptRows);
    table.onUpdatePageDeleteRows(tableData.length, tableData.length);
  }, [deleteEnumDisplay, table, tableData]);

  const handleFilterVisibility = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ isVisible: newValue as 'all' | 'visible' | 'hidden' });
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
          Are you sure you want to delete <strong> {table.selected.length} </strong> items?
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
          heading="Enum Displays"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'System', href: paths.dashboard.enumDisplays.root },
            { name: 'Enum Displays' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.enumDisplays.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New Enum Display
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={currentFilters.isVisible || 'all'}
            onChange={handleFilterVisibility}
            sx={{
              px: 2.5,
              boxShadow: (theme) => `inset 0 -2px 0 0 ${theme.vars.palette.grey['500']}08`,
            }}
          >
            {VISIBILITY_OPTIONS.map((tab) => {
              const count = filteredDataCount[tab.value as keyof typeof filteredDataCount] || 0;

              return (
                <Tab
                  key={tab.value}
                  iconPosition="end"
                  value={tab.value}
                  label={tab.label}
                  icon={
                    <Box
                      sx={{
                        minWidth: 24,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 0.75,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        typography: 'caption',
                        fontWeight: 'bold',
                      }}
                    >
                      {count}
                    </Box>
                  }
                />
              );
            })}
          </Tabs>

          <EnumDisplayTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ enumNames: enumNameOptions }}
          />

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
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={confirmDialog.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar sx={{ minHeight: 444 }}>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
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
                    <EnumDisplayTableRow
                      key={row._id}
                      row={row}
                      selected={table.selected.includes(row._id)}
                      onSelectRow={() => table.onSelectRow(row._id)}
                      onDeleteRow={() => handleDeleteRow(row)}
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
            count={enumDisplaysData?.data?.total || 0}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}
