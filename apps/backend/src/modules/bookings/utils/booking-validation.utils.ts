import { BadRequestException } from '@nestjs/common';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { DateUtils } from '../../../common/utils/date.utils';
import { BOOKING_MESSAGES } from '../constants/booking.constants';

/**
 * Shared booking validation utilities
 * Eliminates code duplication between services
 */
export class BookingValidationUtils {
  /**
   * Validate booking dates - shared between core service and business workflow
   */
  static validateBookingDates(
    checkIn: string | Date,
    checkOut: string | Date,
    allowToday = false,
  ): void {
    ValidationUtils.validateDateRange(checkIn, checkOut, {
      allowToday,
      allowPast: false,
      minNights: 1,
      context: 'BookingValidationUtils',
    });
  }

  /**
   * Validate date format - ensures consistent date parsing
   */
  static validateDateFormat(dateString: string, fieldName: string): Date {
    const date = DateUtils.create(dateString);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid ${fieldName} date format`);
    }
    return date;
  }

  /**
   * Calculate nights between two dates
   */
  static calculateNights(checkIn: string | Date, checkOut: string | Date): number {
    const checkInDate = DateUtils.create(checkIn);
    const checkOutDate = DateUtils.create(checkOut);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Validate guest capacity
   */
  static validateGuestCapacity(totalGuests: number, maxCapacity: number): void {
    if (totalGuests > maxCapacity) {
      throw new BadRequestException(BOOKING_MESSAGES.GUEST_CAPACITY_EXCEEDED);
    }
  }

  /**
   * Validate price amount
   */
  static validatePriceAmount(amount: number, fieldName: string): void {
    ValidationUtils.validatePrice(amount, fieldName, {
      allowZero: false,
      context: 'BookingValidationUtils',
    });
  }
}
