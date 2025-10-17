import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, IsDate, IsOptional, IsArray } from 'class-validator';
import { IsDateField } from '../../../common/validators/standardized-validators';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

/**
 * DTO for blocking dates on a property
 */
export class BlockDatesDto {
  @ApiProperty({
    description: 'Start date of the blocked period',
    example: '2024-07-01',
    type: String,
  })
  @IsDateField({ example: '2024-07-01' })
  @IsNotEmpty({ message: 'Start date is required' })
  @Type(() => Date)
  @IsDate({ message: 'Start date must be a valid date' })
  startDate!: Date;

  @ApiProperty({
    description: 'End date of the blocked period',
    example: '2024-07-15',
    type: String,
  })
  @IsDateField({ example: '2024-07-15' })
  @IsNotEmpty({ message: 'End date is required' })
  @Type(() => Date)
  @IsDate({ message: 'End date must be a valid date' })
  endDate!: Date;

  @ApiProperty({
    description: 'Reason for blocking these dates',
    example: 'Property maintenance and repairs',
    maxLength: 500,
  })
  @IsNotEmpty({ message: 'Reason is required' })
  @IsString({ message: 'Reason must be a string' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason!: string;
}

/**
 * DTO for unblocking dates
 */
export class UnblockDatesDto {
  @ApiProperty({
    description: 'Array of blocked date record IDs to unblock',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    type: [String],
  })
  @IsArray({ message: 'Blocked date IDs must be an array' })
  @IsNotEmpty({ message: 'Blocked date IDs are required' })
  blockedDateIds!: string[];
}

/**
 * Response DTO for a single blocked date record
 */
export class BlockedDateDataDto {
  @ApiProperty({ description: 'Blocked date record ID', example: '507f1f77bcf86cd799439011' })
  id!: string;

  @ApiProperty({ description: 'Property ID', example: '507f1f77bcf86cd799439011' })
  propertyId!: string;

  @ApiProperty({ description: 'Start date of blocked period', example: '2024-07-01T00:00:00.000Z' })
  startDate!: Date;

  @ApiProperty({ description: 'End date of blocked period', example: '2024-07-15T00:00:00.000Z' })
  endDate!: Date;

  @ApiProperty({ description: 'Reason for blocking', example: 'Property maintenance and repairs' })
  reason!: string;

  @ApiProperty({ description: 'Created by user ID', example: '507f1f77bcf86cd799439011' })
  createdBy!: string;

  @ApiPropertyOptional({
    description: 'Updated by user ID',
    example: '507f1f77bcf86cd799439011',
  })
  updatedBy?: string;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-06-01T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-06-01T10:00:00.000Z' })
  updatedAt!: Date;
}

/**
 * Response DTO for booking info in calendar view
 */
export class BookingCalendarDataDto {
  @ApiProperty({ description: 'Booking ID', example: '507f1f77bcf86cd799439011' })
  id!: string;

  @ApiProperty({ description: 'Check-in date', example: '2024-07-20T00:00:00.000Z' })
  checkIn!: Date;

  @ApiProperty({ description: 'Check-out date', example: '2024-07-25T00:00:00.000Z' })
  checkOut!: Date;

  @ApiProperty({ description: 'Booking status', example: 'confirmed' })
  status!: string;

  @ApiProperty({ description: 'Guest name', example: 'John Doe' })
  guestName!: string;

  @ApiProperty({ description: 'Number of nights', example: 5 })
  nights!: number;

  @ApiProperty({ description: 'Number of guests', example: 2 })
  totalGuests!: number;

  @ApiProperty({ description: 'Confirmation code', example: 'ABC123XYZ' })
  confirmationCode?: string;
}

/**
 * Calendar view data combining bookings and blocked dates
 */
export class CalendarViewDataDto {
  @ApiProperty({
    description: 'Array of bookings for this property',
    type: [BookingCalendarDataDto],
  })
  @Type(() => BookingCalendarDataDto)
  bookings!: BookingCalendarDataDto[];

  @ApiProperty({
    description: 'Array of blocked date ranges',
    type: [BlockedDateDataDto],
  })
  @Type(() => BlockedDateDataDto)
  blockedDates!: BlockedDateDataDto[];

  @ApiPropertyOptional({
    description: 'Optional start date filter applied',
    example: '2024-06-01T00:00:00.000Z',
  })
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Optional end date filter applied',
    example: '2024-12-31T00:00:00.000Z',
  })
  endDate?: Date;
}

/**
 * Response DTO for blocking dates operation
 */
export class BlockDatesResponseDto extends BaseResponseDto<BlockedDateDataDto> {
  @ApiProperty({
    description: 'Blocked date record data',
    type: BlockedDateDataDto,
  })
  @Type(() => BlockedDateDataDto)
  declare data: BlockedDateDataDto;
}

/**
 * Response DTO for unblocking dates operation
 */
export class UnblockDatesDataDto {
  @ApiProperty({ description: 'Number of date ranges unblocked', example: 2 })
  unblocked!: number;

  @ApiProperty({
    description: 'IDs of unblocked date records',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  unblockedIds!: string[];
}

export class UnblockDatesResponseDto extends BaseResponseDto<UnblockDatesDataDto> {
  @ApiProperty({
    description: 'Unblock operation result data',
    type: UnblockDatesDataDto,
  })
  @Type(() => UnblockDatesDataDto)
  declare data: UnblockDatesDataDto;
}

/**
 * Response DTO for calendar view
 */
export class CalendarViewResponseDto extends BaseResponseDto<CalendarViewDataDto> {
  @ApiProperty({
    description: 'Calendar view data with bookings and blocked dates',
    type: CalendarViewDataDto,
  })
  @Type(() => CalendarViewDataDto)
  declare data: CalendarViewDataDto;
}

/**
 * Response DTO for toggling property availability
 */
export class ToggleAvailabilityDataDto {
  @ApiProperty({ description: 'Property ID', example: '507f1f77bcf86cd799439011' })
  propertyId!: string;

  @ApiProperty({ description: 'New availability status', example: true })
  isAvailable!: boolean;

  @ApiProperty({ description: 'Message describing the change', example: 'Property is now available' })
  message!: string;
}

export class ToggleAvailabilityResponseDto extends BaseResponseDto<ToggleAvailabilityDataDto> {
  @ApiProperty({
    description: 'Toggle availability operation result',
    type: ToggleAvailabilityDataDto,
  })
  @Type(() => ToggleAvailabilityDataDto)
  declare data: ToggleAvailabilityDataDto;
}
