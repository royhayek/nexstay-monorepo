import { Types } from 'mongoose';
import { PayoutFrequency } from '../../../common/enums/payout.enums';
import { CurrencyCode } from '../../../common/enums/payment.enums';
import { UserDocument } from '../../../database/schemas/user.schema';
import { PayoutDocument } from '../../../database/schemas/payout.schema';
import { BookingDocument } from '../../../database/schemas/booking.schema';
import { PayoutMethodData } from './index';

export interface PayoutPreferencesData {
  frequency: PayoutFrequency;
  minimumAmount: number;
  preferredMethodId?: Types.ObjectId;
  autoPayoutEnabled: boolean;
  lastAutoPayoutDate?: Date;
}

export interface UserPreferences {
  otpNotificationMethod: string;
  language: string;
  timezone: string;
  payout?: PayoutPreferencesData;
}

export type UserWithPreferences = UserDocument;

export interface PopulatedProperty {
  name?: string;
}

export interface PopulatedGuest {
  firstName?: string;
  lastName?: string;
}

export interface PopulatedBooking {
  _id: Types.ObjectId;
  hostId: Types.ObjectId;
  status: string;
  paymentStatus: string;
  payoutStatus: string;
  checkOut: Date;
  pricing: {
    totalAmount: number;
  };
  propertyId: PopulatedProperty;
  guestId: PopulatedGuest;
}

export interface EligibleEarningsData {
  totalEarnings: number;
  currency: CurrencyCode;
  bookingsCount: number;
  bookings: Array<{
    bookingId: string;
    propertyName: string;
    totalAmount: number;
    hostEarning: number;
    checkOutDate: Date;
    guestName: string;
  }>;
}

export interface AutoPayoutProcessingResult {
  processed: number;
  created: number;
  skipped: number;
  errors: string[];
}

export interface PayoutPreferencesResponse {
  frequency: PayoutFrequency;
  minimumAmount: number;
  preferredMethodId?: string;
  autoPayoutEnabled: boolean;
  lastAutoPayoutDate?: Date;
  nextScheduledPayout?: Date | null;
}

export interface PopulatedPayoutDocument extends PayoutDocument {
  payoutMethod?: PayoutMethodData;
  host?: {
    _id: Types.ObjectId;
    profile: {
      firstName: string;
      lastName: string;
    };
    email: string;
  };
  cancelledByUser?: {
    _id: Types.ObjectId;
    profile: {
      firstName: string;
      lastName: string;
    };
    email: string;
  };
}

export interface PopulatedBookingForEarnings extends BookingDocument {
  property?: {
    name: string;
  };
  guest?: {
    firstName: string;
    lastName: string;
  };
}
