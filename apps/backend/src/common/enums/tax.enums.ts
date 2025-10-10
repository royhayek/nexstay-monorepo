export enum TaxType {
  VAT = 'vat',
  GST = 'gst',
  SALES_TAX = 'sales_tax',
  OCCUPANCY_TAX = 'occupancy_tax',
  TOURISM_TAX = 'tourism_tax',
  CITY_TAX = 'city_tax',
  SERVICE_TAX = 'service_tax',
  WITHHOLDING_TAX = 'withholding_tax',
}

export enum TaxCalculationMethod {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  PROGRESSIVE = 'progressive',
  PER_NIGHT = 'per_night',
  PER_GUEST = 'per_guest',
}

export enum TaxApplicability {
  GUEST_PAID = 'guest_paid',
  HOST_PAID = 'host_paid',
  PLATFORM_PAID = 'platform_paid',
  SHARED = 'shared',
}

export enum TaxStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  PENDING_APPROVAL = 'pending_approval',
}

export enum TaxReportingPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  WEEKLY = 'weekly',
  DAILY = 'daily',
}

export enum TaxComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PENDING_REVIEW = 'pending_review',
  EXEMPTED = 'exempted',
}

export enum TaxExemptionType {
  BUSINESS_TRAVEL = 'business_travel',
  LONG_TERM_STAY = 'long_term_stay',
  DISABLED_ACCESS = 'disabled_access',
  GOVERNMENT_OFFICIAL = 'government_official',
  DIPLOMATIC = 'diplomatic',
  STUDENT = 'student',
  NON_PROFIT = 'non_profit',
  MILITARY = 'military',
}

export enum TaxJurisdictionLevel {
  COUNTRY = 'country',
  STATE = 'state',
  PROVINCE = 'province',
  CITY = 'city',
  COUNTY = 'county',
  DISTRICT = 'district',
  MUNICIPALITY = 'municipality',
}
