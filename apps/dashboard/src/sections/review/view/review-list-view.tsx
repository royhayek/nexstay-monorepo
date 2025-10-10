'use client';

import type { ReviewDataDto } from 'src/api/models';
import type { TableHeadCellProps } from 'src/components/table';

import { varAlpha } from 'minimal-shared/utils';
import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useReviewsControllerGetAllReviewsAdminV1 } from 'src/api/queries/reviews/reviews';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { ReviewTableRow } from '../review-table-row';
import { ReviewTableToolbar } from '../review-table-toolbar';
import { ReviewTableFiltersResult } from '../review-table-filters-result';

interface IReviewTableFilters {
  search: string;
  reviewType: 'all' | string;
  rating: 'all' | string;
}

// ----------------------------------------------------------------------

const REVIEW_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'guest_to_host', label: 'Guest to Host' },
  { value: 'host_to_guest', label: 'Host to Guest' },
];

const RATING_OPTIONS = [
  { value: 'all', label: 'All Ratings' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4+ Stars' },
  { value: '3', label: '3+ Stars' },
  { value: '2', label: '2+ Stars' },
  { value: '1', label: '1+ Stars' },
];

const TABLE_HEAD: TableHeadCellProps[] = [
  { id: 'reviewer', label: 'Reviewer', width: 200 },
  { id: 'reviewee', label: 'Reviewee', width: 200 },
  { id: 'property', label: 'Property', width: 180 },
  { id: 'review_type', label: 'Type', width: 120 },
  { id: 'overall_rating', label: 'Rating', width: 100 },
  { id: 'accuracy', label: 'Accuracy', width: 100 },
  { id: 'communication', label: 'Communication', width: 120 },
  { id: 'cleanliness', label: 'Cleanliness', width: 120 },
  { id: 'location', label: 'Location', width: 100 },
  { id: 'value', label: 'Value', width: 100 },
  { id: 'createdAt', label: 'Date', width: 140 },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function ReviewListView() {
  const table = useTable();

  const [tableData, setTableData] = useState<ReviewDataDto[]>([]);

  const filters = useSetState<IReviewTableFilters>({
    search: '',
    reviewType: 'all',
    rating: 'all',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const { data: reviewsData, isLoading } = useReviewsControllerGetAllReviewsAdminV1({
    page: table.page,
    limit: table.rowsPerPage,
    search: currentFilters.search || undefined,
    max_rating: currentFilters.rating !== 'all' ? parseInt(currentFilters.rating, 10) : undefined,
    // review_type: currentFilters.reviewType !== 'all' ? currentFilters.reviewType : undefined,
    min_rating: currentFilters.rating !== 'all' ? parseInt(currentFilters.rating, 10) : undefined,
  });

  const reviewsList = useMemo(() => reviewsData?.data?.data || [], [reviewsData?.data?.data]);

  useEffect(() => {
    if (reviewsList) setTableData(reviewsList);
  }, [reviewsList]);

  const canReset =
    !!currentFilters.search ||
    currentFilters.reviewType !== 'all' ||
    currentFilters.rating !== 'all';

  const notFound = (!tableData.length && canReset) || !tableData.length;

  const handleFilterReviewType = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      table.onResetPage();
      updateFilters({ reviewType: newValue });
    },
    [updateFilters, table]
  );

  const getTypeCounts = () => {
    const counts: Record<string, number> = {
      all: tableData.length,
      guest_to_host: 0,
      host_to_guest: 0,
    };

    tableData.forEach((review) => {
      counts[review.review_type] = (counts[review.review_type] || 0) + 1;
    });

    return counts;
  };

  const typeCounts = getTypeCounts();

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

      <Card>
        <Tabs
          value={currentFilters.reviewType || 'all'}
          onChange={handleFilterReviewType}
          sx={[
            (theme) => ({
              px: 2.5,
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
        >
          {REVIEW_TYPE_OPTIONS.map((tab) => (
            <Tab
              key={tab.value}
              iconPosition="end"
              value={tab.value}
              label={tab.label}
              icon={
                <Label variant="filled" color="default">
                  {typeCounts[tab.value] || 0}
                </Label>
              }
            />
          ))}
        </Tabs>

        <ReviewTableToolbar
          filters={filters}
          onResetPage={table.onResetPage}
          ratingOptions={RATING_OPTIONS}
        />

        {canReset && (
          <ReviewTableFiltersResult
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

          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 1600 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headCells={TABLE_HEAD}
                rowCount={tableData.length}
                numSelected={0}
                onSort={table.onSort}
              />

              <TableBody>
                {tableData.map((row) => (
                  <ReviewTableRow
                    key={row._id}
                    row={row}
                    detailsHref={paths.dashboard.reviews.details(row._id)}
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
          dense={table.dense}
          page={table.page - 1}
          rowsPerPage={table.rowsPerPage}
          count={reviewsData?.data?.total || 0}
          onChangeDense={table.onChangeDense}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          onPageChange={(event, newPage) => table.onChangePage(event, newPage + 1)}
        />
      </Card>
    </DashboardContent>
  );
}
