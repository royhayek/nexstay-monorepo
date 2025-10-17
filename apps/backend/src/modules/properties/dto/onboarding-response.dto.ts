import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { OnboardingProgressDataDto } from './onboarding-steps.dto';

/**
 * Response for onboarding progress (all steps)
 */
export class OnboardingProgressResponseDto extends BaseResponseDto<OnboardingProgressDataDto> {
  @ApiProperty({
    description: 'Onboarding progress data',
    type: OnboardingProgressDataDto,
  })
  declare data: OnboardingProgressDataDto;
}

/**
 * Response after completing a step
 */
export class OnboardingStepResponseDto extends BaseResponseDto<OnboardingProgressDataDto> {
  @ApiProperty({
    description: 'Updated onboarding progress',
    type: OnboardingProgressDataDto,
  })
  declare data: OnboardingProgressDataDto;
}

/**
 * Response data for completed onboarding
 */
export class OnboardingCompletionDataDto {
  @ApiProperty({ description: 'Onboarding ID', example: '507f1f77bcf86cd799439011' })
  onboardingId: string;

  @ApiProperty({ description: 'Created property ID', example: '507f1f77bcf86cd799439011' })
  propertyId: string;

  @ApiProperty({ description: 'Property name', example: 'Beautiful Downtown Apartment' })
  propertyName: string;

  @ApiProperty({ description: 'Completion timestamp', example: '2025-10-12T10:30:00Z' })
  completedAt: Date;

  @ApiProperty({
    description: 'Success message',
    example: 'Congratulations! Your property is now live.',
  })
  message: string;
}

/**
 * Response for completed onboarding
 */
export class OnboardingCompletionResponseDto extends BaseResponseDto<OnboardingCompletionDataDto> {
  @ApiProperty({
    description: 'Onboarding completion data',
    type: OnboardingCompletionDataDto,
  })
  declare data: OnboardingCompletionDataDto;
}
