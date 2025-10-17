import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { createResponseDto } from '../../../common/dto/base-response.dto';

/**
 * DTO for host application submission - All fields optional for direct host access
 */
export class BecomeHostApplicationDto {
  @ApiProperty({
    description: 'Motivation for becoming a host (optional)',
    example: 'I want to share my beautiful home and earn extra income.',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Motivation cannot exceed 1000 characters' })
  motivation?: string;

  @ApiProperty({
    description: 'Whether the applicant has previous hosting experience (optional)',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  hasExperience?: boolean;

  @ApiProperty({
    description: 'Description of previous hosting experience (optional)',
    example: 'I have hosted on Airbnb for 2 years with a 4.9 rating.',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Experience description cannot exceed 500 characters' })
  experienceDescription?: string;

  @ApiProperty({
    description: 'Agreed to platform terms and conditions (optional)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  agreedToTerms?: boolean;

  @ApiProperty({
    description: 'Agreed to host policy and guidelines (optional)',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  agreedToHostPolicy?: boolean;
}

/**
 * DTO for host eligibility check response
 */
export class HostEligibilityRequirementsDto {
  @ApiProperty({
    description: 'Whether email and phone are verified',
    example: true,
  })
  verified!: boolean;

  @ApiProperty({
    description: 'Whether account meets minimum age requirement',
    example: true,
  })
  accountAge!: boolean;

  @ApiProperty({
    description: 'Whether user profile is complete',
    example: true,
  })
  completedProfile!: boolean;
}

export class HostEligibilityDataDto {
  @ApiProperty({
    description: 'Whether user is eligible to apply',
    example: true,
  })
  eligible!: boolean;

  @ApiProperty({
    description: 'Reasons why user is not eligible (if applicable)',
    example: ['Complete your profile before applying'],
    type: [String],
  })
  reasons!: string[];

  @ApiProperty({
    description: 'Detailed eligibility requirements',
    type: HostEligibilityRequirementsDto,
  })
  requirements!: HostEligibilityRequirementsDto;
}

/**
 * DTO for host application status
 */
export class HostApplicationVerificationStatusDto {
  @ApiProperty({
    description: 'Identity verification status',
    example: true,
  })
  identityVerified!: boolean;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  emailVerified!: boolean;

  @ApiProperty({
    description: 'Phone verification status',
    example: true,
  })
  phoneVerified!: boolean;
}

export class HostApplicationStatusDataDto {
  @ApiProperty({
    description: 'Whether user has a host application',
    example: true,
  })
  hasApplication!: boolean;

  @ApiProperty({
    description: 'Application status',
    example: 'pending',
    enum: ['pending', 'approved', 'rejected'],
    required: false,
  })
  status?: 'pending' | 'approved' | 'rejected';

  @ApiProperty({
    description: 'Whether user is already a host',
    example: false,
  })
  isHost!: boolean;

  @ApiProperty({
    description: 'User verification status',
    type: HostApplicationVerificationStatusDto,
  })
  verificationStatus!: HostApplicationVerificationStatusDto;

  @ApiProperty({
    description: 'Next steps for the user',
    example: ['Complete identity verification', 'Wait for admin approval'],
    type: [String],
  })
  nextSteps!: string[];

  @ApiProperty({
    description: 'Reason for rejection (if applicable)',
    example: 'Incomplete profile information',
    required: false,
  })
  rejectionReason?: string;
}

/**
 * DTO for become host response
 */
export class BecomeHostDataDto {
  @ApiProperty({
    description: 'Application ID',
    example: '507f1f77bcf86cd799439011',
  })
  applicationId!: string;

  @ApiProperty({
    description: 'Application status',
    example: 'pending',
    enum: ['pending', 'review', 'approved', 'rejected'],
  })
  status!: 'pending' | 'review' | 'approved' | 'rejected';

  @ApiProperty({
    description: 'Whether identity verification is required',
    example: false,
  })
  requiresVerification!: boolean;

  @ApiProperty({
    description: 'Next steps for the applicant',
    example: ['Complete identity verification', 'Wait for admin approval'],
    type: [String],
  })
  nextSteps!: string[];
}

/**
 * DTO for admin host approval
 */
export class ApproveHostDto {
  @ApiProperty({
    description: 'Optional notes from admin about the approval',
    example: 'Application looks good, user has completed all requirements.',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Admin notes cannot exceed 1000 characters' })
  notes?: string;
}

/**
 * DTO for admin host rejection
 */
export class RejectHostDto {
  @ApiProperty({
    description: 'Reason for rejecting the application',
    example: 'Incomplete profile information. Please add a bio and profile photo.',
    minLength: 20,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Please provide a detailed reason for rejection (at least 20 characters)' })
  @MaxLength(1000, { message: 'Rejection reason cannot exceed 1000 characters' })
  reason!: string;
}

/**
 * Response DTOs using factory pattern
 */
export const BecomeHostResponseDto = createResponseDto(BecomeHostDataDto);
export type BecomeHostResponseDto = InstanceType<typeof BecomeHostResponseDto>;

export const HostEligibilityResponseDto = createResponseDto(HostEligibilityDataDto);
export type HostEligibilityResponseDto = InstanceType<typeof HostEligibilityResponseDto>;

export const HostApplicationStatusResponseDto = createResponseDto(HostApplicationStatusDataDto);
export type HostApplicationStatusResponseDto = InstanceType<typeof HostApplicationStatusResponseDto>;
