import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedSchemasModule } from '../../common/schemas/shared-schemas.module';
import { UserCoreService } from './services/user-core.service';
import { UserProfileService } from './services/user-profile.service';
import { UserAccountService } from './services/user-account.service';
import { UserAdminService } from './services/user-admin.service';
import { UserHostService } from './services/user-host.service';
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
import { Property, PropertySchema } from '../../database/schemas/property.schema';
import { StorageModule } from '../storage/storage.module';
import { AccountsModule } from '../accounts/accounts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  AdminActionApproval,
  AdminActionApprovalSchema,
} from '../../database/schemas/admin-action-approval.schema';

@Module({
  imports: [
    SharedSchemasModule,
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: VerificationToken.name, schema: VerificationTokenSchema },
      { name: AccountActionReason.name, schema: AccountActionReasonSchema },
      { name: Property.name, schema: PropertySchema },
      { name: AdminActionApproval.name, schema: AdminActionApprovalSchema },
    ]),
    StorageModule,
    AccountsModule,
    forwardRef(() => NotificationsModule),
  ],
  providers: [
    UserCoreService,
    UserProfileService,
    UserAccountService,
    UserAdminService,
    UserHostService,
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
    UserHostService,
  ],
})
export class UsersModule {}
