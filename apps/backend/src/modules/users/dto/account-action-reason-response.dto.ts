import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { AccountActionType } from '../../../database/schemas/account-action-reason.schema';

export class AccountActionReasonDataDto {
  @ApiProperty({
    description: 'Unique reason identifier',
    example: '507f1f77bcf86cd799439011',
  })
  @Expose()
  @Transform(({ obj }: { obj: { _id: Types.ObjectId } }) => obj._id.toString())
  id!: string;

  @ApiProperty({
    description: 'Reason title',
    example: 'Taking a break from the platform',
  })
  @Expose()
  title!: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the reason',
    example: 'Temporarily stepping away from using the service',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Type of account action this reason applies to',
    enum: AccountActionType,
    example: AccountActionType.DEACTIVATION,
  })
  @Expose()
  actionType!: AccountActionType;

  @ApiProperty({
    description: 'Whether this reason is currently active',
    example: true,
  })
  @Expose()
  isActive!: boolean;

  @ApiProperty({
    description: 'Sort order for displaying reasons',
    example: 1,
  })
  @Expose()
  sortOrder!: number;

  @ApiProperty({
    description: 'Whether this action requires admin approval',
    example: false,
  })
  @Expose()
  requiresAdminApproval!: boolean;

  @ApiProperty({
    description: 'Whether this is the default reason for the action type',
    example: false,
  })
  @Expose()
  isDefault!: boolean;
}

export class AccountActionReasonResponseDto extends BaseResponseDto<AccountActionReasonDataDto> {
  @ApiProperty({
    description: 'Account action reason data',
    type: AccountActionReasonDataDto,
  })
  declare data: AccountActionReasonDataDto;
}

export class AccountActionReasonsListResponseDto extends BaseResponseDto<
  AccountActionReasonDataDto[]
> {
  @ApiProperty({
    description: 'List of account action reasons',
    type: [AccountActionReasonDataDto],
  })
  declare data: AccountActionReasonDataDto[];
}
