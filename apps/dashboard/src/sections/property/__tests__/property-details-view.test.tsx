import type { PropertyResponseDto } from 'src/api/models/admin';

import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { createTheme, ThemeProvider } from '@mui/material/styles';

import { PropertyDetailsView } from '../view/property-details-view';

// Mock the API hooks
jest.mock('src/api/queries/admin/properties-management/properties-management', () => ({
  usePropertiesAdminControllerTogglePropertyStatus: jest.fn(),
  usePropertiesAdminControllerTogglePropertyPublished: jest.fn(),
}));

// Mock the toast
jest.mock('src/components/snackbar', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock PropertyDetailsToolbar
jest.mock('../property-details-toolbar', () => ({
  PropertyDetailsToolbar: ({ onToggleActive, onTogglePublished, property, ...props }: any) => (
    <div data-testid="property-details-toolbar">
      <div data-testid="property-status">{property?.isActive ? 'Active' : 'Inactive'}</div>
      <div data-testid="property-published">{property?.isPublished ? 'Published' : 'Draft'}</div>
      <button data-testid="toggle-active-btn" onClick={onToggleActive}>
        Toggle Active
      </button>
      <button data-testid="toggle-published-btn" onClick={onTogglePublished}>
        Toggle Published
      </button>
    </div>
  ),
}));

// Mock PropertyDetailsContent
jest.mock('../property-details-content', () => ({
  PropertyDetailsContent: ({ property }: any) => (
    <div data-testid="property-details-content">
      <div data-testid="property-name">{property?.name || 'No property'}</div>
      <div data-testid="property-description">{property?.description || 'No description'}</div>
    </div>
  ),
}));

const mockPropertyData: PropertyResponseDto = {
  _id: '1',
  ownerId: 'owner-1',
  name: 'Test Property',
  description: 'Test description',
  summary: 'Test summary',
  propertyType: 'Apartment' as any,
  roomType: 'Entire_home/apt' as any,
  bedType: 'Real Bed' as any,
  minimumNights: 1,
  maximumNights: 30,
  cancellationPolicy: 'flexible' as any,
  accommodates: 4,
  bedrooms: 2,
  beds: 2,
  bathrooms: 2,
  price: {
    basePrice: 100,
    pricePerNight: 100,
    currency: 'USD',
    currencySymbol: '$',
  } as any,
  address: {
    country: 'USA',
    countryCode: 'US',
    city: 'New York',
    governorate: 'NY',
  } as any,
  coordinates: { latitude: 40.7128, longitude: -74.006 } as any,
  amenities: ['WiFi', 'Kitchen'],
  features: {} as any,
  availability: {} as any,
  images: [{ url: 'test-image.jpg' } as any],
  host: {
    hostName: 'Test Host',
    hostId: 'host-1',
  } as any,
  numberOfReviews: 10,
  averageRating: 4.5,
  instantBookable: true,
  hostIsSuperhost: true,
  status: 'active',
  isActive: true,
  isPublished: true,
  isBusinessTravelReady: false,
  requireGuestProfilePicture: false,
  requireGuestPhoneVerification: false,
  maintenanceMode: false,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

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

describe('PropertyDetailsView', () => {
  const mockToggleStatus = jest.fn();
  const mockTogglePublished = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    const mockToggleStatusMutation =
      require('src/api/queries/admin/properties-management/properties-management').usePropertiesAdminControllerTogglePropertyStatus;
    const mockTogglePublishedMutation =
      require('src/api/queries/admin/properties-management/properties-management').usePropertiesAdminControllerTogglePropertyPublished;

    mockToggleStatusMutation.mockReturnValue({
      mutate: mockToggleStatus,
      isPending: false,
    });

    mockTogglePublishedMutation.mockReturnValue({
      mutate: mockTogglePublished,
      isPending: false,
    });
  });

  it('renders property details view with toolbar and content', () => {
    render(<PropertyDetailsView property={mockPropertyData} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('property-details-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('property-details-content')).toBeInTheDocument();
  });

  it('displays property information correctly', () => {
    render(<PropertyDetailsView property={mockPropertyData} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('property-name')).toHaveTextContent('Test Property');
    expect(screen.getByTestId('property-description')).toHaveTextContent('Test description');
    expect(screen.getByTestId('property-status')).toHaveTextContent('Active');
    expect(screen.getByTestId('property-published')).toHaveTextContent('Published');
  });

  it('handles toggle active status', () => {
    render(<PropertyDetailsView property={mockPropertyData} />, { wrapper: createWrapper() });

    const toggleActiveBtn = screen.getByTestId('toggle-active-btn');
    fireEvent.click(toggleActiveBtn);

    expect(mockToggleStatus).toHaveBeenCalledWith(
      { id: '1' },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('handles toggle published status', () => {
    render(<PropertyDetailsView property={mockPropertyData} />, { wrapper: createWrapper() });

    const togglePublishedBtn = screen.getByTestId('toggle-published-btn');
    fireEvent.click(togglePublishedBtn);

    expect(mockTogglePublished).toHaveBeenCalledWith(
      { id: '1' },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('handles undefined property gracefully', () => {
    render(<PropertyDetailsView property={undefined} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('property-details-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('property-details-content')).toBeInTheDocument();
    expect(screen.getByTestId('property-name')).toHaveTextContent('No property');
  });

  it('initializes state correctly from property props', () => {
    const inactiveProperty = {
      ...mockPropertyData,
      isActive: false,
      isPublished: false,
      maintenanceMode: true,
    };

    render(<PropertyDetailsView property={inactiveProperty} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('property-status')).toHaveTextContent('Inactive');
    expect(screen.getByTestId('property-published')).toHaveTextContent('Draft');
  });

  it('handles toggle status success callback', () => {
    const { toast } = require('src/components/snackbar');
    render(<PropertyDetailsView property={mockPropertyData} />, { wrapper: createWrapper() });

    const toggleActiveBtn = screen.getByTestId('toggle-active-btn');
    fireEvent.click(toggleActiveBtn);

    // Get the success callback and call it
    const successCallback = mockToggleStatus.mock.calls[0][1].onSuccess;
    successCallback();

    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Property'));
  });

  it('handles toggle status error callback', () => {
    const { toast } = require('src/components/snackbar');
    render(<PropertyDetailsView property={mockPropertyData} />, { wrapper: createWrapper() });

    const toggleActiveBtn = screen.getByTestId('toggle-active-btn');
    fireEvent.click(toggleActiveBtn);

    // Get the error callback and call it
    const errorCallback = mockToggleStatus.mock.calls[0][1].onError;
    errorCallback(new Error('Test error'));

    expect(toast.error).toHaveBeenCalledWith('Failed to toggle property status. Please try again.');
  });

  it('handles toggle published success callback', () => {
    const { toast } = require('src/components/snackbar');
    render(<PropertyDetailsView property={mockPropertyData} />, { wrapper: createWrapper() });

    const togglePublishedBtn = screen.getByTestId('toggle-published-btn');
    fireEvent.click(togglePublishedBtn);

    // Get the success callback and call it
    const successCallback = mockTogglePublished.mock.calls[0][1].onSuccess;
    successCallback();

    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Property'));
  });

  it('does not call mutation when property id is missing', () => {
    const propertyWithoutId = { ...mockPropertyData, _id: '' };
    render(<PropertyDetailsView property={propertyWithoutId} />, { wrapper: createWrapper() });

    const toggleActiveBtn = screen.getByTestId('toggle-active-btn');
    fireEvent.click(toggleActiveBtn);

    expect(mockToggleStatus).not.toHaveBeenCalled();
  });
});
