/**
 * Base context for all email templates
 */
export interface BaseEmailTemplateContext
  extends Record<string, string | number | boolean | null | undefined> {
  title: string;
  body: string;
  actionUrl?: string;
  userName: string;
}

/**
 * Context for booking-related email templates
 */
export interface BookingEmailTemplateContext extends BaseEmailTemplateContext {
  guestName?: string;
  hostName?: string;
  propertyName?: string;
  checkInDate?: string;
  checkOutDate?: string;
  confirmationCode?: string;
  totalAmount?: number | string;
  currency?: string;
  reason?: string;
  recipientName?: string;
  senderName?: string;
}

/**
 * Context for review-related email templates
 */
export interface ReviewEmailTemplateContext extends BaseEmailTemplateContext {
  guestName?: string;
  hostName?: string;
  propertyName?: string;
  reviewText?: string;
  rating?: number | string;
}

/**
 * Email template configuration
 */
export interface EmailTemplateConfig {
  templateName: string;
  context: BaseEmailTemplateContext | BookingEmailTemplateContext | ReviewEmailTemplateContext;
}
