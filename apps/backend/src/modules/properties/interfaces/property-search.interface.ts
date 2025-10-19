/**
 * Base search parameters interface
 */
export interface BaseSearchParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Location-based search parameters
 */
export interface LocationSearchParams {
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

/**
 * Date-based search parameters
 */
export interface DateSearchParams {
  checkIn?: string;
  checkOut?: string;
}

/**
 * Property filtering parameters (now using catalog string values)
 */
export interface PropertyFilterParams {
  propertyTypes?: string[];
  roomTypes?: string[];
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
}

/**
 * Amenity filtering parameters
 */
export interface AmenityFilterParams {
  amenities?: string[];
  hasWifi?: boolean;
  hasParking?: boolean;
  hasPool?: boolean;
  hasKitchen?: boolean;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  hasAirConditioning?: boolean;
  hasHeating?: boolean;
}

/**
 * Host and rating filtering parameters (now using catalog string values)
 */
export interface HostFilterParams {
  instantBookable?: boolean;
  isSuperhost?: boolean;
  minRating?: number;
  cancellationPolicy?: string;
}

/**
 * Complete property search parameters
 */
export interface PropertySearchParams
  extends BaseSearchParams,
    LocationSearchParams,
    DateSearchParams,
    PropertyFilterParams,
    AmenityFilterParams,
    HostFilterParams {
  // Additional search-specific parameters
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Property search result item
 */
export interface PropertySearchItem {
  _id: string;
  name: string;
  location?: string;
  pricePerNight?: number;
  rating?: number;
  imageUrl?: string;
}

/**
 * Property search result with pagination
 */
export interface PropertySearchResult {
  items: PropertySearchItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Admin property filters
 */
export interface AdminPropertyFilters extends BaseSearchParams {
  status?: string;
  hostId?: string;
  propertyType?: string;
  roomType?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  isPublished?: string;
  instantBookable?: string;
  businessTravelReady?: string;
  isSuperhost?: string;
  featured?: string;
  verified?: string;
}

/**
 * Property dropdown search result
 */
export interface PropertyDropdownResult {
  properties: PropertySearchItem[];
  total: number;
}
