import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  IdentityVerification,
  IdentityVerificationSchema,
} from '../../database/schemas/identity-verification.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { AuditLog, AuditLogSchema } from '../../database/schemas/audit-log.schema';
import { ComplianceService } from './services/compliance.service';
import { ComplianceAdminController } from './controllers/compliance-admin.controller';

/**
 * Compliance Module
 * Provides compliance-specific operations with enhanced reporting and workflow tools
 *
 * Features:
 * - Verification queue with priority sorting
 * - Aging alerts for verifications requiring attention
 * - Bulk approval/rejection operations
 * - Monthly compliance reports
 * - Real-time compliance statistics
 * - Comprehensive audit logging
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IdentityVerification.name, schema: IdentityVerificationSchema },
      { name: User.name, schema: UserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [ComplianceAdminController],
  providers: [ComplianceService],
  exports: [ComplianceService],
})
export class ComplianceModule {}
