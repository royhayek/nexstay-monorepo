import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedSchemasModule } from '../../common/schemas/shared-schemas.module';
import { UserCoreService } from './services/user-core.service';
import { UserProfileService } from './services/user-profile.service';
import { UserAccountService } from './services/user-account.service';
import { UserAdminService } from './services/user-admin.service';
import { UsersFacadeService } from './services/users-facade.service';
import { UserAccountIntegrationService } from './services/user-account-integration.service';
import { UsersAppController } from './controllers/users-app.controller';
import { UsersAdminController } from './controllers/users-admin.controller';
import { UsersPublicController } from './controllers/users-public.controller';
import { RefreshToken, RefreshTokenSchema } from '../../database/schemas/refresh-token.schema';
import {
  VerificationToken,
  VerificationTokenSchema,
} from '../../database/schemas/verification-token.schema';
import {
  AccountActionReason,
  AccountActionReasonSchema,
} from '../../database/schemas/account-action-reason.schema';
import { StorageModule } from '../storage/storage.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    SharedSchemasModule,
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: VerificationToken.name, schema: VerificationTokenSchema },
      { name: AccountActionReason.name, schema: AccountActionReasonSchema },
    ]),
    StorageModule,
    AccountsModule,
  ],
  providers: [
    UserCoreService,
    UserProfileService,
    UserAccountService,
    UserAdminService,
    UserAccountIntegrationService,
    // Facade service that coordinates all specialized services
    UsersFacadeService,
  ],
  controllers: [UsersAppController, UsersAdminController, UsersPublicController],
  exports: [
    UsersFacadeService,
    UserCoreService,
    UserProfileService,
    UserAccountService,
    UserAdminService,
  ],
})
export class UsersModule {}
