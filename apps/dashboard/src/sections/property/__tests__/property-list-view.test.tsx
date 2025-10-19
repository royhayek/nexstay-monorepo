import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { createTheme, ThemeProvider } from '@mui/material/styles';

import { PropertyListView } from '../view/property-list-view';

// Mock the API hooks
jest.mock('src/api/queries/admin/properties-management/properties-management', () => ({
  usePropertiesAdminControllerGetAllProperties: jest.fn(),
  usePropertiesAdminControllerDeleteProperty: jest.fn(),
}));

jest.mock('src/api/queries/admin/users-management/users-management', () => ({
  usersAdminControllerSearchHosts: jest.fn(),
}));

// Mock the enum display options hook
jest.mock('src/hooks/use-enum-options', () => ({
  useEnumOptions: jest.fn((enumName: string, options?: any) => {
    const baseOptions = options?.prependOptions || [];
    if (enumName === 'PropertyType') {
      return [
        ...baseOptions,
        { value: 'Apartment', label: 'Apartment' },
        { value: 'House', label: 'House' },
        { value: 'Villa', label: 'Villa' },
      ];
    }
    if (enumName === 'RoomType') {
      return [
        ...baseOptions,
        { value: 'Entire_home/apt', label: 'Entire home/apt' },
        { value: 'Private_room', label: 'Private room' },
        { value: 'Shared_room', label: 'Shared room' },
      ];
    }
    return baseOptions;
  }),
}));

// Mock the toast
jest.mock('src/components/snackbar', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the router
const mockPush = jest.fn();
jest.mock('src/routes/hooks', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock DynamicTable component
jest.mock('src/components/dynamic-table', () => ({
  DynamicTable: ({ data, columns, filtering, rowActions, ...props }: any) => (
    <div data-testid="dynamic-table">
      <div data-testid="table-data">{JSON.stringify(data)}</div>
      <div data-testid="table-columns">{columns.length} columns</div>
      {filtering?.filterFields && (
        <div data-testid="filter-fields">
          {filtering.filterFields.map((field: any) => (
            <div key={field.id} data-testid={`filter-${field.id}`}>
              {field.label}
            </div>
          ))}
        </div>
      )}
      {rowActions && (
        <div data-testid="row-actions">
          {rowActions.map((action: any, index: number) => (
            <button
              key={index}
              data-testid={`action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => action.onClick(mockPropertyData[0])}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  ),
}));

const mockPropertyData = [
  {
    _id: '1',
    name: 'Test Property',
    summary: 'Test summary',
    propertyType: 'Apartment',
    roomType: 'Entire_home/apt',
    accommodates: 4,
    bedrooms: 2,
    price: { basePrice: 100 },
    averageRating: 4.5,
    numberOfReviews: 10,
    hostIsSuperhost: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    images: [{ url: 'test-image.jpg' }],
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const theme = createTheme();

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </QueryClientProvider>
  );
};

describe('PropertyListView', () => {
  const mockGetAllProperties =
    require('src/api/queries/admin/properties-management/properties-management').usePropertiesAdminControllerGetAllProperties;
  const mockDeleteProperty =
    require('src/api/queries/admin/properties-management/properties-management').usePropertiesAdminControllerDeleteProperty;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetAllProperties.mockReturnValue({
      data: {
        data: {
          properties: mockPropertyData,
          total: 1,
        },
      },
      isLoading: false,
    });

    mockDeleteProperty.mockReturnValue({
      mutate: jest.fn(),
    });
  });

  it('renders property list view with breadcrumbs and add button', () => {
    render(<PropertyListView />, { wrapper: createWrapper() });

    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('New property')).toBeInTheDocument();
    expect(screen.getByTestId('dynamic-table')).toBeInTheDocument();
  });

  it('displays property data in the table', () => {
    render(<PropertyListView />, { wrapper: createWrapper() });

    const tableData = screen.getByTestId('table-data');
    expect(tableData).toHaveTextContent('Test Property');
  });

  it('renders all filter fields', () => {
    render(<PropertyListView />, { wrapper: createWrapper() });

    // Check if filter fields are rendered
    expect(screen.getByTestId('filter-propertyType')).toHaveTextContent('Property Type');
    expect(screen.getByTestId('filter-roomType')).toHaveTextContent('Room Type');
    expect(screen.getByTestId('filter-minPrice')).toHaveTextContent('Min Price');
    expect(screen.getByTestId('filter-maxPrice')).toHaveTextContent('Max Price');
    expect(screen.getByTestId('filter-minRating')).toHaveTextContent('Min Rating');
    expect(screen.getByTestId('filter-hostId')).toHaveTextContent('Host');
    expect(screen.getByTestId('filter-isActive')).toHaveTextContent('Status');
    expect(screen.getByTestId('filter-isPublished')).toHaveTextContent('Published');
    expect(screen.getByTestId('filter-instantBookable')).toHaveTextContent('Instant Bookable');
    expect(screen.getByTestId('filter-businessTravelReady')).toHaveTextContent(
      'Business Travel Ready'
    );
    expect(screen.getByTestId('filter-superhost')).toHaveTextContent('Superhost');
  });

  it('renders row actions', () => {
    render(<PropertyListView />, { wrapper: createWrapper() });

    const rowActions = screen.getByTestId('row-actions');
    expect(rowActions).toBeInTheDocument();

    expect(screen.getByTestId('action-view-details')).toBeInTheDocument();
    expect(screen.getByTestId('action-edit')).toBeInTheDocument();
    expect(screen.getByTestId('action-delete')).toBeInTheDocument();
  });

  it('handles view details action', () => {
    render(<PropertyListView />, { wrapper: createWrapper() });

    const viewDetailsButton = screen.getByTestId('action-view-details');
    fireEvent.click(viewDetailsButton);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/properties/1');
  });

  it('handles edit action', () => {
    render(<PropertyListView />, { wrapper: createWrapper() });

    const editButton = screen.getByTestId('action-edit');
    fireEvent.click(editButton);

    expect(mockPush).toHaveBeenCalledWith('/dashboard/properties/1/edit');
  });

  it('shows loading state', () => {
    mockGetAllProperties.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<PropertyListView />, { wrapper: createWrapper() });

    expect(screen.getByTestId('dynamic-table')).toBeInTheDocument();
  });

  it('handles empty data state', () => {
    mockGetAllProperties.mockReturnValue({
      data: {
        data: {
          properties: [],
          total: 0,
        },
      },
      isLoading: false,
    });

    render(<PropertyListView />, { wrapper: createWrapper() });

    const tableData = screen.getByTestId('table-data');
    expect(tableData).toHaveTextContent('[]');
  });

  it('renders correct number of columns', () => {
    render(<PropertyListView />, { wrapper: createWrapper() });

    const tableColumns = screen.getByTestId('table-columns');
    expect(tableColumns).toHaveTextContent('9 columns'); // Based on the TABLE_COLUMNS array
  });
});
