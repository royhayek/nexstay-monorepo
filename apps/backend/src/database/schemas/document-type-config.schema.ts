import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DocumentType } from './identity-verification.schema';

export type DocumentTypeConfigDocument = DocumentTypeConfig & Document;

@Schema({ timestamps: true, collection: 'document_type_configs' })
export class DocumentTypeConfig {
  @Prop({
    type: String,
    enum: DocumentType,
    required: true,
    unique: true,
    index: true,
  })
  documentType!: DocumentType;

  @Prop({ type: Boolean, default: true, index: true })
  isEnabled!: boolean;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ type: Boolean, default: false })
  requiresBackImage!: boolean;

  @Prop({ type: [String], default: [] })
  supportedCountries!: string[];

  @Prop({ required: false })
  exampleImageUrl?: string;

  @Prop({ type: Number, default: 0 })
  sortOrder!: number;

  @Prop({ type: Boolean, default: false })
  isLebanonPriority!: boolean;

  @Prop({
    type: {
      documentFront: {
        type: {
          required: { type: Boolean, default: true },
          maxFileSize: { type: Number, default: 10485760 }, // 10MB
          acceptedFormats: { type: [String], default: ['image/jpeg', 'image/png', 'image/webp'] },
          description: { type: String, default: 'Clear photo of the front of your document' },
          guidelines: { type: [String], default: [] },
        },
        default: () => ({
          required: true,
          maxFileSize: 10485760,
          acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
          description: 'Clear photo of the front of your document',
          guidelines: [],
        }),
      },
      documentBack: {
        type: {
          required: { type: Boolean, default: false },
          maxFileSize: { type: Number, default: 10485760 },
          acceptedFormats: { type: [String], default: ['image/jpeg', 'image/png', 'image/webp'] },
          description: { type: String, default: 'Clear photo of the back of your document' },
          guidelines: { type: [String], default: [] },
        },
        default: () => ({
          required: false,
          maxFileSize: 10485760,
          acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
          description: 'Clear photo of the back of your document',
          guidelines: [],
        }),
      },
      selfie: {
        type: {
          required: { type: Boolean, default: false },
          maxFileSize: { type: Number, default: 5242880 }, // 5MB
          acceptedFormats: { type: [String], default: ['image/jpeg', 'image/png', 'image/webp'] },
          description: { type: String, default: 'Photo of yourself holding the document' },
          guidelines: { type: [String], default: [] },
        },
        default: () => ({
          required: false,
          maxFileSize: 5242880,
          acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
          description: 'Photo of yourself holding the document',
          guidelines: [],
        }),
      },
      proofOfAddress: {
        type: {
          required: { type: Boolean, default: false },
          maxFileSize: { type: Number, default: 10485760 },
          acceptedFormats: {
            type: [String],
            default: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
          },
          description: { type: String, default: 'Recent utility bill or bank statement' },
          guidelines: { type: [String], default: [] },
        },
        default: () => ({
          required: false,
          maxFileSize: 10485760,
          acceptedFormats: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
          description: 'Recent utility bill or bank statement',
          guidelines: [],
        }),
      },
      processingTime: { type: String, default: '1-3 business days' },
      generalGuidelines: { type: [String], default: [] },
    },
    default: () => ({
      documentFront: {
        required: true,
        maxFileSize: 10485760,
        acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        description: 'Clear photo of the front of your document',
        guidelines: [],
      },
      documentBack: {
        required: false,
        maxFileSize: 10485760,
        acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        description: 'Clear photo of the back of your document',
        guidelines: [],
      },
      selfie: {
        required: false,
        maxFileSize: 5242880,
        acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        description: 'Photo of yourself holding the document',
        guidelines: [],
      },
      proofOfAddress: {
        required: false,
        maxFileSize: 10485760,
        acceptedFormats: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        description: 'Recent utility bill or bank statement',
        guidelines: [],
      },
      processingTime: '1-3 business days',
      generalGuidelines: [],
    }),
  })
  requirements: {
    documentFront: {
      required: boolean;
      maxFileSize: number;
      acceptedFormats: string[];
      description: string;
      guidelines: string[];
    };
    documentBack: {
      required: boolean;
      maxFileSize: number;
      acceptedFormats: string[];
      description: string;
      guidelines: string[];
    };
    selfie: {
      required: boolean;
      maxFileSize: number;
      acceptedFormats: string[];
      description: string;
      guidelines: string[];
    };
    proofOfAddress: {
      required: boolean;
      maxFileSize: number;
      acceptedFormats: string[];
      description: string;
      guidelines: string[];
    };
    processingTime: string;
    generalGuidelines: string[];
  };

  @Prop({
    type: {
      enabled: { type: Boolean, default: false },
      requiredFields: { type: [String], default: [] },
      guidelines: { type: [String], default: [] },
    },
    required: false,
  })
  lebanonSpecific?: {
    enabled: boolean;
    requiredFields: string[];
    guidelines: string[];
  };

  @Prop({ required: false })
  disabledReason?: string;

  @Prop({ type: Date, required: false })
  disabledAt?: Date;

  @Prop({ required: false })
  notes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const DocumentTypeConfigSchema = SchemaFactory.createForClass(DocumentTypeConfig);

// Create indexes for efficient querying
DocumentTypeConfigSchema.index({ isEnabled: 1, sortOrder: 1 });
DocumentTypeConfigSchema.index({ isLebanonPriority: -1, sortOrder: 1 });
DocumentTypeConfigSchema.index({ supportedCountries: 1, isEnabled: 1 });
