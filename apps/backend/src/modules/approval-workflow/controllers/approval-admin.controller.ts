import { Controller, Get, Post, Patch, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseController } from '../../../common/controllers/base.controller';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../database/schemas/user.schema';
import { ApprovalWorkflowService } from '../services/approval-workflow.service';
import {
  CreateApprovalRequestDto,
  ProcessApprovalDto,
  AssignApprovalDto,
  CancelApprovalDto,
  ApprovalRequestQueryDto,
  ApprovalRequestResponseDto,
  ApprovalRequestListWrapperResponseDto,
  ApprovalProcessResponseDto,
  ApprovalStatisticsResponseDto,
} from '../dto/approval-request.dto';

/**
 * Approval Workflow Admin Controller
 * Handles approval workflow for critical administrative operations
 * Accessible to admin and system_admin roles
 */
@Controller('admin/approvals')
@ApiTags('Approval Workflow')
@Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
export class ApprovalAdminController extends BaseController {
  constructor(private readonly approvalService: ApprovalWorkflowService) {
    super();
  }

  @Post()
  @AdminEndpoint(
    'Create approval request',
    'Create a new approval request for a critical administrative operation',
  )
  async createApprovalRequest(
    @Body() dto: CreateApprovalRequestDto,
    @CurrentUser('userId') userId: string,
    @Request() req: any,
  ): Promise<ApprovalRequestResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.approvalService.createApprovalRequest(dto, userId, req.ip);
      },
      'create approval request',
      'Approval Request Created',
      'Approval request created successfully and is pending review',
      'Failed to create approval request',
    );
  }

  @Get()
  @AdminEndpoint(
    'List approval requests',
    'Retrieve list of approval requests with filters and pagination',
  )
  async listApprovalRequests(
    @Query() query: ApprovalRequestQueryDto,
    @CurrentUser('userId') userId: string,
  ): Promise<ApprovalRequestListWrapperResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.approvalService.listApprovalRequests(query, userId);
      },
      'list approval requests',
      'Approval Requests Retrieved',
      'Approval requests retrieved successfully',
      'Failed to retrieve approval requests',
    );
  }

  @Get('statistics')
  @AdminEndpoint(
    'Get approval statistics',
    'Get real-time statistics about approval requests',
  )
  async getApprovalStatistics(
    @CurrentUser('userId') userId: string,
  ): Promise<ApprovalStatisticsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.approvalService.getApprovalStatistics(userId);
      },
      'get approval statistics',
      'Statistics Retrieved',
      'Approval statistics retrieved successfully',
      'Failed to retrieve approval statistics',
    );
  }

  @Get(':id')
  @AdminEndpoint(
    'Get approval request by ID',
    'Retrieve detailed information about a specific approval request',
  )
  async getApprovalById(@Param('id') id: string): Promise<ApprovalRequestResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.approvalService.getApprovalById(id);
      },
      'get approval by ID',
      'Approval Retrieved',
      'Approval request retrieved successfully',
      'Failed to retrieve approval request',
    );
  }

  @Patch(':id/process')
  @AdminEndpoint(
    'Process approval request',
    'Approve or reject a pending approval request',
  )
  async processApproval(
    @Param('id') id: string,
    @Body() dto: ProcessApprovalDto,
    @CurrentUser('userId') userId: string,
    @Request() req: any,
  ): Promise<ApprovalProcessResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.approvalService.processApproval(id, dto, userId, req.ip);
      },
      'process approval',
      dto.decision === 'approved' ? 'Approval Granted' : 'Approval Rejected',
      `Approval request ${dto.decision === 'approved' ? 'approved' : 'rejected'} successfully`,
      'Failed to process approval request',
    );
  }

  @Patch(':id/assign')
  @AdminEndpoint(
    'Assign approval request',
    'Assign a pending approval request to a specific admin for review',
  )
  async assignApproval(
    @Param('id') id: string,
    @Body() dto: AssignApprovalDto,
    @CurrentUser('userId') userId: string,
    @Request() req: any,
  ): Promise<ApprovalRequestResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.approvalService.assignApproval(id, dto, userId, req.ip);
      },
      'assign approval',
      'Approval Assigned',
      'Approval request assigned successfully',
      'Failed to assign approval request',
    );
  }

  @Patch(':id/cancel')
  @AdminEndpoint(
    'Cancel approval request',
    'Cancel a pending approval request (requester only)',
  )
  async cancelApproval(
    @Param('id') id: string,
    @Body() dto: CancelApprovalDto,
    @CurrentUser('userId') userId: string,
    @Request() req: any,
  ): Promise<ApprovalRequestResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.approvalService.cancelApproval(id, dto, userId, req.ip);
      },
      'cancel approval',
      'Approval Cancelled',
      'Approval request cancelled successfully',
      'Failed to cancel approval request',
    );
  }

  @Post('expire-old')
  @Roles(UserRole.SYSTEM_ADMIN)
  @AdminEndpoint(
    'Expire old approvals',
    'Manual trigger to expire old pending approvals (usually done by cron job)',
  )
  async expireApprovals(): Promise<any> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const expiredCount = await this.approvalService.expireApprovals();
        return { expiredCount };
      },
      'expire old approvals',
      'Approvals Expired',
      'Old approval requests expired successfully',
      'Failed to expire old approvals',
    );
  }
}
