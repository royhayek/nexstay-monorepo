/**
 * Date utility interfaces for type-safe date operations
 * Provides comprehensive typing for date handling across the application
 */

/**
 * Date Range Interface
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Date Difference Result
 */
export interface DateDifference {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  totalMilliseconds: number;
}

/**
 * Business Hours Configuration
 */
export interface BusinessHours {
  start: { hour: number; minute: number };
  end: { hour: number; minute: number };
  timezone?: string;
}
