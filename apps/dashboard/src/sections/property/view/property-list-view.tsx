'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { PropertyResponseDto, PropertySearchDtoSortBy } from 'src/api/models';

import { varAlpha } from 'minimal-shared/utils';
import { useState, useEffect, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

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
  usePropertiesControllerSearchV1,
  usePropertiesControllerRemoveV1,
} from 'src/api/queries/properties/properties';

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

import { PropertyTableRow } from '../property-table-row';
import { PropertyTableToolbar } from '../property-table-toolbar';
import { PropertyTableFiltersResult } from '../property-table-filters-result';

interface IPropertyTableFilters {
  name: string;
  propertyType: 'all' | string;
}

// ----------------------------------------------------------------------

const PROPERTY_TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Apartment', label: 'Apartment' },
  { value: 'House', label: 'House' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'Condominium', label: 'Condominium' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Loft', label: 'Loft' },
  { value: 'Cabin', label: 'Cabin' },
  { value: 'Cottage', label: 'Cottage' },
  { value: 'Bungalow', label: 'Bungalow' },
  { value: 'Castle', label: 'Castle' },
  { value: 'Treehouse', label: 'Treehouse' },
  { value: 'Boat', label: 'Boat' },
  { value: 'Camper/RV', label: 'Camper/RV' },
  { value: 'Tent', label: 'Tent' },
  { value: 'Hotel', label: 'Hotel' },
  { value: 'Hostel', label: 'Hostel' },
  { value: 'Bed & Breakfast', label: 'Bed & Breakfast' },
  { value: 'Boutique Hotel', label: 'Boutique Hotel' },
  { value: 'Guesthouse', label: 'Guesthouse' },
  { value: 'Guest suite', label: 'Guest suite' },
  { value: 'Serviced apartment', label: 'Serviced apartment' },
  { value: 'Other', label: 'Other' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'name', label: 'Property' },
  { id: 'property_type', label: 'Type', width: 120 },
  { id: 'room_type', label: 'Room Type', width: 120 },
  { id: 'accommodates', label: 'Guests', width: 100 },
  { id: 'bedrooms', label: 'Bedrooms', width: 100 },
  { id: 'price', label: 'Price/Night', width: 120 },
  { id: 'average_rating', label: 'Rating', width: 100 },
  { id: 'host_is_superhost', label: 'Superhost', width: 100 },
  { id: 'createdAt', label: 'Created', width: 180 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function PropertyListView() {
  const table = useTable();

  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState<PropertyResponseDto[]>([]);

  const filters = useSetState<IPropertyTableFilters>({
    name: '',
    propertyType: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const { mutate: searchProperties, isPending: isLoading } = usePropertiesControllerSearchV1();

  const { mutate: deleteProperty } = usePropertiesControllerRemoveV1();

  useEffect(() => {
    const searchData = {
      name: currentFilters.name || undefined,
      property_types:
        currentFilters.propertyType !== 'all' ? [currentFilters.propertyType as any] : undefined,
      page: table.page,
      limit: table.rowsPerPage,
      sort_by: table.orderBy as PropertySearchDtoSortBy,
      sort_order: table.order === 'asc' ? ('asc' as const) : ('desc' as const),
    };

    searchProperties(
      { data: searchData },
      {
        onSuccess: (response) => {
          if (response.data?.data) {
            setTableData(response.data.data);
          }
        },
        onError: (error) => {
          console.error('Failed to fetch properties:', error);
          toast.error('Failed to fetch properties');
        },
      }
    );
  }, [searchProperties, currentFilters, table.page, table.rowsPerPage, table.orderBy, table.order]);

  const canReset = !!currentFilters.name || currentFilters.propertyType !== 'all';

  const notFound = (!tableData.length && canReset) || !tableData.length;

  const handleDeleteRow = useCallback(
    (id: string) => {
      const deleteRow = tableData.filter((row) => row._id !== id);

      deleteProperty(
        { id },
        {
          onSuccess: () => {
            toast.success('Property deleted successfully');
            setTableData(deleteRow);
            table.onUpdatePageDeleteRow(tableData.length);
          },
          onError: () => {
            toast.error('Failed to delete property');
          },
        }
      );
    },
    [deleteProperty, table, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const keptRows = tableData.filter((row) => !table.selected.includes(row._id));
    const deletedRows = tableData.filter((row) => table.selected.includes(row._id));

    Promise.all(
      deletedRows.map(
        (row) =>
          new Promise((resolve, reject) => {
            deleteProperty(
              { id: row._id },
              {
                onSuccess: resolve,
                onError: reject,
              }
            );
          })
      )
    )
      .then(() => {
        toast.success(`${deletedRows.length} properties deleted successfully`);
        setTableData(keptRows);
        table.onUpdatePageDeleteRows(tableData.length, tableData.length);
      })
      .catch(() => {
        toast.error('Failed to delete some properties');
      });
  }, [deleteProperty, table, tableData]);

  const handleFilterPropertyType = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ propertyType: newValue });
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
          heading="Properties"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Properties' },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.properties.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New property
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={currentFilters.propertyType || 'all'}
            onChange={handleFilterPropertyType}
            sx={[
              (theme) => ({
                px: 2.5,
                boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }),
            ]}
          >
            {PROPERTY_TYPE_OPTIONS.map((tab) => (
              <Tab
                key={tab.value}
                iconPosition="end"
                value={tab.value}
                label={tab.label}
                icon={
                  currentFilters.propertyType === tab.value ? (
                    <Label variant="filled" color="default">
                      {tab.value === 'all' || currentFilters.propertyType === tab.value
                        ? tableData.length
                        : tableData.filter((property) => property.property_type === tab.value)
                            .length}
                    </Label>
                  ) : null
                }
              />
            ))}
          </Tabs>

          <PropertyTableToolbar filters={filters} onResetPage={table.onResetPage} />

          {canReset && (
            <PropertyTableFiltersResult
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
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={confirmDialog.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 1200 }}>
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
                    <PropertyTableRow
                      key={row._id}
                      row={row}
                      selected={table.selected.includes(row._id)}
                      onSelectRow={() => table.onSelectRow(row._id)}
                      onDeleteRow={() => handleDeleteRow(row._id)}
                      editHref={paths.dashboard.properties.edit(row._id)}
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
            count={tableData.length}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}
