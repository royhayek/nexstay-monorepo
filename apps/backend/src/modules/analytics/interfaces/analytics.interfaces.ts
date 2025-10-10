export interface AnalyticsTimeframe {
  startDate: Date;
  endDate: Date;
  period: '1d' | '7d' | '30d' | '90d' | '1y' | 'custom';
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  usersByRole: Record<string, number>;
  usersByRegion: Record<string, number>;
  userGrowthRate: number;
}

export interface BookingAnalytics {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  revenue: number;
  averageBookingValue: number;
  bookingGrowthRate: number;
}

export interface PropertyAnalytics {
  totalProperties: number;
  activeProperties: number;
  averageOccupancyRate: number;
  topPerformingProperties: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
    rating: number;
  }>;
}

export interface FinancialAnalytics {
  totalRevenue: number;
  hostEarnings: number;
  platformCommission: number;
  pendingPayouts: number;
  revenueGrowthRate: number;
  averageTransactionValue: number;
}

export interface AnalyticsAggregation {
  period: string;
  users: UserAnalytics;
  bookings: BookingAnalytics;
  properties: PropertyAnalytics;
  financial: FinancialAnalytics;
  timestamp: Date;
}

/**
 * Metric calculation result interface
 */
export interface MetricCalculationResult {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  period: string;
  unit?: string;
}

/**
 * Platform distribution interface
 */
export interface PlatformDistribution {
  platform: string;
  count: number;
  percentage: number;
  color?: string;
}

/**
 * Regional distribution interface
 */
export interface RegionalDistribution {
  region: string;
  count: number;
  code?: string;
}

/**
 * Time series data interface
 */
export interface TimeSeriesData {
  period: string;
  value: number;
  breakdown?: Record<string, number>;
}

/**
 * Analytics filters interface
 */
export interface AnalyticsFilters {
  startDate?: Date;
  endDate?: Date;
  period?: string;
  status?: string;
  propertyId?: string;
  guestId?: string;
  hostId?: string;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Pagination interface for analytics
 */
export interface AnalyticsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Analytics query result interface
 */
export interface AnalyticsQueryResult<T> {
  items: T[];
  pagination: AnalyticsPagination;
  filters?: AnalyticsFilters;
  executionTime?: number;
  timestamp: Date;
}
