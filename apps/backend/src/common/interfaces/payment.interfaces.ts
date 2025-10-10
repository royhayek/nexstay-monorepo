import {
  PaymentProvider,
  PaymentMethodType,
  PaymentTransactionStatus,
  PaymentIntentStatus,
  CurrencyCode,
} from '../enums/payment.enums';

export interface PaymentAmount {
  amount: number;
  currency: CurrencyCode;
}

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  provider: PaymentProvider;
  details: Record<string, any>;
  isDefault?: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: PaymentAmount;
  status: PaymentIntentStatus;
  provider: PaymentProvider;
  metadata?: Record<string, any>;
  clientSecret?: string;
  providerIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentTransaction {
  id: string;
  paymentIntentId: string;
  amount: PaymentAmount;
  status: PaymentTransactionStatus;
  provider: PaymentProvider;
  providerTransactionId?: string;
  providerResponse?: Record<string, any>;
  failureReason?: string;
  refundAmount?: number;
  refundDate?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentIntentRequest {
  amount: PaymentAmount;
  provider: PaymentProvider;
  paymentMethodId?: string;
  customerId?: string;
  bookingId?: string;
  metadata?: Record<string, any>;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentProviderConfig {
  provider: PaymentProvider;
  isEnabled: boolean;
  config: Record<string, any>;
}

export interface PaymentProviderInterface {
  createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntent>;
  confirmPaymentIntent(
    intentId: string,
    paymentMethodId?: string,
    actualIntent?: PaymentIntent,
  ): Promise<PaymentIntent>;
  cancelPaymentIntent(intentId: string): Promise<PaymentIntent>;
  refundPayment(transactionId: string, amount?: number): Promise<PaymentTransaction>;
  getPaymentIntent(intentId: string): Promise<PaymentIntent>;
  getTransaction(transactionId: string): Promise<PaymentTransaction>;
  createCustomer(customerData: CreateCustomerRequest): Promise<PaymentCustomer>;
  attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<PaymentMethod>;
  detachPaymentMethod(paymentMethodId: string): Promise<void>;
  listCustomerPaymentMethods(customerId: string): Promise<PaymentMethod[]>;
}

export interface CreateCustomerRequest {
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, any>;
}

export interface PaymentCustomer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  provider: PaymentProvider;
  providerCustomerId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEvent {
  id: string;
  provider: PaymentProvider;
  eventType: string;
  data: Record<string, any>;
  signature?: string;
  createdAt: Date;
}

export interface PaymentProviderWebhookHandler {
  handleWebhook(event: WebhookEvent): Promise<void>;
  validateWebhookSignature(payload: string, signature: string): boolean;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface PaymentDashboardMetrics {
  totalRevenue: PaymentAmount;
  transactionCount: number;
  successRate: number;
  averageTransactionValue: PaymentAmount;
  refundRate: number;
  topPaymentMethods: Array<{
    type: PaymentMethodType;
    count: number;
    percentage: number;
  }>;
  providerMetrics: Array<{
    provider: PaymentProvider;
    transactionCount: number;
    successRate: number;
    revenue: PaymentAmount;
  }>;
}
