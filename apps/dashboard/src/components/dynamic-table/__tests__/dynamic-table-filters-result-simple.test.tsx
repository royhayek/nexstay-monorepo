/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';

import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Mock DynamicTableFiltersResult component
const MockDynamicTableFiltersResult = ({
  filters,
  totalResults,
  onResetPage,
  getFilterLabels,
}: any) => {
  const getDefaultFilterLabels = (filterState: any) => {
    const labels: { key: string; label: string; value: any }[] = [];

    Object.keys(filterState).forEach((key) => {
      const value = filterState[key];
      if (
        value !== null &&
        value !== undefined &&
        value !== 'all' &&
        value !== '' &&
        value !== 0 &&
        (!Array.isArray(value) || value.length > 0) &&
        (typeof value !== 'boolean' || value === true)
      ) {
        let displayValue = value;

        if (Array.isArray(value)) {
          displayValue = value.join(', ');
        } else if (typeof value === 'boolean') {
          displayValue = String(value);
        }

        labels.push({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
          value: displayValue,
        });
      }
    });

    return labels;
  };

  const handleRemoveFilter = (filterKey: string) => {
    onResetPage();

    const newFilters = { ...filters.state };
    if (filterKey in newFilters) {
      const value = newFilters[filterKey];

      if (typeof value === 'string') {
        newFilters[filterKey] = '';
      } else if (typeof value === 'boolean') {
        newFilters[filterKey] = false;
      } else if (Array.isArray(value)) {
        newFilters[filterKey] = [];
      } else if (typeof value === 'number') {
        newFilters[filterKey] = 0;
      } else if (
        filterKey.toLowerCase().includes('all') ||
        filterKey.toLowerCase().includes('visible') ||
        filterKey.toLowerCase().includes('status')
      ) {
        newFilters[filterKey] = 'all';
      } else {
        newFilters[filterKey] = null;
      }
    }

    // Simulate setTimeout batching
    setTimeout(() => {
      filters.setState(newFilters);
    }, 0);
  };

  const handleClearAll = () => {
    onResetPage();

    const clearedFilters = Object.keys(filters.state).reduce((acc: any, key) => {
      const value = filters.state[key];

      if (
        key.toLowerCase().includes('all') ||
        key.toLowerCase().includes('visible') ||
        key.toLowerCase().includes('status')
      ) {
        // For enum/status fields, reset to 'all'
        acc[key] = 'all';
      } else if (typeof value === 'string') {
        acc[key] = '';
      } else if (typeof value === 'boolean') {
        acc[key] = false;
      } else if (Array.isArray(value)) {
        acc[key] = [];
      } else if (typeof value === 'number') {
        acc[key] = 0;
      } else {
        acc[key] = null;
      }
      return acc;
    }, {});

    setTimeout(() => {
      filters.setState(clearedFilters);
    }, 0);
  };

  const filterLabels = getFilterLabels
    ? getFilterLabels(filters.state)
    : getDefaultFilterLabels(filters.state);
  const hasFilters = filterLabels.length > 0;

  if (!hasFilters) {
    return null;
  }

  return (
    <div data-testid="filters-result">
      <div data-testid="results-count">
        <strong>{totalResults}</strong> results found
      </div>

      <div data-testid="filter-chips">
        {filterLabels.map((filter: any) => (
          <div key={filter.key} data-testid={`filter-chip-${filter.key}`}>
            <span data-testid="filter-label">{filter.label}:</span>
            <span data-testid="filter-value">{filter.value}</span>
            <button
              data-testid={`remove-filter-${filter.key}`}
              onClick={() => handleRemoveFilter(filter.key)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {hasFilters && (
        <button data-testid="clear-all-button" onClick={handleClearAll}>
          Clear all
        </button>
      )}
    </div>
  );
};

// Use fake timers for setTimeout tests
jest.useFakeTimers();

interface TestFilters {
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

describe('DynamicTableFiltersResult Component', () => {
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
      <MockDynamicTableFiltersResult
        filters={mockFilters}
        totalResults={42}
        onResetPage={mockOnResetPage}
      />
    );

    expect(screen.getByTestId('filters-result')).toBeInTheDocument();
    expect(screen.getByTestId('results-count')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('results found')).toBeInTheDocument();
  });

  it('displays active filters as chips', () => {
    render(
      <MockDynamicTableFiltersResult
        filters={mockFilters}
        totalResults={42}
        onResetPage={mockOnResetPage}
      />
    );

    expect(screen.getByTestId('filter-chips')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('tech')).toBeInTheDocument();
    expect(screen.getByText('react, typescript')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders clear all button', () => {
    render(
      <MockDynamicTableFiltersResult
        filters={mockFilters}
        totalResults={42}
        onResetPage={mockOnResetPage}
      />
    );

    expect(screen.getByTestId('clear-all-button')).toBeInTheDocument();
    expect(screen.getByText('Clear all')).toBeInTheDocument();
  });

  it('handles individual filter removal', async () => {
    render(
      <MockDynamicTableFiltersResult
        filters={mockFilters}
        totalResults={42}
        onResetPage={mockOnResetPage}
      />
    );

    const removeButton = screen.getByTestId('remove-filter-name');
    fireEvent.click(removeButton);

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
      <MockDynamicTableFiltersResult
        filters={mockFilters}
        totalResults={42}
        onResetPage={mockOnResetPage}
      />
    );

    fireEvent.click(screen.getByTestId('clear-all-button'));

    // Fast-forward timers
    jest.runAllTimers();

    await waitFor(() => {
      expect(mockOnResetPage).toHaveBeenCalled();
      expect(mockFilters.setState).toHaveBeenCalledWith({
        name: '',
        status: 'all', // status field should reset to 'all'
        category: '',
        tags: [],
        isVisible: 'all', // isVisible contains "visible" so should reset to 'all'
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
      <MockDynamicTableFiltersResult
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
      <MockDynamicTableFiltersResult
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
      <MockDynamicTableFiltersResult
        filters={mixedFilters}
        totalResults={10}
        onResetPage={mockOnResetPage}
      />
    );

    // Should only show non-default values
    expect(screen.getByText('text value')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('item1, item2, item3')).toBeInTheDocument();

    // Should not show default/empty values
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
      <MockDynamicTableFiltersResult
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

  it('handles special field names that should reset to "all"', async () => {
    const specialFilters = {
      state: {
        visibility: 'hidden',
        statusAll: 'active',
        allCategories: 'tech',
      },
      setState: jest.fn(),
    };

    render(
      <MockDynamicTableFiltersResult
        filters={specialFilters}
        totalResults={10}
        onResetPage={mockOnResetPage}
      />
    );

    fireEvent.click(screen.getByTestId('clear-all-button'));

    // Fast-forward timers
    jest.runAllTimers();

    await waitFor(() => {
      expect(specialFilters.setState).toHaveBeenCalledWith({
        visibility: '', // visibility doesn't contain 'visible', it's a different word
        statusAll: 'all', // contains 'all'
        allCategories: 'all', // contains 'all'
      });
    });
  });
});
