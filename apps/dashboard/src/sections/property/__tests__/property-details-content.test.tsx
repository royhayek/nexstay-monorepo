import type { PropertyResponseDto } from 'src/api/models/admin';

import { render, screen } from '@testing-library/react';

import { createTheme, ThemeProvider } from '@mui/material/styles';

import { PropertyDetailsContent } from '../property-details-content';

// Mock the Lightbox component
jest.mock('src/components/lightbox', () => ({
  Lightbox: ({ slides }: any) => (
    <div data-testid="lightbox">
      {slides.map((slide: any, index: number) => (
        <div key={index} data-testid={`slide-${index}`}>
          {slide.src}
        </div>
      ))}
    </div>
  ),
  useLightBox: (slides: any) => ({
    selected: 0,
    open: false,
    onOpen: jest.fn(),
    onClose: jest.fn(),
  }),
}));

// Mock the Markdown component
jest.mock('src/components/markdown', () => ({
  Markdown: ({ children }: any) => <div data-testid="markdown">{children}</div>,
}));

// Mock the Image component
jest.mock('src/components/image', () => ({
  Image: ({ src, alt, onClick }: any) => (
    <img
      data-testid="property-image"
      src={src}
      alt={alt}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    />
  ),
}));

const mockPropertyData: PropertyResponseDto = {
  _id: '1',
  ownerId: 'owner-1',
  name: 'Luxury Apartment in Manhattan',
  description: 'Beautiful luxury apartment with amazing views',
  summary: 'Perfect for business travelers and couples',
  space: 'Spacious living area with modern furnishings',
  neighborhoodOverview: 'Located in the heart of Manhattan',
  houseRules: 'No smoking, no parties',
  transit: 'Close to subway stations',
  notes: 'Check-in after 3 PM',
  propertyType: 'Apartment' as any,
  roomType: 'Entire_home/apt' as any,
  bedType: 'Real Bed' as any,
  minimumNights: 2,
  maximumNights: 30,
  cancellationPolicy: 'flexible' as any,
  accommodates: 4,
  bedrooms: 2,
  beds: 2,
  bathrooms: 2,
  price: {
    basePrice: 200,
    pricePerNight: 200,
    currency: 'USD',
    currencySymbol: '$',
    weeklyDiscount: 10,
    monthlyDiscount: 20,
    cleaningFee: 50,
    securityDeposit: 100,
    extraPeopleFee: 25,
  } as any,
  address: {
    country: 'United States',
    countryCode: 'US',
    city: 'New York',
    governorate: 'NY',
    district: 'Manhattan',
    neighborhood: 'Midtown',
    street: '5th Avenue',
    building: 'Empire State Building',
    floor: 20,
    apartment: '2001',
    postalCode: '10001',
    landmark: 'Near Central Park',
  } as any,
  coordinates: { latitude: 40.7128, longitude: -74.006 } as any,
  amenities: ['WiFi', 'Kitchen', 'Air conditioning', 'Heating'],
  features: {
    smokeDetector: true,
    carbonMonoxideDetector: true,
    fireExtinguisher: false,
    firstAidKit: true,
    safetyCard: false,
  } as any,
  availability: {} as any,
  reviewScores: {
    reviewScoresRating: 9.2,
    reviewScoresAccuracy: 9.0,
    reviewScoresCleanliness: 9.5,
    reviewScoresCheckin: 9.3,
    reviewScoresCommunication: 9.1,
    reviewScoresLocation: 9.8,
    reviewScoresValue: 8.9,
  } as any,
  images: [
    { url: 'image1.jpg' } as any,
    { url: 'image2.jpg' } as any,
    { url: 'image3.jpg' } as any,
  ],
  host: {
    hostName: 'John Doe',
    hostId: 'host-1',
    hostSince: '2020-01-01',
    hostLocation: 'New York, NY',
    hostAbout: 'Experienced host with great reviews',
    hostResponseRate: 95,
    hostResponseTime: 'within an hour',
    hostAcceptanceRate: 90,
    hostTotalListingsCount: 5,
    hostIdentityVerified: true,
    hostPictureUrl: 'host-image.jpg',
    hostThumbnailUrl: 'host-thumb.jpg',
    hostVerifications: ['email', 'phone', 'reviews'],
  } as any,
  numberOfReviews: 25,
  averageRating: 4.6,
  instantBookable: true,
  hostIsSuperhost: true,
  status: 'active',
  isActive: true,
  isPublished: true,
  isBusinessTravelReady: true,
  requireGuestProfilePicture: false,
  requireGuestPhoneVerification: false,
  maintenanceMode: false,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

const createWrapper = () => {
  const theme = createTheme();

  return ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  );
};

describe('PropertyDetailsContent', () => {
  it('renders property gallery with images', () => {
    render(<PropertyDetailsContent property={mockPropertyData} />, { wrapper: createWrapper() });

    const images = screen.getAllByTestId('property-image');
    expect(images).toHaveLength(5); // First image + up to 4 more in the grid
  });

  it('renders property head section with name and description', () => {
    render(<PropertyDetailsContent property={mockPropertyData} />, { wrapper: createWrapper() });

    expect(screen.getByText('Luxury Apartment in Manhattan')).toBeInTheDocument();
    expect(screen.getByTestId('markdown')).toHaveTextContent(
      'Beautiful luxury apartment with amazing views'
    );
  });

  it('displays property rating and reviews', () => {
    render(<PropertyDetailsContent property={mockPropertyData} />, { wrapper: createWrapper() });

    expect(screen.getByText('4.6')).toBeInTheDocument();
    expect(screen.getByText('(25 reviews)')).toBeInTheDocument();
  });

  it('shows property location', () => {
    render(<PropertyDetailsContent property={mockPropertyData} />, { wrapper: createWrapper() });

    expect(screen.getByText(/New York, NY/)).toBeInTheDocument();
  });

  it('displays host information', () => {
    render(<PropertyDetailsContent property={mockPropertyData} />, { wrapper: createWrapper() });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/Hosted by/)).toBeInTheDocument();
  });

  it('renders property overview section', () => {
    render(<PropertyDetailsContent property={mockPropertyData} />, { wrapper: createWrapper() });

    expect(screen.getByText('Property Overview')).toBeInTheDocument();
    expect(screen.getByText('Property Type')).toBeInTheDocument();
    expect(screen.getByText('Room Type')).toBeInTheDocument();
    expect(screen.getByText('4 guests')).toBeInTheDocument();
    expect(screen.getByText('2 bedrooms')).toBeInTheDocument();
  });

  it('shows pricing information', () => {
    render(<PropertyDetailsContent property={mockPropertyData} />, { wrapper: createWrapper() });

    expect(screen.getByText('Pricing Information')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument(); // Weekly discount
    expect(screen.getByText('20%')).toBeInTheDocument(); // Monthly discount
  });

  it('displays address information', () => {
    render(<PropertyDetailsContent property={mockPropertyData} />, { wrapper: createWrapper() });

    expect(screen.getByText('Location & Address')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('Manhattan')).toBeInTheDocument();
    expect(screen.getByText('5th Avenue')).toBeInTheDocument();
  });

  it('shows host details', () => {
    render(<PropertyDetailsContent property={mockPropertyData} />, { wrapper: createWrapper() });

    expect(screen.getByText('About Your Host')).toBeInTheDocument();
    expect(screen.getByText('Superhost')).toBeInTheDocument();
    expect(screen.getByText(/Host since/)).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument(); // Response rate
  });

  it('displays review scores', () => {
    render(<PropertyDetailsContent property={mockPropertyData} />, { wrapper: createWrapper() });

    expect(screen.getByText('Review Scores')).toBeInTheDocument();
    expect(screen.getByText('Overall Rating')).toBeInTheDocument();
    expect(screen.getByText('9.2/10')).toBeInTheDocument();
    expect(screen.getByText('Cleanliness')).toBeInTheDocument();
    expect(screen.getByText('9.5/10')).toBeInTheDocument();
  });

  it('shows safety features', () => {
    render(<PropertyDetailsContent property={mockPropertyData} />, { wrapper: createWrapper() });

    expect(screen.getByText('Safety Features')).toBeInTheDocument();
    expect(screen.getByText('Smoke Detector')).toBeInTheDocument();
    expect(screen.getByText('Carbon Monoxide Detector')).toBeInTheDocument();
    expect(screen.getByText('First Aid Kit')).toBeInTheDocument();
  });

  it('displays additional information sections', () => {
    render(<PropertyDetailsContent property={mockPropertyData} />, { wrapper: createWrapper() });

    expect(screen.getByText('Additional Information')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('The Space')).toBeInTheDocument();
    expect(screen.getByText('Neighborhood Overview')).toBeInTheDocument();
    expect(screen.getByText('House Rules')).toBeInTheDocument();
    expect(screen.getByText('Getting Around')).toBeInTheDocument();
    expect(screen.getByText('Other Things to Note')).toBeInTheDocument();
  });

  it('shows amenities list', () => {
    render(<PropertyDetailsContent property={mockPropertyData} />, { wrapper: createWrapper() });

    expect(screen.getByText('Amenities')).toBeInTheDocument();
    expect(screen.getByText('WiFi')).toBeInTheDocument();
    expect(screen.getByText('Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Air conditioning')).toBeInTheDocument();
  });

  it('handles property with no images gracefully', () => {
    const propertyWithoutImages = { ...mockPropertyData, images: [] };
    render(<PropertyDetailsContent property={propertyWithoutImages} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
    // Should not crash and still render other content
    expect(screen.getByText('Luxury Apartment in Manhattan')).toBeInTheDocument();
  });

  it('handles property with no review scores', () => {
    const propertyWithoutReviewScores = { ...mockPropertyData, reviewScores: undefined };
    render(<PropertyDetailsContent property={propertyWithoutReviewScores} />, {
      wrapper: createWrapper(),
    });

    // Should not render review scores section
    expect(screen.queryByText('Review Scores')).not.toBeInTheDocument();
    // But should still render other sections
    expect(screen.getByText('Luxury Apartment in Manhattan')).toBeInTheDocument();
  });

  it('handles property with no amenities', () => {
    const propertyWithoutAmenities = { ...mockPropertyData, amenities: [] };
    render(<PropertyDetailsContent property={propertyWithoutAmenities} />, {
      wrapper: createWrapper(),
    });

    // Should not render amenities section when empty
    expect(screen.queryByText('Amenities')).not.toBeInTheDocument();
  });

  it('handles undefined property gracefully', () => {
    render(<PropertyDetailsContent property={undefined} />, { wrapper: createWrapper() });

    // Should render lightbox but no property content
    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
    // Should not crash or show property-specific content
    expect(screen.queryByText('Luxury Apartment in Manhattan')).not.toBeInTheDocument();
  });

  it('displays host verifications', () => {
    render(<PropertyDetailsContent property={mockPropertyData} />, { wrapper: createWrapper() });

    expect(screen.getByText('Verifications')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('phone')).toBeInTheDocument();
    expect(screen.getByText('reviews')).toBeInTheDocument();
  });
});
