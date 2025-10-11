import type { IconifyName } from 'src/components/iconify';
import type { DynamicTableProps, DynamicTableFilter } from './types';

import { useMemo } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import {
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { DynamicTableRow } from './dynamic-table-row';
import { DynamicTableToolbar } from './dynamic-table-toolbar';
import { DynamicTableFiltersResult } from './dynamic-table-filters-result';

// ----------------------------------------------------------------------

export function DynamicTable<
  TData = Record<string, unknown>,
  TFilters extends DynamicTableFilter = DynamicTableFilter,
>({
  // Core data
  data,
  loading = false,
  columns,
  getRowId,

  // Grouped functionality
  pagination,
  sorting,
  selection,
  filtering,
  tabs,
  options = {},

  // Row actions
  rowActions = [],

  // Additional content
  additionalToolbarContent,

  // Custom styling
  sx,
}: DynamicTableProps<TData, TFilters>) {
  const { dense = false, minWidth = 800, onChangeDense } = options;

  // Calculate table layout and column widths
  const tableLayout = useMemo(() => {
    const hasActions = rowActions.length > 0;
    const columnsWithWidth = columns.filter(col => col.width);
    const columnsWithoutWidth = columns.filter(col => !col.width);
    
    // If all columns have widths, use fixed layout
    if (columnsWithoutWidth.length === 0) {
      return {
        layout: 'fixed' as const,
        hasFixedWidths: true,
        totalFixedWidth: columnsWithWidth.reduce((sum, col) => sum + (col.width || 0), 0) + (hasActions ? 88 : 0)
      };
    }
    
    // If some columns have widths, use auto layout but respect fixed widths
    if (columnsWithWidth.length > 0) {
      return {
        layout: 'auto' as const,
        hasFixedWidths: true,
        totalFixedWidth: columnsWithWidth.reduce((sum, col) => sum + (col.width || 0), 0) + (hasActions ? 88 : 0)
      };
    }
    
    // If no columns have widths, use auto layout
    return {
      layout: 'auto' as const,
      hasFixedWidths: false,
      totalFixedWidth: hasActions ? 88 : 0
    };
  }, [columns, rowActions]);

  const tableHead = useMemo(() => {
    const hasActions = rowActions.length > 0;

    const headCells = columns.map((column) => ({
      id: String(column.id),
      label: column.label,
      width: column.width,
      align: column.align,
    }));

    // Add actions column if row actions exist
    if (hasActions) {
      headCells.push({ id: '', label: '', width: 88, align: 'right' as const });
    }

    return headCells;
  }, [columns, rowActions]);

  const canReset = filtering?.canResetFilters ? filtering.canResetFilters(filtering.state) : false;
  const notFound = (!data.length && canReset) || !data.length;

  const handleSelectAllRows = (checked: boolean) => {
    if (selection) {
      selection.onSelectAllRows(checked);
    }
  };

  const handleSort = (property: string) => {
    if (!sorting?.onSort) return;

    const isAsc = sorting.orderBy === property && sorting.order === 'asc';
    sorting.onSort(property, isAsc ? 'desc' : 'asc');
  };

  const renderTabs = () => {
    if (!tabs) return null;

    return (
      <Tabs
        value={tabs.activeTab || 'all'}
        onChange={(_, newValue) => tabs.onTabChange(newValue)}
        sx={[
          (theme) => ({
            px: 2.5,
            boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }),
        ]}
      >
        {tabs.tabs.map((tab) => {
          const count = data.length || 0;
          return (
            <Tab
              key={tab.value}
              iconPosition="end"
              value={tab.value}
              label={tab.label}
              icon={
                tabs.activeTab === tab.value ? (
                  <Label variant="filled" color="primary">
                    {count}
                  </Label>
                ) : undefined
              }
            />
          );
        })}
      </Tabs>
    );
  };

  const renderBulkActions = () => {
    if (!selection || !selection.bulkActions || selection.bulkActions.length === 0) return null;

    return (
      <TableSelectedAction
        dense={dense}
        numSelected={selection.selected.length}
        rowCount={data.length}
        onSelectAllRows={handleSelectAllRows}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selection.bulkActions.map((action) => {
              const selectedData = data.filter((row) => selection.selected.includes(getRowId(row)));
              const isDisabled = action.disabled ? action.disabled(selectedData) : false;

              return (
                <Tooltip key={action.label} title={action.label}>
                  <IconButton
                    color={action.color || 'primary'}
                    onClick={() => action.onClick(selection.selected)}
                    disabled={isDisabled}
                  >
                    <Iconify icon={action.icon as IconifyName} />
                  </IconButton>
                </Tooltip>
              );
            })}
          </Box>
        }
      />
    );
  };

  return (
    <Card 
      sx={[
        {
          width: '100%',
          '& .MuiTable-root': {
            tableLayout: tableLayout.layout,
            width: '100%',
            // Set minimum width based on fixed columns
            ...(tableLayout.hasFixedWidths && tableLayout.layout === 'fixed' && {
              minWidth: `${tableLayout.totalFixedWidth}px`,
            }),
          },
          // Apply text overflow styles only when we have fixed widths
          ...(tableLayout.hasFixedWidths && {
            '& .MuiTableCell-root': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          })
        },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    >
      {renderTabs()}

      {filtering && (
        <DynamicTableToolbar
          filters={{ state: filtering.state, setState: filtering.setState }}
          onResetPage={() => pagination.onPageChange(null, 1)}
          placeholder={filtering.searchPlaceholder}
          searchKey={filtering.searchKey}
          filterFields={filtering.filterFields}
          additionalFilters={additionalToolbarContent}
        />
      )}

      {filtering?.showFiltersResult && canReset && filtering && (
        <DynamicTableFiltersResult
          filters={{ state: filtering.state, setState: filtering.setState }}
          totalResults={data.length}
          onResetPage={() => pagination.onPageChange(null, 1)}
          getFilterLabels={filtering.getFilterLabels}
          filterFields={filtering.filterFields}
          sx={{ p: 2.5, pt: 0 }}
        />
      )}

      <Box sx={{ position: 'relative' }}>
        {loading && (
          <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />
        )}

        {renderBulkActions()}

        <Scrollbar sx={{ minHeight: 444 }}>
          <Table 
            size={dense ? 'small' : 'medium'} 
            sx={{ 
              width: '100%',
              minWidth: tableLayout.hasFixedWidths ? 'max-content' : minWidth,
            }}
          >
            <TableHeadCustom
              order={sorting?.order}
              orderBy={sorting?.orderBy}
              headCells={tableHead}
              rowCount={data.length}
              numSelected={selection?.selected.length || 0}
              onSort={handleSort}
              onSelectAllRows={handleSelectAllRows}
            />

            <TableBody>
              {data.map((row) => (
                <DynamicTableRow
                  key={getRowId(row)}
                  row={row}
                  selected={selection?.selected.includes(getRowId(row)) || false}
                  onSelectRow={() => selection?.onSelectRow(getRowId(row))}
                  columns={columns}
                  actions={rowActions}
                />
              ))}

              <TableEmptyRows
                height={dense ? 56 : 56 + 20}
                emptyRows={emptyRows(pagination.page - 1, pagination.rowsPerPage, data.length)}
              />

              <TableNoData notFound={notFound} />
            </TableBody>
          </Table>
        </Scrollbar>
      </Box>

      <TablePaginationCustom
        page={pagination.page - 1}
        dense={dense}
        rowsPerPage={pagination.rowsPerPage}
        onPageChange={(event, newPage) => pagination.onPageChange(event, newPage + 1)}
        count={pagination.totalCount}
        onChangeDense={onChangeDense}
        onRowsPerPageChange={pagination.onRowsPerPageChange}
      />
    </Card>
  );
}
