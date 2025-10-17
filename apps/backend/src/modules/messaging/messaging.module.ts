import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedSchemasModule } from '../../common/schemas/shared-schemas.module';

import { CommonModule } from '../../common/common.modules';
import { Conversation, ConversationSchema } from '../../database/schemas/conversation.schema';
import { Message, MessageSchema } from '../../database/schemas/message.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { MessagingAppController } from './controllers/messaging-app.controller';
import { MessagingAdminController } from './controllers/messaging-admin.controller';
import { MessagingGateway } from './messaging.gateway';
import { MessagingService } from './messaging.service';

@Module({
  imports: [
    SharedSchemasModule,
    ConfigModule,
    CommonModule,
    UsersModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => ({
        secret: cs.get<string>('JWT_SECRET', 'fallbackSecret'),
        signOptions: { expiresIn: cs.get<string>('JWT_EXPIRES_IN', '15m') as any },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [MessagingAppController, MessagingAdminController],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}
