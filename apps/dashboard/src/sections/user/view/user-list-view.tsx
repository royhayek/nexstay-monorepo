'use client';

import type { DynamicTableColumn } from 'src/components/dynamic-table';
import type { UserDataDto, UsersAdminControllerGetAllUsersSortBy } from 'src/api/models/admin';

import React, { useMemo, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useMultipleEnumOptions } from 'src/hooks/use-enum-options';

import { fShortenNumber } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { getUserRoleColor, getUserStatusColor } from 'src/constants/user-colors';
import {
  useUsersAdminControllerDeleteUser,
  useUsersAdminControllerGetAllUsers,
  useUsersAdminControllerBulkDeleteUsers,
} from 'src/api/queries/admin/users-management/users-management';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { Iconify } from 'src/components/iconify';
import { DynamicTable } from 'src/components/dynamic-table';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const VERIFIED_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Unverified' },
];

const createTableColumns = (
  userStatusOptions: Array<{ value: string; label: string }>,
  userRoleOptions: Array<{ value: string; label: string }>
): DynamicTableColumn<UserDataDto>[] => [
  {
    id: 'firstName',
    label: 'User',
    width: 300,
    cellSx: {
      left: { xs: 0, sm: 'auto' },
      bgcolor: { xs: 'background.paper', sm: 'transparent' },
      zIndex: { xs: 1, sm: 0 },
      minWidth: { xs: 200, sm: 280 },
    },
    render: (user) => {
      const name = `${user.firstName} ${user.lastName}`;
      return (
        <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
          <Avatar
            alt={name}
            src={user.avatarUrl}
            sx={{
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
              border: (theme) => `2px solid ${theme.vars.palette.background.neutral}`,
            }}
          />

          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Link
              component={RouterLink}
              href={paths.dashboard.user.account(user.id)}
              color="inherit"
              sx={{
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                '&:hover': { color: 'primary.main' },
              }}
            >
              {name}
            </Link>

            {user.bio && (
              <Box
                component="span"
                sx={{
                  color: 'text.secondary',
                  fontSize: { xs: 11, sm: 12 },
                  maxWidth: { xs: 150, sm: 200 },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {user.bio}
              </Box>
            )}
          </Stack>
        </Box>
      );
    },
  },
  {
    id: 'phone',
    label: 'Contact',
    width: 200,
    render: (user) => (
      <Stack spacing={0.5}>
        {user.phone && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Iconify icon="solar:phone-bold" width={16} sx={{ color: 'text.secondary' }} />
            <Box component="span" sx={{ typography: 'caption', color: 'text.secondary' }}>
              {user.phone}
            </Box>
            {user.isPhoneVerified && (
              <Iconify icon="solar:check-circle-bold" width={14} sx={{ color: 'success.main' }} />
            )}
          </Box>
        )}
        {user.email && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Iconify icon="solar:letter-bold" width={16} sx={{ color: 'text.secondary' }} />
            <Box
              component="span"
              sx={{
                typography: 'caption',
                color: 'text.secondary',
                maxWidth: 180,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user.email}
            </Box>
            {user.isEmailVerified && (
              <Iconify icon="solar:check-circle-bold" width={14} sx={{ color: 'success.main' }} />
            )}
          </Box>
        )}
      </Stack>
    ),
  },
  {
    id: 'roles',
    label: 'Roles',
    width: 140,
    render: (user) => (
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {user.roles.map((role) => {
          const roleOption = userRoleOptions.find((option) => option.value === role);
          const displayLabel = roleOption?.label || role;

          return (
            <Label key={role} variant="soft" color={getUserRoleColor(role)}>
              {displayLabel}
            </Label>
          );
        })}
      </Box>
    ),
  },
  {
    id: 'status',
    label: 'Status',
    width: 160,
    align: 'center',
    render: (user) => {
      // Find the status option to get the proper label
      const statusOption = userStatusOptions.find((option) => option.value === user.status);
      const displayLabel = statusOption?.label || user.status;

      return (
        <Label variant="soft" color={getUserStatusColor(user.status)}>
          {displayLabel}
        </Label>
      );
    },
  },
  {
    id: 'reviewCount',
    label: 'Reviews',
    width: 120,
    align: 'center',
    render: (user) => fShortenNumber(user.reviewCount || 0),
  },
  {
    id: 'averageRating',
    label: 'Rating',
    width: 180,
    align: 'center',
    format: 'rating',
  },
];

// ----------------------------------------------------------------------

interface UserTableFilter extends Record<string, unknown> {
  search: string;
  status: string[];
  role: string[];
  verified?: string;
}

export function UserListView() {
  const enumOptions = useMultipleEnumOptions(['UserStatus', 'UserRole']);
  const userStatusOptions = enumOptions.UserStatus;
  const userRoleOptions = enumOptions.UserRole;

  const tableColumns = useMemo(
    () => createTableColumns(userStatusOptions, userRoleOptions),
    [userRoleOptions, userStatusOptions]
  );

  const table = useTable();

  const confirmDialog = useBoolean();

  const filters = useSetState<UserTableFilter>({
    search: '',
    role: [],
    verified: 'all',
    status: [],
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    refetch: refetchUsers,
  } = useUsersAdminControllerGetAllUsers({
    page: table.page,
    limit: table.rowsPerPage,
    search: currentFilters.search,
    role: currentFilters.role.length > 0 ? currentFilters.role?.join(',') : undefined,
    verified:
      currentFilters.verified === 'all'
        ? undefined
        : currentFilters.verified === 'true'
          ? true
          : false,
    status: currentFilters.status.length > 0 ? currentFilters.status?.join(',') : undefined,
    sortBy: table.orderBy as UsersAdminControllerGetAllUsersSortBy,
    sortDirection: table.order,
  });

  const usersList = useMemo(() => usersData?.data?.items || [], [usersData?.data?.items]);

  const { mutate: deleteUser } = useUsersAdminControllerDeleteUser();

  const { mutate: deleteUsers } = useUsersAdminControllerBulkDeleteUsers();

  const canResetFilters = useCallback(
    (filterState: UserTableFilter) =>
      !!filterState.search || filterState.role.length > 0 || filterState.status.length > 0,
    []
  );

  const handleDeleteRow = useCallback(
    (id: string) => {
      deleteUser(
        { id },
        {
          onSuccess: (data) => {
            toast.success(data.message);
            table.onUpdatePageDeleteRow(usersList.length);
            refetchUsers();
          },
        }
      );
    },
    [deleteUser, refetchUsers, table, usersList.length]
  );

  const handleDeleteRows = useCallback(() => {
    const deletedRows = usersList.filter((row) => table.selected.includes(row.id));

    deleteUsers(
      { data: { userIds: deletedRows.map((row) => row.id) } },
      {
        onSuccess: (data) => {
          toast.success(data.message);
          table.onUpdatePageDeleteRows(usersList.length, usersList.length);
          refetchUsers();
        },
      }
    );
  }, [deleteUsers, refetchUsers, table, usersList]);

  const handleTabChange = useCallback(
    (newValue: string) => {
      table.onResetPage();
      updateFilters({ verified: newValue });
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

        <DynamicTable
          data={usersList}
          loading={isLoadingUsers}
          columns={tableColumns}
          getRowId={(row) => row.id}
          pagination={{
            page: table.page,
            rowsPerPage: table.rowsPerPage,
            totalCount: usersData?.data.total || 0,
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
                usersList.map((row) => row.id)
              ),
            bulkActions: [
              {
                label: 'Delete',
                icon: 'solar:trash-bin-trash-bold',
                color: 'error',
                onClick: () => confirmDialog.onTrue(),
              },
            ],
          }}
          filtering={{
            state: currentFilters,
            setState: updateFilters,
            searchKey: 'search',
            searchPlaceholder: 'Search users...',
            showFiltersResult: true,
            canResetFilters,
            filterFields: [
              {
                id: 'status',
                label: 'Status',
                type: 'multiselect',
                name: 'status',
                options: userStatusOptions,
              },
              {
                id: 'role',
                label: 'Role',
                type: 'multiselect',
                name: 'role',
                options: userRoleOptions,
              },
            ],
          }}
          tabs={{
            tabs: VERIFIED_OPTIONS,
            activeTab: currentFilters.verified,
            onTabChange: handleTabChange,
          }}
          options={{
            dense: table.dense,
            onChangeDense: table.onChangeDense,
            minWidth: 800,
          }}
          rowActions={[
            {
              label: 'Edit',
              icon: 'solar:pen-bold',
              onClick: (user) => {
                window.location.href = paths.dashboard.user.account((user as UserDataDto).id);
              },
              color: 'default',
            },
            {
              label: 'Delete',
              icon: 'solar:trash-bin-trash-bold',
              onClick: (user) => handleDeleteRow((user as UserDataDto).id),
              color: 'error',
            },
          ]}
        />
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}
