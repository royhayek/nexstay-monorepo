import { INestApplication } from '@nestjs/common';
import { DocumentTypeManagementService } from '../../modules/identity-verification/document-type-management.service';
import { SeederLogger, runSeeder } from './seeder.helpers';

export async function seedDocumentTypes(appContext: INestApplication) {
  await runSeeder('document types', async () => {
    const documentTypeService = appContext.get(DocumentTypeManagementService);

    const documentTypes = await documentTypeService.getAllDocumentTypes();

    if (documentTypes.length > 0) {
      SeederLogger.skipped('document types', `${documentTypes.length} types already exist`);
      return;
    }

    // Force re-initialization if needed (this is handled by the service's onModuleInit)
    await documentTypeService.getAllDocumentTypes();

    SeederLogger.success('document types');
  });
}
