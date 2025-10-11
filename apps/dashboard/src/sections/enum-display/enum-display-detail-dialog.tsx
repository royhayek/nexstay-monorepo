import type { EnumDisplayDataDto } from 'src/api/models/admin';
import type {
  DynamicTableColumn,
  DynamicTableAction,
  DynamicTableRowAction,
} from 'src/components/dynamic-table/types';

import { useBoolean } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';

import { useEnumDisplaysAdminControllerDelete } from 'src/api/queries/admin/enum-displays-management/enum-displays-management';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { Iconify } from 'src/components/iconify';
import { DynamicTable } from 'src/components/dynamic-table';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

interface Props {
  open: boolean;
  onClose: () => void;
  enumName: string;
  items: EnumDisplayDataDto[];
  onRefresh: () => void;
}

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
  {
    id: 'updatedAt',
    label: 'Last Updated',
    width: 150,
    render: (row) => (
      <Typography variant="caption" color="text.secondary">
        {new Date(row.updatedAt).toLocaleDateString()}
      </Typography>
    ),
  },
];

export function EnumDisplayDetailDialog({ open, onClose, enumName, items, onRefresh }: Props) {
  const table = useTable();
  const confirmDialog = useBoolean();
  const [selectedItem, setSelectedItem] = useState<EnumDisplayDataDto | null>(null);

  const { mutate: deleteEnumDisplay } = useEnumDisplaysAdminControllerDelete();

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
          onRefresh();
        },
        onError: () => {
          toast.error('Failed to delete enum display');
        },
      }
    );
  }, [selectedItem, deleteEnumDisplay, confirmDialog, onRefresh]);

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
        onRefresh();
        table.onResetSelection();
      }, 500);
    },
    [items, deleteEnumDisplay, onRefresh, table]
  );

  // Row actions for individual enum displays
  const rowActions: DynamicTableRowAction<EnumDisplayDataDto>[] = useMemo(
    () => [
      {
        label: 'Edit',
        icon: 'solar:pen-bold',
        color: 'default',
        href: (row) => paths.dashboard.enumDisplays.edit(row._id),
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

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6">
                {enumName.replace(/([A-Z])/g, ' $1').trim()} Enum
              </Typography>
              <Label color="primary">{items.length} items</Label>
            </Box>
            <IconButton onClick={onClose} size="small">
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 0 }}>
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
              minWidth: 800,
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, p: 3, pt: 2 }}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              href={`${paths.dashboard.enumDisplays.new}?enumName=${enumName}`}
            >
              Add New Item
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

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
