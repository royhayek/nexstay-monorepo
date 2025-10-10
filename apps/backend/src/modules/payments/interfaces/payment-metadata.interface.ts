export interface PaymentMetadata {
  bookingId?: string;
  userId?: string;
  userEmail?: string;
  guestEmail?: string;
  confirmationCode?: string;
  description?: string;
  hostId?: string;
  propertyId?: string;
  checkInDate?: string;
  checkOutDate?: string;
  guestCount?: number;
  originalTransactionId?: string;
  refundReason?: string;
  approveUrl?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface RefundMetadata extends PaymentMetadata {
  originalTransactionId: string;
  refundReason: string;
}

export interface CreatePaymentIntentMetadata extends PaymentMetadata {
  userId: string;
  userEmail: string;
}

export interface UserContext {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}
