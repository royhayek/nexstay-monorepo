import { Controller, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { SecurityDepositService } from '../services/security-deposit.service';
import {
  SecurityDepositStatus,
  SecurityDepositReleaseReason,
} from '../../../common/enums/security-deposit.enums';
import type {
  AdminSecurityDepositFilters,
  ReleaseSecurityDepositRequest,
} from '../interfaces/security-deposit-controller.interfaces';

@ApiTags('Security Deposits Management')
@Controller('admin/security-deposits')
export class SecurityDepositAdminController {
  constructor(private readonly securityDepositService: SecurityDepositService) {}

  @Get()
  @AdminEndpoint(
    'Get all security deposits',
    'Retrieve all security deposits with admin filtering options',
  )
  async getAllSecurityDeposits(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: SecurityDepositStatus,
    @Query('hasActiveClaims') hasActiveClaims?: boolean,
    @Query('requiresAdminReview') requiresAdminReview?: boolean,
  ) {
    const filters: AdminSecurityDepositFilters = {};
    if (status) filters.status = status;
    if (hasActiveClaims !== undefined) filters.hasActiveClaims = hasActiveClaims;
    if (requiresAdminReview !== undefined) filters.requiresAdminReview = requiresAdminReview;

    return this.securityDepositService.getSecurityDeposits(filters, page, limit);
  }

  @Patch(':depositId/release')
  @AdminEndpoint(
    'Admin release security deposit',
    'Release a security deposit with admin override capabilities',
  )
  async releaseSecurityDeposit(
    @Param('depositId') depositId: string,
    @Body() body: ReleaseSecurityDepositRequest,
  ) {
    return this.securityDepositService.releaseSecurityDeposit(
      depositId,
      body.reason || SecurityDepositReleaseReason.ADMIN_RELEASE,
      body.notes,
      'admin',
    );
  }

  @Get('stats')
  @AdminEndpoint(
    'Get security deposit statistics',
    'Retrieve comprehensive statistics for security deposits management',
  )
  async getSecurityDepositStats() {
    return this.securityDepositService.getSecurityDepositStats();
  }
}
