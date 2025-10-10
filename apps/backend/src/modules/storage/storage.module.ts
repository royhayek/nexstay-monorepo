import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import s3Config from '../../config/s3.config';
import { ImageProcessingService } from './services/image-processing.service';
import { S3Service } from './services/s3.service';
import { StorageAppController } from './controllers/storage-app.controller';
import { StorageAdminController } from './controllers/storage-admin.controller';

@Global()
@Module({
  imports: [ConfigModule.forFeature(s3Config)],
  controllers: [StorageAppController, StorageAdminController],
  providers: [ImageProcessingService, S3Service],
  exports: [S3Service, ImageProcessingService],
})
export class StorageModule {}
