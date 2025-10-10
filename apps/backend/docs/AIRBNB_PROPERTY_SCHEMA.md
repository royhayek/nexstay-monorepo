# Airbnb Property Data Structure & API Schema

## Core Property Entity

### Basic Information

```typescript
interface Property {
  _id: string;
  listing_url: string;
  name: string;
  summary?: string;
  space?: string;
  description: string;
  neighborhood_overview?: string;
  notes?: string;
  transit?: string;
  access?: string;
  interaction?: string;
  house_rules?: string;

  // Property Type & Classification
  property_type: PropertyType;
  room_type: RoomType;
  bed_type: BedType;
  minimum_nights: number;
  maximum_nights: number;
  cancellation_policy: CancellationPolicy;

  // Capacity
  accommodates: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;

  // Pricing
  price: PriceInfo;
  weekly_price?: number;
  monthly_price?: number;
  security_deposit?: number;
  cleaning_fee?: number;
  extra_people?: number;

  // Location
  address: Address;
  coordinates: Coordinates;

  // Amenities & Features
  amenities: string[];
  features: PropertyFeatures;

  // Images & Media
  images: PropertyImage[];
  picture_url?: string;
  xl_picture_url?: string;

  // Availability & Calendar
  availability: AvailabilityInfo;
  calendar_last_scraped: Date;

  // Host Information
  host: Host;

  // Reviews & Ratings
  reviews: Review[];
  review_scores: ReviewScores;
  number_of_reviews: number;
  first_review?: Date;
  last_review?: Date;
  reviews_per_month?: number;

  // Verification & Trust
  instant_bookable: boolean;
  is_business_travel_ready: boolean;
  require_guest_profile_picture: boolean;
  require_guest_phone_verification: boolean;

  // Metadata
  created_at: Date;
  updated_at: Date;
  last_scraped: Date;
  calendar_updated?: Date;
}
```

## Enums & Types

### Property Classifications

```typescript
enum PropertyType {
  APARTMENT = 'Apartment',
  HOUSE = 'House',
  TOWNHOUSE = 'Townhouse',
  CONDOMINIUM = 'Condominium',
  VILLA = 'Villa',
  LOFT = 'Loft',
  CABIN = 'Cabin',
  COTTAGE = 'Cottage',
  BUNGALOW = 'Bungalow',
  CASTLE = 'Castle',
  TREEHOUSE = 'Treehouse',
  BOAT = 'Boat',
  CAMPER_RV = 'Camper/RV',
  TENT = 'Tent',
  HOTEL = 'Hotel',
  HOSTEL = 'Hostel',
  BED_BREAKFAST = 'Bed & Breakfast',
  BOUTIQUE_HOTEL = 'Boutique hotel',
  GUESTHOUSE = 'Guesthouse',
  GUEST_SUITE = 'Guest suite',
  SERVICED_APARTMENT = 'Serviced apartment',
  OTHER = 'Other',
}

enum RoomType {
  ENTIRE_HOME = 'Entire home/apt',
  PRIVATE_ROOM = 'Private room',
  SHARED_ROOM = 'Shared room',
  HOTEL_ROOM = 'Hotel room',
}

enum BedType {
  REAL_BED = 'Real Bed',
  PULL_OUT_SOFA = 'Pull-out Sofa',
  FUTON = 'Futon',
  COUCH = 'Couch',
  AIRBED = 'Airbed',
}

enum CancellationPolicy {
  FLEXIBLE = 'flexible',
  MODERATE = 'moderate',
  STRICT = 'strict',
  STRICT_14_WITH_GRACE_PERIOD = 'strict_14_with_grace_period',
  SUPER_STRICT_30 = 'super_strict_30',
  SUPER_STRICT_60 = 'super_strict_60',
}
```

### Pricing Information

```typescript
interface PriceInfo {
  base_price: number;
  currency: string;
  currency_symbol: string;
  price_per_night: number;
  weekly_discount?: number;
  monthly_discount?: number;
  cleaning_fee?: number;
  security_deposit?: number;
  extra_people_fee?: number;
}
```

### Address & Location

```typescript
interface Address {
  street?: string;
  suburb?: string;
  government_area?: string;
  market?: string;
  country: string;
  country_code: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    is_location_exact: boolean;
  };
}

interface Coordinates {
  latitude: number;
  longitude: number;
}
```

### Property Features & Amenities

```typescript
interface PropertyFeatures {
  // Safety Features
  smoke_detector: boolean;
  carbon_monoxide_detector: boolean;
  fire_extinguisher: boolean;
  first_aid_kit: boolean;
  safety_card: boolean;

  // Kitchen
  kitchen: boolean;
  kitchenette: boolean;
  refrigerator: boolean;
  microwave: boolean;
  dishwasher: boolean;
  coffee_maker: boolean;

  // Connectivity
  wifi: boolean;
  internet: boolean;
  cable_tv: boolean;

  // Comfort
  air_conditioning: boolean;
  heating: boolean;
  hot_water: boolean;

  // Outdoor
  balcony: boolean;
  patio: boolean;
  garden: boolean;
  pool: boolean;
  hot_tub: boolean;

  // Parking
  free_parking: boolean;
  paid_parking: boolean;
  street_parking: boolean;

  // Family Friendly
  family_kid_friendly: boolean;
  crib: boolean;
  high_chair: boolean;

  // Accessibility
  wheelchair_accessible: boolean;
  elevator_in_building: boolean;

  // Business
  laptop_friendly_workspace: boolean;
  suitable_for_events: boolean;

  // Pet Policy
  pets_allowed: boolean;
  pets_live_on_property: boolean;
  dog: boolean;
  cat: boolean;

  // Smoking Policy
  smoking_allowed: boolean;
}

// Common amenities list
const COMMON_AMENITIES = [
  'WiFi',
  'Kitchen',
  'Air conditioning',
  'Heating',
  'TV',
  'Hot water',
  'Washer',
  'Dryer',
  'Iron',
  'Hair dryer',
  'Shampoo',
  'Breakfast',
  'Free parking on premises',
  'Paid parking off premises',
  'Smoke detector',
  'Carbon monoxide detector',
  'First aid kit',
  'Fire extinguisher',
  'Essentials',
  'Hangers',
  'Bed linens',
  'Extra pillows and blankets',
  'Ethernet connection',
  'Laptop friendly workspace',
  'Self check-in',
  'Keypad',
  'Lockbox',
  'Family/kid friendly',
  'Suitable for events',
  'Pets allowed',
  'Smoking allowed',
  'Wheelchair accessible',
  'Elevator in building',
  'Free street parking',
  'Buzzer/wireless intercom',
  'Pool',
  'Hot tub',
  'Gym',
  'BBQ grill',
];
```

### Images & Media

```typescript
interface PropertyImage {
  _id: string;
  url: string;
  thumbnail_url?: string;
  medium_url?: string;
  picture_url?: string;
  xl_picture_url?: string;
  caption?: string;
  is_primary: boolean;
  sort_order: number;
  room_type?: string; // bedroom, bathroom, kitchen, living_room, exterior, etc.
}
```

### Host Information

```typescript
interface Host {
  host_id: string;
  host_url: string;
  host_name: string;
  host_since: Date;
  host_location?: string;
  host_about?: string;
  host_response_time?: string;
  host_response_rate?: number;
  host_acceptance_rate?: number;
  host_is_superhost: boolean;
  host_thumbnail_url?: string;
  host_picture_url?: string;
  host_neighbourhood?: string;
  host_listings_count: number;
  host_total_listings_count: number;
  host_verifications: string[];
  host_has_profile_pic: boolean;
  host_identity_verified: boolean;
}
```

### Reviews & Ratings

```typescript
interface Review {
  _id: string;
  date: Date;
  listing_id: string;
  reviewer_id: string;
  reviewer_name: string;
  comments: string;
}

interface ReviewScores {
  review_scores_rating?: number;
  review_scores_accuracy?: number;
  review_scores_cleanliness?: number;
  review_scores_checkin?: number;
  review_scores_communication?: number;
  review_scores_location?: number;
  review_scores_value?: number;
}
```

### Availability

```typescript
interface AvailabilityInfo {
  availability_30: number;
  availability_60: number;
  availability_90: number;
  availability_365: number;
  calendar_updated?: Date;
  has_availability: boolean;
}
```

## Additional Entities

### Booking Entity

```typescript
interface Booking {
  _id: string;
  property_id: string;
  guest_id: string;
  host_id: string;

  // Dates
  check_in: Date;
  check_out: Date;
  nights: number;

  // Guests
  adults: number;
  children: number;
  infants: number;
  total_guests: number;

  // Pricing
  base_amount: number;
  cleaning_fee: number;
  service_fee: number;
  occupancy_taxes: number;
  total_amount: number;
  currency: string;

  // Status
  status: BookingStatus;
  payment_status: PaymentStatus;

  // Special Requests
  special_requests?: string;
  estimated_arrival_time?: string;

  // Timestamps
  created_at: Date;
  updated_at: Date;
  confirmed_at?: Date;
  cancelled_at?: Date;
}

enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}
```

### Guest Entity

```typescript
interface Guest {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: Date;

  // Profile
  profile_picture?: string;
  about?: string;
  languages: string[];
  location?: string;

  // Verification
  email_verified: boolean;
  phone_verified: boolean;
  identity_verified: boolean;

  // Reviews & Ratings
  reviews_received: number;
  average_rating?: number;

  // Account
  member_since: Date;
  last_active: Date;
  is_active: boolean;
}
```

## Search & Filter Parameters

### Search Query Interface

```typescript
interface PropertySearchQuery {
  // Location
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // in km

  // Dates
  check_in?: Date;
  check_out?: Date;

  // Guests
  adults?: number;
  children?: number;
  infants?: number;

  // Property Type
  property_types?: PropertyType[];
  room_types?: RoomType[];

  // Price Range
  min_price?: number;
  max_price?: number;
  currency?: string;

  // Capacity
  min_accommodates?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;

  // Amenities
  amenities?: string[];

  // Host Preferences
  instant_bookable?: boolean;
  superhost_only?: boolean;

  // Policies
  cancellation_policy?: CancellationPolicy;

  // Sorting
  sort_by?: 'price' | 'rating' | 'reviews' | 'distance' | 'newest';
  sort_order?: 'asc' | 'desc';

  // Pagination
  page?: number;
  limit?: number;
}
```

## API Endpoint Structure Recommendations

### Property Endpoints

- `GET /api/properties` - List properties with filters
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create new property (host only)
- `PUT /api/properties/:id` - Update property (host only)
- `DELETE /api/properties/:id` - Delete property (host only)
- `GET /api/properties/:id/availability` - Check availability
- `GET /api/properties/:id/reviews` - Get property reviews
- `POST /api/properties/:id/reviews` - Add review (guests only)
- `GET /api/properties/:id/similar` - Get similar properties

### Booking Endpoints

- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `GET /api/users/bookings` - Get user's bookings (guest)
- `GET /api/hosts/bookings` - Get host's bookings (host)

### Search Endpoints

- `GET /api/search/properties` - Search properties
- `GET /api/search/suggestions` - Location suggestions
- `GET /api/search/filters` - Available filters

This comprehensive schema covers all major aspects of an Airbnb-like property system including property details, host information, guest management, bookings, reviews, and search functionality.
