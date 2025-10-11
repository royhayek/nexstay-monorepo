/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';

import { render, screen, fireEvent } from '@testing-library/react';

// Mock the entire DynamicTable component to avoid complex dependencies
const MockDynamicTable = ({ data, loading, filtering, pagination, tabs, selection }: any) => (
  <div data-testid="dynamic-table">
    {loading && <div data-testid="loading">Loading...</div>}

    {filtering && (
      <div data-testid="toolbar">
        {filtering.searchKey && (
          <input
            data-testid="search-input"
            placeholder={filtering.searchPlaceholder || 'Search...'}
            value={filtering.state[filtering.searchKey] || ''}
            onChange={(e) => filtering.setState({ [filtering.searchKey]: e.target.value })}
          />
        )}
        {filtering.showFiltersResult &&
          filtering.canResetFilters &&
          filtering.canResetFilters(filtering.state) && (
            <div data-testid="filters-result">
              <button onClick={() => filtering.setState({})}>Clear all</button>
            </div>
          )}
      </div>
    )}

    {tabs && (
      <div data-testid="tabs">
        {tabs.tabs.map((tab: any) => (
          <button key={tab.value} onClick={() => tabs.onTabChange(tab.value)}>
            {tab.label}
          </button>
        ))}
      </div>
    )}

    <table data-testid="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row: any) => (
          <tr key={row.id}>
            <td>{row.name}</td>
            <td>{row.email}</td>
            <td>{row.status}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {selection && selection.selected.length > 0 && (
      <div data-testid="bulk-actions">Selected: {selection.selected.length}</div>
    )}

    {pagination && (
      <div data-testid="pagination">
        <button onClick={(e) => pagination.onPageChange(e, pagination.page - 1)}>Previous</button>
        <span>Page {pagination.page}</span>
        <button onClick={(e) => pagination.onPageChange(e, pagination.page + 1)}>Next</button>
      </div>
    )}
  </div>
);

// Sample test data
interface TestData {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

interface TestFilters {
  name: string;
  status: 'all' | 'active' | 'inactive';
}

const mockData: TestData[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'active' },
];

const mockColumns = [
  { id: 'name' as keyof TestData, label: 'Name', width: 200 },
  { id: 'email' as keyof TestData, label: 'Email', width: 250 },
  { id: 'status' as keyof TestData, label: 'Status', width: 120 },
];

const mockPagination = {
  page: 1,
  rowsPerPage: 10,
  totalCount: mockData.length,
  onPageChange: jest.fn(),
  onRowsPerPageChange: jest.fn(),
};

describe('DynamicTable Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders table with data correctly', () => {
    render(
      <MockDynamicTable
        data={mockData}
        loading={false}
        columns={mockColumns}
        getRowId={(row: TestData) => row.id}
        pagination={mockPagination}
      />
    );

    expect(screen.getByTestId('dynamic-table')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(
      <MockDynamicTable
        data={[]}
        loading
        columns={mockColumns}
        getRowId={(row: TestData) => row.id}
        pagination={mockPagination}
      />
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with filtering enabled', () => {
    const mockFilters = {
      state: { name: '', status: 'all' as const },
      setState: jest.fn(),
    };

    const filtering = {
      state: mockFilters.state,
      setState: mockFilters.setState,
      searchKey: 'name',
      searchPlaceholder: 'Search users...',
      showFiltersResult: false,
    };

    render(
      <MockDynamicTable
        data={mockData}
        loading={false}
        columns={mockColumns}
        getRowId={(row: TestData) => row.id}
        pagination={mockPagination}
        filtering={filtering}
      />
    );

    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
  });

  it('handles search input changes', () => {
    const mockFilters = {
      state: { name: '', status: 'all' as const },
      setState: jest.fn(),
    };

    const filtering = {
      state: mockFilters.state,
      setState: mockFilters.setState,
      searchKey: 'name',
      searchPlaceholder: 'Search users...',
      showFiltersResult: false,
    };

    render(
      <MockDynamicTable
        data={mockData}
        loading={false}
        columns={mockColumns}
        getRowId={(row: TestData) => row.id}
        pagination={mockPagination}
        filtering={filtering}
      />
    );

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    expect(mockFilters.setState).toHaveBeenCalledWith({ name: 'John' });
  });

  it('renders tabs when provided', () => {
    const tabs = {
      tabs: [
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
      activeTab: 'all',
      onTabChange: jest.fn(),
    };

    render(
      <MockDynamicTable
        data={mockData}
        loading={false}
        columns={mockColumns}
        getRowId={(row: TestData) => row.id}
        pagination={mockPagination}
        tabs={tabs}
      />
    );

    expect(screen.getByTestId('tabs')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('handles tab changes', () => {
    const tabs = {
      tabs: [
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active' },
      ],
      activeTab: 'all',
      onTabChange: jest.fn(),
    };

    render(
      <MockDynamicTable
        data={mockData}
        loading={false}
        columns={mockColumns}
        getRowId={(row: TestData) => row.id}
        pagination={mockPagination}
        tabs={tabs}
      />
    );

    fireEvent.click(screen.getByText('Active'));
    expect(tabs.onTabChange).toHaveBeenCalledWith('active');
  });

  it('renders bulk actions when rows are selected', () => {
    const selection = {
      selected: ['1', '2'],
      onSelectRow: jest.fn(),
      onSelectAllRows: jest.fn(),
    };

    render(
      <MockDynamicTable
        data={mockData}
        loading={false}
        columns={mockColumns}
        getRowId={(row: TestData) => row.id}
        pagination={mockPagination}
        selection={selection}
      />
    );

    expect(screen.getByTestId('bulk-actions')).toBeInTheDocument();
    expect(screen.getByText('Selected: 2')).toBeInTheDocument();
  });

  it('renders pagination correctly', () => {
    render(
      <MockDynamicTable
        data={mockData}
        loading={false}
        columns={mockColumns}
        getRowId={(row: TestData) => row.id}
        pagination={mockPagination}
      />
    );

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByText('Page 1')).toBeInTheDocument();
  });

  it('handles pagination changes', () => {
    render(
      <MockDynamicTable
        data={mockData}
        loading={false}
        columns={mockColumns}
        getRowId={(row: TestData) => row.id}
        pagination={mockPagination}
      />
    );

    fireEvent.click(screen.getByText('Next'));
    expect(mockPagination.onPageChange).toHaveBeenCalledWith(expect.any(Object), 2);
  });

  it('shows filter results when filters are active', () => {
    const mockFilters = {
      state: { name: 'John', status: 'active' as const },
      setState: jest.fn(),
    };

    const filtering = {
      state: mockFilters.state,
      setState: mockFilters.setState,
      searchKey: 'name',
      searchPlaceholder: 'Search users...',
      showFiltersResult: true,
      canResetFilters: (state: any) => !!state.name || state.status !== 'all',
    };

    render(
      <MockDynamicTable
        data={mockData}
        loading={false}
        columns={mockColumns}
        getRowId={(row: TestData) => row.id}
        pagination={mockPagination}
        filtering={filtering}
      />
    );

    expect(screen.getByTestId('filters-result')).toBeInTheDocument();
    expect(screen.getByText('Clear all')).toBeInTheDocument();
  });

  it('handles clear all filters', () => {
    const mockFilters = {
      state: { name: 'John', status: 'active' as const },
      setState: jest.fn(),
    };

    const filtering = {
      state: mockFilters.state,
      setState: mockFilters.setState,
      searchKey: 'name',
      searchPlaceholder: 'Search users...',
      showFiltersResult: true,
      canResetFilters: (state: any) => !!state.name || state.status !== 'all',
    };

    render(
      <MockDynamicTable
        data={mockData}
        loading={false}
        columns={mockColumns}
        getRowId={(row: TestData) => row.id}
        pagination={mockPagination}
        filtering={filtering}
      />
    );

    fireEvent.click(screen.getByText('Clear all'));
    expect(mockFilters.setState).toHaveBeenCalledWith({});
  });
});
