'use client';

import type { EnumDisplayDataDto } from 'src/api/models/admin';
import type {
  DynamicTableColumn,
  DynamicTableAction,
  DynamicTableRowAction,
} from 'src/components/dynamic-table/types';

import { useSearchParams } from 'next/navigation';
import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useEnumDisplaysAdminControllerDelete,
  useEnumDisplaysAdminControllerFindAll,
} from 'src/api/queries/admin/enum-displays-management/enum-displays-management';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { Iconify } from 'src/components/iconify';
import { DynamicTable } from 'src/components/dynamic-table';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

// Column definitions for the detailed table
const getDetailTableColumns = (): DynamicTableColumn<EnumDisplayDataDto>[] => [
  {
    id: 'key',
    label: 'Key',
    width: 200,
    render: (row) => (
      <Typography variant="body2" fontWeight={600}>
        {row.key}
      </Typography>
    ),
  },
  {
    id: 'label',
    label: 'Labels',
    width: 400,
    render: (row) => {
      const labels = row.label as Record<string, string>;
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {labels && typeof labels === 'object' && (
            <>
              {Object.entries(labels).map(([lang, value]) => (
                <Box key={lang} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={lang.toUpperCase()}
                    size="small"
                    variant="soft"
                    sx={{ width: 40, fontSize: '0.625rem' }}
                  />
                  <Typography variant="body2">{value}</Typography>
                </Box>
              ))}
            </>
          )}
        </Box>
      );
    },
  },
  {
    id: 'sortOrder',
    label: 'Sort Order',
    width: 100,
    align: 'center',
    render: (row) => (
      <Typography variant="body2" fontWeight={600}>
        {row.sortOrder ?? 0}
      </Typography>
    ),
  },
  {
    id: 'isVisible',
    label: 'Status',
    width: 100,
    align: 'center',
    render: (row) => (
      <Label variant="soft" color={row.isVisible ? 'success' : 'error'}>
        {row.isVisible ? 'Visible' : 'Hidden'}
      </Label>
    ),
  },
];

export function EnumDisplayDetailView() {
  const searchParams = useSearchParams();
  const enumName = searchParams.get('enum') || '';

  const table = useTable();
  const confirmDialog = useBoolean();
  const [selectedItem, setSelectedItem] = useState<EnumDisplayDataDto | null>(null);

  // Fetch enum display data
  const { data: enumDisplaysData, isLoading, refetch } = useEnumDisplaysAdminControllerFindAll();
  const { mutate: deleteEnumDisplay } = useEnumDisplaysAdminControllerDelete();

  // Get items for the specific enum
  const items = useMemo(() => {
    if (!enumDisplaysData?.data || !enumName) return [];

    // Check if data is grouped (object of arrays)
    if (!Array.isArray(enumDisplaysData.data)) {
      return (enumDisplaysData.data as Record<string, EnumDisplayDataDto[]>)[enumName] || [];
    }

    // If data is a flat array, filter by enumName
    return (enumDisplaysData.data as EnumDisplayDataDto[]).filter(
      (item) => item.enumName === enumName
    );
  }, [enumDisplaysData?.data, enumName]);

  const handleDeleteRow = useCallback(
    (row: EnumDisplayDataDto) => {
      setSelectedItem(row);
      confirmDialog.onTrue();
    },
    [confirmDialog]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!selectedItem) return;

    deleteEnumDisplay(
      { enumName: selectedItem.enumName, key: selectedItem.key },
      {
        onSuccess: () => {
          toast.success('Enum display deleted successfully');
          confirmDialog.onFalse();
          setSelectedItem(null);
          refetch();
        },
        onError: () => {
          toast.error('Failed to delete enum display');
        },
      }
    );
  }, [selectedItem, deleteEnumDisplay, confirmDialog, refetch]);

  const handleDeleteRows = useCallback(
    (selectedIds: string[]) => {
      const itemsToDelete = items.filter((item) => selectedIds.includes(item._id));

      // Delete selected items one by one
      itemsToDelete.forEach((item) => {
        deleteEnumDisplay(
          { enumName: item.enumName, key: item.key },
          {
            onSuccess: () => {
              toast.success(`Deleted ${item.key}`);
            },
            onError: () => {
              toast.error(`Failed to delete ${item.key}`);
            },
          }
        );
      });

      setTimeout(() => {
        refetch();
        table.onSelectAllRows(false, []);
      }, 500);
    },
    [items, deleteEnumDisplay, refetch, table]
  );

  // Row actions for individual enum displays
  const rowActions: DynamicTableRowAction<EnumDisplayDataDto>[] = useMemo(
    () => [
      {
        label: 'Edit',
        icon: 'solar:pen-bold',
        color: 'default',
        href: (row) =>
          `${paths.dashboard.enumDisplays.root}/edit?enumName=${row.enumName}&key=${row.key}`,
        onClick: () => {}, // Required but navigation is handled by href
      },
      {
        label: 'Delete',
        icon: 'solar:trash-bin-trash-bold',
        color: 'error',
        onClick: handleDeleteRow,
      },
    ],
    [handleDeleteRow]
  );

  // Bulk actions for selected enum displays
  const bulkActions: DynamicTableAction<EnumDisplayDataDto>[] = useMemo(
    () => [
      {
        label: 'Delete Selected',
        icon: 'solar:trash-bin-trash-bold',
        color: 'error',
        onClick: handleDeleteRows,
      },
    ],
    [handleDeleteRows]
  );

  // Statistics for the enum
  const stats = useMemo(() => {
    const visibleCount = items.filter((item) => item.isVisible ?? false).length;
    const hiddenCount = items.filter((item) => !(item.isVisible ?? false)).length;
    return { total: items.length, visible: visibleCount, hidden: hiddenCount };
  }, [items]);

  if (!enumName) {
    return (
      <DashboardContent>
        <EmptyContent
          title="No enum selected"
          description="Please select an enum from the list to view its details"
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.enumDisplays.root}
              variant="contained"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              Back to List
            </Button>
          }
        />
      </DashboardContent>
    );
  }

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={enumName.replace(/([A-Z])/g, ' $1').trim()}
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'System', href: paths.dashboard.enumDisplays.root },
            { name: 'Enum Displays', href: paths.dashboard.enumDisplays.root },
            { name: enumName },
          ]}
          action={
            <Stack direction="row" spacing={2}>
              <Button
                component={RouterLink}
                href={paths.dashboard.enumDisplays.root}
                variant="outlined"
                startIcon={<Iconify icon="eva:arrow-back-fill" />}
              >
                Back
              </Button>
              <Button
                component={RouterLink}
                href={`${paths.dashboard.enumDisplays.new}?enumName=${enumName}`}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                Add New Item
              </Button>
            </Stack>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {/* Statistics Cards */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Card sx={{ px: 3, py: 2, flexGrow: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                }}
              >
                <Iconify icon="solar:list-bold-duotone" width={24} />
              </Box>
              <Box>
                <Typography variant="h4">{stats.total}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Items
                </Typography>
              </Box>
            </Stack>
          </Card>

          <Card sx={{ px: 3, py: 2, flexGrow: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                  bgcolor: 'success.lighter',
                  color: 'success.main',
                }}
              >
                <Iconify icon="solar:check-circle-bold-duotone" width={24} />
              </Box>
              <Box>
                <Typography variant="h4">{stats.visible}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Visible
                </Typography>
              </Box>
            </Stack>
          </Card>

          <Card sx={{ px: 3, py: 2, flexGrow: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                  bgcolor: 'error.lighter',
                  color: 'error.main',
                }}
              >
                <Iconify icon="solar:close-circle-bold-duotone" width={24} />
              </Box>
              <Box>
                <Typography variant="h4">{stats.hidden}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Hidden
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Stack>

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <EmptyContent
            title={`No items in ${enumName}`}
            description="This enum doesn't have any items yet"
            action={
              <Button
                component={RouterLink}
                href={`${paths.dashboard.enumDisplays.new}?enumName=${enumName}`}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                Add First Item
              </Button>
            }
          />
        )}

        {/* Data Table */}
        {!isLoading && items.length > 0 && (
          <Card>
            <DynamicTable<EnumDisplayDataDto>
              // Core data
              data={items}
              loading={false}
              columns={getDetailTableColumns()}
              getRowId={(row) => row._id}
              // Pagination
              pagination={{
                page: table.page,
                rowsPerPage: table.rowsPerPage,
                totalCount: items.length,
                onPageChange: (event, newPage) => table.onChangePage(event, newPage),
                onRowsPerPageChange: table.onChangeRowsPerPage,
              }}
              // Sorting
              sorting={{
                orderBy: table.orderBy,
                order: table.order,
                onSort: table.onSort,
              }}
              // Selection
              selection={{
                selected: table.selected,
                onSelectRow: table.onSelectRow,
                onSelectAllRows: (checked) =>
                  table.onSelectAllRows(
                    checked,
                    items.map((row) => row._id)
                  ),
                bulkActions,
              }}
              // Row actions
              rowActions={rowActions}
              // Options
              options={{
                dense: table.dense,
                onChangeDense: table.onChangeDense,
                minWidth: 900,
              }}
            />
          </Card>
        )}
      </DashboardContent>

      <ConfirmDialog
        open={confirmDialog.value}
        onClose={confirmDialog.onFalse}
        title="Delete Item"
        content={
          <>
            Are you sure you want to delete <strong>{selectedItem?.key}</strong>?
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        }
      />
    </>
  );
}
