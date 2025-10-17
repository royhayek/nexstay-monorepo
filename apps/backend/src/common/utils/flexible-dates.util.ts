import { FlexibleDateRange } from '../enums/property.enums';
import { DateUtils } from './date.utils';

/**
 * Utility class for handling flexible date ranges
 * Converts flexible date selections to actual date ranges
 */
export class FlexibleDatesUtil {
  /**
   * Convert flexible date range to actual check-in and check-out dates
   * @param flexibleRange - The flexible date range enum
   * @returns Object with checkIn and checkOut dates
   */
  static convertFlexibleDateRange(flexibleRange: FlexibleDateRange): {
    checkIn: Date;
    checkOut: Date;
  } {
    const now = DateUtils.now();
    let checkIn: Date;
    let checkOut: Date;

    switch (flexibleRange) {
      case FlexibleDateRange.WEEKEND:
        // Next weekend (Friday to Sunday)
        checkIn = this.getNextFriday(now);
        checkOut = this.addDays(checkIn, 3); // Friday + 3 days = Monday checkout
        break;

      case FlexibleDateRange.LONG_WEEKEND:
        // Next long weekend (Thursday to Monday)
        checkIn = this.getNextThursday(now);
        checkOut = this.addDays(checkIn, 4); // Thursday + 4 days = Monday checkout
        break;

      case FlexibleDateRange.THREE_DAYS:
        // 3 days starting from today
        checkIn = now;
        checkOut = this.addDays(checkIn, 3);
        break;

      case FlexibleDateRange.WEEK:
        // 7 days starting from today
        checkIn = now;
        checkOut = this.addDays(checkIn, 7);
        break;

      case FlexibleDateRange.TWO_WEEKS:
        // 14 days starting from today
        checkIn = now;
        checkOut = this.addDays(checkIn, 14);
        break;

      case FlexibleDateRange.MONTH:
        // 30 days starting from today
        checkIn = now;
        checkOut = this.addDays(checkIn, 30);
        break;

      default:
        // Default to a week
        checkIn = now;
        checkOut = this.addDays(checkIn, 7);
        break;
    }

    return { checkIn, checkOut };
  }

  /**
   * Get the next Friday from a given date
   */
  private static getNextFriday(from: Date): Date {
    const date = new Date(from);
    const dayOfWeek = date.getDay();
    // Friday is 5 (0 = Sunday, 5 = Friday)
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - dayOfWeek + 5;
    return this.addDays(date, daysUntilFriday);
  }

  /**
   * Get the next Thursday from a given date
   */
  private static getNextThursday(from: Date): Date {
    const date = new Date(from);
    const dayOfWeek = date.getDay();
    // Thursday is 4 (0 = Sunday, 4 = Thursday)
    const daysUntilThursday = dayOfWeek <= 4 ? 4 - dayOfWeek : 7 - dayOfWeek + 4;
    return this.addDays(date, daysUntilThursday);
  }

  /**
   * Add days to a date
   */
  private static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Check if a flexible date range is valid
   */
  static isValidFlexibleDateRange(range: string): boolean {
    return Object.values(FlexibleDateRange).includes(range as FlexibleDateRange);
  }

  /**
   * Get all available flexible date ranges with descriptions
   */
  static getAvailableRanges(): Array<{ value: FlexibleDateRange; label: string; days: number }> {
    return [
      { value: FlexibleDateRange.WEEKEND, label: 'Weekend (Fri-Sun)', days: 3 },
      { value: FlexibleDateRange.LONG_WEEKEND, label: 'Long Weekend (Thu-Mon)', days: 4 },
      { value: FlexibleDateRange.THREE_DAYS, label: '3 Days', days: 3 },
      { value: FlexibleDateRange.WEEK, label: '1 Week', days: 7 },
      { value: FlexibleDateRange.TWO_WEEKS, label: '2 Weeks', days: 14 },
      { value: FlexibleDateRange.MONTH, label: '1 Month', days: 30 },
    ];
  }
}
