import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class DeleteAccountDataDto {
  @ApiProperty({ example: 'Account deleted' })
  message!: string;

  @ApiProperty({
    description: 'Timestamp when the account was deleted',
    example: '2024-01-01T12:00:00.000Z',
  })
  deletedAt!: Date;

  @ApiProperty({
    description: 'Reason for account deletion',
    example: 'No longer need account',
  })
  reason!: string;

  @ApiPropertyOptional({
    description: 'Custom reason text if "Other reason" was selected',
    example: 'I no longer need this service',
  })
  customReason?: string;
}

export class DeleteAccountResponseDto extends BaseResponseDto<DeleteAccountDataDto> {
  @ApiProperty({
    description: 'User account deletion Data',
    type: DeleteAccountDataDto,
  })
  declare data: DeleteAccountDataDto;
}
