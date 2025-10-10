import {
  VerificationStatus,
  DocumentType,
} from '../../../database/schemas/identity-verification.schema';

export interface IdentityVerificationFilters {
  status?: VerificationStatus;
  documentType?: DocumentType;
  issuingCountry?: string;
  userId?: string;
  reviewerId?: string;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface VerificationMetadata {
  ipAddress?: string;
  userAgent?: string;
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
  ocrResults?: {
    extractedText?: string;
    confidence?: number;
    fields?: Record<string, string>;
  };
  fraudDetection?: {
    riskScore?: number;
    flags?: string[];
    provider?: string;
  };
}

export interface VerificationStatusHistoryEntry {
  status: VerificationStatus;
  changedAt: Date;
  changedBy?: string;
  comment?: string;
  metadata?: Record<string, any>;
}

export interface VerificationUploadFiles {
  documentFront: Express.Multer.File;
  documentBack?: Express.Multer.File;
  selfie?: Express.Multer.File;
  proofOfAddress?: Express.Multer.File;
}

export interface VerificationStats {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  expired: number;
  averageProcessingTime: number;
}

export interface LebanonSpecificRequirements {
  isLebaneseCitizen: boolean;
  residencyStatus?: 'citizen' | 'resident' | 'temporary_visitor';
  municipalityCode?: string;
  qaidNumber?: string; // Lebanese civil registry number
  passportNumber?: string;
  idCardNumber?: string;
}
