import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class DeleteFileResultDto {
  @ApiProperty({
    description: 'Success message',
    example: 'File deleted successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Deleted file key',
    example: 'profile-images/user123/2024-08-10/uuid-profile.jpg',
  })
  deletedKey!: string;
}

export class DeleteFileResponseDto extends BaseResponseDto<DeleteFileResultDto> {
  @ApiProperty({
    description: 'File deletion result data',
    type: DeleteFileResultDto,
  })
  declare data: DeleteFileResultDto;
}
