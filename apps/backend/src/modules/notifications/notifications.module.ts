import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { CommonModule } from '../../common/common.modules';
import { SharedSchemasModule } from '../../common/schemas/shared-schemas.module';
import { DeviceToken, DeviceTokenSchema } from '../../database/schemas/device-token.schema';
import { Notification, NotificationSchema } from '../../database/schemas/notification.schema';
import { UsersModule } from '../users/users.module';
import { NotificationHelperService } from './helpers/notification-helper.service';
import { NotificationsAppController } from './controllers/notifications-app.controller';
import { NotificationsAdminController } from './controllers/notifications-admin.controller';
import { NotificationsService } from './notifications.service';
import { FirebaseService } from './services/firebase.service';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    SharedSchemasModule,
    forwardRef(() => UsersModule),
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
    ]),
  ],
  controllers: [NotificationsAppController, NotificationsAdminController],
  providers: [NotificationsService, FirebaseService, NotificationHelperService],
  exports: [NotificationsService, FirebaseService, NotificationHelperService],
})
export class NotificationsModule {}
