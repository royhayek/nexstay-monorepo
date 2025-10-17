import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiParam } from '@nestjs/swagger';
import { BaseController } from '../../../common/controllers/base.controller';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole, type UserDocument } from '../../../database/schemas/user.schema';
import { SupportService } from '../services/support.service';
import { IssueRefundDto, RequestRefundApprovalDto } from '../dto/issue-refund.dto';
import {
  RefundResponseDto,
  ApprovalRequestResponseDto,
  TicketAssignmentResponseDto,
  SupportStatsResponseDto,
} from '../dto/support-action-response.dto';

/**
 * Support Controller
 * Handles support operations with role-based permission boundaries
 * Support role can access these endpoints with specific limits enforced in the service layer
 */
@Controller('admin/support')
@ApiTags('Support Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportAdminController extends BaseController {
  constructor(private readonly supportService: SupportService) {
    super();
  }

  @Post('refund')
  @Roles(UserRole.SUPPORT, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @AdminEndpoint(
    'Issue refund (Support, Admin, System Admin)',
    'Issue a refund for a booking. Support role limited to $500, Admin/System Admin have no limit.',
    RefundResponseDto,
  )
  async issueRefund(
    @Body() issueRefundDto: IssueRefundDto,
    @CurrentUser() user: UserDocument,
    @Request() req: any,
  ): Promise<RefundResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.supportService.issueRefund(
          issueRefundDto,
          String(user._id),
          user.roles,
          req.ip,
        );
        return result;
      },
      'Issue refund',
      'Refund Issued',
      'Refund processed successfully',
      'Failed to process refund',
    );
  }

  @Post('refund/request-approval')
  @Roles(UserRole.SUPPORT)
  @AdminEndpoint(
    'Request refund approval (Support only)',
    'Request admin approval for refund exceeding $500 support limit',
    ApprovalRequestResponseDto,
  )
  async requestRefundApproval(
    @Body() requestApprovalDto: RequestRefundApprovalDto,
    @CurrentUser() user: UserDocument,
    @Request() req: any,
  ): Promise<ApprovalRequestResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.supportService.requestRefundApproval(
          requestApprovalDto,
          String(user._id),
          req.ip,
        );
        return result;
      },
      'Request refund approval',
      'Approval Request Created',
      'Refund approval request submitted successfully',
      'Failed to submit refund approval request',
    );
  }

  @Put('tickets/:conversationId/assign/:userId')
  @Roles(UserRole.SUPPORT, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @AdminEndpoint(
    'Assign support ticket (Support, Admin, System Admin)',
    'Assign a support ticket to a support agent',
    TicketAssignmentResponseDto,
  )
  @ApiParam({ name: 'conversationId', description: 'Support ticket/conversation ID' })
  @ApiParam({ name: 'userId', description: 'User ID of the support agent to assign to' })
  async assignTicket(
    @Param('conversationId') conversationId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: UserDocument,
    @Request() req: any,
  ): Promise<TicketAssignmentResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.supportService.assignTicket(
          conversationId,
          userId,
          String(user._id),
          req.ip,
        );
        return result;
      },
      'Assign support ticket',
      'Ticket Assigned',
      'Support ticket assigned successfully',
      'Failed to assign support ticket',
    );
  }

  @Get('statistics')
  @Roles(UserRole.SUPPORT, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
  @AdminEndpoint(
    'Get support statistics (Support, Admin, System Admin)',
    'Retrieve support statistics and metrics for current agent',
    SupportStatsResponseDto,
  )
  async getSupportStatistics(
    @CurrentUser() user: UserDocument,
  ): Promise<SupportStatsResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const result = await this.supportService.getSupportStats(String(user._id));
        return result;
      },
      'Get support statistics',
      'Support Statistics',
      'Support statistics retrieved successfully',
      'Failed to retrieve support statistics',
    );
  }
}
