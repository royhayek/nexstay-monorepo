import { BookingDocument } from '../../../database/schemas/booking.schema';
import { PaymentProvider } from '../../../common/enums/payment.enums';

export interface BookingPaymentMetadata {
  bookingId: string;
  propertyId: string;
  hostId: string;
  guestEmail: string;
  confirmationCode: string;
  description: string;
  checkIn: string;
  checkOut: string;
}

export interface PaymentSummaryResponse {
  paymentIntents: Array<{
    _id: string;
    amount: {
      amount: number;
      currency: string;
    };
    status: string;
    provider: PaymentProvider;
    metadata?: BookingPaymentMetadata;
    createdAt: Date;
    updatedAt: Date;
  }>;
  transactions: Array<{
    _id: string;
    amount: {
      amount: number;
      currency: string;
    };
    status: string;
    provider: PaymentProvider;
    metadata?: BookingPaymentMetadata;
    createdAt: Date;
    updatedAt: Date;
  }>;
  invoices: Array<{
    _id: string;
    invoiceNumber: string;
    status: string;
    pricing: {
      totalAmount: number;
      currency: string;
    };
    metadata: {
      bookingId: string;
      propertyId: string;
      confirmationCode: string;
    };
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export interface BusinessWorkflowResult {
  booking: BookingDocument;
  paymentIntent: {
    _id: string;
    amount: {
      amount: number;
      currency: string;
    };
    status: string;
    provider: PaymentProvider;
    clientSecret?: string;
    metadata?: BookingPaymentMetadata;
  };
  invoice: {
    _id: string;
    invoiceNumber: string;
    totalAmount: number;
    currency: string;
    dueDate: Date;
    status: string;
  };
  nextSteps: string[];
}

export interface PaymentSuccessResult {
  booking: BookingDocument;
  invoice: {
    _id: string;
    invoiceNumber: string;
    status: string;
  } | null;
  notifications: string[];
}

export interface PaymentFailureResult {
  booking: BookingDocument;
  nextSteps: string[];
}
