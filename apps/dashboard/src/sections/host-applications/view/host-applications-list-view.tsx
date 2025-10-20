'use client';

import type { DynamicTableColumn } from 'src/components/dynamic-table';
import type { UserDataDto } from 'src/api/models/admin';

import React, { useMemo, useState, useCallback } from 'react';
import { useBoolean, useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { getUserRoleColor } from 'src/constants/user-colors';
import type { UsersAdminControllerGetAllUsersSortBy } from 'src/api/models/admin';

import {
  useUsersAdminControllerGetAllUsers,
  useUsersAdminControllerRejectHostApplication,
} from 'src/api/queries/admin/users-management/users-management';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { Iconify } from 'src/components/iconify';
import { DynamicTable } from 'src/components/dynamic-table';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const createTableColumns = (): DynamicTableColumn<UserDataDto>[] => [
  {
    id: 'firstName',
    label: 'Host',
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

            {user.email && (
              <Box
                component="span"
                sx={{
                  color: 'text.secondary',
                  fontSize: { xs: 11, sm: 12 },
                }}
              >
                {user.email}
              </Box>
            )}
          </Stack>
        </Box>
      );
    },
  },
  {
    id: 'roles',
    label: 'Roles',
    width: 180,
    render: (user) => (
      <Stack direction="row" spacing={0.5} flexWrap="wrap">
        {user.roles.map((role) => (
          <Label key={role} variant="soft" color={getUserRoleColor(role)}>
            {role}
          </Label>
        ))}
      </Stack>
    ),
  },
  {
    id: 'createdAt',
    label: 'Joined',
    width: 140,
    render: (user) => fDate(user.createdAt),
  },
  {
    id: 'isEmailVerified',
    label: 'Verified',
    width: 120,
    render: (user) => (
      <Stack direction="row" spacing={0.5}>
        {user.isEmailVerified && (
          <Tooltip title="Email verified">
            <Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: 'success.main' }} />
          </Tooltip>
        )}
        {user.isPhoneVerified && (
          <Tooltip title="Phone verified">
            <Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: 'success.main' }} />
          </Tooltip>
        )}
        {user.isIdentityVerified && (
          <Tooltip title="Identity verified">
            <Iconify icon="eva:shield-fill" sx={{ color: 'info.main' }} />
          </Tooltip>
        )}
      </Stack>
    ),
  },
];

// ----------------------------------------------------------------------

interface HostTableFilter extends Record<string, unknown> {
  search: string;
}

export function HostApplicationsListView() {
  const table = useTable();
  const confirm = useBoolean();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const filters = useSetState<HostTableFilter>({
    search: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Fetch all users with HOST role
  const {
    data: hostsData,
    isLoading,
    refetch,
  } = useUsersAdminControllerGetAllUsers({
    page: table.page,
    limit: table.rowsPerPage,
    search: currentFilters.search || undefined,
    role: 'host', // Filter for HOST role only
    sortBy: table.orderBy as UsersAdminControllerGetAllUsersSortBy,
    sortDirection: table.order,
  });

  const { mutate: revokeHost } = useUsersAdminControllerRejectHostApplication();

  const hostsList = useMemo(() => hostsData?.data?.items || [], [hostsData?.data?.items]);

  const tableColumns = useMemo(() => createTableColumns(), []);

  const canResetFilters = useCallback(
    (filterState: HostTableFilter) => !!filterState.search,
    []
  );

  const handleRevokeClick = useCallback((userId: string) => {
    setSelectedUserId(userId);
    confirm.onTrue();
  }, [confirm]);

  const handleRevokeConfirm = useCallback(() => {
    if (selectedUserId) {
      revokeHost(
        {
          applicationId: selectedUserId,
          data: {
            reason: 'Host access revoked by admin',
          },
        },
        {
          onSuccess: () => {
            toast.success('Host access revoked successfully');
            confirm.onFalse();
            setSelectedUserId(null);
            refetch();
          },
          onError: (err: any) => {
            toast.error(err?.message || 'Failed to revoke host access');
          },
        }
      );
    }
  }, [selectedUserId, revokeHost, confirm, refetch]);

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Host Applications"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Host Applications' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <DynamicTable
          data={hostsList}
          loading={isLoading}
          columns={tableColumns}
          getRowId={(row) => row.id}
          pagination={{
            page: table.page,
            rowsPerPage: table.rowsPerPage,
            totalCount: hostsData?.data?.total || 0,
            onPageChange: table.onChangePage,
            onRowsPerPageChange: table.onChangeRowsPerPage,
          }}
          sorting={{
            orderBy: table.orderBy,
            order: table.order,
            onSort: table.onSort,
          }}
          filtering={{
            state: currentFilters,
            setState: updateFilters,
            searchKey: 'search',
            searchPlaceholder: 'Search hosts by name, email...',
            showFiltersResult: true,
            canResetFilters,
          }}
          options={{
            dense: table.dense,
            onChangeDense: table.onChangeDense,
            minWidth: 800,
          }}
          rowActions={[
            {
              label: 'View Profile',
              icon: 'solar:eye-bold',
              onClick: (user) => {
                window.location.href = paths.dashboard.user.account((user as UserDataDto).id);
              },
              color: 'default',
            },
            {
              label: 'Revoke Host Access',
              icon: 'solar:trash-bin-trash-bold',
              onClick: (user) => handleRevokeClick((user as UserDataDto).id),
              color: 'error',
            },
          ]}
        />
      </DashboardContent>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Revoke Host Access"
        content="Are you sure you want to revoke host access for this user? This action can be reversed later if needed."
        action={
          <Button variant="contained" color="error" onClick={handleRevokeConfirm}>
            Revoke Access
          </Button>
        }
      />
    </>
  );
}
