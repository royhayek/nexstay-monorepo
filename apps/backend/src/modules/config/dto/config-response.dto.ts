import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { ConfigCategory } from '../../../database/schemas/app-config.schema';

export class ConfigDataDto {
  @ApiProperty({
    description: 'Unique configuration key identifier',
    example: 'SESSION_EXPIRES_IN',
  })
  key: string;

  @ApiProperty({
    description: 'Configuration value',
    example: '15m',
  })
  value: string;

  @ApiProperty({
    description: 'Human-readable title for display',
    example: 'Session Expiry Duration',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Optional description of the configuration',
    example: 'JWT session expiry duration in minutes or hours format',
  })
  description?: string;

  @ApiProperty({
    description: 'Configuration category for grouping',
    enum: ConfigCategory,
    example: ConfigCategory.SECURITY,
  })
  category: ConfigCategory;

  @ApiProperty({
    description: 'Sort order within the category (lower numbers first)',
    example: 1,
  })
  sortOrder: number;
}

export class ConfigResponseDto extends BaseResponseDto<ConfigDataDto> {
  @ApiProperty({
    description: 'Configuration data',
    type: ConfigDataDto,
  })
  declare data: ConfigDataDto;
}

export class ConfigGroupedResponseDto extends BaseResponseDto<Record<string, ConfigDataDto[]>> {
  @ApiProperty({
    description: 'Configurations grouped by category',
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: { $ref: '#/components/schemas/ConfigDataDto' },
    },
    example: {
      security: [
        {
          key: 'SESSION_EXPIRES_IN',
          value: '15m',
          description: 'JWT access token expiry',
          category: 'security',
          sortOrder: 1,
        },
      ],
      email: [
        {
          key: 'NOTIFY_EMAIL_ENABLED',
          value: 'false',
          description: 'Enable email notifications',
          category: 'email',
          sortOrder: 1,
        },
      ],
    },
  })
  declare data: Record<string, ConfigDataDto[]>;
}
