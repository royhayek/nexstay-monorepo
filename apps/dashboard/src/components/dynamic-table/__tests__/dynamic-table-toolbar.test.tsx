import '@testing-library/jest-dom';

import type { DynamicTableFilter, DynamicTableFilterField } from '../types';

/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';

import { DynamicTableToolbar } from '../dynamic-table-toolbar';

// Mock dependencies
jest.mock('src/components/iconify', () => ({
  Iconify: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`}>{icon}</span>,
}));

jest.mock('../dynamic-table-filter-fields', () => ({
  DynamicTableFilterFields: ({ filterFields, filters, onResetPage }: any) => (
    <div data-testid="dynamic-filter-fields">
      {filterFields.map((field: any) => (
        <div key={field.id} data-testid={`filter-field-${field.id}`}>
          {field.label}
        </div>
      ))}
    </div>
  ),
}));

// Sample test interfaces
interface TestFilters extends DynamicTableFilter {
  name: string;
  status: 'all' | 'active' | 'inactive';
  category: string;
}

const mockFilters = {
  state: { name: '', status: 'all' as const, category: '' },
  setState: jest.fn(),
};

const mockFilterFields: DynamicTableFilterField<TestFilters>[] = [
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

describe('DynamicTableToolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search field when searchKey is provided', () => {
    render(
      <DynamicTableToolbar
        filters={mockFilters}
        onResetPage={jest.fn()}
        searchKey="name"
        placeholder="Search users..."
      />
    );

    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    expect(screen.getByTestId('icon-eva:search-fill')).toBeInTheDocument();
  });

  it('does not render search field when searchKey is not provided', () => {
    render(<DynamicTableToolbar filters={mockFilters} onResetPage={jest.fn()} />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('displays current search value', () => {
    const filtersWithValue = {
      state: { name: 'John Doe', status: 'all' as const, category: '' },
      setState: jest.fn(),
    };

    render(
      <DynamicTableToolbar
        filters={filtersWithValue}
        onResetPage={jest.fn()}
        searchKey="name"
        placeholder="Search users..."
      />
    );

    const searchInput = screen.getByDisplayValue('John Doe');
    expect(searchInput).toBeInTheDocument();
  });

  it('handles search input changes', () => {
    render(
      <DynamicTableToolbar
        filters={mockFilters}
        onResetPage={jest.fn()}
        searchKey="name"
        placeholder="Search users..."
      />
    );

    const searchInput = screen.getByPlaceholderText('Search users...');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    expect(mockFilters.setState).toHaveBeenCalledWith({ name: 'Jane' });
  });

  it('does not call setState when searchKey is not provided', () => {
    render(<DynamicTableToolbar filters={mockFilters} onResetPage={jest.fn()} />);

    // Since no search field is rendered, setState should not be called
    expect(mockFilters.setState).not.toHaveBeenCalled();
  });

  it('renders filter fields when provided', () => {
    render(
      <DynamicTableToolbar
        filters={mockFilters}
        onResetPage={jest.fn()}
        filterFields={mockFilterFields}
      />
    );

    expect(screen.getByTestId('dynamic-filter-fields')).toBeInTheDocument();
    expect(screen.getByTestId('filter-field-status-filter')).toBeInTheDocument();
    expect(screen.getByTestId('filter-field-category-filter')).toBeInTheDocument();
  });

  it('does not render filter fields section when no fields provided', () => {
    render(<DynamicTableToolbar filters={mockFilters} onResetPage={jest.fn()} filterFields={[]} />);

    expect(screen.queryByTestId('dynamic-filter-fields')).not.toBeInTheDocument();
  });

  it('renders additional filters when provided', () => {
    const additionalFilters = <div data-testid="additional-filters">Custom Filter Component</div>;

    render(
      <DynamicTableToolbar
        filters={mockFilters}
        onResetPage={jest.fn()}
        additionalFilters={additionalFilters}
      />
    );

    expect(screen.getByTestId('additional-filters')).toBeInTheDocument();
    expect(screen.getByText('Custom Filter Component')).toBeInTheDocument();
  });

  it('renders all components together', () => {
    const additionalFilters = <div data-testid="additional-filters">Custom Filter</div>;

    render(
      <DynamicTableToolbar
        filters={mockFilters}
        onResetPage={jest.fn()}
        searchKey="name"
        placeholder="Search users..."
        filterFields={mockFilterFields}
        additionalFilters={additionalFilters}
      />
    );

    // All components should be present
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    expect(screen.getByTestId('dynamic-filter-fields')).toBeInTheDocument();
    expect(screen.getByTestId('additional-filters')).toBeInTheDocument();
  });

  it('handles empty search input', () => {
    const filtersWithValue = {
      state: { name: 'John', status: 'all' as const, category: '' },
      setState: jest.fn(),
    };

    render(
      <DynamicTableToolbar
        filters={filtersWithValue}
        onResetPage={jest.fn()}
        searchKey="name"
        placeholder="Search users..."
      />
    );

    const searchInput = screen.getByDisplayValue('John');
    fireEvent.change(searchInput, { target: { value: '' } });

    expect(filtersWithValue.setState).toHaveBeenCalledWith({ name: '' });
  });

  it('uses default placeholder when not provided', () => {
    render(<DynamicTableToolbar filters={mockFilters} onResetPage={jest.fn()} searchKey="name" />);

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('handles complex filter state objects', () => {
    interface ComplexFilters extends DynamicTableFilter {
      search: string;
      dateRange: { start: Date | null; end: Date | null };
      tags: string[];
      isActive: boolean;
    }

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
      <DynamicTableToolbar<ComplexFilters>
        filters={complexFilters}
        onResetPage={jest.fn()}
        searchKey="search"
        placeholder="Search complex data..."
      />
    );

    const searchInput = screen.getByDisplayValue('test search');
    expect(searchInput).toBeInTheDocument();
  });
});
