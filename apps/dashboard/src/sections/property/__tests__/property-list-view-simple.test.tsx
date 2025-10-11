import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { createTheme, ThemeProvider } from '@mui/material/styles';

// Mock all the complex dependencies
jest.mock('src/api/queries/admin/properties-management/properties-management', () => ({
  usePropertiesAdminControllerGetAllProperties: jest.fn(() => ({
    data: {
      data: {
        properties: [],
        total: 0,
      },
    },
    isLoading: false,
  })),
  usePropertiesAdminControllerDeleteProperty: jest.fn(() => ({
    mutate: jest.fn(),
  })),
}));

jest.mock('src/api/queries/admin/users-management/users-management', () => ({
  usersAdminControllerSearchHosts: jest.fn(() => Promise.resolve({ data: { users: [] } })),
}));

jest.mock('src/hooks/use-enum-display-options', () => ({
  useEnumDisplayOptions: jest.fn(() => [
    { value: 'all', label: 'All' },
    { value: 'test', label: 'Test' },
  ]),
}));

jest.mock('src/components/snackbar', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('src/routes/hooks', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('src/routes/paths', () => ({
  paths: {
    dashboard: {
      root: '/dashboard',
      properties: {
        root: '/dashboard/properties',
        new: '/dashboard/properties/new',
        details: (id: string) => `/dashboard/properties/${id}`,
        edit: (id: string) => `/dashboard/properties/${id}/edit`,
      },
    },
  },
}));

jest.mock('src/routes/components', () => ({
  RouterLink: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

jest.mock('src/components/iconify', () => ({
  Iconify: ({ icon }: any) => <span data-testid="iconify">{icon}</span>,
}));

jest.mock('src/layouts/dashboard', () => ({
  DashboardContent: ({ children }: any) => <div data-testid="dashboard-content">{children}</div>,
}));

jest.mock('src/components/custom-breadcrumbs', () => ({
  CustomBreadcrumbs: ({ heading, action }: any) => (
    <div data-testid="breadcrumbs">
      <h1>{heading}</h1>
      {action}
    </div>
  ),
}));

jest.mock('src/components/dynamic-table', () => ({
  DynamicTable: ({ data, loading, filtering }: any) => (
    <div data-testid="dynamic-table">
      <div data-testid="loading-state">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="data-length">{data?.length || 0}</div>
      <div data-testid="has-filters">{filtering?.filterFields ? 'yes' : 'no'}</div>
    </div>
  ),
}));

jest.mock('src/components/table', () => ({
  useTable: () => ({
    page: 1,
    rowsPerPage: 10,
    orderBy: 'name',
    order: 'asc',
    selected: [],
    dense: false,
    onChangePage: jest.fn(),
    onChangeRowsPerPage: jest.fn(),
    onSort: jest.fn(),
    onSelectRow: jest.fn(),
    onSelectAllRows: jest.fn(),
    onChangeDense: jest.fn(),
  }),
}));

jest.mock('src/components/custom-dialog', () => ({
  ConfirmDialog: ({ open, title, children }: any) =>
    open ? (
      <div data-testid="confirm-dialog">
        {title} - {children}
      </div>
    ) : null,
}));

// Import after mocking
import { PropertyListView } from '../view/property-list-view';

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

describe('PropertyListView - Basic Rendering', () => {
  it('renders without crashing', () => {
    render(<PropertyListView />, { wrapper: createWrapper() });

    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getByTestId('dynamic-table')).toBeInTheDocument();
  });

  it('displays the correct heading', () => {
    render(<PropertyListView />, { wrapper: createWrapper() });

    expect(screen.getByText('Properties')).toBeInTheDocument();
  });

  it('shows the add new property button', () => {
    render(<PropertyListView />, { wrapper: createWrapper() });

    expect(screen.getByText('New property')).toBeInTheDocument();
  });

  it('passes correct props to DynamicTable', () => {
    render(<PropertyListView />, { wrapper: createWrapper() });

    expect(screen.getByTestId('loading-state')).toHaveTextContent('not-loading');
    expect(screen.getByTestId('data-length')).toHaveTextContent('0');
    expect(screen.getByTestId('has-filters')).toHaveTextContent('yes');
  });

  it('renders with loading state', () => {
    const mockUseProperties =
      require('src/api/queries/admin/properties-management/properties-management').usePropertiesAdminControllerGetAllProperties;
    mockUseProperties.mockReturnValueOnce({
      data: null,
      isLoading: true,
    });

    render(<PropertyListView />, { wrapper: createWrapper() });

    expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');
  });
});
