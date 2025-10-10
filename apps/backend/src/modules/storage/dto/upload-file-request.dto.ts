import { FileCategory } from '../services/s3.service';
import {
  IsEnumField,
  IsNameField,
  IsNumberField,
} from '../../../common/validators/standardized-validators';

export class UploadFileDto {
  @IsEnumField(FileCategory, {
    required: true,
    description: 'File category for organizing uploads',
    example: FileCategory.PROFILE_IMAGES,
  })
  category!: FileCategory;

  @IsNameField({
    description: 'Custom file name (optional)',
    example: 'my-profile-picture',
    maxLength: 100,
  })
  customName?: string;
}

export class PresignedUploadUrlDto {
  @IsNameField({
    required: true,
    description: 'File name to upload',
    example: 'profile-picture.jpg',
    maxLength: 255,
  })
  fileName!: string;

  @IsNameField({
    required: true,
    description: 'File content type',
    example: 'image/jpeg',
  })
  contentType!: string;

  @IsEnumField(FileCategory, {
    required: true,
    description: 'File category for organizing uploads',
    example: FileCategory.PROFILE_IMAGES,
  })
  category!: FileCategory;

  @IsNumberField({
    description: 'Expected file size in bytes (optional)',
    example: 1024768,
  })
  contentLength?: number;
}

export class DeleteFileDto {
  @IsNameField({
    required: true,
    description: 'File key or URL to delete',
    example: 'profile-images/user123/2024-08-10/uuid-profile.jpg',
  })
  fileKey!: string;
}
