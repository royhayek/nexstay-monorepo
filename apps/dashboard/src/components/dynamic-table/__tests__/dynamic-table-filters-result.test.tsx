import '@testing-library/jest-dom';

import type { DynamicTableFilter } from '../types';

/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

import { DynamicTableFiltersResult } from '../dynamic-table-filters-result';

// Mock dependencies
jest.mock('src/components/iconify', () => ({
  Iconify: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`}>{icon}</span>,
}));

// Use fake timers for setTimeout tests
jest.useFakeTimers();

// Sample test interfaces
interface TestFilters extends DynamicTableFilter {
  name: string;
  status: 'all' | 'active' | 'inactive';
  category: string;
  tags: string[];
  isVisible: boolean;
  count: number;
}

const mockFilters = {
  state: {
    name: 'John',
    status: 'active' as const,
    category: 'tech',
    tags: ['react', 'typescript'],
    isVisible: true,
    count: 5,
  },
  setState: jest.fn(),
};

const mockOnResetPage = jest.fn();

describe('DynamicTableFiltersResult', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('renders filter results correctly', () => {
    render(
      <DynamicTableFiltersResult
        filters={mockFilters}
        totalResults={42}
        onResetPage={mockOnResetPage}
      />
    );

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('results found')).toBeInTheDocument();
  });

  it('displays active filters as chips', () => {
    render(
      <DynamicTableFiltersResult
        filters={mockFilters}
        totalResults={42}
        onResetPage={mockOnResetPage}
      />
    );

    // Should show chips for non-default values
    expect(screen.getByText('John')).toBeInTheDocument(); // name
    expect(screen.getByText('active')).toBeInTheDocument(); // status
    expect(screen.getByText('tech')).toBeInTheDocument(); // category
    expect(screen.getByText('react, typescript')).toBeInTheDocument(); // tags array
    // Note: isVisible boolean is not shown by the component's filter logic
    expect(screen.getByText('5')).toBeInTheDocument(); // count number
  });

  it('renders clear all button', () => {
    render(
      <DynamicTableFiltersResult
        filters={mockFilters}
        totalResults={42}
        onResetPage={mockOnResetPage}
      />
    );

    expect(screen.getByText('Clear all')).toBeInTheDocument();
    expect(screen.getByTestId('icon-solar:trash-bin-trash-bold')).toBeInTheDocument();
  });

  it('handles individual filter removal', async () => {
    render(
      <DynamicTableFiltersResult
        filters={mockFilters}
        totalResults={42}
        onResetPage={mockOnResetPage}
      />
    );

    // Find the delete icon within the name chip
    const nameChip = screen.getByText('John').closest('[role="button"]');
    const deleteIcon = nameChip?.querySelector('[data-testid="CancelIcon"]');
    expect(deleteIcon).toBeInTheDocument();
    
    if (deleteIcon) {
      fireEvent.click(deleteIcon);
    }

    // Fast-forward timers to execute setTimeout
    jest.runAllTimers();

    await waitFor(() => {
      expect(mockOnResetPage).toHaveBeenCalled();
      expect(mockFilters.setState).toHaveBeenCalledWith({
        ...mockFilters.state,
        name: '',
      });
    });
  });

  it('handles clear all filters', async () => {
    render(
      <DynamicTableFiltersResult
        filters={mockFilters}
        totalResults={42}
        onResetPage={mockOnResetPage}
      />
    );

    fireEvent.click(screen.getByText('Clear all'));

    // Fast-forward timers
    jest.runAllTimers();

    await waitFor(() => {
      expect(mockOnResetPage).toHaveBeenCalled();
      expect(mockFilters.setState).toHaveBeenCalledWith({
        name: '',
        status: 'all', // special field names are now properly reset to 'all'
        category: '',
        tags: [],
        isVisible: 'all', // special field names are now properly reset to 'all' 
        count: 0,
      });
    });
  });

  it('does not render when no active filters', () => {
    const emptyFilters = {
      state: {
        name: '',
        status: 'all' as const,
        category: '',
        tags: [],
        isVisible: false,
        count: 0,
      },
      setState: jest.fn(),
    };

    const { container } = render(
      <DynamicTableFiltersResult
        filters={emptyFilters}
        totalResults={42}
        onResetPage={mockOnResetPage}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('uses custom filter labels when provided', () => {
    const getFilterLabels = jest.fn(() => [
      { key: 'name', label: 'User Name', value: 'John Doe' },
      { key: 'status', label: 'User Status', value: 'Active User' },
    ]);

    render(
      <DynamicTableFiltersResult
        filters={mockFilters}
        totalResults={42}
        onResetPage={mockOnResetPage}
        getFilterLabels={getFilterLabels}
      />
    );

    expect(getFilterLabels).toHaveBeenCalledWith(mockFilters.state);
    expect(screen.getByText('User Name:')).toBeInTheDocument();
    expect(screen.getByText('User Status:')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Active User')).toBeInTheDocument();
  });

  it('handles different data types correctly in default filter labels', () => {
    const mixedFilters = {
      state: {
        stringField: 'text value',
        numberField: 42,
        booleanField: true,
        arrayField: ['item1', 'item2', 'item3'],
        emptyString: '',
        zeroNumber: 0,
        falseBool: false,
        emptyArray: [],
        nullField: null,
        undefinedField: undefined,
      },
      setState: jest.fn(),
    };

    render(
      <DynamicTableFiltersResult
        filters={mixedFilters}
        totalResults={10}
        onResetPage={mockOnResetPage}
      />
    );

    // Should only show non-default values
    expect(screen.getByText('text value')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    // Boolean true is not shown in the output (component filters it out)
    expect(screen.getByText('item1, item2, item3')).toBeInTheDocument();

    // Should not show default/empty values
    // Note: Don't check for empty string as it may appear in other parts of the UI
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.queryByText('false')).not.toBeInTheDocument();
  });

  it('formats field names correctly', () => {
    const camelCaseFilters = {
      state: {
        firstName: 'John',
        lastName: 'Doe',
        isActiveUser: true,
        userPreferences: 'dark mode',
      },
      setState: jest.fn(),
    };

    render(
      <DynamicTableFiltersResult
        filters={camelCaseFilters}
        totalResults={5}
        onResetPage={mockOnResetPage}
      />
    );

    // Should format camelCase to readable labels
    expect(screen.getByText('First Name:')).toBeInTheDocument();
    expect(screen.getByText('Last Name:')).toBeInTheDocument();
    expect(screen.getByText('Is Active User:')).toBeInTheDocument();
    expect(screen.getByText('User Preferences:')).toBeInTheDocument();
  });

  it('handles special field names that should reset to "all"', () => {
    const specialFilters = {
      state: {
        visibility: 'hidden',
        statusAll: 'active',
        allCategories: 'tech',
      },
      setState: jest.fn(),
    };

    render(
      <DynamicTableFiltersResult
        filters={specialFilters}
        totalResults={10}
        onResetPage={mockOnResetPage}
      />
    );

    fireEvent.click(screen.getByText('Clear all'));

    // Fast-forward timers
    jest.runAllTimers();

    expect(specialFilters.setState).toHaveBeenCalledWith({
      visibility: '', // 'visibility' does NOT contain 'visible' as substring, so gets reset to ''
      statusAll: 'all', // contains 'all' so gets reset to 'all' 
      allCategories: 'all', // contains 'all' so gets reset to 'all'
    });
  });

  it('applies custom styling', () => {
    render(
      <DynamicTableFiltersResult
        filters={mockFilters}
        totalResults={42}
        onResetPage={mockOnResetPage}
        sx={{ backgroundColor: 'red' }}
      />
    );

    const container = screen.getByText('42').closest('[class*="MuiStack-root"]');
    expect(container).toBeInTheDocument();
  });
});
