export enum VerificationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum DocumentType {
  PASSPORT = 'passport',
  NATIONAL_ID = 'national_id',
  DRIVERS_LICENSE = 'drivers_license',
  RESIDENCE_PERMIT = 'residence_permit',
}

export enum VerificationRejectionReason {
  DOCUMENT_UNCLEAR = 'document_unclear',
  DOCUMENT_EXPIRED = 'document_expired',
  DOCUMENT_INVALID = 'document_invalid',
  PERSONAL_INFO_MISMATCH = 'personal_info_mismatch',
  DOCUMENT_TAMPERED = 'document_tampered',
  UNSUPPORTED_DOCUMENT = 'unsupported_document',
  POOR_IMAGE_QUALITY = 'poor_image_quality',
  INCOMPLETE_SUBMISSION = 'incomplete_submission',
  FRAUDULENT_DOCUMENT = 'fraudulent_document',
  OTHER = 'other',
}

export interface VerificationStatusInfo {
  status: VerificationStatus;
  displayName: string;
  description: string;
  allowsResubmission: boolean;
  isTerminal: boolean;
}

export const VERIFICATION_STATUS_CONFIG: Record<VerificationStatus, VerificationStatusInfo> = {
  [VerificationStatus.PENDING]: {
    status: VerificationStatus.PENDING,
    displayName: 'Pending',
    description: 'Verification request is waiting to be processed',
    allowsResubmission: true,
    isTerminal: false,
  },
  [VerificationStatus.UNDER_REVIEW]: {
    status: VerificationStatus.UNDER_REVIEW,
    displayName: 'Under Review',
    description: 'Documents are currently being reviewed by our team',
    allowsResubmission: false,
    isTerminal: false,
  },
  [VerificationStatus.APPROVED]: {
    status: VerificationStatus.APPROVED,
    displayName: 'Approved',
    description: 'Identity verification has been successfully completed',
    allowsResubmission: false,
    isTerminal: true,
  },
  [VerificationStatus.REJECTED]: {
    status: VerificationStatus.REJECTED,
    displayName: 'Rejected',
    description: 'Verification request was rejected. You may resubmit with correct documents',
    allowsResubmission: true,
    isTerminal: true,
  },
  [VerificationStatus.EXPIRED]: {
    status: VerificationStatus.EXPIRED,
    displayName: 'Expired',
    description: 'Verification has expired and needs to be renewed',
    allowsResubmission: true,
    isTerminal: true,
  },
};

export interface DocumentTypeInfo {
  type: DocumentType;
  displayName: string;
  description: string;
  requiresBackImage: boolean;
  supportedCountries: string[];
  exampleImageUrl?: string;
}

export const DOCUMENT_TYPE_CONFIG: Record<DocumentType, DocumentTypeInfo> = {
  [DocumentType.PASSPORT]: {
    type: DocumentType.PASSPORT,
    displayName: 'Passport',
    description: 'Government-issued passport with photo and personal information',
    requiresBackImage: false,
    supportedCountries: ['*'], // Universal support
  },
  [DocumentType.NATIONAL_ID]: {
    type: DocumentType.NATIONAL_ID,
    displayName: 'National ID Card / Lebanese Identity Card',
    description:
      'Government-issued national identification card (Lebanese Identity Card for Lebanon residents)',
    requiresBackImage: true,
    supportedCountries: ['LB', 'US', 'CA', 'GB', 'FR', 'DE', 'IT', 'ES', 'AE', 'SA'], // Lebanon prioritized
  },
  [DocumentType.DRIVERS_LICENSE]: {
    type: DocumentType.DRIVERS_LICENSE,
    displayName: "Driver's License",
    description: 'Government-issued driving license with photo (Lebanese Driving License accepted)',
    requiresBackImage: true,
    supportedCountries: ['LB', 'US', 'CA', 'GB', 'AU', 'NZ'], // Lebanon added and prioritized
  },
  [DocumentType.RESIDENCE_PERMIT]: {
    type: DocumentType.RESIDENCE_PERMIT,
    displayName: 'Residence Permit / Lebanese Residence Card',
    description: 'Government-issued residence permit or Lebanese residence card for non-citizens',
    requiresBackImage: true,
    supportedCountries: ['LB', 'AE', 'SA', 'QA', 'KW', 'OM', 'BH', 'US', 'CA', 'GB', 'DE', 'FR'], // Lebanon prioritized
  },
};

export interface RejectionReasonInfo {
  reason: VerificationRejectionReason;
  displayName: string;
  description: string;
  userFriendlyMessage: string;
  severity: 'minor' | 'major' | 'critical';
}

export const REJECTION_REASON_CONFIG: Record<VerificationRejectionReason, RejectionReasonInfo> = {
  [VerificationRejectionReason.DOCUMENT_UNCLEAR]: {
    reason: VerificationRejectionReason.DOCUMENT_UNCLEAR,
    displayName: 'Unclear Document',
    description: 'Document image is blurry or unclear',
    userFriendlyMessage: 'Please take a clearer photo of your document in good lighting',
    severity: 'minor',
  },
  [VerificationRejectionReason.DOCUMENT_EXPIRED]: {
    reason: VerificationRejectionReason.DOCUMENT_EXPIRED,
    displayName: 'Expired Document',
    description: 'Submitted document has expired',
    userFriendlyMessage: 'Please submit a valid, non-expired document',
    severity: 'major',
  },
  [VerificationRejectionReason.DOCUMENT_INVALID]: {
    reason: VerificationRejectionReason.DOCUMENT_INVALID,
    displayName: 'Invalid Document',
    description: 'Document type is not accepted or appears to be invalid',
    userFriendlyMessage: 'Please submit a valid government-issued document',
    severity: 'major',
  },
  [VerificationRejectionReason.PERSONAL_INFO_MISMATCH]: {
    reason: VerificationRejectionReason.PERSONAL_INFO_MISMATCH,
    displayName: 'Information Mismatch',
    description: 'Personal information does not match document details',
    userFriendlyMessage: 'Ensure your profile information matches your document exactly',
    severity: 'major',
  },
  [VerificationRejectionReason.DOCUMENT_TAMPERED]: {
    reason: VerificationRejectionReason.DOCUMENT_TAMPERED,
    displayName: 'Document Tampered',
    description: 'Document appears to have been altered or tampered with',
    userFriendlyMessage: 'Please submit an original, unaltered document',
    severity: 'critical',
  },
  [VerificationRejectionReason.UNSUPPORTED_DOCUMENT]: {
    reason: VerificationRejectionReason.UNSUPPORTED_DOCUMENT,
    displayName: 'Unsupported Document',
    description: 'Document type is not supported in your region',
    userFriendlyMessage: 'Please choose from our supported document types',
    severity: 'major',
  },
  [VerificationRejectionReason.POOR_IMAGE_QUALITY]: {
    reason: VerificationRejectionReason.POOR_IMAGE_QUALITY,
    displayName: 'Poor Image Quality',
    description: 'Image quality is too low for verification',
    userFriendlyMessage: 'Please take a high-quality photo with good lighting and focus',
    severity: 'minor',
  },
  [VerificationRejectionReason.INCOMPLETE_SUBMISSION]: {
    reason: VerificationRejectionReason.INCOMPLETE_SUBMISSION,
    displayName: 'Incomplete Submission',
    description: 'Required documents or information are missing',
    userFriendlyMessage: 'Please submit all required documents and information',
    severity: 'minor',
  },
  [VerificationRejectionReason.FRAUDULENT_DOCUMENT]: {
    reason: VerificationRejectionReason.FRAUDULENT_DOCUMENT,
    displayName: 'Fraudulent Document',
    description: 'Document appears to be fraudulent or fake',
    userFriendlyMessage: 'Please contact support for assistance with your verification',
    severity: 'critical',
  },
  [VerificationRejectionReason.OTHER]: {
    reason: VerificationRejectionReason.OTHER,
    displayName: 'Other',
    description: 'Other verification issue',
    userFriendlyMessage: 'Please contact support for more information',
    severity: 'major',
  },
};

export function getVerificationStatusInfo(status: VerificationStatus): VerificationStatusInfo {
  return VERIFICATION_STATUS_CONFIG[status];
}

export function getDocumentTypeInfo(documentType: DocumentType): DocumentTypeInfo {
  return DOCUMENT_TYPE_CONFIG[documentType];
}

export function getRejectionReasonInfo(reason: VerificationRejectionReason): RejectionReasonInfo {
  return REJECTION_REASON_CONFIG[reason];
}

export function getSupportedDocumentTypes(country?: string): DocumentType[] {
  if (!country) {
    return Object.values(DocumentType);
  }

  return Object.values(DocumentType).filter((type) => {
    const config = DOCUMENT_TYPE_CONFIG[type];
    return config.supportedCountries.includes('*') || config.supportedCountries.includes(country);
  });
}

export function canResubmitVerification(status: VerificationStatus): boolean {
  return VERIFICATION_STATUS_CONFIG[status].allowsResubmission;
}

export function isTerminalStatus(status: VerificationStatus): boolean {
  return VERIFICATION_STATUS_CONFIG[status].isTerminal;
}
