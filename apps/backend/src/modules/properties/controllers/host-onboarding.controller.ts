import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { BaseController } from '../../../common/controllers/base.controller';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { UserDocument } from '../../../database/schemas/user.schema';
import { HostOnboardingService } from '../services/host-onboarding.service';
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
import {
  OnboardingProgressResponseDto,
  OnboardingStepResponseDto,
  OnboardingCompletionResponseDto,
  OnboardingCompletionDataDto,
} from '../dto/onboarding-response.dto';

/**
 * Host Onboarding Controller
 * Handles the multi-step onboarding flow for new hosts
 */
@Controller('app/onboarding')
@ApiTags('Host Onboarding')
export class HostOnboardingController extends BaseController {
  constructor(private readonly onboardingService: HostOnboardingService) {
    super();
  }

  @Get('progress')
  @ProtectedEndpoint(
    'Get onboarding progress',
    "Retrieve the authenticated host's current onboarding progress",
    OnboardingProgressResponseDto,
  )
  async getProgress(
    @CurrentUser() user: UserDocument,
  ): Promise<OnboardingProgressResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const progress = await this.onboardingService.getOnboardingProgress(String(user._id));
        return plainToInstance(OnboardingProgressDataDto, progress);
      },
      'Get onboarding progress',
      'Onboarding Progress',
      'Onboarding progress retrieved successfully',
      'Failed to retrieve onboarding progress',
    );
  }

  @Post('start')
  @ProtectedEndpoint(
    'Start onboarding',
    'Initialize the onboarding process for a new host',
    OnboardingProgressResponseDto,
  )
  async startOnboarding(
    @CurrentUser() user: UserDocument,
  ): Promise<OnboardingProgressResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const progress = await this.onboardingService.initializeOnboarding(String(user._id));
        return plainToInstance(OnboardingProgressDataDto, progress);
      },
      'Start onboarding',
      'Onboarding Started',
      'Onboarding initialized successfully',
      'Failed to start onboarding',
    );
  }

  @Post('step1')
  @ProtectedEndpoint(
    'Save step 1: Basic information',
    'Save property type, room type, name, and description',
    OnboardingStepResponseDto,
  )
  async saveStep1(
    @CurrentUser() user: UserDocument,
    @Body() dto: OnboardingStep1Dto,
  ): Promise<OnboardingStepResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const progress = await this.onboardingService.saveStep1(String(user._id), dto);
        return plainToInstance(OnboardingProgressDataDto, progress);
      },
      'Save onboarding step 1',
      'Step 1 Saved',
      'Basic information saved successfully',
      'Failed to save basic information',
    );
  }

  @Post('step2')
  @ProtectedEndpoint(
    'Save step 2: Location',
    'Save property address and geographical coordinates',
    OnboardingStepResponseDto,
  )
  async saveStep2(
    @CurrentUser() user: UserDocument,
    @Body() dto: OnboardingStep2Dto,
  ): Promise<OnboardingStepResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const progress = await this.onboardingService.saveStep2(String(user._id), dto);
        return plainToInstance(OnboardingProgressDataDto, progress);
      },
      'Save onboarding step 2',
      'Step 2 Saved',
      'Location information saved successfully',
      'Failed to save location information',
    );
  }

  @Post('step3')
  @ProtectedEndpoint(
    'Save step 3: Property details',
    'Save bedrooms, bathrooms, guests, and bed configuration',
    OnboardingStepResponseDto,
  )
  async saveStep3(
    @CurrentUser() user: UserDocument,
    @Body() dto: OnboardingStep3Dto,
  ): Promise<OnboardingStepResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const progress = await this.onboardingService.saveStep3(String(user._id), dto);
        return plainToInstance(OnboardingProgressDataDto, progress);
      },
      'Save onboarding step 3',
      'Step 3 Saved',
      'Property details saved successfully',
      'Failed to save property details',
    );
  }

  @Post('step4')
  @ProtectedEndpoint(
    'Save step 4: Amenities',
    'Save property amenities and features',
    OnboardingStepResponseDto,
  )
  async saveStep4(
    @CurrentUser() user: UserDocument,
    @Body() dto: OnboardingStep4Dto,
  ): Promise<OnboardingStepResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const progress = await this.onboardingService.saveStep4(String(user._id), dto);
        return plainToInstance(OnboardingProgressDataDto, progress);
      },
      'Save onboarding step 4',
      'Step 4 Saved',
      'Amenities saved successfully',
      'Failed to save amenities',
    );
  }

  @Post('step5')
  @ProtectedEndpoint(
    'Save step 5: Photos',
    'Upload property photos (minimum 5 required)',
    OnboardingStepResponseDto,
  )
  async saveStep5(
    @CurrentUser() user: UserDocument,
    @Body() dto: OnboardingStep5Dto,
  ): Promise<OnboardingStepResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const progress = await this.onboardingService.saveStep5(String(user._id), dto);
        return plainToInstance(OnboardingProgressDataDto, progress);
      },
      'Save onboarding step 5',
      'Step 5 Saved',
      'Photos saved successfully',
      'Failed to save photos',
    );
  }

  @Post('step6')
  @ProtectedEndpoint(
    'Save step 6: Pricing',
    'Save pricing information, discounts, and fees',
    OnboardingStepResponseDto,
  )
  async saveStep6(
    @CurrentUser() user: UserDocument,
    @Body() dto: OnboardingStep6Dto,
  ): Promise<OnboardingStepResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const progress = await this.onboardingService.saveStep6(String(user._id), dto);
        return plainToInstance(OnboardingProgressDataDto, progress);
      },
      'Save onboarding step 6',
      'Step 6 Saved',
      'Pricing information saved successfully',
      'Failed to save pricing information',
    );
  }

  @Post('step7')
  @ProtectedEndpoint(
    'Save step 7: Availability & rules',
    'Save booking rules, cancellation policy, house rules, and availability',
    OnboardingStepResponseDto,
  )
  async saveStep7(
    @CurrentUser() user: UserDocument,
    @Body() dto: OnboardingStep7Dto,
  ): Promise<OnboardingStepResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const progress = await this.onboardingService.saveStep7(String(user._id), dto);
        return plainToInstance(OnboardingProgressDataDto, progress);
      },
      'Save onboarding step 7',
      'Step 7 Saved',
      'Availability and rules saved successfully',
      'Failed to save availability and rules',
    );
  }

  @Post('complete')
  @ProtectedEndpoint(
    'Complete onboarding',
    'Finalize onboarding and publish the property listing',
    OnboardingCompletionResponseDto,
  )
  async completeOnboarding(
    @CurrentUser() user: UserDocument,
    @Body() dto: CompleteOnboardingDto,
  ): Promise<OnboardingCompletionResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const completion = await this.onboardingService.completeOnboarding(
          String(user._id),
          dto,
        );
        return plainToInstance(OnboardingCompletionDataDto, completion);
      },
      'Complete onboarding',
      'Property Published',
      'Congratulations! Your property is now live',
      'Failed to complete onboarding',
    );
  }
}
