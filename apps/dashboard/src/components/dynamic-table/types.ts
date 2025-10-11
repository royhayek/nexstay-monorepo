import type { ReactNode } from 'react';
import type { Theme, SxProps } from '@mui/material/styles';
import type { TableHeadCellProps } from 'src/components/table';

// ----------------------------------------------------------------------

export interface DynamicTableColumn<TData = Record<string, unknown>>
  extends Omit<TableHeadCellProps, 'id'> {
  id: keyof TData;
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (row: TData) => ReactNode;
  // Advanced formatting options
  format?: 'currency' | 'number' | 'date' | 'datetime' | 'boolean' | 'rating' | 'status' | 'image';
  // For currency formatting
  currency?: string;
  // For number formatting
  decimals?: number;
  // For date formatting
  dateFormat?: string;
  // For status formatting
  statusColors?: Record<
    string,
    'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  >;
  // Custom class names or styling
  cellSx?: SxProps<Theme>;
}

export interface DynamicTableTab {
  value: string;
  label: string;
}

export interface DynamicTableAction<TData = Record<string, unknown>> {
  label: string;
  icon: string;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  onClick: (selectedIds: string[]) => void;
  disabled?: (selectedData: TData[]) => boolean;
}

export interface DynamicTableRowAction<TData = Record<string, unknown>> {
  label: string;
  icon: string;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  onClick: (row: TData) => void;
  href?: string | ((row: TData) => string);
  disabled?: (row: TData) => boolean;
}

export interface DynamicTableFilter {
  [key: string]: unknown;
}

// Dynamic Filter Field Types - compatible with DynamicForm
export interface DynamicTableFilterField<TFilters extends DynamicTableFilter = DynamicTableFilter> {
  id: string;
  name: keyof TFilters;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'dateRange' | 'number';
  label: string;
  placeholder?: string;
  width?: number | string;
  maxWidth?:
    | number
    | string
    | {
        xs?: number | string;
        sm?: number | string;
        md?: number | string;
        lg?: number | string;
        xl?: number | string;
      };
  options?: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
  // For date fields
  minDate?: Date;
  maxDate?: Date;
  // For number fields
  min?: number;
  max?: number;
  step?: number;
  // Conditional display
  condition?: {
    field: keyof TFilters;
    operator: 'equals' | 'not_equals' | 'in' | 'not_in';
    value: unknown;
  };
  // Autocomplete functionality (for select/multiselect fields)
  autocomplete?: boolean;
  onSearch?: (searchTerm: string) => Promise<Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>>;
  freeSolo?: boolean;
  loading?: boolean;
  minSearchLength?: number;
  searchDelay?: number;
  noOptionsText?: string;
  loadingText?: string;
  // Custom styling
  sx?: SxProps<Theme>;
  // Grid sizing for layout
  gridSize?: {
    xs?: number | 'auto';
    sm?: number | 'auto';
    md?: number | 'auto';
    lg?: number | 'auto';
    xl?: number | 'auto';
  };
}

// Grouped Props Interfaces
export interface DynamicTablePagination {
  page: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface DynamicTableSorting {
  orderBy?: string;
  order?: 'asc' | 'desc';
  onSort?: (orderBy: string, order: 'asc' | 'desc') => void;
}

export interface DynamicTableSelection<TData = Record<string, unknown>> {
  selected: string[];
  onSelectRow: (id: string) => void;
  onSelectAllRows: (checked: boolean) => void;
  bulkActions?: DynamicTableAction<TData>[];
}

export interface DynamicTableFiltering<TFilters extends DynamicTableFilter = DynamicTableFilter> {
  state: TFilters;
  setState: (filters: Partial<TFilters>) => void;
  searchKey?: keyof TFilters;
  searchPlaceholder?: string;
  showFiltersResult?: boolean;
  getFilterLabels?: (filters: TFilters) => { key: string; label: string; value: unknown }[];
  canResetFilters?: (filters: TFilters) => boolean;
  // Dynamic filter fields configuration
  filterFields?: DynamicTableFilterField<TFilters>[];
}

export interface DynamicTableTabs {
  tabs: DynamicTableTab[];
  activeTab?: string;
  onTabChange: (tab: string) => void;
}

export interface DynamicTableOptions {
  dense?: boolean;
  onChangeDense?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  minWidth?: number | string;
}

// Component Props Interfaces
export interface DynamicTableToolbarProps<
  TFilters extends DynamicTableFilter = DynamicTableFilter,
> {
  filters: {
    state: TFilters;
    setState: (filters: Partial<TFilters>) => void;
  };
  onResetPage: () => void;
  placeholder?: string;
  searchKey?: keyof TFilters;
  additionalFilters?: ReactNode;
  filterFields?: DynamicTableFilterField<TFilters>[];
}

export interface DynamicTableFiltersResultProps<
  TFilters extends DynamicTableFilter = DynamicTableFilter,
> {
  filters: {
    state: TFilters;
    setState: (filters: Partial<TFilters>) => void;
  };
  totalResults: number;
  onResetPage: () => void;
  sx?: SxProps<Theme>;
  getFilterLabels?: (filters: TFilters) => { key: string; label: string; value: unknown }[];
  filterFields?: DynamicTableFilterField<TFilters>[];
}

export interface DynamicTableRowProps<TData = Record<string, unknown>> {
  row: TData;
  selected: boolean;
  onSelectRow: () => void;
  columns: DynamicTableColumn<TData>[];
  actions?: DynamicTableRowAction<TData>[];
}

// Main Table Props Interface
export interface DynamicTableProps<
  TData = Record<string, unknown>,
  TFilters extends DynamicTableFilter = DynamicTableFilter,
> {
  // Core data
  data: TData[];
  loading?: boolean;
  columns: DynamicTableColumn<TData>[];
  getRowId: (row: TData) => string;

  // Grouped functionality
  pagination: DynamicTablePagination;
  sorting?: DynamicTableSorting;
  selection?: DynamicTableSelection<TData>;
  filtering?: DynamicTableFiltering<TFilters>;
  tabs?: DynamicTableTabs;
  options?: DynamicTableOptions;

  // Row actions
  rowActions?: DynamicTableRowAction<TData>[];

  // Additional toolbar content
  additionalToolbarContent?: ReactNode;

  // Custom styling
  sx?: SxProps<Theme>;
}
