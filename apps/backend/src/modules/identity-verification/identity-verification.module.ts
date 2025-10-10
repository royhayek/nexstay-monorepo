import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { SharedSchemasModule } from '../../common/schemas/shared-schemas.module';
import { IdentityVerificationService } from './identity-verification.service';
import { DocumentTypeManagementService } from './document-type-management.service';
import { IdentityVerificationAppController } from './controllers/identity-verification-app.controller';
import { IdentityVerificationAdminController } from './controllers/identity-verification-admin.controller';
import {
  IdentityVerification,
  IdentityVerificationSchema,
} from '../../database/schemas/identity-verification.schema';
import {
  DocumentTypeConfig,
  DocumentTypeConfigSchema,
} from '../../database/schemas/document-type-config.schema';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    SharedSchemasModule,
    MongooseModule.forFeature([
      { name: IdentityVerification.name, schema: IdentityVerificationSchema },
      { name: DocumentTypeConfig.name, schema: DocumentTypeConfigSchema },
    ]),
    ConfigModule,
    StorageModule,
  ],
  controllers: [IdentityVerificationAppController, IdentityVerificationAdminController],
  providers: [IdentityVerificationService, DocumentTypeManagementService],
  exports: [IdentityVerificationService, DocumentTypeManagementService],
})
export class IdentityVerificationModule {}
