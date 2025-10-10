/**
 * Business logic interfaces using camelCase (following architectural guidelines)
 * Use these for application-level data structures and service layer operations
 */
export interface BookingFields {
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  status: string;
}

export interface ReviewFields {
  overallRating: number;
}

/**
 * Interface for property pricing update data
 */
export interface PropertyPricingUpdateData {
  pricePerNight: number;
  cleaningFee?: number;
  serviceFee?: number;
}

/**
 * Interface for property statistics
 */
export interface PropertyStatistics {
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  occupancyRate: number;
  viewCount: number;
}
