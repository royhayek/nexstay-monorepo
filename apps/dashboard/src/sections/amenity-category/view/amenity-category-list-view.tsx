'use client';

import type { AmenityCategoryDataDto } from 'src/api/models';
import type { TableHeadCellProps } from 'src/components/table';

import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useAmenityCategoriesControllerDeleteV1,
  useAmenityCategoriesControllerFindAllV1,
} from 'src/api/queries/amenity-categories/amenity-categories';

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

import { AmenityCategoryTableRow } from '../amenity-category-table-row';
import { AmenityCategoryTableToolbar } from '../amenity-category-table-toolbar';
import { AmenityCategoryTableFiltersResult } from '../amenity-category-table-filters-result';

interface IAmenityCategoryTableFilters {
  name: string;
  status: string;
}

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'name', label: 'Name' },
  { id: 'key', label: 'Key', width: 200 },
  { id: 'group', label: 'Group', width: 140 },
  { id: 'sortOrder', label: 'Sort Order', width: 120, align: 'center' },
  { id: 'isActive', label: 'Status', width: 120, align: 'center' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function AmenityCategoryListView() {
  const router = useRouter();
  const table = useTable();

  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState<AmenityCategoryDataDto[]>([]);

  const filters = useSetState<IAmenityCategoryTableFilters>({
    name: '',
    status: 'all',
  });

  const { state: currentFilters, setState: updateFilters } = filters;

  const { data: categoriesData, isLoading } = useAmenityCategoriesControllerFindAllV1({
    page: table.page,
    limit: table.rowsPerPage,
    search: currentFilters.name,
    isActive: currentFilters.status === 'all' ? undefined : currentFilters.status === 'active',
  });

  const { mutate: deleteCategory } = useAmenityCategoriesControllerDeleteV1();

  const categoriesList = useMemo(
    () => categoriesData?.data?.data || [],
    [categoriesData?.data?.data]
  );

  const denseHeight = table.dense ? 52 : 72;

  const canReset = currentFilters.name !== '' || currentFilters.status !== 'all';

  const notFound = (!categoriesData?.data?.total && canReset) || !categoriesData?.data?.total;

  useEffect(() => {
    if (categoriesList) setTableData(categoriesList);
  }, [categoriesList]);

  const handleDeleteRow = useCallback(
    (id: string) => {
      deleteCategory(
        { id },
        {
          onSuccess: () => {
            toast.success('Category deleted successfully');
          },
          onError: (error) => {
            toast.error('Failed to delete category');
          },
        }
      );
    },
    [deleteCategory]
  );

  const handleDeleteRows = useCallback(
    (selectedRows: string[]) => {
      selectedRows.forEach((id) => {
        handleDeleteRow(id);
      });
      table.onUpdatePageDeleteRows(categoriesList?.length || 0, categoriesList?.length || 0);
    },
    [table, categoriesList?.length, handleDeleteRow]
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Amenity Categories"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Amenity Categories', href: paths.dashboard.amenityCategories.list },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.amenityCategories.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New Category
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <AmenityCategoryTableToolbar
            filters={currentFilters}
            onResetFilters={() => {
              updateFilters({ name: '', status: 'all' });
            }}
            onFilters={(name, value) => {
              table.onResetPage();
              updateFilters({ [name]: value });
            }}
            statusOptions={STATUS_OPTIONS}
          />

          {canReset && (
            <AmenityCategoryTableFiltersResult
              filters={currentFilters}
              totalResults={categoriesList?.length || 0}
              onResetFilters={() => {
                updateFilters({ name: '', status: 'all' });
              }}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={categoriesList?.length || 0}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(checked, tableData?.map((row) => row._id) || [])
              }
              action={
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={confirmDialog.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            {isLoading && (
              <LinearProgress
                sx={{
                  width: 1,
                  height: 2,
                  bgcolor: 'transparent',
                  position: 'absolute',
                  zIndex: (theme) => theme.zIndex.drawer - 1,
                }}
              />
            )}

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headCells={TABLE_HEAD}
                  rowCount={categoriesList?.length || 0}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(checked, tableData?.map((row) => row._id) || [])
                  }
                />

                <TableBody>
                  {tableData?.map((row) => (
                    <AmenityCategoryTableRow
                      key={row._id}
                      row={row}
                      selected={table.selected.includes(row._id)}
                      onSelectRow={() => table.onSelectRow(row._id)}
                      onDeleteRow={() => handleDeleteRow(row._id)}
                      onEditRow={() => router.push(paths.dashboard.amenityCategories.edit(row._id))}
                    />
                  ))}

                  <TableEmptyRows
                    height={denseHeight + 20}
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
            count={categoriesData?.data?.total || 0}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

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
              handleDeleteRows(table.selected);
              confirmDialog.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
    </>
  );
}
