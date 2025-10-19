'use client';

import type { CatalogItemDataDto } from 'src/api/models/admin';
import type { DynamicTableColumn } from 'src/components/dynamic-table';

import { useMemo, useCallback, Suspense } from 'react';
import { useSetState } from 'minimal-shared/hooks';
import * as IconsaxReact from 'iconsax-react';

import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  useCatalogAdminControllerFindAll,
  useCatalogAdminControllerRemove,
  useCatalogAdminControllerRestore,
} from 'src/api/queries/admin/catalogs-admin/catalogs-admin';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { Iconify } from 'src/components/iconify';
import { DynamicTable } from 'src/components/dynamic-table';
import { ICONSAX_ICONS } from 'src/components/iconsax-picker';

// ----------------------------------------------------------------------

const TABLE_COLUMNS: DynamicTableColumn<CatalogItemDataDto>[] = [
  {
    id: 'catalogType',
    label: 'Catalog Type',
    width: 150,
    render: (item) => (
      <Chip
        label={item.catalogType}
        size="small"
        variant="filled"
        color="primary"
      />
    ),
  },
  {
    id: 'label',
    label: 'Label',
    width: 350,
    render: (item) => {
      const displayLabel =
        typeof item.label === 'object' ? item.label.en || 'N/A' : item.label || 'N/A';
      const displayKey = item.key || 'N/A';
      const displayDescription =
        typeof item.description === 'object' ? item.description.en || '' : item.description || '';

      return (
        <div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{String(displayLabel)}</div>
          {displayDescription && (
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>
              {String(displayDescription)}
            </div>
          )}
          <div style={{ fontSize: '12px', color: '#666' }}>{`Key: ${String(displayKey)}`}</div>
        </div>
      );
    },
  },
  {
    id: 'slug',
    label: 'Slug',
    render: (item) => (
      <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
        {item.slug}
      </Typography>
    ),
  },
  {
    id: 'group',
    label: 'Group',
    render: (item) => (
      <Chip
        label={item.group || 'No Group'}
        size="small"
        variant={item.group ? 'filled' : 'outlined'}
        color={item.group ? 'info' : 'default'}
      />
    ),
  },
  {
    id: 'icon',
    label: 'Icon',
    align: 'center',
    render: (item) => {
      if (!item.icon) {
        return (
          <Typography variant="body2" color="text.disabled">
            -
          </Typography>
        );
      }

      // Parse icon value format: "iconName:variant" (e.g., "home-2:Bold")
      const iconParts = item.icon.split(':');
      const iconName = iconParts[0];
      const iconVariant = (iconParts[1] || 'Bold') as any; // Default to Bold if no variant specified

      // Find the Iconsax icon by name
      const iconsaxIcon = ICONSAX_ICONS.find((icon) => icon.name === iconName);
      if (iconsaxIcon) {
        const IconComponent = (IconsaxReact as any)[iconsaxIcon.componentName];
        if (IconComponent) {
          return (
            <Suspense fallback={<Skeleton variant="circular" width={24} height={24} />}>
              <IconComponent size={24} variant={iconVariant} color="currentColor" />
            </Suspense>
          );
        }
      }

      // Fallback to Iconify if not an Iconsax icon (legacy support)
      return <Iconify icon={iconName} width={24} sx={{ color: 'primary.main' }} />;
    },
  },
  {
    id: 'sortOrder',
    label: 'Sort Order',
    align: 'center',
    render: (item) => (
      <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
        {item.sortOrder}
      </Typography>
    ),
  },
  {
    id: 'isActive',
    label: 'Status',
    align: 'center',
    render: (item) => (
      <Label variant="soft" color={item.isActive ? 'success' : 'default'}>
        {item.isActive ? 'Active' : 'Inactive'}
      </Label>
    ),
  },
];

// ----------------------------------------------------------------------

export function CatalogList() {
  const router = useRouter();
  const table = useTable();

  interface CatalogTableFilter {
    search: string;
    catalogType: string;
    status: string;
    group: string;
    [key: string]: string;
  }

  const filters = useSetState<CatalogTableFilter>({
    search: '',
    catalogType: 'all',
    status: 'all',
    group: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const { data: catalogData, isLoading } = useCatalogAdminControllerFindAll({
    page: table.page,
    limit: table.rowsPerPage,
    search: currentFilters.search || undefined,
    catalogType: currentFilters.catalogType === 'all' ? undefined : currentFilters.catalogType,
    isActive: currentFilters.status === 'all' ? undefined : currentFilters.status === 'active',
    group: currentFilters.group === 'all' ? undefined : currentFilters.group,
  });

  const tableData = useMemo(
    () => catalogData?.data?.items || [],
    [catalogData?.data?.items]
  );

  const { mutate: deleteCatalogItem } = useCatalogAdminControllerRemove({
    mutation: {
      onSuccess: () => {
        toast.success('Catalog item deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete catalog item');
      },
    },
  });

  const { mutate: restoreCatalogItem } = useCatalogAdminControllerRestore({
    mutation: {
      onSuccess: () => {
        toast.success('Catalog item restored successfully');
      },
      onError: () => {
        toast.error('Failed to restore catalog item');
      },
    },
  });

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
    []
  );

  const catalogTypeOptions = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(tableData.map((item) => item.catalogType))
    );

    return [
      { value: 'all', label: 'All Types' },
      ...uniqueTypes.map((type) => ({
        value: type,
        label: type,
      })),
    ];
  }, [tableData]);

  const groupOptions = useMemo(() => {
    const uniqueGroups = Array.from(
      new Set(
        tableData.map((item) => item.group).filter((group): group is string => !!group)
      )
    );

    return [
      { value: 'all', label: 'All Groups' },
      { value: '', label: 'No Group' },
      ...uniqueGroups.map((group) => ({
        value: group,
        label: group.charAt(0).toUpperCase() + group.slice(1),
      })),
    ];
  }, [tableData]);

  const canResetFilters = useCallback(
    (filterState: CatalogTableFilter) =>
      !!filterState.search ||
      filterState.catalogType !== 'all' ||
      filterState.status !== 'all' ||
      filterState.group !== 'all',
    []
  );

  const handleDeleteRow = useCallback(
    (item: CatalogItemDataDto) => {
      deleteCatalogItem({ id: item._id });
    },
    [deleteCatalogItem]
  );

  const handleRestoreRow = useCallback(
    (item: CatalogItemDataDto) => {
      restoreCatalogItem({ id: item._id });
    },
    [restoreCatalogItem]
  );

  const handleDeleteSelected = useCallback(
    (selectedRows: string[]) => {
      selectedRows.forEach((id) => {
        deleteCatalogItem({ id });
      });
    },
    [deleteCatalogItem]
  );

  const rowActions = useMemo(
    () => [
      {
        label: 'Edit',
        icon: 'solar:pen-bold',
        onClick: (item: CatalogItemDataDto) =>
          router.push(paths.dashboard.catalogs.edit(item._id)),
      },
      {
        label: 'Delete',
        icon: 'solar:trash-bin-trash-bold',
        color: 'error' as const,
        onClick: (item: CatalogItemDataDto) => handleDeleteRow(item),
      },
    ],
    [router, handleDeleteRow]
  );

  return (
    <DynamicTable
      data={tableData}
      loading={isLoading}
      columns={TABLE_COLUMNS}
      getRowId={(row) => row._id}
      pagination={{
        page: table.page,
        rowsPerPage: table.rowsPerPage,
        totalCount: catalogData?.data?.pagination?.total || 0,
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
            tableData.map((row) => row._id)
          ),
        bulkActions: [
          {
            label: 'Delete Selected',
            icon: 'solar:trash-bin-trash-bold',
            color: 'error',
            onClick: () => handleDeleteSelected(table.selected),
          },
        ],
      }}
      rowActions={rowActions}
      filtering={{
        state: currentFilters,
        setState: updateFilters,
        searchKey: 'search',
        searchPlaceholder: 'Search catalog items by label, key, or slug...',
        showFiltersResult: true,
        canResetFilters,
        filterFields: [
          {
            id: 'catalogType',
            label: 'Catalog Type',
            type: 'select',
            name: 'catalogType',
            options: catalogTypeOptions,
          },
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            name: 'status',
            options: statusOptions,
          },
          {
            id: 'group',
            label: 'Group',
            type: 'select',
            name: 'group',
            options: groupOptions,
          },
        ],
      }}
    />
  );
}
