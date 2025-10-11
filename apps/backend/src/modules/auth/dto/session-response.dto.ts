import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

/**
 * Individual session data
 */
export class SessionDataDto {
  @ApiProperty({ description: 'Session ID', example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ description: 'Device name', example: 'Chrome on Windows' })
  deviceName: string;

  @ApiProperty({ description: 'Device fingerprint hash', required: false })
  deviceFingerprint?: string;

  @ApiProperty({ description: 'IP address', example: '192.168.1.100', required: false })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent string', required: false })
  userAgent?: string;

  @ApiProperty({ description: 'Session creation timestamp', example: '2025-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last activity timestamp', example: '2025-01-15T14:30:00.000Z' })
  lastUsedAt: Date;

  @ApiProperty({ description: 'Session expiration timestamp', example: '2025-01-22T10:30:00.000Z' })
  expiresAt: Date;

  @ApiProperty({ description: 'Whether this is the current session', example: false })
  isCurrent: boolean;
}

/**
 * List sessions response
 */
export class ListSessionsResponseDto extends BaseResponseDto<SessionDataDto[]> {
  @ApiProperty({ type: [SessionDataDto], description: 'List of active sessions' })
  declare data: SessionDataDto[];
}

/**
 * Session termination response
 */
export class SessionTerminationDataDto {
  @ApiProperty({ description: 'Success message', example: 'Session terminated successfully' })
  message: string;
}

export class SessionTerminationResponseDto extends BaseResponseDto<SessionTerminationDataDto> {
  @ApiProperty({ type: SessionTerminationDataDto })
  declare data: SessionTerminationDataDto;
}
