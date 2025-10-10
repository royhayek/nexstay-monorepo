import { InvoiceStatus, CurrencyCode } from '../enums/payment.enums';

export interface InvoiceAddress {
  name: string;
  email: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
}

export interface InvoiceLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  total?: number; // Alternative to amount for backward compatibility
  taxRate?: number;
  metadata?: Record<string, any>;
}

export interface InvoiceTax {
  name: string;
  rate: number;
  amount: number;
}

export interface InvoiceDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  amount: number;
  description?: string;
}

export interface InvoicePricing {
  subtotal: number;
  discounts: InvoiceDiscount[];
  taxes: InvoiceTax[];
  totalAmount: number;
  currency: CurrencyCode;
}

export interface InvoicePaymentInfo {
  paymentIntentId?: string;
  transactionId?: string;
  paidAmount?: number;
  paidAt?: Date;
  paymentMethod?: string;
  paymentProvider?: string;
}

export interface InvoicePaymentData {
  paymentIntentId?: string;
  transactionId?: string;
  paidAmount?: number;
  paidAt?: Date;
  paymentMethod?: string;
  paymentProvider?: string;
  notes?: string;
}

export interface CreateInvoiceRequest {
  bookingId?: string;
  fromAddress: InvoiceAddress;
  toAddress: InvoiceAddress;
  lineItems: InvoiceLineItem[];
  taxes?: InvoiceTax[];
  discounts?: InvoiceDiscount[];
  notes?: string;
  dueDate?: Date;
  metadata?: Record<string, any>;
}

export interface UpdateInvoiceRequest {
  fromAddress?: InvoiceAddress;
  toAddress?: InvoiceAddress;
  lineItems?: InvoiceLineItem[];
  taxes?: InvoiceTax[];
  discounts?: InvoiceDiscount[];
  notes?: string;
  dueDate?: Date;
  status?: InvoiceStatus;
  metadata?: Record<string, any>;
}

export interface InvoiceSearchFilters {
  status?: InvoiceStatus;
  customerId?: string;
  bookingId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountFrom?: number;
  amountTo?: number;
  currency?: CurrencyCode;
  search?: string;
}

export interface InvoicePrintOptions {
  format: 'pdf' | 'html';
  template?: string;
  includePaymentInfo?: boolean;
  customFields?: Record<string, any>;
}

export interface InvoiceEmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  message?: string;
  attachPdf?: boolean;
  template?: string;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  htmlTemplate: string;
  cssStyles?: string;
  isDefault: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceMetrics {
  totalInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  overdueInvoices: number;
  averagePaymentTime: number;
  statusBreakdown: Array<{
    status: InvoiceStatus;
    count: number;
    percentage: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    invoiceCount: number;
  }>;
}

export interface AdminInvoiceFilters {
  status?: InvoiceStatus;
  currency?: CurrencyCode;
  customerId?: string;
  bookingId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  amountFrom?: number;
  amountTo?: number;
  emailSent?: boolean;
  overdueOnly?: boolean;
  sortBy?: 'createdAt' | 'dueDate' | 'totalAmount' | 'status' | 'invoiceNumber';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AdvancedInvoiceMetrics {
  totalInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  overdueInvoices: number;
  draftInvoices: number;
  cancelledInvoices: number;
  averagePaymentTime: number;
  collectionRate: number;
  statusBreakdown: Array<{
    status: InvoiceStatus;
    count: number;
    percentage: number;
    revenue: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    invoiceCount: number;
    averageValue: number;
  }>;
  currencyBreakdown: Array<{
    currency: CurrencyCode;
    count: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    customerEmail: string;
    invoiceCount: number;
    totalRevenue: number;
  }>;
}

export interface InvoiceSearchQuery {
  status?: InvoiceStatus | { $in: InvoiceStatus[] };
  customerId?: string;
  bookingId?: string;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
  dueDate?: {
    $gte?: Date;
    $lte?: Date;
    $lt?: Date;
  };
  'pricing.totalAmount'?: {
    $gte?: number;
    $lte?: number;
  };
  'pricing.currency'?: CurrencyCode;
  emailSent?: boolean;
  $or?: Array<{
    [key: string]: {
      $regex: string;
      $options: string;
    };
  }>;
}

export interface MetricsAggregationResult {
  _id: null;
  totalInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  overdueInvoices: number;
  draftInvoices: number;
  cancelledInvoices: number;
  averageAmount?: number;
  averagePaymentTime: number;
}

export interface StatusBreakdownResult {
  _id: InvoiceStatus;
  count: number;
  revenue: number;
}

export interface MonthlyRevenueResult {
  _id: {
    year: number;
    month: number;
  };
  revenue: number;
  invoiceCount: number;
  averageValue?: number;
}

export interface CurrencyBreakdownResult {
  _id: CurrencyCode;
  count: number;
  revenue: number;
}

export interface TopCustomerResult {
  _id: string;
  invoiceCount: number;
  totalRevenue: number;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface InvoicePaymentData {
  paidAmount?: number;
  paidAt?: Date;
  paymentMethod?: string;
  paymentProvider?: string;
  notes?: string;
}

export interface BulkSendRequest {
  invoiceIds: string[];
  emailOptions?: InvoiceEmailOptions;
  filters?: AdminInvoiceFilters;
}

export interface BulkSendResult {
  invoiceId: string;
  status: string;
  error?: string;
}

export interface InvoiceCSVRow {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  status: string;
  createdDate: string;
  dueDate: string;
  paidDate: string;
  bookingId: string;
  notes: string;
}
