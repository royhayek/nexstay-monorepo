import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsArray, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import {
  IsIdentifierField,
  IsTextAreaField,
  IsEnumField,
} from '../../../common/validators/standardized-validators';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import {
  CoHostPermission,
  CoHostAccessLevel,
  CoHostStatus,
} from '../../../database/schemas/co-host.schema';

/**
 * Invite Co-Host DTO
 */
export class InviteCoHostDto {
  @IsIdentifierField({
    required: true,
    description: 'Property ID to grant co-host access to',
    example: '507f1f77bcf86cd799439011',
  })
  propertyId!: string;

  @IsIdentifierField({
    required: true,
    description: 'User ID of the person to invite as co-host',
    example: '507f1f77bcf86cd799439012',
  })
  coHostUserId!: string;

  @IsEnumField({
    enum: CoHostAccessLevel,
    required: true,
    description: 'Access level for co-host (full, limited, or custom)',
    example: CoHostAccessLevel.FULL,
  })
  accessLevel!: CoHostAccessLevel;

  @ApiProperty({
    description: 'Specific permissions (required if accessLevel is CUSTOM)',
    type: [String],
    enum: CoHostPermission,
    example: [CoHostPermission.VIEW_CALENDAR, CoHostPermission.MESSAGE_GUESTS],
    required: false,
  })
  @IsArray()
  @IsEnum(CoHostPermission, { each: true })
  @ArrayMinSize(1, { message: 'At least one permission must be specified for custom access' })
  @ArrayMaxSize(8, { message: 'Maximum 8 permissions allowed' })
  @IsOptional()
  permissions?: CoHostPermission[];

  @IsTextAreaField({
    required: false,
    minLength: 10,
    maxLength: 500,
    description: 'Optional message to include with the invitation',
    example: 'Hi! I would like you to help me manage this property.',
  })
  @IsOptional()
  invitationMessage?: string;

  @ApiProperty({
    description: 'Whether co-host should receive notifications about this property',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  receiveNotifications?: boolean;
}

/**
 * Update Co-Host Permissions DTO
 */
export class UpdateCoHostPermissionsDto {
  @IsEnumField({
    enum: CoHostAccessLevel,
    required: true,
    description: 'New access level for co-host',
    example: CoHostAccessLevel.FULL,
  })
  accessLevel!: CoHostAccessLevel;

  @ApiProperty({
    description: 'New specific permissions (required if accessLevel is CUSTOM)',
    type: [String],
    enum: CoHostPermission,
    example: [
      CoHostPermission.VIEW_CALENDAR,
      CoHostPermission.EDIT_CALENDAR,
      CoHostPermission.MESSAGE_GUESTS,
    ],
    required: false,
  })
  @IsArray()
  @IsEnum(CoHostPermission, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @IsOptional()
  permissions?: CoHostPermission[];

  @ApiProperty({
    description: 'Whether co-host should receive notifications',
    example: true,
    required: false,
  })
  @IsOptional()
  receiveNotifications?: boolean;
}

/**
 * Remove Co-Host DTO
 */
export class RemoveCoHostDto {
  @IsTextAreaField({
    required: false,
    minLength: 5,
    maxLength: 300,
    description: 'Optional reason for removing the co-host',
    example: 'No longer needed.',
  })
  @IsOptional()
  reason?: string;
}

/**
 * Respond to Co-Host Invitation DTO
 */
export class RespondToInvitationDto {
  @IsEnumField({
    enum: [CoHostStatus.ACCEPTED, CoHostStatus.REJECTED],
    required: true,
    description: 'Accept or reject the co-host invitation',
    example: CoHostStatus.ACCEPTED,
  })
  response!: CoHostStatus.ACCEPTED | CoHostStatus.REJECTED;
}

/**
 * Query Co-Hosts DTO
 */
export class QueryCoHostsDto {
  @IsIdentifierField({
    required: false,
    description: 'Filter by property ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  propertyId?: string;

  @IsEnumField({
    enum: CoHostStatus,
    required: false,
    description: 'Filter by status',
    example: CoHostStatus.ACCEPTED,
  })
  @IsOptional()
  status?: CoHostStatus;

  @IsEnumField({
    enum: CoHostAccessLevel,
    required: false,
    description: 'Filter by access level',
    example: CoHostAccessLevel.FULL,
  })
  @IsOptional()
  accessLevel?: CoHostAccessLevel;

  @ApiProperty({
    description: 'Page number',
    example: 1,
    required: false,
    minimum: 1,
  })
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  limit?: number;
}

/**
 * Co-Host Item DTO (Response)
 */
export class CoHostItemDto {
  @ApiProperty({ description: 'Co-host record ID', example: '507f1f77bcf86cd799439011' })
  id!: string;

  @ApiProperty({ description: 'Co-host user ID', example: '507f1f77bcf86cd799439012' })
  userId!: string;

  @ApiProperty({ description: 'Co-host name', example: 'Jane Smith' })
  coHostName!: string;

  @ApiProperty({ description: 'Co-host email', example: 'jane@example.com' })
  coHostEmail!: string;

  @ApiProperty({ description: 'Co-host profile picture URL', required: false })
  coHostProfilePicture?: string;

  @ApiProperty({ description: 'Property ID', example: '507f1f77bcf86cd799439011' })
  propertyId!: string;

  @ApiProperty({ description: 'Property name', example: 'Beautiful Beach House' })
  propertyName!: string;

  @ApiProperty({ description: 'Primary host user ID', example: '507f1f77bcf86cd799439013' })
  invitedBy!: string;

  @ApiProperty({ description: 'Primary host name', example: 'John Doe' })
  invitedByName!: string;

  @ApiProperty({
    description: 'Access level',
    enum: CoHostAccessLevel,
    example: CoHostAccessLevel.FULL,
  })
  accessLevel!: CoHostAccessLevel;

  @ApiProperty({
    description: 'Granted permissions',
    type: [String],
    enum: CoHostPermission,
    example: [CoHostPermission.VIEW_CALENDAR, CoHostPermission.MESSAGE_GUESTS],
  })
  permissions!: CoHostPermission[];

  @ApiProperty({
    description: 'Co-host status',
    enum: CoHostStatus,
    example: CoHostStatus.ACCEPTED,
  })
  status!: CoHostStatus;

  @ApiProperty({ description: 'Invitation date', example: '2025-10-12T10:00:00.000Z' })
  invitedAt!: Date;

  @ApiProperty({
    description: 'Acceptance date',
    example: '2025-10-12T12:00:00.000Z',
    required: false,
  })
  acceptedAt?: Date;

  @ApiProperty({
    description: 'Expiration date',
    example: '2025-10-19T10:00:00.000Z',
    required: false,
  })
  expiresAt?: Date;

  @ApiProperty({
    description: 'Removal date',
    example: '2025-10-25T10:00:00.000Z',
    required: false,
  })
  removedAt?: Date;

  @ApiProperty({
    description: 'Removal reason',
    example: 'No longer needed',
    required: false,
  })
  removalReason?: string;

  @ApiProperty({
    description: 'Invitation message',
    example: 'Welcome aboard!',
    required: false,
  })
  invitationMessage?: string;

  @ApiProperty({ description: 'Receive notifications', example: true })
  receiveNotifications!: boolean;

  @ApiProperty({ description: 'Record created timestamp', example: '2025-10-12T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ description: 'Record last updated timestamp', example: '2025-10-12T12:00:00.000Z' })
  updatedAt!: Date;
}

/**
 * Co-Host List Response DTO
 */
export class CoHostListDto {
  @ApiProperty({ type: [CoHostItemDto] })
  items!: CoHostItemDto[];

  @ApiProperty({ example: 15 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;

  @ApiProperty({
    description: 'Status counts',
    example: { invited: 2, accepted: 10, rejected: 1, removed: 2, expired: 0 },
  })
  statusCounts!: {
    invited: number;
    accepted: number;
    rejected: number;
    removed: number;
    expired: number;
  };

  @ApiProperty({
    description: 'Access level counts',
    example: { full: 8, limited: 5, custom: 2 },
  })
  accessLevelCounts!: {
    full: number;
    limited: number;
    custom: number;
  };
}

/**
 * Co-Host Statistics DTO
 */
export class CoHostStatisticsDto {
  @ApiProperty({ description: 'Total active co-hosts', example: 12 })
  totalActive!: number;

  @ApiProperty({ description: 'Total pending invitations', example: 3 })
  totalPending!: number;

  @ApiProperty({ description: 'Total properties with co-hosts', example: 8 })
  propertiesWithCoHosts!: number;

  @ApiProperty({ description: 'Total co-hosts I manage', example: 5 })
  coHostsManagedByMe!: number;

  @ApiProperty({ description: 'Properties I co-host', example: 3 })
  propertiesICoHost!: number;

  @ApiProperty({ description: 'Full access co-hosts', example: 7 })
  fullAccessCoHosts!: number;

  @ApiProperty({ description: 'Limited access co-hosts', example: 5 })
  limitedAccessCoHosts!: number;

  @ApiProperty({
    description: 'Statistics generated timestamp',
    example: '2025-10-12T12:00:00.000Z',
  })
  generatedAt!: Date;
}

/**
 * Response DTOs using BaseResponseDto factory
 */
export type CoHostResponseDto = BaseResponseDto<CoHostItemDto>;
export type CoHostListResponseDto = BaseResponseDto<CoHostListDto>;
export type CoHostStatisticsResponseDto = BaseResponseDto<CoHostStatisticsDto>;
