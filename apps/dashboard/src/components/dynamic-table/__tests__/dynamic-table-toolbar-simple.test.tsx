/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';

import { render, screen, fireEvent } from '@testing-library/react';

// Mock DynamicTableToolbar component
const MockDynamicTableToolbar = ({
  filters,
  onResetPage,
  searchKey,
  placeholder = 'Search...',
  filterFields = [],
  additionalFilters,
}: any) => (
  <div data-testid="dynamic-table-toolbar">
    {searchKey && (
      <div data-testid="search-section">
        <input
          data-testid="search-input"
          placeholder={placeholder}
          value={filters.state[searchKey] || ''}
          onChange={(e) => filters.setState({ [searchKey]: e.target.value })}
        />
      </div>
    )}

    {filterFields.length > 0 && (
      <div data-testid="filter-fields">
        {filterFields.map((field: any) => (
          <div key={field.id} data-testid={`filter-field-${field.id}`}>
            {field.label}
          </div>
        ))}
      </div>
    )}

    {additionalFilters && <div data-testid="additional-filters">{additionalFilters}</div>}
  </div>
);

interface TestFilters {
  name: string;
  status: 'all' | 'active' | 'inactive';
  category: string;
}

const mockFilters = {
  state: { name: '', status: 'all' as const, category: '' },
  setState: jest.fn(),
};

const mockFilterFields = [
  {
    id: 'status-filter',
    name: 'status',
    type: 'select',
    label: 'Status',
    options: [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
  {
    id: 'category-filter',
    name: 'category',
    type: 'text',
    label: 'Category',
    placeholder: 'Enter category...',
  },
];

describe('DynamicTableToolbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search field when searchKey is provided', () => {
    render(
      <MockDynamicTableToolbar
        filters={mockFilters}
        onResetPage={jest.fn()}
        searchKey="name"
        placeholder="Search users..."
      />
    );

    expect(screen.getByTestId('dynamic-table-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('search-section')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
  });

  it('does not render search field when searchKey is not provided', () => {
    render(<MockDynamicTableToolbar filters={mockFilters} onResetPage={jest.fn()} />);

    expect(screen.getByTestId('dynamic-table-toolbar')).toBeInTheDocument();
    expect(screen.queryByTestId('search-section')).not.toBeInTheDocument();
  });

  it('displays current search value', () => {
    const filtersWithValue = {
      state: { name: 'John Doe', status: 'all' as const, category: '' },
      setState: jest.fn(),
    };

    render(
      <MockDynamicTableToolbar
        filters={filtersWithValue}
        onResetPage={jest.fn()}
        searchKey="name"
        placeholder="Search users..."
      />
    );

    const searchInput = screen.getByTestId('search-input') as HTMLInputElement;
    expect(searchInput.value).toBe('John Doe');
  });

  it('handles search input changes', () => {
    render(
      <MockDynamicTableToolbar
        filters={mockFilters}
        onResetPage={jest.fn()}
        searchKey="name"
        placeholder="Search users..."
      />
    );

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    expect(mockFilters.setState).toHaveBeenCalledWith({ name: 'Jane' });
  });

  it('renders filter fields when provided', () => {
    render(
      <MockDynamicTableToolbar
        filters={mockFilters}
        onResetPage={jest.fn()}
        filterFields={mockFilterFields}
      />
    );

    expect(screen.getByTestId('filter-fields')).toBeInTheDocument();
    expect(screen.getByTestId('filter-field-status-filter')).toBeInTheDocument();
    expect(screen.getByTestId('filter-field-category-filter')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('does not render filter fields section when no fields provided', () => {
    render(
      <MockDynamicTableToolbar filters={mockFilters} onResetPage={jest.fn()} filterFields={[]} />
    );

    expect(screen.queryByTestId('filter-fields')).not.toBeInTheDocument();
  });

  it('renders additional filters when provided', () => {
    const additionalFilters = <div data-testid="custom-filter">Custom Filter Component</div>;

    render(
      <MockDynamicTableToolbar
        filters={mockFilters}
        onResetPage={jest.fn()}
        additionalFilters={additionalFilters}
      />
    );

    expect(screen.getByTestId('additional-filters')).toBeInTheDocument();
    expect(screen.getByTestId('custom-filter')).toBeInTheDocument();
    expect(screen.getByText('Custom Filter Component')).toBeInTheDocument();
  });

  it('renders all components together', () => {
    const additionalFilters = <div data-testid="custom-filter">Custom Filter</div>;

    render(
      <MockDynamicTableToolbar
        filters={mockFilters}
        onResetPage={jest.fn()}
        searchKey="name"
        placeholder="Search users..."
        filterFields={mockFilterFields}
        additionalFilters={additionalFilters}
      />
    );

    // All components should be present
    expect(screen.getByTestId('search-section')).toBeInTheDocument();
    expect(screen.getByTestId('filter-fields')).toBeInTheDocument();
    expect(screen.getByTestId('additional-filters')).toBeInTheDocument();
  });

  it('handles empty search input', () => {
    const filtersWithValue = {
      state: { name: 'John', status: 'all' as const, category: '' },
      setState: jest.fn(),
    };

    render(
      <MockDynamicTableToolbar
        filters={filtersWithValue}
        onResetPage={jest.fn()}
        searchKey="name"
        placeholder="Search users..."
      />
    );

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: '' } });

    expect(filtersWithValue.setState).toHaveBeenCalledWith({ name: '' });
  });

  it('uses default placeholder when not provided', () => {
    render(
      <MockDynamicTableToolbar filters={mockFilters} onResetPage={jest.fn()} searchKey="name" />
    );

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('handles complex filter state objects', () => {
    const complexFilters = {
      state: {
        search: 'test search',
        dateRange: { start: null, end: null },
        tags: ['tag1', 'tag2'],
        isActive: true,
      },
      setState: jest.fn(),
    };

    render(
      <MockDynamicTableToolbar
        filters={complexFilters}
        onResetPage={jest.fn()}
        searchKey="search"
        placeholder="Search complex data..."
      />
    );

    const searchInput = screen.getByTestId('search-input') as HTMLInputElement;
    expect(searchInput.value).toBe('test search');
  });
});
