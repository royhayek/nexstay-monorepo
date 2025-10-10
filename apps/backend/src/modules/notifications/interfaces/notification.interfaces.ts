import { Types } from 'mongoose';

import {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
} from '../../../common/enums/notification.enums';
import { InvoiceTax, InvoiceLineItem } from '../../../common/interfaces/invoice.interfaces';

/**
 * Interface for invoice data used in notification helper service
 */
export interface InvoiceData {
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date;
  issueDate: Date;
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  items: InvoiceLineItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  taxes?: InvoiceTax[];
  notes?: string;
}

// InvoiceLineItem interface is now imported from common interfaces

// InvoiceTax interface is now imported from common interfaces

/**
 * Interface for email options used in invoice sending
 */
export interface InvoiceEmailOptions {
  to: string;
  subject: string;
  template: string;
  context: InvoiceEmailContext;
  attachments?: EmailAttachment[];
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

/**
 * Interface for invoice email template context
 */
export interface InvoiceEmailContext {
  recipientName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  paymentUrl?: string;
  companyName: string;
  companyLogo?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Interface for email attachments
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  cid?: string;
}

/**
 * Interface for notification template parameters
 */
export interface NotificationTemplateParams {
  recipientId?: string;
  hostId?: string;
  guestId?: string;
  userId?: string;
  senderId?: string;
  guestName?: string;
  hostName?: string;
  userName?: string;
  senderName?: string;
  reviewerName?: string;
  propertyName?: string;
  propertyId?: string;
  bookingId?: string;
  reviewId?: string;
  confirmationCode?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  amount?: number;
  currency?: string;
  rating?: number;
  reason?: string;
  activity?: string;
  location?: string;
}

/**
 * Interface for bulk notification data
 */
export interface BulkNotificationData {
  recipientIds: string[];
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
  priority?: NotificationPriority;
  scheduledFor?: Date;
}

/**
 * Interface for notification creation result
 */
export interface NotificationCreationResult {
  notification: {
    _id: Types.ObjectId;
    recipient_id: string;
    type: NotificationType;
    title: string;
    body: string;
    status: NotificationStatus;
    priority: NotificationPriority;
    created_at: Date;
  };
  success: boolean;
  error?: string;
}

/**
 * Interface for notification processing error
 */
export interface NotificationProcessingError extends Error {
  code?: string;
  statusCode?: number;
  details?: {
    recipientId?: string;
    notificationType?: NotificationType;
    context?: string;
  };
}

// Controller request interfaces
export interface DeviceTokenRequest {
  token: string;
}

// Notification preferences interfaces
export interface NotificationPreferences {
  pushEnabled?: boolean;
  marketingEnabled?: boolean;
  bookingNotifications?: boolean;
  reviewNotifications?: boolean;
  messageNotifications?: boolean;
  paymentNotifications?: boolean;
}

export interface PreferencesUpdateResult {
  preferences: NotificationPreferences;
  message: string;
}
