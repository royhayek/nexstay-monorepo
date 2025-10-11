'use client';

import type { AmenityCategoryDataDto } from 'src/api/models/admin';
import type { DynamicTableColumn } from 'src/components/dynamic-table';

import { useMemo, useCallback } from 'react';
import { useSetState } from 'minimal-shared/hooks';

import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  useAmenityCategoriesAdminControllerDelete,
  useAmenityCategoriesAdminControllerFindAll,
} from 'src/api/queries/admin/amenity-categories-management/amenity-categories-management';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { Iconify } from 'src/components/iconify';
import { DynamicTable } from 'src/components/dynamic-table';

// ----------------------------------------------------------------------

const TABLE_COLUMNS: DynamicTableColumn<AmenityCategoryDataDto>[] = [
  {
    id: 'name',
    label: 'Name',
    width: 350,
    render: (category) => {
      const displayName =
        typeof category.name === 'object' ? category.name.en || 'N/A' : category.name || 'N/A';
      const displayKey = category.key || 'N/A';

      return (
        <div>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{String(displayName)}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{`Key: ${String(displayKey)}`}</div>
        </div>
      );
    },
  },
  {
    id: 'group',
    label: 'Group',
    render: (category) => (
      <Chip
        label={category.group || 'No Group'}
        size="small"
        variant={category.group ? 'filled' : 'outlined'}
        color={category.group ? 'primary' : 'default'}
      />
    ),
  },
  {
    id: 'icon',
    label: 'Icon',
    align: 'center',
    render: (category) =>
      category.icon ? (
        <Iconify icon={category.icon} width={24} sx={{ color: 'primary.main' }} />
      ) : (
        <Typography variant="body2" color="text.disabled">
          -
        </Typography>
      ),
  },
  {
    id: 'sortOrder',
    label: 'Sort Order',
    align: 'center',
    render: (category) => (
      <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
        {category.sortOrder}
      </Typography>
    ),
  },
  {
    id: 'isActive',
    label: 'Status',
    align: 'center',
    render: (category) => (
      <Label variant="soft" color={category.isActive ? 'success' : 'default'}>
        {category.isActive ? 'Active' : 'Inactive'}
      </Label>
    ),
  },
];

// ----------------------------------------------------------------------

export function AmenityCategoryList() {
  const router = useRouter();
  const table = useTable();

  interface AmenityCategoryTableFilter {
    search: string;
    status: string;
    group: string;
    [key: string]: string;
  }

  const filters = useSetState<AmenityCategoryTableFilter>({
    search: '',
    status: 'all',
    group: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const { data: categoriesData, isLoading } = useAmenityCategoriesAdminControllerFindAll({
    page: table.page,
    limit: table.rowsPerPage,
    search: currentFilters.search || undefined,
    isActive: currentFilters.status === 'all' ? undefined : currentFilters.status === 'active',
  });

  const tableData = useMemo(
    () => categoriesData?.data?.categories || [],
    [categoriesData?.data?.categories]
  );

  const { mutate: deleteCategory } = useAmenityCategoriesAdminControllerDelete({
    mutation: {
      onSuccess: () => {
        toast.success('Category deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete category');
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

  const groupOptions = useMemo(() => {
    const uniqueGroups = Array.from(
      new Set(
        tableData.map((category) => category.group).filter((group): group is string => !!group)
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
    (filterState: AmenityCategoryTableFilter) =>
      !!filterState.search || filterState.status !== 'all' || filterState.group !== 'all',
    []
  );

  const handleDeleteRow = useCallback(
    (category: AmenityCategoryDataDto) => {
      deleteCategory({ id: category._id });
    },
    [deleteCategory]
  );

  const handleDeleteSelected = useCallback(
    (selectedRows: string[]) => {
      selectedRows.forEach((id) => {
        deleteCategory({ id });
      });
    },
    [deleteCategory]
  );

  const rowActions = useMemo(
    () => [
      {
        label: 'Edit',
        icon: 'solar:pen-bold',
        onClick: (category: AmenityCategoryDataDto) =>
          router.push(paths.dashboard.amenityCategories.edit(category._id)),
      },
      {
        label: 'Delete',
        icon: 'solar:trash-bin-trash-bold',
        color: 'error' as const,
        onClick: (category: AmenityCategoryDataDto) => handleDeleteRow(category),
      },
    ],
    [router, handleDeleteRow]
  );

  // Filter data based on group selection
  const filteredTableData = useMemo(() => {
    if (currentFilters.group === 'all') return tableData;
    if (currentFilters.group === '') return tableData.filter((item) => !item.group);
    return tableData.filter((item) => item.group === currentFilters.group);
  }, [tableData, currentFilters.group]);

  return (
    <DynamicTable
      data={filteredTableData}
      loading={isLoading}
      columns={TABLE_COLUMNS}
      getRowId={(row) => row._id}
      pagination={{
        page: table.page,
        rowsPerPage: table.rowsPerPage,
        totalCount: categoriesData?.data?.total || 0,
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
            filteredTableData.map((row) => row._id)
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
        searchPlaceholder: 'Search categories by name or key...',
        showFiltersResult: true,
        canResetFilters,
        filterFields: [
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
