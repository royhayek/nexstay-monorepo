import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class VerifyResetDataDto {
  @ApiProperty({
    description: 'Temporary token for password reset (expires in 15 minutes)',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODk4M2FmNTRhNDcxYTBjZTYzMWRhMGMiLCJ0eXBlIjoicGFzc3dvcmRfcmVzZXQiLCJpYXQiOjE3NTQ4MDgwNTksImV4cCI6MTc1NDgwODk1OX0.CDe3Q_rVFfRtSiTdayHo69hP_g_Ytp_O-NpRANeZAn0',
  })
  resetToken: string;

  @ApiProperty({
    description: 'Token expiration timestamp',
    example: '2025-09-22T20:07:29.735Z',
  })
  expiresAt: string;
}

export class VerifyResetResponseDto extends BaseResponseDto<VerifyResetDataDto> {
  @ApiProperty({
    description: 'Password reset verification response data',
    type: VerifyResetDataDto,
  })
  declare data: VerifyResetDataDto;
}
