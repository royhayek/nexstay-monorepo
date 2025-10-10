import { ApiProperty } from '@nestjs/swagger';

import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { ImageSize } from '../services/image-processing.service';
import { FileCategory } from '../services/s3.service';

export class FileUploadResultDto {
  @ApiProperty({
    description: 'Unique file key in S3',
    example: 'profile-images/user123/2024-08-10/uuid-profile.jpg',
  })
  key!: string;

  @ApiProperty({
    description: 'Public URL to access the file',
    example:
      'https://bucket.s3.region.amazonaws.com/profile-images/user123/2024-08-10/uuid-profile.jpg',
  })
  url!: string;

  @ApiProperty({
    description: 'S3 bucket name',
    example: 'airbnb-clone-uploads',
  })
  bucket!: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024768,
  })
  size!: number;

  @ApiProperty({
    description: 'File content type',
    example: 'image/jpeg',
  })
  contentType!: string;

  @ApiProperty({
    description: 'File category',
    enum: FileCategory,
    example: FileCategory.PROFILE_IMAGES,
  })
  category!: FileCategory;

  @ApiProperty({
    description: 'Whether the image was processed and optimized',
    example: true,
    required: false,
  })
  isProcessed?: boolean;

  @ApiProperty({
    description: 'Image variants (different sizes/formats) if processed',
    type: [Object],
    required: false,
    example: [
      {
        key: 'profile-images/user123/2024-08-10/uuid-profile_thumb.webp',
        url: 'https://bucket.s3.region.amazonaws.com/profile-images/user123/2024-08-10/uuid-profile_thumb.webp',
        size: 'thumbnail',
        width: 64,
        height: 64,
        contentType: 'image/webp',
        fileSize: 2048,
      },
    ],
  })
  variants?: ImageVariantDto[];
}

export class ImageVariantDto {
  @ApiProperty({
    description: 'S3 key for this image variant',
    example: 'profile-images/user123/2024-08-10/uuid-profile_sm.webp',
  })
  key!: string;

  @ApiProperty({
    description: 'Public URL for this image variant',
    example:
      'https://bucket.s3.region.amazonaws.com/profile-images/user123/2024-08-10/uuid-profile_sm.webp',
  })
  url!: string;

  @ApiProperty({
    description: 'Image size variant',
    enum: ImageSize,
    example: ImageSize.MEDIUM,
  })
  size!: ImageSize;

  @ApiProperty({
    description: 'Image width in pixels',
    example: 150,
  })
  width!: number;

  @ApiProperty({
    description: 'Image height in pixels',
    example: 150,
  })
  height!: number;

  @ApiProperty({
    description: 'Content type of this variant',
    example: 'image/webp',
  })
  contentType!: string;

  @ApiProperty({
    description: 'File size in bytes for this variant',
    example: 4096,
  })
  fileSize!: number;
}

export class FileUploadResponseDto extends BaseResponseDto<FileUploadResultDto> {
  @ApiProperty({
    description: 'File upload result data',
    type: FileUploadResultDto,
  })
  declare data: FileUploadResultDto;
}

export class MultipleFileUploadResultDto {
  @ApiProperty({
    description: 'Array of uploaded file results',
    type: [FileUploadResultDto],
  })
  files!: FileUploadResultDto[];

  @ApiProperty({
    description: 'Number of files uploaded successfully',
    example: 5,
  })
  count!: number;
}

export class MultipleFileUploadResponseDto extends BaseResponseDto<MultipleFileUploadResultDto> {
  @ApiProperty({
    description: 'Multiple file upload result data',
    type: MultipleFileUploadResultDto,
  })
  declare data: MultipleFileUploadResultDto;
}
