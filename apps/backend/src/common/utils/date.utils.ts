/**
 * Date Utility Functions
 *
 * Comprehensive date operations for the Homestay/Airhub Clone Backend
 * Provides timezone-aware date operations, formatting, validation, and business logic helpers
 *
 * @module DateUtils
 */

/**
 * Date Format Constants
 */
export const DateFormats = {
  // API Formats
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ' as const,
  ISO_DATE: 'YYYY-MM-DD' as const,
  ISO_TIME: 'HH:mm:ss' as const,

  // Display Formats
  DISPLAY_DATE: 'MMM DD, YYYY' as const,
  DISPLAY_DATE_TIME: 'MMM DD, YYYY HH:mm' as const,
  DISPLAY_SHORT: 'MM/DD/YYYY' as const,
  DISPLAY_LONG: 'MMMM DD, YYYY' as const,

  // Business Formats
  BOOKING_DATE: 'YYYY-MM-DD' as const,
  INVOICE_DATE: 'DD/MM/YYYY' as const,
  REPORT_DATE: 'YYYY-MM-DD HH:mm:ss' as const,
} as const;

/**
 * Time Constants
 */
export const TimeConstants = {
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  DAYS_PER_MONTH: 30, // Average
  DAYS_PER_YEAR: 365,

  // Derived constants
  MILLISECONDS_PER_MINUTE: 60 * 1000,
  MILLISECONDS_PER_HOUR: 60 * 60 * 1000,
  MILLISECONDS_PER_DAY: 24 * 60 * 60 * 1000,
  MILLISECONDS_PER_WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

import type { DateRange, DateDifference, BusinessHours } from '../interfaces/date.interfaces';

/**
 * Date Utility Class
 * Provides comprehensive date operations for the application
 */
export class DateUtils {
  /**
   * Get current date and time
   */
  static now(): Date {
    return new Date();
  }

  /**
   * Get current timestamp in milliseconds
   */
  static nowTimestamp(): number {
    return Date.now();
  }

  /**
   * Create a new date instance
   */
  static create(date?: Date | string | number): Date {
    if (date === undefined) {
      return new Date();
    }
    return this.parseDate(date);
  }

  /**
   * Format a date to ISO string
   */
  static toISO(date: Date | string | number): string {
    const dateObj = this.parseDate(date);
    return dateObj.toISOString();
  }

  /**
   * Format a date to ISO date string (YYYY-MM-DD)
   */
  static toISODate(date: Date | string | number): string {
    const dateObj = this.parseDate(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse a date from various formats
   */
  static parseDate(date: Date | string | number): Date {
    if (date instanceof Date) {
      return new Date(date.getTime());
    }

    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }

    return parsed;
  }

  /**
   * Safe date parsing with fallback
   */
  static safeParse(date: unknown, fallback: Date = new Date()): Date {
    try {
      return this.parseDate(date as Date | string | number);
    } catch {
      return fallback;
    }
  }

  /**
   * Check if a value is a valid date
   */
  static isValidDate(date: unknown): boolean {
    try {
      const parsed = this.parseDate(date as Date | string | number);
      return !isNaN(parsed.getTime());
    } catch {
      return false;
    }
  }

  /**
   * Get the start of day (00:00:00.000)
   */
  static startOfDay(date: Date | string | number): Date {
    const dateObj = this.parseDate(date);
    const result = new Date(dateObj);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get the end of day (23:59:59.999)
   */
  static endOfDay(date: Date | string | number): Date {
    const dateObj = this.parseDate(date);
    const result = new Date(dateObj);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Get the start of week (Monday)
   */
  static startOfWeek(date: Date | string | number): Date {
    const dateObj = this.parseDate(date);
    const result = new Date(dateObj);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1);
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get the end of week (Sunday)
   */
  static endOfWeek(date: Date | string | number): Date {
    const dateObj = this.parseDate(date);
    const result = new Date(dateObj);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? 0 : 7);
    result.setDate(diff);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Get the start of month
   */
  static startOfMonth(date: Date | string | number): Date {
    const dateObj = this.parseDate(date);
    const result = new Date(dateObj);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get the end of month
   */
  static endOfMonth(date: Date | string | number): Date {
    const dateObj = this.parseDate(date);
    const result = new Date(dateObj);
    result.setMonth(result.getMonth() + 1, 0);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Add days to a date
   */
  static addDays(date: Date | string | number, days: number): Date {
    const dateObj = this.parseDate(date);
    const result = new Date(dateObj);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Subtract days from a date
   */
  static subtractDays(date: Date | string | number, days: number): Date {
    return this.addDays(date, -days);
  }

  /**
   * Add hours to a date
   */
  static addHours(date: Date | string | number, hours: number): Date {
    const dateObj = this.parseDate(date);
    const result = new Date(dateObj);
    result.setHours(result.getHours() + hours);
    return result;
  }

  /**
   * Subtract hours from a date
   */
  static subtractHours(date: Date | string | number, hours: number): Date {
    return this.addHours(date, -hours);
  }

  /**
   * Add minutes to a date
   */
  static addMinutes(date: Date | string | number, minutes: number): Date {
    const dateObj = this.parseDate(date);
    const result = new Date(dateObj);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  /**
   * Add months to a date
   */
  static addMonths(date: Date | string | number, months: number): Date {
    const dateObj = this.parseDate(date);
    const result = new Date(dateObj);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * Add years to a date
   */
  static addYears(date: Date | string | number, years: number): Date {
    const dateObj = this.parseDate(date);
    const result = new Date(dateObj);
    result.setFullYear(result.getFullYear() + years);
    return result;
  }

  /**
   * Calculate the difference between two dates
   */
  static difference(date1: Date | string | number, date2: Date | string | number): DateDifference {
    const d1 = this.parseDate(date1);
    const d2 = this.parseDate(date2);

    const totalMilliseconds = Math.abs(d1.getTime() - d2.getTime());
    const totalSeconds = totalMilliseconds / TimeConstants.MILLISECONDS_PER_SECOND;
    const totalMinutes = totalMilliseconds / TimeConstants.MILLISECONDS_PER_MINUTE;
    const totalHours = totalMilliseconds / TimeConstants.MILLISECONDS_PER_HOUR;
    const totalDays = totalMilliseconds / TimeConstants.MILLISECONDS_PER_DAY;

    const days = Math.floor(totalDays);
    const hours = Math.floor(totalHours % 24);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = totalMilliseconds % 1000;

    return {
      days,
      hours,
      minutes,
      seconds,
      milliseconds,
      totalDays,
      totalHours,
      totalMinutes,
      totalSeconds,
      totalMilliseconds,
    };
  }

  /**
   * Calculate days between two dates
   */
  static daysBetween(date1: Date | string | number, date2: Date | string | number): number {
    const diff = this.difference(date1, date2);
    return Math.floor(diff.totalDays);
  }

  /**
   * Check if date1 is before date2
   */
  static isBefore(date1: Date | string | number, date2: Date | string | number): boolean {
    const d1 = this.parseDate(date1);
    const d2 = this.parseDate(date2);
    return d1.getTime() < d2.getTime();
  }

  /**
   * Check if date1 is after date2
   */
  static isAfter(date1: Date | string | number, date2: Date | string | number): boolean {
    const d1 = this.parseDate(date1);
    const d2 = this.parseDate(date2);
    return d1.getTime() > d2.getTime();
  }

  /**
   * Check if two dates are on the same day
   */
  static isSameDay(date1: Date | string | number, date2: Date | string | number): boolean {
    const d1 = this.parseDate(date1);
    const d2 = this.parseDate(date2);

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  /**
   * Check if a date is between two dates (inclusive)
   */
  static isBetween(
    date: Date | string | number,
    start: Date | string | number,
    end: Date | string | number,
    inclusive = true,
  ): boolean {
    const d = this.parseDate(date);
    const s = this.parseDate(start);
    const e = this.parseDate(end);

    if (inclusive) {
      return d.getTime() >= s.getTime() && d.getTime() <= e.getTime();
    } else {
      return d.getTime() > s.getTime() && d.getTime() < e.getTime();
    }
  }

  /**
   * Check if a date is in the past
   */
  static isPast(date: Date | string | number): boolean {
    const d = this.parseDate(date);
    return d.getTime() < Date.now();
  }

  /**
   * Check if a date is in the future
   */
  static isFuture(date: Date | string | number): boolean {
    const d = this.parseDate(date);
    return d.getTime() > Date.now();
  }

  /**
   * Check if a date is today
   */
  static isToday(date: Date | string | number): boolean {
    return this.isSameDay(date, this.now());
  }

  /**
   * Check if a date is tomorrow
   */
  static isTomorrow(date: Date | string | number): boolean {
    const tomorrow = this.addDays(this.now(), 1);
    return this.isSameDay(date, tomorrow);
  }

  /**
   * Check if a date is yesterday
   */
  static isYesterday(date: Date | string | number): boolean {
    const yesterday = this.subtractDays(this.now(), 1);
    return this.isSameDay(date, yesterday);
  }

  /**
   * Get age from birthdate
   */
  static getAge(birthdate: Date | string | number): number {
    const birth = this.parseDate(birthdate);
    const today = this.now();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Format a date with a simple format string
   */
  static format(date: Date | string | number, format: string): string {
    const d = this.parseDate(date);

    const pad = (num: number, size = 2): string => String(num).padStart(size, '0');

    const replacements: Record<string, string> = {
      YYYY: String(d.getFullYear()),
      YY: String(d.getFullYear()).slice(-2),
      MM: pad(d.getMonth() + 1),
      M: String(d.getMonth() + 1),
      DD: pad(d.getDate()),
      D: String(d.getDate()),
      HH: pad(d.getHours()),
      H: String(d.getHours()),
      mm: pad(d.getMinutes()),
      m: String(d.getMinutes()),
      ss: pad(d.getSeconds()),
      s: String(d.getSeconds()),
      SSS: pad(d.getMilliseconds(), 3),
    };

    let result = format;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(key, 'g'), value);
    }

    return result;
  }

  /**
   * Get a human-readable relative time (e.g., "2 hours ago", "in 3 days")
   */
  static getRelativeTime(date: Date | string | number): string {
    const d = this.parseDate(date);
    const now = this.now();
    const diff = this.difference(d, now);
    const isPastDate = d.getTime() < now.getTime();

    if (diff.totalSeconds < 60) {
      return isPastDate ? 'just now' : 'in a moment';
    }

    if (diff.totalMinutes < 60) {
      const minutes = Math.floor(diff.totalMinutes);
      return isPastDate
        ? `${minutes} minute${minutes > 1 ? 's' : ''} ago`
        : `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }

    if (diff.totalHours < 24) {
      const hours = Math.floor(diff.totalHours);
      return isPastDate
        ? `${hours} hour${hours > 1 ? 's' : ''} ago`
        : `in ${hours} hour${hours > 1 ? 's' : ''}`;
    }

    if (diff.totalDays < 30) {
      const days = Math.floor(diff.totalDays);
      return isPastDate
        ? `${days} day${days > 1 ? 's' : ''} ago`
        : `in ${days} day${days > 1 ? 's' : ''}`;
    }

    if (diff.totalDays < 365) {
      const months = Math.floor(diff.totalDays / 30);
      return isPastDate
        ? `${months} month${months > 1 ? 's' : ''} ago`
        : `in ${months} month${months > 1 ? 's' : ''}`;
    }

    const years = Math.floor(diff.totalDays / 365);
    return isPastDate
      ? `${years} year${years > 1 ? 's' : ''} ago`
      : `in ${years} year${years > 1 ? 's' : ''}`;
  }

  /**
   * Get the next occurrence of a specific day of week
   */
  static getNextDayOfWeek(dayOfWeek: number, fromDate?: Date | string | number): Date {
    const from = this.parseDate(fromDate ?? this.now());
    const result = new Date(from);
    const currentDay = result.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7 || 7;
    result.setDate(result.getDate() + daysUntilTarget);
    return result;
  }

  /**
   * Check if a date falls within business hours
   */
  static isWithinBusinessHours(
    date: Date | string | number,
    businessHours: BusinessHours,
  ): boolean {
    const d = this.parseDate(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();

    const currentMinutes = hours * 60 + minutes;
    const startMinutes = businessHours.start.hour * 60 + businessHours.start.minute;
    const endMinutes = businessHours.end.hour * 60 + businessHours.end.minute;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  /**
   * Get the number of business days between two dates (excluding weekends)
   */
  static getBusinessDaysBetween(
    start: Date | string | number,
    end: Date | string | number,
  ): number {
    const startDate = this.parseDate(start);
    const endDate = this.parseDate(end);

    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Add business days to a date (skipping weekends)
   */
  static addBusinessDays(date: Date | string | number, days: number): Date {
    const result = this.parseDate(date);
    let daysAdded = 0;

    while (daysAdded < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++;
      }
    }

    return result;
  }

  /**
   * Create a date range
   */
  static createDateRange(start: Date | string | number, end: Date | string | number): DateRange {
    return {
      startDate: this.parseDate(start),
      endDate: this.parseDate(end),
    };
  }

  /**
   * Check if two date ranges overlap
   */
  static doDateRangesOverlap(range1: DateRange, range2: DateRange): boolean {
    return range1.startDate <= range2.endDate && range1.endDate >= range2.startDate;
  }

  /**
   * Get all dates within a range
   */
  static getDatesInRange(start: Date | string | number, end: Date | string | number): Date[] {
    const startDate = this.parseDate(start);
    const endDate = this.parseDate(end);
    const dates: Date[] = [];

    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  /**
   * Check if a year is a leap year
   */
  static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * Get the number of days in a month
   */
  static getDaysInMonth(date: Date | string | number): number {
    const d = this.parseDate(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }

  /**
   * Get the quarter of the year (1-4)
   */
  static getQuarter(date: Date | string | number): number {
    const d = this.parseDate(date);
    return Math.floor(d.getMonth() / 3) + 1;
  }

  /**
   * Get the week number of the year
   */
  static getWeekNumber(date: Date | string | number): number {
    const d = this.parseDate(date);
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (d.getTime() - firstDayOfYear.getTime()) / TimeConstants.MILLISECONDS_PER_DAY;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Business Logic Helpers
   */

  /**
   * Calculate booking duration in nights
   */
  static calculateBookingNights(
    checkIn: Date | string | number,
    checkOut: Date | string | number,
  ): number {
    const checkInDate = this.startOfDay(checkIn);
    const checkOutDate = this.startOfDay(checkOut);
    return this.daysBetween(checkInDate, checkOutDate);
  }

  /**
   * Check if a booking is valid (check-out after check-in)
   */
  static isValidBookingRange(
    checkIn: Date | string | number,
    checkOut: Date | string | number,
  ): boolean {
    const checkInDate = this.parseDate(checkIn);
    const checkOutDate = this.parseDate(checkOut);
    return checkOutDate > checkInDate;
  }

  /**
   * Get the check-in deadline (e.g., 24 hours before)
   */
  static getCheckInDeadline(checkIn: Date | string | number, hoursBefore: number = 24): Date {
    return this.subtractDays(checkIn, hoursBefore / 24);
  }

  /**
   * Check if a date is within cancellation window
   */
  static isWithinCancellationWindow(
    bookingDate: Date | string | number,
    cancellationHours: number = 48,
  ): boolean {
    const booking = this.parseDate(bookingDate);
    const deadline = this.subtractDays(booking, cancellationHours / 24);
    return this.now() <= deadline;
  }

  /**
   * Calculate late check-out fee periods
   */
  static calculateLateCheckoutPeriods(
    scheduledCheckout: Date | string | number,
    actualCheckout: Date | string | number,
    periodHours: number = 1,
  ): number {
    const scheduled = this.parseDate(scheduledCheckout);
    const actual = this.parseDate(actualCheckout);

    if (actual <= scheduled) {
      return 0;
    }

    const diff = this.difference(actual, scheduled);
    return Math.ceil(diff.totalHours / periodHours);
  }

  /**
   * Get payment due date
   */
  static getPaymentDueDate(bookingDate: Date | string | number, daysBefore: number = 7): Date {
    return this.subtractDays(bookingDate, daysBefore);
  }

  /**
   * Check if a review period is still open
   */
  static isReviewPeriodOpen(
    checkoutDate: Date | string | number,
    reviewDays: number = 14,
  ): boolean {
    const checkout = this.parseDate(checkoutDate);
    const deadline = this.addDays(checkout, reviewDays);
    return this.now() <= deadline;
  }

  /**
   * Calculate payout release date
   */
  static getPayoutReleaseDate(
    checkInDate: Date | string | number,
    releaseHours: number = 24,
  ): Date {
    return this.addHours(checkInDate, releaseHours);
  }

  /**
   * Get seasonal pricing period
   */
  static getSeasonalPeriod(date: Date | string | number): 'peak' | 'high' | 'low' | 'standard' {
    const d = this.parseDate(date);
    const month = d.getMonth();

    // Summer peak (June, July, August)
    if (month >= 5 && month <= 7) {
      return 'peak';
    }

    // Winter high (December, January)
    if (month === 11 || month === 0) {
      return 'high';
    }

    // Spring/Fall standard (March-May, September-November)
    if ((month >= 2 && month <= 4) || (month >= 8 && month <= 10)) {
      return 'standard';
    }

    // February low season
    return 'low';
  }

  /**
   * Check if a date is a weekend
   */
  static isWeekend(date: Date | string | number): boolean {
    const d = this.parseDate(date);
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  /**
   * Get availability calendar dates
   */
  static getAvailabilityCalendar(startDate: Date | string | number, months: number = 3): Date[] {
    const start = this.startOfMonth(startDate);
    const end = this.endOfMonth(this.addMonths(start, months - 1));
    return this.getDatesInRange(start, end);
  }

  /**
   * Check if booking dates are available
   */
  static areBookingDatesAvailable(
    requestedDates: DateRange,
    blockedDates: Date[],
    minimumStay: number = 1,
  ): { available: boolean; reason?: string } {
    // Check minimum stay
    const nights = this.calculateBookingNights(requestedDates.startDate, requestedDates.endDate);
    if (nights < minimumStay) {
      return { available: false, reason: `Minimum stay is ${minimumStay} nights` };
    }

    // Check if any requested dates are blocked
    const requestedDatesArray = this.getDatesInRange(
      requestedDates.startDate,
      requestedDates.endDate,
    );
    for (const requestedDate of requestedDatesArray) {
      for (const blockedDate of blockedDates) {
        if (this.isSameDay(requestedDate, blockedDate)) {
          return { available: false, reason: 'Some dates are not available' };
        }
      }
    }

    return { available: true };
  }

  /**
   * Calculate dynamic pricing multiplier based on date
   */
  static getDynamicPricingMultiplier(date: Date | string | number): number {
    const d = this.parseDate(date);

    // Weekend pricing (20% increase)
    let multiplier = this.isWeekend(d) ? 1.2 : 1.0;

    // Seasonal pricing
    const season = this.getSeasonalPeriod(d);
    switch (season) {
      case 'peak':
        multiplier *= 1.5;
        break;
      case 'high':
        multiplier *= 1.3;
        break;
      case 'low':
        multiplier *= 0.8;
        break;
      default:
        multiplier *= 1.0;
    }

    return multiplier;
  }

  /**
   * Format duration for display
   */
  static formatDuration(milliseconds: number): string {
    const diff = this.difference(new Date(milliseconds), new Date(0));

    if (diff.totalDays >= 1) {
      return `${Math.floor(diff.totalDays)} day${Math.floor(diff.totalDays) > 1 ? 's' : ''}`;
    }

    if (diff.totalHours >= 1) {
      return `${Math.floor(diff.totalHours)} hour${Math.floor(diff.totalHours) > 1 ? 's' : ''}`;
    }

    if (diff.totalMinutes >= 1) {
      return `${Math.floor(diff.totalMinutes)} minute${Math.floor(diff.totalMinutes) > 1 ? 's' : ''}`;
    }

    return `${Math.floor(diff.totalSeconds)} second${Math.floor(diff.totalSeconds) > 1 ? 's' : ''}`;
  }

  /**
   * Get a formatted date for invoices
   */
  static getInvoiceDate(date?: Date | string | number): string {
    return this.format(date ?? this.now(), DateFormats.INVOICE_DATE);
  }

  /**
   * Get a formatted date for reports
   */
  static getReportDate(date?: Date | string | number): string {
    return this.format(date ?? this.now(), DateFormats.REPORT_DATE);
  }

  /**
   * Check if a token or session is expired
   */
  static isExpired(expiryDate: Date | string | number): boolean {
    return this.isPast(expiryDate);
  }

  /**
   * Get token expiry date
   */
  static getTokenExpiryDate(hoursValid: number = 24): Date {
    return this.addHours(new Date(), hoursValid);
  }
}
