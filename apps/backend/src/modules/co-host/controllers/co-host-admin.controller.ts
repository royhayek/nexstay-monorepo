import { Controller, Get, Post, Patch, Query, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../database/schemas/user.schema';
import { BaseController } from '../../../common/controllers/base.controller';
import { ApiEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { CoHostService } from '../services/co-host.service';
import {
  QueryCoHostsDto,
  CoHostItemDto,
  CoHostListDto,
  CoHostStatisticsDto,
  UpdateCoHostPermissionsDto,
  RemoveCoHostDto,
} from '../dto/co-host.dto';

/**
 * Co-Host Admin Controller
 * Administrative oversight of co-host relationships across all properties
 */
@Controller('admin/co-hosts')
@ApiTags('Co-Host Admin')
@Roles(UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
export class CoHostAdminController extends BaseController {
  constructor(private readonly coHostService: CoHostService) {
    super();
  }

  /**
   * List all co-hosts (admin view)
   */
  @Get()
  @ApiEndpoint({
    summary: 'List all co-hosts',
    description: 'List all co-host relationships across all properties (admin only)',
    responseType: CoHostListDto,
  })
  async listAllCoHosts(
    @Query() dto: QueryCoHostsDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.executeWithErrorHandling(
      async () => {
        // Admins can see all co-hosts without user-specific filtering
        return await this.coHostService.listCoHosts({ ...dto }, userId);
      },
      'list all co-hosts',
    );
  }

  /**
   * Get specific co-host details (admin view)
   */
  @Get(':id')
  @ApiEndpoint({
    summary: 'Get co-host details',
    description: 'Get detailed information about a specific co-host relationship',
    responseType: CoHostItemDto,
  })
  async getCoHost(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.executeWithErrorHandling(
      async () => {
        return await this.coHostService.getCoHost(id, userId);
      },
      'get co-host',
    );
  }

  /**
   * Get platform-wide co-host statistics
   */
  @Get('statistics/platform')
  @ApiEndpoint({
    summary: 'Get platform co-host statistics',
    description: 'Get platform-wide statistics about co-host usage',
    responseType: CoHostStatisticsDto,
  })
  async getPlatformStatistics(
    @CurrentUser('userId') userId: string,
  ) {
    return this.executeWithErrorHandling(
      async () => {
        return await this.coHostService.getCoHostStatistics(userId);
      },
      'get platform statistics',
    );
  }

  /**
   * Expire old pending invitations (admin maintenance)
   */
  @Post('expire-old')
  @ApiEndpoint({
    summary: 'Expire old invitations',
    description: 'Manually trigger expiration of old pending co-host invitations',
  })
  async expireOldInvitations() {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.coHostService.expireOldInvitations();
      },
      'expire old invitations',
      'Invitations Expired',
      'Old pending invitations have been expired',
      'Failed to expire invitations',
    );
  }

  /**
   * Admin update co-host permissions
   */
  @Patch(':id/permissions')
  @ApiEndpoint({
    summary: 'Admin update co-host permissions',
    description: 'Update co-host permissions as admin (override)',
    responseType: CoHostItemDto,
  })
  async adminUpdatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateCoHostPermissionsDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // For admin, we need to get the property owner ID
        const coHost = await this.coHostService.getCoHost(id, userId);
        // Use the invitedBy as the host user ID for permission updates
        return await this.coHostService.updateCoHostPermissions(id, dto, coHost.invitedBy, undefined);
      },
      'admin update permissions',
      'Permissions Updated',
      'Co-host permissions updated by admin',
      'Failed to update permissions',
    );
  }

  /**
   * Admin remove co-host
   */
  @Patch(':id/remove')
  @ApiEndpoint({
    summary: 'Admin remove co-host',
    description: 'Remove co-host as admin (override)',
    responseType: CoHostItemDto,
  })
  async adminRemoveCoHost(
    @Param('id') id: string,
    @Body() dto: RemoveCoHostDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        // For admin, get the property owner ID
        const coHost = await this.coHostService.getCoHost(id, userId);
        return await this.coHostService.removeCoHost(id, dto, coHost.invitedBy, undefined);
      },
      'admin remove co-host',
      'Co-Host Removed',
      'Co-host removed by admin',
      'Failed to remove co-host',
    );
  }
}
