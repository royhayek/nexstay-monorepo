'use client';

import type { ReviewAdminDto } from 'src/api/models/admin';
import type { DynamicTableColumn } from 'src/components/dynamic-table';

import { useMemo, useCallback } from 'react';
import { useSetState } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { fDate, fTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { useReviewsAdminControllerGetAllReviews } from 'src/api/queries/admin/reviews-management/reviews-management';

import { Label } from 'src/components/label';
import { useTable } from 'src/components/table';
import { DynamicTable } from 'src/components/dynamic-table';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

interface ReviewTableFilter extends Record<string, unknown> {
  search: string;
  reviewType: string;
  rating: string;
}

// ----------------------------------------------------------------------

const REVIEW_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'guest_to_host', label: 'Guest to Host' },
  { value: 'host_to_guest', label: 'Host to Guest' },
];

const RATING_OPTIONS = [
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4+ Stars' },
  { value: '3', label: '3+ Stars' },
  { value: '2', label: '2+ Stars' },
  { value: '1', label: '1+ Stars' },
];

const getReviewTypeColor = (reviewType: string) => {
  switch (reviewType) {
    case 'guest_to_host':
      return 'info';
    case 'host_to_guest':
      return 'success';
    default:
      return 'default';
  }
};

const TABLE_COLUMNS: DynamicTableColumn<ReviewAdminDto>[] = [
  {
    id: 'reviewerId',
    label: 'Reviewer',
    width: 200,
    render: (review) => (
      <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ width: 40, height: 40 }}>R</Avatar>
        <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
          <Typography variant="subtitle2" noWrap>
            Reviewer
          </Typography>
          <Box component="span" sx={{ color: 'text.disabled', typography: 'caption' }}>
            ID: {review.reviewerId.slice(-8)}
          </Box>
        </Stack>
      </Box>
    ),
  },
  {
    id: 'revieweeId',
    label: 'Reviewee',
    width: 200,
    render: (review) => (
      <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ width: 40, height: 40 }}>R</Avatar>
        <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
          <Typography variant="subtitle2" noWrap>
            Reviewee
          </Typography>
          <Box component="span" sx={{ color: 'text.disabled', typography: 'caption' }}>
            ID: {review.revieweeId.slice(-8)}
          </Box>
        </Stack>
      </Box>
    ),
  },
  {
    id: 'propertyId',
    label: 'Property',
    width: 180,
    render: (review) => (
      <Link
        component={RouterLink}
        href={paths.dashboard.properties.details(review.propertyId)}
        color="inherit"
        sx={{ cursor: 'pointer' }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
          Property #{review.propertyId.slice(-8)}
        </Typography>
      </Link>
    ),
  },
  {
    id: 'reviewType',
    label: 'Type',
    width: 120,
    render: (review) => (
      <Label variant="soft" color={getReviewTypeColor(review.reviewType)}>
        {review.reviewType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </Label>
    ),
  },
  {
    id: 'overallRating',
    label: 'Rating',
    width: 140,
    render: (review) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Rating
          value={review.overallRating || 0}
          precision={0.1}
          readOnly
          size="small"
          sx={{ '& .MuiRating-icon': { fontSize: '1rem' } }}
        />
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
          ({review.overallRating?.toFixed(1) || 'N/A'})
        </Typography>
      </Box>
    ),
  },
  {
    id: 'accuracy',
    label: 'Accuracy',
    width: 100,
    align: 'center',
    render: (review) => (
      <Typography variant="body2">{review.accuracy?.toFixed(1) || 'N/A'}</Typography>
    ),
  },
  {
    id: 'communication',
    label: 'Communication',
    width: 120,
    align: 'center',
    render: (review) => (
      <Typography variant="body2">{review.communication?.toFixed(1) || 'N/A'}</Typography>
    ),
  },
  {
    id: 'cleanliness',
    label: 'Cleanliness',
    width: 120,
    align: 'center',
    render: (review) => (
      <Typography variant="body2">{review.cleanliness?.toFixed(1) || 'N/A'}</Typography>
    ),
  },
  {
    id: 'location',
    label: 'Location',
    width: 100,
    align: 'center',
    render: (review) => (
      <Typography variant="body2">{review.location?.toFixed(1) || 'N/A'}</Typography>
    ),
  },
  {
    id: 'value',
    label: 'Value',
    width: 100,
    align: 'center',
    render: (review) => (
      <Typography variant="body2">{review.value?.toFixed(1) || 'N/A'}</Typography>
    ),
  },
  {
    id: 'createdAt',
    label: 'Date',
    width: 140,
    render: (review) => (
      <ListItemText
        primary={fDate(review.createdAt)}
        secondary={fTime(review.createdAt)}
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

export function ReviewListView() {
  const table = useTable();
  const router = useRouter();

  const filters = useSetState<ReviewTableFilter>({
    search: '',
    reviewType: 'all',
    rating: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const { data: reviewsData, isLoading } = useReviewsAdminControllerGetAllReviews({
    page: table.page,
    limit: table.rowsPerPage,
    search: currentFilters.search || undefined,
    minRating: currentFilters.rating !== 'all' ? parseInt(currentFilters.rating, 10) : undefined,
    maxRating: currentFilters.rating !== 'all' ? parseInt(currentFilters.rating, 10) : undefined,
  });

  const tableData = useMemo(() => reviewsData?.data?.items || [], [reviewsData?.data?.items]);

  const canResetFilters = useCallback(
    (filterState: ReviewTableFilter) =>
      !!filterState.search || filterState.reviewType !== 'all' || filterState.rating !== 'all',
    []
  );

  const handleTabChange = useCallback(
    (newValue: string) => {
      table.onResetPage();
      updateFilters({ reviewType: newValue });
    },
    [updateFilters, table]
  );

  // Apply client-side filtering for review type (since API doesn't support it yet)
  const filteredTableData = useMemo(() => {
    let filtered = tableData;

    if (currentFilters.reviewType !== 'all') {
      filtered = filtered.filter((review) => review.reviewType === currentFilters.reviewType);
    }

    return filtered;
  }, [tableData, currentFilters.reviewType]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Reviews"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Reviews' },
          { name: 'List' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <DynamicTable
        data={filteredTableData}
        loading={isLoading}
        columns={TABLE_COLUMNS}
        getRowId={(row) => row.id}
        pagination={{
          page: table.page,
          rowsPerPage: table.rowsPerPage,
          totalCount: reviewsData?.data.total || 0,
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
          searchPlaceholder: 'Search reviews...',
          showFiltersResult: true,
          canResetFilters,
          filterFields: [
            {
              id: 'rating',
              label: 'Rating',
              type: 'select',
              name: 'rating',
              options: RATING_OPTIONS,
            },
          ],
        }}
        tabs={{
          tabs: REVIEW_TYPE_OPTIONS,
          activeTab: currentFilters.reviewType,
          onTabChange: handleTabChange,
        }}
        options={{
          dense: table.dense,
          onChangeDense: table.onChangeDense,
          minWidth: 1600,
        }}
        rowActions={[
          {
            label: 'View Details',
            icon: 'solar:eye-bold',
            color: 'default',
            onClick: (review) => router.push(paths.dashboard.reviews.details(review.id)),
          },
        ]}
      />
    </DashboardContent>
  );
}
