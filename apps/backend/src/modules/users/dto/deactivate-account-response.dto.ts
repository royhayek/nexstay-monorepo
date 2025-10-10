import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class DeactivateAccountDataDto {
  @ApiProperty({
    description: 'Confirmation message for account deactivation',
    example: 'Account deactivated successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Timestamp when the account was deactivated',
    example: '2024-01-01T12:00:00.000Z',
  })
  deactivatedAt!: Date;

  @ApiProperty({
    description: 'Reason for deactivation',
    example: 'Taking a break from the platform',
  })
  reason!: string;

  @ApiPropertyOptional({
    description: 'Custom reason text if "Other reason" was selected',
    example: 'I need to focus on my studies',
  })
  customReason?: string;
}

export class DeactivateAccountResponseDto extends BaseResponseDto<DeactivateAccountDataDto> {
  @ApiProperty({
    description: 'Account deactivation response data',
    type: DeactivateAccountDataDto,
  })
  declare data: DeactivateAccountDataDto;
}
