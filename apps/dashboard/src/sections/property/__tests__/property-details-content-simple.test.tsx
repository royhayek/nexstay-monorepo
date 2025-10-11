import type { PropertyResponseDto } from 'src/api/models/admin';

import { render, screen } from '@testing-library/react';

import { createTheme, ThemeProvider } from '@mui/material/styles';

// Mock all the complex dependencies
jest.mock('src/components/lightbox', () => ({
  Lightbox: ({ slides }: any) => (
    <div data-testid="lightbox">
      {slides?.map((slide: any, index: number) => (
        <div key={index} data-testid={`slide-${index}`}>
          {slide.src}
        </div>
      ))}
    </div>
  ),
  useLightBox: () => ({
    selected: 0,
    open: false,
    onOpen: jest.fn(),
    onClose: jest.fn(),
  }),
}));

jest.mock('src/components/markdown', () => ({
  Markdown: ({ children }: any) => <div data-testid="markdown">{children}</div>,
}));

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

jest.mock('src/components/iconify', () => ({
  Iconify: ({ icon }: any) => <span data-testid="iconify">{icon}</span>,
}));

jest.mock('src/utils/format-time', () => ({
  fDate: (date: string, format?: string) => 'Jan 01, 2023',
  fTime: (date: string) => '12:00 AM',
}));

jest.mock('src/utils/format-number', () => ({
  fCurrency: (value: number) => (value ? `$${value.toFixed(2)}` : '$0.00'),
}));

// Import after mocking
import { PropertyDetailsContent } from '../property-details-content';

const mockPropertyData: Partial<PropertyResponseDto> = {
  _id: '1',
  name: 'Test Property',
  description: 'Test description',
  summary: 'Test summary',
  propertyType: 'Apartment' as any,
  roomType: 'Entire_home/apt' as any,
  accommodates: 4,
  bedrooms: 2,
  beds: 2,
  bathrooms: 2,
  averageRating: 4.5,
  numberOfReviews: 10,
  hostIsSuperhost: true,
  price: {
    basePrice: 100,
    pricePerNight: 100,
    currency: 'USD',
    currencySymbol: '$',
  } as any,
  address: {
    country: 'USA',
    city: 'New York',
    governorate: 'NY',
  } as any,
  images: [{ url: 'image1.jpg' } as any, { url: 'image2.jpg' } as any],
  host: {
    hostName: 'John Doe',
    hostSince: '2020-01-01',
    hostAbout: 'Great host',
  } as any,
  amenities: ['WiFi', 'Kitchen'],
  features: {
    smokeDetector: true,
    carbonMonoxideDetector: false,
  } as any,
  reviewScores: {
    reviewScoresRating: 9.2,
    reviewScoresCleanliness: 9.5,
  } as any,
  createdAt: '2023-01-01T00:00:00.000Z',
};

const createWrapper = () => {
  const theme = createTheme();

  return ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
  );
};

describe('PropertyDetailsContent - Basic Rendering', () => {
  it('renders without crashing', () => {
    render(<PropertyDetailsContent property={mockPropertyData as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
  });

  it('displays property name', () => {
    render(<PropertyDetailsContent property={mockPropertyData as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Test Property')).toBeInTheDocument();
  });

  it('shows property description in markdown', () => {
    render(<PropertyDetailsContent property={mockPropertyData as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    const markdown = screen.getByTestId('markdown');
    expect(markdown).toHaveTextContent('Test description');
  });

  it('displays property rating and reviews', () => {
    render(<PropertyDetailsContent property={mockPropertyData as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(10 reviews)')).toBeInTheDocument();
  });

  it('shows property location', () => {
    render(<PropertyDetailsContent property={mockPropertyData as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/New York, NY/)).toBeInTheDocument();
  });

  it('displays host information', () => {
    render(<PropertyDetailsContent property={mockPropertyData as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    const hostNames = screen.getAllByText('John Doe');
    expect(hostNames.length).toBeGreaterThan(0);
  });

  it('renders property overview section', () => {
    render(<PropertyDetailsContent property={mockPropertyData as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Property Overview')).toBeInTheDocument();
    expect(screen.getByText('4 guests')).toBeInTheDocument();
    expect(screen.getByText('2 bedrooms')).toBeInTheDocument();
  });

  it('shows pricing information', () => {
    render(<PropertyDetailsContent property={mockPropertyData as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Pricing Information')).toBeInTheDocument();
    const priceElements = screen.getAllByText('$100.00');
    expect(priceElements.length).toBeGreaterThan(0);
  });

  it('displays address information', () => {
    render(<PropertyDetailsContent property={mockPropertyData as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Location & Address')).toBeInTheDocument();
    expect(screen.getByText('USA')).toBeInTheDocument();
  });

  it('shows amenities', () => {
    render(<PropertyDetailsContent property={mockPropertyData as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Amenities')).toBeInTheDocument();
    expect(screen.getByText('WiFi')).toBeInTheDocument();
    expect(screen.getByText('Kitchen')).toBeInTheDocument();
  });

  it('displays safety features', () => {
    render(<PropertyDetailsContent property={mockPropertyData as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Safety Features')).toBeInTheDocument();
    expect(screen.getByText('Smoke Detector')).toBeInTheDocument();
  });

  it('shows review scores when available', () => {
    render(<PropertyDetailsContent property={mockPropertyData as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Review Scores')).toBeInTheDocument();
    expect(screen.getByText('9.2/10')).toBeInTheDocument();
    expect(screen.getByText('9.5/10')).toBeInTheDocument();
  });

  it('handles property with no images gracefully', () => {
    const propertyWithoutImages = { ...mockPropertyData, images: [] };
    render(<PropertyDetailsContent property={propertyWithoutImages as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
    expect(screen.getByText('Test Property')).toBeInTheDocument();
  });

  it('handles undefined property gracefully', () => {
    render(<PropertyDetailsContent property={undefined} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
    expect(screen.queryByText('Test Property')).not.toBeInTheDocument();
  });

  it('displays superhost badge', () => {
    render(<PropertyDetailsContent property={mockPropertyData as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Superhost')).toBeInTheDocument();
  });

  it('shows property images in lightbox', () => {
    render(<PropertyDetailsContent property={mockPropertyData as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    const lightbox = screen.getByTestId('lightbox');
    expect(lightbox).toBeInTheDocument();
    expect(screen.getByTestId('slide-0')).toHaveTextContent('image1.jpg');
    expect(screen.getByTestId('slide-1')).toHaveTextContent('image2.jpg');
  });

  it('displays additional information sections', () => {
    render(<PropertyDetailsContent property={mockPropertyData as PropertyResponseDto} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Additional Information')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });
});
