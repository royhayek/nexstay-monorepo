import { Controller, Get, Post, Body, Query, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseController } from '../../../common/controllers/base.controller';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../database/schemas/user.schema';
import { ComplianceService } from '../services/compliance.service';
import {
  GetMonthlyReportDto,
  MonthlyComplianceReportResponseDto,
  ComplianceStatisticsResponseDto,
} from '../dto/compliance-report.dto';
import {
  VerificationQueueQueryDto,
  VerificationQueueWrapperResponseDto,
  AgingAlertsQueryDto,
  AgingAlertsWrapperResponseDto,
} from '../dto/verification-queue.dto';
import {
  BulkApproveVerificationsDto,
  BulkRejectVerificationsDto,
  BulkApproveResponseDto,
  BulkRejectResponseDto,
} from '../dto/bulk-verification.dto';

/**
 * Compliance Admin Controller
 * Handles compliance-specific operations for identity verification
 * Accessible to compliance, admin, and system_admin roles
 */
@Controller('admin/compliance')
@ApiTags('Compliance Operations')
@Roles(UserRole.COMPLIANCE, UserRole.ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MODERATOR)
export class ComplianceAdminController extends BaseController {
  constructor(private readonly complianceService: ComplianceService) {
    super();
  }

  @Get('verification-queue')
  @AdminEndpoint(
    'Get verification queue',
    'Retrieve pending verifications optimized for compliance team workflow with priority sorting',
  )
  async getVerificationQueue(
    @Query() query: VerificationQueueQueryDto,
  ): Promise<VerificationQueueWrapperResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.complianceService.getVerificationQueue(query);
      },
      'get verification queue',
      'Verification Queue Retrieved',
      'Verification queue retrieved successfully',
      'Failed to retrieve verification queue',
    );
  }

  @Get('aging-alerts')
  @AdminEndpoint(
    'Get aging alerts',
    'Get verifications that have been pending beyond acceptable thresholds and require immediate attention',
  )
  async getAgingAlerts(
    @Query() query: AgingAlertsQueryDto,
  ): Promise<AgingAlertsWrapperResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.complianceService.getAgingAlerts(query);
      },
      'get aging alerts',
      'Aging Alerts Retrieved',
      'Aging alerts retrieved successfully',
      'Failed to retrieve aging alerts',
    );
  }

  @Post('bulk-approve')
  @Roles(UserRole.COMPLIANCE, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @AdminEndpoint(
    'Bulk approve verifications',
    'Approve multiple verifications at once - Compliance/Admin only',
  )
  async bulkApproveVerifications(
    @Body() dto: BulkApproveVerificationsDto,
    @CurrentUser('userId') reviewerId: string,
    @Request() req: any,
  ): Promise<BulkApproveResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.complianceService.bulkApproveVerifications(dto, reviewerId, req.ip);
      },
      'bulk approve verifications',
      'Bulk Approval Completed',
      `Processed ${dto.verificationIds.length} verifications`,
      'Failed to bulk approve verifications',
    );
  }

  @Post('bulk-reject')
  @Roles(UserRole.COMPLIANCE, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @AdminEndpoint(
    'Bulk reject verifications',
    'Reject multiple verifications at once with common reason - Compliance/Admin only',
  )
  async bulkRejectVerifications(
    @Body() dto: BulkRejectVerificationsDto,
    @CurrentUser('userId') reviewerId: string,
    @Request() req: any,
  ): Promise<BulkRejectResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.complianceService.bulkRejectVerifications(dto, reviewerId, req.ip);
      },
      'bulk reject verifications',
      'Bulk Rejection Completed',
      `Processed ${dto.verificationIds.length} verifications`,
      'Failed to bulk reject verifications',
    );
  }

  @Get('reports/monthly')
  @AdminEndpoint(
    'Get monthly compliance report',
    'Generate comprehensive monthly compliance report with detailed statistics',
  )
  async getMonthlyReport(
    @Query() query: GetMonthlyReportDto,
  ): Promise<MonthlyComplianceReportResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.complianceService.getMonthlyReport(query.month);
      },
      'get monthly compliance report',
      'Monthly Report Generated',
      'Monthly compliance report generated successfully',
      'Failed to generate monthly compliance report',
    );
  }

  @Get('statistics')
  @AdminEndpoint(
    'Get compliance statistics',
    'Get real-time compliance statistics including pending counts, review times, and approval rates',
  )
  async getComplianceStatistics(): Promise<ComplianceStatisticsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.complianceService.getComplianceStatistics();
      },
      'get compliance statistics',
      'Compliance Statistics Retrieved',
      'Compliance statistics retrieved successfully',
      'Failed to retrieve compliance statistics',
    );
  }
}
