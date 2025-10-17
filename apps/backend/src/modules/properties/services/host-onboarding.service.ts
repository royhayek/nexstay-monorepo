import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HostOnboarding,
  HostOnboardingDocument,
  OnboardingStep,
} from '../../../database/schemas/host-onboarding.schema';
import { Property, PropertyDocument } from '../../../database/schemas/property.schema';
import { User, UserDocument } from '../../../database/schemas/user.schema';
import {
  OnboardingStep1Dto,
  OnboardingStep2Dto,
  OnboardingStep3Dto,
  OnboardingStep4Dto,
  OnboardingStep5Dto,
  OnboardingStep6Dto,
  OnboardingStep7Dto,
  OnboardingProgressDataDto,
  CompleteOnboardingDto,
} from '../dto/onboarding-steps.dto';
import { OnboardingCompletionDataDto } from '../dto/onboarding-response.dto';
import { CreatePropertyDto } from '../dto/create-property.dto';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { DateUtils } from '../../../common/utils/date.utils';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { PropertyStatus } from '../../../common/enums/property.enums';
import { NotificationHelperService } from '../../../modules/notifications/helpers/notification-helper.service';

/**
 * Host Onboarding Service
 * Manages the multi-step onboarding flow for new hosts creating their first listing
 */
@Injectable()
export class HostOnboardingService {
  constructor(
    @InjectModel(HostOnboarding.name)
    private readonly onboardingModel: Model<HostOnboardingDocument>,
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly notificationHelperService: NotificationHelperService,
  ) {}

  /**
   * Initialize or get existing onboarding for a user
   */
  async initializeOnboarding(userId: string): Promise<OnboardingProgressDataDto> {
    ValidationUtils.validateObjectId(userId, 'userId', {
      context: 'HostOnboardingService',
    });

    try {
      // Check if user already has an active (incomplete) onboarding
      let onboarding = await this.onboardingModel
        .findOne({ userId, isCompleted: false })
        .sort({ createdAt: -1 })
        .exec();

      if (!onboarding) {
        // Create new onboarding
        onboarding = await this.onboardingModel.create({
          userId,
          currentStep: OnboardingStep.BASIC_INFO,
          completedSteps: [],
          isCompleted: false,
        });

        LoggingUtil.log(`Onboarding initialized for user ${userId}`, 'HostOnboardingService');
      }

      return this.mapToProgressDto(onboarding);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error initializing onboarding for user ${userId}`,
        error,
        'HostOnboardingService',
      );
      throw error;
    }
  }

  /**
   * Get current onboarding progress for a user
   */
  async getOnboardingProgress(userId: string): Promise<OnboardingProgressDataDto> {
    ValidationUtils.validateObjectId(userId, 'userId', {
      context: 'HostOnboardingService',
    });

    try {
      const onboarding = await this.onboardingModel
        .findOne({ userId, isCompleted: false })
        .sort({ createdAt: -1 })
        .exec();

      if (!onboarding) {
        // Initialize new onboarding if none exists
        return await this.initializeOnboarding(userId);
      }

      return this.mapToProgressDto(onboarding);
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error getting onboarding progress for user ${userId}`,
        error,
        'HostOnboardingService',
      );
      throw error;
    }
  }

  /**
   * Save Step 1: Basic Information
   */
  async saveStep1(userId: string, dto: OnboardingStep1Dto): Promise<OnboardingProgressDataDto> {
    return this.saveStep(
      userId,
      OnboardingStep.BASIC_INFO,
      'basicInfo',
      dto,
      OnboardingStep.LOCATION,
    );
  }

  /**
   * Save Step 2: Location & Address
   */
  async saveStep2(userId: string, dto: OnboardingStep2Dto): Promise<OnboardingProgressDataDto> {
    return this.saveStep(
      userId,
      OnboardingStep.LOCATION,
      'location',
      dto,
      OnboardingStep.PROPERTY_DETAILS,
    );
  }

  /**
   * Save Step 3: Property Details
   */
  async saveStep3(userId: string, dto: OnboardingStep3Dto): Promise<OnboardingProgressDataDto> {
    return this.saveStep(
      userId,
      OnboardingStep.PROPERTY_DETAILS,
      'propertyDetails',
      dto,
      OnboardingStep.AMENITIES,
    );
  }

  /**
   * Save Step 4: Amenities & Features
   */
  async saveStep4(userId: string, dto: OnboardingStep4Dto): Promise<OnboardingProgressDataDto> {
    return this.saveStep(userId, OnboardingStep.AMENITIES, 'amenities', dto, OnboardingStep.PHOTOS);
  }

  /**
   * Save Step 5: Photos
   */
  async saveStep5(userId: string, dto: OnboardingStep5Dto): Promise<OnboardingProgressDataDto> {
    // Validate minimum 5 photos
    if (!dto.images || dto.images.length < 5) {
      throw new BadRequestException('At least 5 photos are required for your listing');
    }

    return this.saveStep(
      userId,
      OnboardingStep.PHOTOS,
      'photos',
      dto.images,
      OnboardingStep.PRICING,
    );
  }

  /**
   * Save Step 6: Pricing
   */
  async saveStep6(userId: string, dto: OnboardingStep6Dto): Promise<OnboardingProgressDataDto> {
    return this.saveStep(
      userId,
      OnboardingStep.PRICING,
      'pricing',
      dto,
      OnboardingStep.AVAILABILITY_RULES,
    );
  }

  /**
   * Save Step 7: Availability & Rules
   */
  async saveStep7(userId: string, dto: OnboardingStep7Dto): Promise<OnboardingProgressDataDto> {
    return this.saveStep(
      userId,
      OnboardingStep.AVAILABILITY_RULES,
      'availabilityRules',
      dto,
      OnboardingStep.AVAILABILITY_RULES, // Last step stays on same step
    );
  }

  /**
   * Complete onboarding and create the property
   */
  async completeOnboarding(
    userId: string,
    dto: CompleteOnboardingDto,
  ): Promise<OnboardingCompletionDataDto> {
    ValidationUtils.validateObjectId(userId, 'userId', {
      context: 'HostOnboardingService',
    });

    if (!dto.confirmAndPublish) {
      throw new BadRequestException('Please confirm to publish your listing');
    }

    try {
      // Get onboarding progress
      const onboarding = await this.onboardingModel.findOne({ userId, isCompleted: false }).exec();

      if (!onboarding) {
        throw new NotFoundException('No active onboarding found');
      }

      // Validate all steps are completed
      const requiredSteps = [
        OnboardingStep.BASIC_INFO,
        OnboardingStep.LOCATION,
        OnboardingStep.PROPERTY_DETAILS,
        OnboardingStep.AMENITIES,
        OnboardingStep.PHOTOS,
        OnboardingStep.PRICING,
        OnboardingStep.AVAILABILITY_RULES,
      ];

      const missingSteps = requiredSteps.filter(
        (step) => !onboarding.completedSteps.includes(step),
      );

      if (missingSteps.length > 0) {
        throw new BadRequestException(
          `Please complete all onboarding steps. Missing: ${missingSteps.join(', ')}`,
        );
      }

      // Validate minimum photos
      if (!onboarding.photos || onboarding.photos.length < 5) {
        throw new BadRequestException('At least 5 photos are required for your listing');
      }

      // Build complete property DTO from onboarding data
      const propertyDto = this.buildPropertyDto(onboarding);

      // Create the property
      const property = await this.propertyModel.create({
        ...propertyDto,
        hostId: userId,
        status: PropertyStatus.PUBLISHED,
        isPublished: true,
        publishedAt: DateUtils.now(),
        createdAt: DateUtils.now(),
        updatedAt: DateUtils.now(),
      });

      // Mark onboarding as completed
      onboarding.isCompleted = true;
      onboarding.completedAt = DateUtils.now();
      onboarding.createdPropertyId = property._id as any;
      onboarding.currentStep = OnboardingStep.COMPLETED;
      await onboarding.save();

      LoggingUtil.log(
        `Onboarding completed for user ${userId}, property ${String(property._id)} created`,
        'HostOnboardingService',
      );

      // Send congratulations email (non-blocking)
      try {
        const host = await this.userModel.findById(userId).exec();
        if (host) {
          await this.notificationHelperService.sendFirstListingCongratulations(property, host);
          LoggingUtil.log(
            `Congratulations email sent for first listing ${String(property._id)}`,
            'HostOnboardingService',
          );
        }
      } catch (emailError) {
        // Don't fail the onboarding if email fails
        LoggingUtil.errorWithException(
          `Failed to send congratulations email for property ${String(property._id)}`,
          emailError,
          'HostOnboardingService',
        );
      }

      return {
        onboardingId: String(onboarding._id),
        propertyId: String(property._id),
        propertyName: property.name,
        completedAt: onboarding.completedAt,
        message: 'Congratulations! Your property is now live and accepting bookings.',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Error completing onboarding for user ${userId}`,
        error,
        'HostOnboardingService',
      );
      throw new BadRequestException('Failed to complete onboarding');
    }
  }

  /**
   * Generic method to save a step
   */
  private async saveStep(
    userId: string,
    currentStep: OnboardingStep,
    fieldName: string,
    data: any,
    nextStep: OnboardingStep,
  ): Promise<OnboardingProgressDataDto> {
    ValidationUtils.validateObjectId(userId, 'userId', {
      context: 'HostOnboardingService',
    });

    try {
      const onboarding = await this.onboardingModel.findOne({ userId, isCompleted: false }).exec();

      if (!onboarding) {
        throw new NotFoundException('No active onboarding found. Please start onboarding first.');
      }

      // Update the step data
      onboarding[fieldName] = data;

      // Mark step as completed if not already
      if (!onboarding.completedSteps.includes(currentStep)) {
        onboarding.completedSteps.push(currentStep);
      }

      // Update current step to next step
      onboarding.currentStep = nextStep;
      onboarding.updatedAt = DateUtils.now();

      await onboarding.save();

      LoggingUtil.log(
        `Step ${currentStep} saved for user ${userId}, next step: ${nextStep}`,
        'HostOnboardingService',
      );

      return this.mapToProgressDto(onboarding);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      LoggingUtil.errorWithException(
        `Error saving step ${currentStep} for user ${userId}`,
        error,
        'HostOnboardingService',
      );
      throw new BadRequestException(`Failed to save ${currentStep}`);
    }
  }

  /**
   * Build complete CreatePropertyDto from onboarding data
   */
  private buildPropertyDto(onboarding: HostOnboardingDocument): CreatePropertyDto {
    const basicInfo = onboarding.basicInfo as OnboardingStep1Dto;
    const location = onboarding.location as OnboardingStep2Dto;
    const propertyDetails = onboarding.propertyDetails as OnboardingStep3Dto;
    const amenities = onboarding.amenities as OnboardingStep4Dto;
    const pricing = onboarding.pricing as OnboardingStep6Dto;
    const availabilityRules = onboarding.availabilityRules as OnboardingStep7Dto;

    return {
      // Basic info
      name: basicInfo.name,
      description: basicInfo.description,
      summary: basicInfo.summary,
      propertyType: basicInfo.propertyType,
      roomType: basicInfo.roomType,

      // Location
      address: location.address,
      coordinates: location.coordinates,
      location: location.location,
      neighborhoodOverview: location.neighborhoodOverview,
      transit: location.transit,

      // Property details
      accommodates: propertyDetails.accommodates,
      bedrooms: propertyDetails.bedrooms,
      beds: propertyDetails.beds,
      bathrooms: propertyDetails.bathrooms,
      bedType: propertyDetails.bedType,
      space: propertyDetails.space,

      // Amenities
      amenities: amenities.amenities,
      features: amenities.features,

      // Photos
      images: onboarding.photos,

      // Pricing
      price: pricing.price,

      // Availability & Rules
      minimumNights: availabilityRules.minimumNights,
      maximumNights: availabilityRules.maximumNights,
      cancellationPolicy: availabilityRules.cancellationPolicy,
      houseRules: availabilityRules.houseRules,
      access: availabilityRules.access,
      interaction: availabilityRules.interaction,
      notes: availabilityRules.notes,
      instantBookable: availabilityRules.instantBookable,
      isBusinessTravelReady: availabilityRules.isBusinessTravelReady,
      requireGuestProfilePicture: availabilityRules.requireGuestProfilePicture,
      requireGuestPhoneVerification: availabilityRules.requireGuestPhoneVerification,
      availability: availabilityRules.availability,
    };
  }

  /**
   * Map onboarding document to DTO
   */
  private mapToProgressDto(onboarding: HostOnboardingDocument): OnboardingProgressDataDto {
    return {
      id: String(onboarding._id),
      currentStep: onboarding.currentStep,
      completedSteps: onboarding.completedSteps,
      isCompleted: onboarding.isCompleted,
      savedData: {
        basicInfo: onboarding.basicInfo as OnboardingStep1Dto,
        location: onboarding.location as OnboardingStep2Dto,
        propertyDetails: onboarding.propertyDetails as OnboardingStep3Dto,
        amenities: onboarding.amenities as OnboardingStep4Dto,
        photos: onboarding.photos
          ? ({ images: onboarding.photos } as OnboardingStep5Dto)
          : undefined,
        pricing: onboarding.pricing as OnboardingStep6Dto,
        availabilityRules: onboarding.availabilityRules as OnboardingStep7Dto,
      },
      createdPropertyId: onboarding.createdPropertyId
        ? String(onboarding.createdPropertyId)
        : undefined,
    };
  }
}
