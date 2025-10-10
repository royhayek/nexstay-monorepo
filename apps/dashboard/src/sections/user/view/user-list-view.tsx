'use client';

import type { TableHeadCellProps } from 'src/components/table';
import type { UserDataDto, UsersControllerGetAllUsersV1SortBy } from 'src/api/models';

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
import { RouterLink } from 'src/routes/components';

import { USER_ROLE_OPTIONS } from 'src/_mock';
import { useAppContext } from 'src/contexts/app';
import { UserDataDtoRolesItem } from 'src/api/models';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  useUsersControllerGetAllUsersV1,
  useUsersControllerAdminDeleteUserV1,
  useUsersControllerAdminBulkDeleteUsersV1,
} from 'src/api/queries/users/users';

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

import { UserTableRow } from '../user-table-row';
import { UserTableToolbar } from '../user-table-toolbar';
import { UserTableFiltersResult } from '../user-table-filters-result';

interface IUserTableFilters {
  name: string;
  role: 'all' | UserDataDtoRolesItem;
}

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }, ...USER_ROLE_OPTIONS];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'firstName', label: 'User' },
  { id: 'phone', label: 'Contact', width: 300 },
  { id: 'roles', label: 'Role', width: 140 },
  { id: 'reviewCount', label: 'Reviews', width: 120, align: 'center' },
  { id: 'averageRating', label: 'Rating', width: 120, align: 'center' },
  { id: 'status', label: 'Status', width: 120, align: 'center' },
  { id: 'createdAt', label: 'Joined', width: 180 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function UserListView() {
  const { catalog } = useAppContext();
  console.log('catalog', catalog);

  const table = useTable();

  const confirmDialog = useBoolean();

  const [tableData, setTableData] = useState<UserDataDto[]>([]);

  const filters = useSetState<IUserTableFilters>({
    name: '',
    role: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const { data: usersData, isLoading } = useUsersControllerGetAllUsersV1({
    page: table.page,
    limit: table.rowsPerPage,
    search: currentFilters.name,
    role: currentFilters.role === 'all' ? undefined : currentFilters.role,
    sortBy: table.orderBy as UsersControllerGetAllUsersV1SortBy,
    sortDirection: table.order,
  });

  const usersList = useMemo(() => usersData?.data?.data || [], [usersData?.data?.data]);

  const { mutate: deleteUser } = useUsersControllerAdminDeleteUserV1();

  const { mutate: deleteUsers } = useUsersControllerAdminBulkDeleteUsersV1();

  useEffect(() => {
    if (usersList) setTableData(usersList);
  }, [usersList]);

  const filteredDataCount = useMemo(
    () => ({
      all: tableData.length,
      guest: tableData.filter((user) => user.roles.includes('guest')).length,
      host: tableData.filter((user) => user.roles.includes('host')).length,
      admin: tableData.filter((user) => user.roles.includes('admin')).length,
    }),
    [tableData]
  );

  const canReset = !!currentFilters.name || currentFilters.role !== 'all';

  const notFound = (!tableData.length && canReset) || !tableData.length;

  const handleDeleteRow = useCallback(
    (id: string) => {
      const deleteRow = tableData.filter((row) => row.id !== id);

      deleteUser(
        { id },
        {
          onSuccess: (data) => {
            toast.success(data.message);
            setTableData(deleteRow);
            table.onUpdatePageDeleteRow(tableData.length);
          },
        }
      );
    },
    [deleteUser, table, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const keptRows = tableData.filter((row) => !table.selected.includes(row.id));
    const deletedRows = tableData.filter((row) => table.selected.includes(row.id));

    deleteUsers(
      { data: { userIds: deletedRows.map((row) => row.id) } },
      {
        onSuccess: (data) => {
          toast.success(data.message);
          setTableData(keptRows);
          table.onUpdatePageDeleteRows(tableData.length, tableData.length);
        },
      }
    );
  }, [deleteUsers, table, tableData]);

  const handleFilterRole = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ role: newValue as UserDataDtoRolesItem });
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
            { name: 'User', href: paths.dashboard.user.root },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.user.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New user
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={currentFilters.role || 'all'}
            onChange={handleFilterRole}
            sx={[
              (theme) => ({
                px: 2.5,
                boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }),
            ]}
          >
            {STATUS_OPTIONS.map((tab) => {
              const count = filteredDataCount[tab.value as keyof typeof filteredDataCount] || 0;

              return (
                <Tab
                  key={tab.value}
                  iconPosition="end"
                  value={tab.value}
                  label={tab.label}
                  icon={
                    currentFilters.role === tab.value ? (
                      <Label variant="filled" color="primary">
                        {count}
                      </Label>
                    ) : null
                  }
                />
              );
            })}
          </Tabs>

          <UserTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            options={{ roles: Object.values(UserDataDtoRolesItem) }}
          />

          {canReset && (
            <UserTableFiltersResult
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
                  tableData.map((row) => row.id)
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
                      tableData.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {tableData.map((row) => (
                    <UserTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                      editHref={paths.dashboard.user.account(row.id)}
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
            count={usersData?.data.total || 0}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}
