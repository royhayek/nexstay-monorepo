'use client';

import type { PropertyResponseDto } from 'src/api/models/admin';
import type { DynamicTableColumn } from 'src/components/dynamic-table';

import { useBoolean, useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useEnumDisplayOptions } from 'src/hooks/use-enum-display-options';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { usersAdminControllerSearchHosts } from 'src/api/queries/admin/users-management/users-management';
import {
  getRoomTypeColor,
  getPropertyTypeColor,
  getPropertyStatusColor,
} from 'src/constants/property-colors';
import {
  usePropertiesAdminControllerDeleteProperty,
  usePropertiesAdminControllerGetAllProperties,
} from 'src/api/queries/admin/properties-management/properties-management';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { Iconify } from 'src/components/iconify';
import { DynamicTable } from 'src/components/dynamic-table';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const PUBLISHED_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Published' },
  { value: 'false', label: 'Draft' },
];

const TABLE_COLUMNS: DynamicTableColumn<PropertyResponseDto>[] = [
  {
    id: 'name',
    label: 'Property',
    width: 300,
    render: (property) => {
      const primaryImage = property.images?.[0]?.url || '/assets/placeholder.png';
      return (
        <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
          <Avatar
            alt={property.name}
            src={primaryImage}
            variant="rounded"
            sx={{ width: 64, height: 48 }}
          />
          <Link
            component={RouterLink}
            href={paths.dashboard.properties.details(property._id)}
            color="inherit"
            sx={{ cursor: 'pointer' }}
          >
            <Typography variant="subtitle2">{property.name}</Typography>
          </Link>
        </Box>
      );
    },
  },
  {
    id: 'propertyType',
    label: 'Type',
    width: 120,
    render: (property) => (
      <Label variant="soft" color={getPropertyTypeColor(property.propertyType)}>
        {property.propertyType}
      </Label>
    ),
  },
  {
    id: 'roomType',
    label: 'Room Type',
    width: 120,
    render: (property) => (
      <Label variant="soft" color={getRoomTypeColor(property.roomType)}>
        {property.roomType}
      </Label>
    ),
  },
  {
    id: 'accommodates',
    label: 'Guests',
    width: 100,
    align: 'center',
    render: (property) => (
      <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
        {property.accommodates}
      </Typography>
    ),
  },
  {
    id: 'bedrooms',
    label: 'Bedrooms',
    width: 100,
    align: 'center',
    render: (property) => (
      <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
        {property.bedrooms}
      </Typography>
    ),
  },
  {
    id: 'price',
    label: 'Price/Night',
    width: 120,
    render: (property) => (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
          {fCurrency(property.price?.basePrice || 0)}
        </Typography>
        <Box component="span" sx={{ color: 'text.disabled', typography: 'caption' }}>
          per night
        </Box>
      </Box>
    ),
  },
  {
    id: 'averageRating',
    label: 'Rating',
    width: 120,
    render: (property) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Rating
          value={property.averageRating || 0}
          precision={0.1}
          readOnly
          size="small"
          sx={{ '& .MuiRating-icon': { fontSize: '1rem' } }}
        />
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
          ({property.numberOfReviews})
        </Typography>
      </Box>
    ),
  },
  {
    id: 'status',
    label: 'Status',
    width: 120,
    align: 'center',
    render: (property) => (
      <Label variant="soft" color={getPropertyStatusColor(property.status)}>
        {property.status}
      </Label>
    ),
  },
  {
    id: 'createdAt',
    label: 'Created',
    width: 140,
    render: (property) => (
      <ListItemText
        primary={fDate(property.createdAt)}
        secondary={fTime(property.createdAt)}
        slotProps={{
          primary: {
            noWrap: true,
            sx: { typography: 'body2' },
          },
          secondary: {
            sx: { mt: 0.5, typography: 'caption' },
          },
        }}
      />
    ),
  },
];

// ----------------------------------------------------------------------

interface PropertyTableFilter extends Record<string, unknown> {
  search: string;
  propertyType: string[];
  roomType: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  hostId: string | null;
  isActive: string;
  isPublished: string;
  instantBookable: string;
  businessTravelReady: string;
  superhost: string;
}

// Host search function for autocomplete using React Query
const createHostSearchFunction =
  () =>
  async (
    searchTerm: string
  ): Promise<
    Array<{
      value: string | number;
      label: string;
      disabled?: boolean;
    }>
  > => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      return [];
    }

    try {
      // Use the React Query function directly
      const data = await usersAdminControllerSearchHosts({ search: searchTerm.trim() });

      if (data?.data?.users) {
        return data.data.users.map((user) => ({
          value: user._id,
          label: `${user.firstName} ${user.lastName}`,
        }));
      }

      return [];
    } catch (error) {
      console.error('Host search error:', error);
      return [];
    }
  };

export function PropertyListView() {
  const router = useRouter();
  const table = useTable();
  const confirmDialog = useBoolean();

  // Filter out any existing 'all' options from enum display options
  const propertyTypeOptions = useEnumDisplayOptions('PropertyType');

  const roomTypeOptions = useEnumDisplayOptions('RoomType');

  // State to store fetched host options
  const [hostOptions, setHostOptions] = useState<
    Array<{
      value: string | number;
      label: string;
      disabled?: boolean;
    }>
  >([]);

  // Create search function that also updates host options
  const baseSearchHosts = createHostSearchFunction();
  const searchHosts = useCallback(
    async (searchTerm: string) => {
      const results = await baseSearchHosts(searchTerm);

      // Update host options with the search results
      if (results.length > 0) {
        setHostOptions((prevOptions) => {
          // Merge new results with existing options, avoiding duplicates
          const existingIds = new Set(prevOptions.map((opt) => opt.value));
          const newOptions = results.filter((opt) => !existingIds.has(opt.value));
          return [...prevOptions, ...newOptions];
        });
      }

      return results;
    },
    [baseSearchHosts]
  );

  const filters = useSetState<PropertyTableFilter>({
    search: '',
    propertyType: [],
    roomType: [],
    minPrice: null,
    maxPrice: null,
    minRating: null,
    hostId: null,
    isActive: 'all',
    isPublished: 'all',
    instantBookable: 'all',
    businessTravelReady: 'all',
    superhost: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  // Load the selected host on mount or when hostId changes
  useEffect(() => {
    if (currentFilters.hostId && hostOptions.length === 0) {
      // If we have a hostId but no options, try to fetch that specific host
      // This ensures the selected value displays correctly
      searchHosts('');
    }
  }, [currentFilters.hostId, hostOptions.length, searchHosts]);

  const { data: propertiesData, isLoading } = usePropertiesAdminControllerGetAllProperties({
    search: currentFilters.search?.trim() || undefined,
    page: table.page,
    limit: table.rowsPerPage,
    // Map supported API parameters
    businessTravelReady:
      currentFilters.businessTravelReady !== 'all' ? currentFilters.businessTravelReady : undefined,
    instantBookable:
      currentFilters.instantBookable !== 'all' ? currentFilters.instantBookable : undefined,
    isSuperhost: currentFilters.superhost !== 'all' ? currentFilters.superhost : undefined,
    isPublished: currentFilters.isPublished !== 'all' ? currentFilters.isPublished : undefined,
    maxPrice: currentFilters.maxPrice !== null ? currentFilters.maxPrice : undefined,
    minPrice: currentFilters.minPrice !== null ? currentFilters.minPrice : undefined,
    minRating: currentFilters.minRating !== null ? currentFilters.minRating : undefined,
    roomType: currentFilters.roomType.length > 0 ? currentFilters.roomType.join(',') : undefined,
    status: currentFilters.isActive !== 'all' ? currentFilters.isActive : undefined,
    hostId: currentFilters.hostId || undefined,
    propertyType:
      currentFilters.propertyType.length > 0 ? currentFilters.propertyType.join(',') : undefined,
  });

  const tableData = useMemo(() => propertiesData?.data.items || [], [propertiesData?.data.items]);

  const { mutate: deleteProperty } = usePropertiesAdminControllerDeleteProperty();

  const canResetFilters = useCallback(
    (filterState: PropertyTableFilter) =>
      !!filterState.search ||
      filterState.roomType.length > 0 ||
      filterState.propertyType.length > 0 ||
      filterState.hostId !== null ||
      filterState.isActive !== 'all' ||
      filterState.minPrice !== null ||
      filterState.maxPrice !== null ||
      filterState.minRating !== null ||
      filterState.instantBookable !== 'all' ||
      filterState.businessTravelReady !== 'all' ||
      filterState.superhost !== 'all',
    []
  );

  const handleDeleteRow = useCallback(
    (id: string) => {
      deleteProperty(
        { id },
        {
          onSuccess: () => {
            toast.success('Property deleted successfully');
          },
          onError: () => {
            toast.error('Failed to delete property');
          },
        }
      );
    },
    [deleteProperty]
  );

  const handleDeleteSelected = useCallback(() => {
    const selectedProperties = tableData.filter((row) => table.selected.includes(row._id));

    Promise.all(
      selectedProperties.map(
        (property) =>
          new Promise((resolve, reject) => {
            deleteProperty(
              { id: property._id },
              {
                onSuccess: resolve,
                onError: reject,
              }
            );
          })
      )
    )
      .then(() => {
        toast.success(`${selectedProperties.length} properties deleted successfully`);
        window.location.reload();
      })
      .catch(() => {
        toast.error('Failed to delete some properties');
      });
  }, [deleteProperty, table.selected, tableData]);

  const handleTabChange = useCallback(
    (newValue: string) => {
      table.onResetPage();
      updateFilters({ isPublished: newValue });
    },
    [updateFilters, table]
  );

  const rowActions = useMemo(
    () => [
      {
        label: 'View Details',
        icon: 'solar:eye-bold',
        onClick: (property: PropertyResponseDto) =>
          router.push(paths.dashboard.properties.details(property._id)),
      },
      {
        label: 'Edit',
        icon: 'solar:pen-bold',
        onClick: (property: PropertyResponseDto) =>
          router.push(paths.dashboard.properties.edit(property._id)),
      },
      {
        label: 'Delete',
        icon: 'solar:trash-bin-trash-bold',
        color: 'error' as const,
        onClick: (property: PropertyResponseDto) => handleDeleteRow(property._id),
      },
    ],
    [router, handleDeleteRow]
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Delete Properties"
      content={
        <>
          Are you sure want to delete <strong> {table.selected.length} </strong> propert
          {table.selected.length === 1 ? 'y' : 'ies'}?
        </>
      }
      action={
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            handleDeleteSelected();
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

        <DynamicTable
          data={tableData}
          loading={isLoading}
          columns={TABLE_COLUMNS}
          getRowId={(row) => row._id}
          pagination={{
            page: table.page,
            rowsPerPage: table.rowsPerPage,
            totalCount: propertiesData?.data?.total || 0,
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
                onClick: confirmDialog.onTrue,
              },
            ],
          }}
          filtering={{
            state: currentFilters,
            setState: updateFilters,
            searchKey: 'search',
            searchPlaceholder: 'Search properties by name, location, or host...',
            showFiltersResult: true,
            canResetFilters,
            filterFields: [
              // API-Supported Filters
              {
                id: 'propertyType',
                label: 'Property Type',
                type: 'multiselect',
                name: 'propertyType',
                options: propertyTypeOptions,
              },
              {
                id: 'hostId',
                label: 'Host',
                type: 'select',
                name: 'hostId',
                autocomplete: true,
                onSearch: searchHosts,
                options: hostOptions,
                minSearchLength: 2,
                searchDelay: 500,
                noOptionsText: 'No hosts found',
                loadingText: 'Searching hosts...',
                placeholder: 'Search by host name...',
              },
              {
                id: 'isActive',
                label: 'Status',
                type: 'select',
                name: 'isActive',
                options: [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ],
              },

              // UI-Only Filters (client-side filtering)
              {
                id: 'roomType',
                label: 'Room Type',
                type: 'multiselect',
                name: 'roomType',
                options: roomTypeOptions,
              },
              {
                id: 'minPrice',
                label: 'Min Price',
                type: 'number',
                name: 'minPrice',
                placeholder: 'Min price per night',
              },
              {
                id: 'maxPrice',
                label: 'Max Price',
                type: 'number',
                name: 'maxPrice',
                placeholder: 'Max price per night',
              },
              {
                id: 'minRating',
                label: 'Min Rating',
                type: 'number',
                name: 'minRating',
                placeholder: 'Minimum rating',
              },
              {
                id: 'instantBookable',
                label: 'Instant Bookable',
                type: 'select',
                name: 'instantBookable',
                options: [
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ],
              },
              {
                id: 'businessTravelReady',
                label: 'Business Travel Ready',
                type: 'select',
                name: 'businessTravelReady',
                options: [
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ],
              },
              {
                id: 'superhost',
                label: 'Superhost',
                type: 'select',
                name: 'superhost',
                options: [
                  { value: 'true', label: 'Superhost' },
                  { value: 'false', label: 'Regular Host' },
                ],
              },
            ],
          }}
          tabs={{
            tabs: PUBLISHED_OPTIONS,
            activeTab: currentFilters.isPublished,
            onTabChange: handleTabChange,
          }}
          options={{
            dense: table.dense,
            onChangeDense: table.onChangeDense,
            minWidth: 1200,
          }}
          rowActions={rowActions}
        />
      </DashboardContent>

      {renderConfirmDialog()}
    </>
  );
}
