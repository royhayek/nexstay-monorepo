import {
  TaxType,
  TaxApplicability,
  TaxCalculationMethod,
  TaxExemptionType,
} from '../../../common/enums/tax.enums';

export interface TaxCalculationRequest {
  propertyId: string;
  guestId: string;
  hostId: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  subtotalAmount: number;
  currency: string;
  propertyLocation: {
    address: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  exemptionDetails?: {
    exemptionType?: TaxExemptionType;
    exemptionCertificate?: string;
    businessTaxId?: string;
  };
}

export interface TaxCalculationResult {
  subtotalAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  currency: string;
  taxBreakdown: TaxBreakdownItem[];
  exemptionSummary?: {
    totalExemptedAmount: number;
    exemptedTaxes: string[];
  };
}

export interface TaxBreakdownItem {
  taxRateId: string;
  jurisdictionId: string;
  taxType: TaxType;
  taxName: string;
  applicability: TaxApplicability;
  calculationMethod: TaxCalculationMethod;
  baseAmount: number;
  rate: number;
  taxAmount: number;
  isExempted: boolean;
  exemptionReason?: string;
  metadata?: Record<string, any>;
}

export interface TaxRateQuery {
  propertyLocation: {
    country: string;
    state?: string;
    city?: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  bookingDate: Date;
  propertyType?: string;
  stayDuration: number;
  bookingAmount: number;
}

export interface ApplicableTaxRate {
  id: string;
  jurisdictionId: string;
  type: TaxType;
  name: string;
  calculationMethod: TaxCalculationMethod;
  rate: number;
  applicability: TaxApplicability;
  minimumAmount?: number;
  maximumAmount?: number;
  fixedAmount?: number;
  progressiveRates?: Array<{
    from: number;
    to?: number;
    rate: number;
    fixedAmount?: number;
  }>;
  priority: number;
}

export interface TaxExemptionCheck {
  propertyId: string;
  guestId: string;
  hostId: string;
  exemptionType?: TaxExemptionType;
  exemptionCertificate?: string;
  businessTaxId?: string;
  stayDuration: number;
  bookingAmount: number;
}

export interface TaxExemptionResult {
  isExempted: boolean;
  exemptedTaxTypes: TaxType[];
  exemptionAmount: number;
  exemptionReason?: string;
  validationDetails?: Record<string, any>;
}
