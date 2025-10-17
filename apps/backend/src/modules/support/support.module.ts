import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from '../../database/schemas/booking.schema';
import { Conversation, ConversationSchema } from '../../database/schemas/conversation.schema';
import { AuditLog, AuditLogSchema } from '../../database/schemas/audit-log.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { SupportService } from './services/support.service';
import { SupportAdminController } from './controllers/support-admin.controller';

/**
 * Support Module
 * Provides support operations with role-based permission boundaries
 *
 * Features:
 * - Refund issuance with $500 limit for support role
 * - Approval workflow for refunds exceeding support limit
 * - Support ticket assignment
 * - Support statistics and metrics
 * - Comprehensive audit logging
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SupportAdminController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
