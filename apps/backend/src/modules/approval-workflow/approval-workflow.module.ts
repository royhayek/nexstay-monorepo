import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AdminActionApproval,
  AdminActionApprovalSchema,
} from '../../database/schemas/admin-action-approval.schema';
import { User, UserSchema } from '../../database/schemas/user.schema';
import { AuditLog, AuditLogSchema } from '../../database/schemas/audit-log.schema';
import { ApprovalWorkflowService } from './services/approval-workflow.service';
import { ApprovalAdminController } from './controllers/approval-admin.controller';

/**
 * Approval Workflow Module
 * Provides approval workflow for critical administrative operations
 *
 * Features:
 * - Approval request creation and tracking
 * - Approve/reject workflow
 * - Assignment to specific admins
 * - Automatic expiration of old requests
 * - Priority-based processing
 * - Comprehensive audit logging
 * - Statistics and reporting
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminActionApproval.name, schema: AdminActionApprovalSchema },
      { name: User.name, schema: UserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [ApprovalAdminController],
  providers: [ApprovalWorkflowService],
  exports: [ApprovalWorkflowService],
})
export class ApprovalWorkflowModule {}
