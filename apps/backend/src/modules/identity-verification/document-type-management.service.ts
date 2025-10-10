import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DocumentTypeConfig,
  DocumentTypeConfigDocument,
} from '../../database/schemas/document-type-config.schema';
import { DocumentType } from '../../database/schemas/identity-verification.schema';
import {
  UpdateDocumentTypeConfigDto,
  DocumentRequirementsDto,
} from './dto/update-document-type-config.dto';
import { DOCUMENT_TYPE_CONFIG } from '../../common/enums/identity-verification.enums';
import { DateUtils } from '../../common/utils/date.utils';
import { LoggingUtil } from '../../common/utils/logging.util';

@Injectable()
export class DocumentTypeManagementService implements OnModuleInit {
  constructor(
    @InjectModel(DocumentTypeConfig.name)
    private readonly documentTypeConfigModel: Model<DocumentTypeConfigDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initializeDocumentTypes();
  }

  private async initializeDocumentTypes(): Promise<void> {
    LoggingUtil.log('Initializing document type configurations...');

    for (const [documentType, config] of Object.entries(DOCUMENT_TYPE_CONFIG)) {
      const existingConfig = await this.documentTypeConfigModel.findOne({ documentType }).exec();

      if (!existingConfig) {
        const newConfig = new this.documentTypeConfigModel({
          documentType,
          isEnabled: true,
          displayName: config.displayName,
          description: config.description,
          requiresBackImage: config.requiresBackImage,
          supportedCountries: config.supportedCountries,
          exampleImageUrl: config.exampleImageUrl,
          sortOrder: this.getDefaultSortOrder(documentType as DocumentType),
          isLebanonPriority: this.isLebanonPriority(documentType as DocumentType),
          requirements: this.getDefaultRequirements(documentType as DocumentType),
          lebanonSpecific: this.getLebanonSpecificConfig(documentType as DocumentType),
        });

        await newConfig.save();
        LoggingUtil.log(`Created configuration for document type: ${documentType}`);
      }
    }

    LoggingUtil.log('Document type configurations initialized successfully');
  }

  private getDefaultSortOrder(documentType: DocumentType): number {
    const sortOrder: Record<DocumentType, number> = {
      [DocumentType.NATIONAL_ID]: 1,
      [DocumentType.PASSPORT]: 2,
      [DocumentType.DRIVERS_LICENSE]: 3,
      [DocumentType.RESIDENCE_PERMIT]: 4,
    };
    return sortOrder[documentType] || 10;
  }

  private isLebanonPriority(documentType: DocumentType): boolean {
    return [
      DocumentType.NATIONAL_ID,
      DocumentType.PASSPORT,
      DocumentType.DRIVERS_LICENSE,
      DocumentType.RESIDENCE_PERMIT,
    ].includes(documentType);
  }

  private getDefaultRequirements(documentType: DocumentType): DocumentRequirementsDto & {
    documentFront: Required<NonNullable<DocumentRequirementsDto['documentFront']>>;
    documentBack: Required<NonNullable<DocumentRequirementsDto['documentBack']>>;
    selfie: Required<NonNullable<DocumentRequirementsDto['selfie']>>;
    proofOfAddress: Required<NonNullable<DocumentRequirementsDto['proofOfAddress']>>;
  } {
    const baseRequirements = {
      documentFront: {
        required: true,
        maxFileSize: 10485760, // 10MB
        acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        description: 'Clear photo of the front of your document',
        guidelines: [
          'Take photo in good lighting',
          'Ensure all text is clearly readable',
          'Avoid glare and shadows',
          'Include all corners of the document',
        ],
      },
      documentBack: {
        required: false,
        maxFileSize: 10485760,
        acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        description: 'Clear photo of the back of your document',
        guidelines: [
          'Include all information on the back',
          'Ensure signature is visible if present',
        ],
      },
      selfie: {
        required: false,
        maxFileSize: 5242880, // 5MB
        acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        description: 'Photo of yourself holding the document',
        guidelines: [
          'Hold document clearly visible next to your face',
          'Ensure both you and the document are in focus',
          'Use good lighting for both face and document',
        ],
      },
      proofOfAddress: {
        required: false,
        maxFileSize: 10485760,
        acceptedFormats: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        description: 'Recent utility bill or bank statement',
        guidelines: [
          'Document must be less than 3 months old',
          'Your name and address must be clearly visible',
          'Accepted: utility bills, bank statements, tax documents',
        ],
      },
      processingTime: '1-3 business days',
      generalGuidelines: [
        'All documents must be valid and not expired',
        'Photos should be high quality and clearly readable',
        'Avoid shadows, glare, or blurry images',
      ],
    };

    // Customize based on document type
    if (documentType === DocumentType.NATIONAL_ID) {
      baseRequirements.documentBack.required = true;
      baseRequirements.documentBack.description = 'Back side of your national ID card';
      if (documentType === DocumentType.NATIONAL_ID) {
        baseRequirements.generalGuidelines.push(
          'For Lebanese ID cards, ensure both Arabic and French text are visible',
          'Include the official stamps and signatures',
        );
      }
    }

    if (documentType === DocumentType.PASSPORT) {
      baseRequirements.documentBack.required = false;
      baseRequirements.documentBack.description = 'Not required for passports';
      baseRequirements.generalGuidelines.push(
        'Photo page with personal information must be clearly visible',
      );
    }

    if (documentType === DocumentType.DRIVERS_LICENSE) {
      baseRequirements.documentBack.required = true;
      baseRequirements.generalGuidelines.push(
        'Ensure license is not expired and all restrictions are visible',
      );
    }

    if (documentType === DocumentType.RESIDENCE_PERMIT) {
      baseRequirements.documentBack.required = true;
      baseRequirements.proofOfAddress.required = true;
      baseRequirements.generalGuidelines.push(
        'Residence permit must be currently valid',
        'Proof of address helps verify current residence status',
      );
    }

    return baseRequirements;
  }

  private getLebanonSpecificConfig(documentType: DocumentType): {
    enabled: boolean;
    requiredFields: string[];
    guidelines: string[];
  } {
    if (documentType === DocumentType.NATIONAL_ID) {
      return {
        enabled: true,
        requiredFields: ['qaidNumber', 'municipalityCode'],
        guidelines: [
          'Provide Lebanese civil registry number (Qaid number) if available',
          'Include municipality code for faster processing',
          'Specify citizenship or residency status',
        ],
      };
    }

    if (documentType === DocumentType.RESIDENCE_PERMIT) {
      return {
        enabled: true,
        requiredFields: ['residencyStatus'],
        guidelines: ['Specify your residency status in Lebanon', 'Include expiration date clearly'],
      };
    }

    return {
      enabled: false,
      requiredFields: [],
      guidelines: [],
    };
  }

  async getAllDocumentTypes(): Promise<DocumentTypeConfigDocument[]> {
    return this.documentTypeConfigModel.find().sort({ isLebanonPriority: -1, sortOrder: 1 }).exec();
  }

  async getEnabledDocumentTypes(): Promise<DocumentTypeConfigDocument[]> {
    return this.documentTypeConfigModel
      .find({ isEnabled: true })
      .sort({ isLebanonPriority: -1, sortOrder: 1 })
      .exec();
  }

  async getDocumentTypeConfig(documentType: string): Promise<DocumentTypeConfigDocument> {
    const config = await this.documentTypeConfigModel.findOne({ documentType }).exec();
    if (!config) {
      throw new NotFoundException(`Document type configuration not found: ${documentType}`);
    }
    return config;
  }

  async updateDocumentTypeConfig(
    documentType: string,
    updateDto: UpdateDocumentTypeConfigDto,
  ): Promise<DocumentTypeConfigDocument> {
    const config = await this.getDocumentTypeConfig(documentType);

    // Update fields
    if (updateDto.isEnabled !== undefined) {
      config.isEnabled = updateDto.isEnabled;
      if (!updateDto.isEnabled && updateDto.disabledReason) {
        config.disabledReason = updateDto.disabledReason;
        config.disabledAt = DateUtils.now();
      }
    }

    if (updateDto.displayName) config.displayName = updateDto.displayName;
    if (updateDto.description) config.description = updateDto.description;
    if (updateDto.requiresBackImage !== undefined) {
      config.requiresBackImage = updateDto.requiresBackImage;
    }
    if (updateDto.supportedCountries) config.supportedCountries = updateDto.supportedCountries;
    if (updateDto.exampleImageUrl !== undefined) config.exampleImageUrl = updateDto.exampleImageUrl;
    if (updateDto.sortOrder !== undefined) config.sortOrder = updateDto.sortOrder;
    if (updateDto.isLebanonPriority !== undefined) {
      config.isLebanonPriority = updateDto.isLebanonPriority;
    }
    if (updateDto.notes !== undefined) config.notes = updateDto.notes;

    // Update requirements
    if (updateDto.requirements) {
      // Merge each requirement section individually to maintain structure
      if (updateDto.requirements.documentFront) {
        config.requirements.documentFront = {
          ...config.requirements.documentFront,
          ...updateDto.requirements.documentFront,
        };
      }
      if (updateDto.requirements.documentBack) {
        config.requirements.documentBack = {
          ...config.requirements.documentBack,
          ...updateDto.requirements.documentBack,
        };
      }
      if (updateDto.requirements.selfie) {
        config.requirements.selfie = {
          ...config.requirements.selfie,
          ...updateDto.requirements.selfie,
        };
      }
      if (updateDto.requirements.proofOfAddress) {
        config.requirements.proofOfAddress = {
          ...config.requirements.proofOfAddress,
          ...updateDto.requirements.proofOfAddress,
        };
      }
      if (updateDto.requirements.processingTime !== undefined) {
        config.requirements.processingTime = updateDto.requirements.processingTime;
      }
      if (updateDto.requirements.generalGuidelines !== undefined) {
        config.requirements.generalGuidelines = updateDto.requirements.generalGuidelines;
      }
    }

    // Update Lebanon-specific config
    if (updateDto.lebanonSpecific) {
      if (!config.lebanonSpecific) {
        config.lebanonSpecific = {
          enabled: false,
          requiredFields: [],
          guidelines: [],
        };
      }
      if (updateDto.lebanonSpecific.enabled !== undefined) {
        config.lebanonSpecific.enabled = updateDto.lebanonSpecific.enabled;
      }
      if (updateDto.lebanonSpecific.requiredFields !== undefined) {
        config.lebanonSpecific.requiredFields = updateDto.lebanonSpecific.requiredFields;
      }
      if (updateDto.lebanonSpecific.guidelines !== undefined) {
        config.lebanonSpecific.guidelines = updateDto.lebanonSpecific.guidelines;
      }
    }

    return config.save();
  }

  async updateDocumentRequirements(
    documentType: string,
    requirements: DocumentRequirementsDto,
    adminId: string,
  ): Promise<DocumentTypeConfigDocument> {
    const config = await this.getDocumentTypeConfig(documentType);

    // Deep merge requirements
    if (requirements.documentFront) {
      config.requirements.documentFront = {
        ...config.requirements.documentFront,
        ...requirements.documentFront,
      };
    }

    if (requirements.documentBack) {
      config.requirements.documentBack = {
        ...config.requirements.documentBack,
        ...requirements.documentBack,
      };
    }

    if (requirements.selfie) {
      config.requirements.selfie = {
        ...config.requirements.selfie,
        ...requirements.selfie,
      };
    }

    if (requirements.proofOfAddress) {
      config.requirements.proofOfAddress = {
        ...config.requirements.proofOfAddress,
        ...requirements.proofOfAddress,
      };
    }

    if (requirements.processingTime !== undefined) {
      config.requirements.processingTime = requirements.processingTime;
    }

    if (requirements.generalGuidelines !== undefined) {
      config.requirements.generalGuidelines = requirements.generalGuidelines;
    }

    // Update requiresBackImage based on documentBack.required
    if (requirements.documentBack?.required !== undefined) {
      config.requiresBackImage = requirements.documentBack.required;
    }

    LoggingUtil.log(`Document requirements for ${documentType} updated by admin: ${adminId}`);
    return config.save();
  }

  async enableDocumentType(
    documentType: string,
    adminId: string,
  ): Promise<DocumentTypeConfigDocument> {
    const config = await this.getDocumentTypeConfig(documentType);

    if (config.isEnabled) {
      throw new BadRequestException(`Document type ${documentType} is already enabled`);
    }

    config.isEnabled = true;
    config.disabledReason = undefined;
    config.disabledAt = undefined;

    LoggingUtil.log(`Document type ${documentType} enabled by admin: ${adminId}`);
    return config.save();
  }

  async disableDocumentType(
    documentType: string,
    reason: string,
    adminId: string,
  ): Promise<DocumentTypeConfigDocument> {
    const config = await this.getDocumentTypeConfig(documentType);

    if (!config.isEnabled) {
      throw new BadRequestException(`Document type ${documentType} is already disabled`);
    }

    config.isEnabled = false;
    config.disabledReason = reason;
    config.disabledAt = DateUtils.now();

    LoggingUtil.log(
      `Document type ${documentType} disabled by admin: ${adminId}. Reason: ${reason}`,
    );
    return config.save();
  }

  async getLebanonPriorityDocumentTypes(): Promise<DocumentTypeConfigDocument[]> {
    return this.documentTypeConfigModel
      .find({ isLebanonPriority: true, isEnabled: true })
      .sort({ sortOrder: 1 })
      .exec();
  }

  async updateLebanonPriority(
    documentType: string,
    isPriority: boolean,
    adminId: string,
  ): Promise<DocumentTypeConfigDocument> {
    const config = await this.getDocumentTypeConfig(documentType);

    config.isLebanonPriority = isPriority;

    LoggingUtil.log(
      `Lebanon priority for ${documentType} ${isPriority ? 'enabled' : 'disabled'} by admin: ${adminId}`,
    );
    return config.save();
  }

  async getSupportedDocumentTypesForCountry(country?: string): Promise<DocumentType[]> {
    const query = { isEnabled: true };

    // If Lebanon is specified or no country provided, prioritize Lebanon
    const configs = await this.documentTypeConfigModel
      .find(query)
      .sort({
        isLebanonPriority: country === 'LB' || !country ? -1 : 1,
        sortOrder: 1,
      })
      .exec();

    return configs
      .filter((config) => {
        if (!country) return true;
        return (
          config.supportedCountries.includes('*') ||
          config.supportedCountries.includes(country.toUpperCase())
        );
      })
      .map((config) => config.documentType);
  }

  async getDocumentTypeRequirements(documentType: string): Promise<{
    documentType: string;
    displayName: string;
    description: string;
    requiresBackImage: boolean;
    supportedCountries: string[];
    isEnabled: boolean;
    requirements: Record<string, any> | undefined;
    lebanonSpecific: Record<string, any> | undefined;
    sortOrder: number;
    isLebanonPriority: boolean;
  }> {
    const config = await this.getDocumentTypeConfig(documentType);

    return {
      documentType: config.documentType,
      displayName: config.displayName,
      description: config.description,
      requiresBackImage: config.requiresBackImage,
      supportedCountries: config.supportedCountries,
      isEnabled: config.isEnabled,
      requirements: config.requirements,
      lebanonSpecific: config.lebanonSpecific,
      sortOrder: config.sortOrder,
      isLebanonPriority: config.isLebanonPriority,
    };
  }
}
