import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class PresignedUploadUrlResultDto {
  @ApiProperty({
    description: 'Presigned URL for direct upload to S3',
    example:
      'https://bucket.s3.region.amazonaws.com/profile-images/user123/2024-08-10/uuid-profile.jpg?X-Amz-...',
  })
  uploadUrl!: string;

  @ApiProperty({
    description: 'File key that will be used in S3',
    example: 'profile-images/user123/2024-08-10/uuid-profile.jpg',
  })
  key!: string;

  @ApiProperty({
    description: 'URL expiration time in seconds',
    example: 300,
  })
  expiresIn!: number;
}

export class PresignedUploadUrlResponseDto extends BaseResponseDto<PresignedUploadUrlResultDto> {
  @ApiProperty({
    description: 'Presigned upload URL result data',
    type: PresignedUploadUrlResultDto,
  })
  declare data: PresignedUploadUrlResultDto;
}
