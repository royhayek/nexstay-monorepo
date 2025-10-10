import { registerAs } from '@nestjs/config';

export interface S3Config {
  region: string;
  bucketName: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  forcePathStyle: boolean;
  fileServeBaseUrl?: string;
  maxFileSize: number;
  maxProfileImageSize: number;
  maxPropertyImageSize: number;
  enableImageProcessing: boolean;
}

export default registerAs(
  's3',
  (): S3Config => ({
    region: process.env.AWS_S3_REGION!,
    bucketName: process.env.AWS_S3_BUCKET_NAME!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || undefined,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || undefined,
    endpoint: process.env.AWS_S3_ENDPOINT || undefined,
    forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
    fileServeBaseUrl: process.env.FILE_SERVE_BASE_URL || undefined,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    maxProfileImageSize: parseInt(process.env.MAX_PROFILE_IMAGE_SIZE || '5242880', 10), // 5MB
    maxPropertyImageSize: parseInt(process.env.MAX_PROPERTY_IMAGE_SIZE || '10485760', 10), // 10MB
    enableImageProcessing: process.env.ENABLE_IMAGE_PROCESSING !== 'false', // Enabled by default
  }),
);
