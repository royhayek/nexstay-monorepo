import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

export class ImageVariantDto {
  @ApiProperty({ description: 'Image variant size', example: 'thumbnail' })
  size: string;

  @ApiProperty({
    description: 'Image variant URL',
    example: 'https://s3.bucket.com/image-thumb.jpg',
  })
  url: string;

  @ApiProperty({ description: 'Image width in pixels', example: 320 })
  width: number;

  @ApiProperty({ description: 'Image height in pixels', example: 240 })
  height: number;
}

export class PropertyImageUploadDto {
  @ApiProperty({ description: 'Image storage key' })
  key: string;

  @ApiProperty({ description: 'Primary image URL' })
  url: string;

  @ApiProperty({ description: 'Thumbnail URL' })
  thumbnailUrl: string;

  @ApiProperty({
    description: 'Available image variants',
    type: [ImageVariantDto],
  })
  variants: ImageVariantDto[];
}

export class MultiplePropertyImageUploadDto {
  @ApiProperty({
    description: 'Uploaded image files',
    type: [PropertyImageUploadDto],
  })
  files: PropertyImageUploadDto[];

  @ApiProperty({ description: 'Number of uploaded files' })
  count: number;
}

export class PropertyImageUploadResponseDto extends BaseResponseDto<PropertyImageUploadDto> {
  @ApiProperty({
    description: 'Uploaded property image data',
    type: PropertyImageUploadDto,
  })
  declare data: PropertyImageUploadDto;
}

export class MultiplePropertyImageUploadResponseDto extends BaseResponseDto<MultiplePropertyImageUploadDto> {
  @ApiProperty({
    description: 'Uploaded property images data',
    type: MultiplePropertyImageUploadDto,
  })
  declare data: MultiplePropertyImageUploadDto;
}
