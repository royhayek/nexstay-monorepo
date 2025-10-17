import { Controller, Post, Get, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../database/schemas/user.schema';
import { BaseController } from '../../../common/controllers/base.controller';
import { ApiEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { CoHostService } from '../services/co-host.service';
import {
  InviteCoHostDto,
  UpdateCoHostPermissionsDto,
  RemoveCoHostDto,
  RespondToInvitationDto,
  QueryCoHostsDto,
  CoHostItemDto,
  CoHostListDto,
  CoHostStatisticsDto,
} from '../dto/co-host.dto';

/**
 * Co-Host Controller (App Routes)
 * Manages co-host invitations, permissions, and access control for properties
 */
@Controller('app/co-hosts')
@ApiTags('Co-Host')
@Roles(UserRole.HOST, UserRole.ADMIN, UserRole.SYSTEM_ADMIN)
export class CoHostAppController extends BaseController {
  constructor(private readonly coHostService: CoHostService) {
    super();
  }

  /**
   * Invite a user to be a co-host for a property
   */
  @Post('invite')
  @ApiEndpoint({
    summary: 'Invite co-host',
    description: 'Invite a user to be a co-host for one of your properties',
    responseType: CoHostItemDto,
  })
  async inviteCoHost(
    @Body() dto: InviteCoHostDto,
    @CurrentUser('userId') userId: string,
    @Request() req: any,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.coHostService.inviteCoHost(dto, userId, req.ip);
      },
      'invite co-host',
      'Co-Host Invited',
      'Co-host invitation sent successfully',
      'Failed to invite co-host',
    );
  }

  /**
   * Accept or reject a co-host invitation
   */
  @Patch(':id/respond')
  @ApiEndpoint({
    summary: 'Respond to co-host invitation',
    description: 'Accept or reject a co-host invitation',
    responseType: CoHostItemDto,
  })
  async respondToInvitation(
    @Param('id') id: string,
    @Body() dto: RespondToInvitationDto,
    @CurrentUser('userId') userId: string,
    @Request() req: any,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.coHostService.respondToInvitation(id, dto, userId, req.ip);
      },
      'respond to invitation',
      dto.response === 'accepted' ? 'Invitation Accepted' : 'Invitation Rejected',
      `Co-host invitation ${dto.response === 'accepted' ? 'accepted' : 'rejected'} successfully`,
      'Failed to respond to invitation',
    );
  }

  /**
   * Update co-host permissions
   */
  @Patch(':id/permissions')
  @ApiEndpoint({
    summary: 'Update co-host permissions',
    description: 'Update permissions for an existing co-host',
    responseType: CoHostItemDto,
  })
  async updateCoHostPermissions(
    @Param('id') id: string,
    @Body() dto: UpdateCoHostPermissionsDto,
    @CurrentUser('userId') userId: string,
    @Request() req: any,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.coHostService.updateCoHostPermissions(id, dto, userId, req.ip);
      },
      'update co-host permissions',
      'Permissions Updated',
      'Co-host permissions updated successfully',
      'Failed to update co-host permissions',
    );
  }

  /**
   * Remove a co-host from a property
   */
  @Delete(':id')
  @ApiEndpoint({
    summary: 'Remove co-host',
    description: 'Remove a co-host from one of your properties',
    responseType: CoHostItemDto,
  })
  async removeCoHost(
    @Param('id') id: string,
    @Body() dto: RemoveCoHostDto,
    @CurrentUser('userId') userId: string,
    @Request() req: any,
  ) {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.coHostService.removeCoHost(id, dto, userId, req.ip);
      },
      'remove co-host',
      'Co-Host Removed',
      'Co-host removed successfully',
      'Failed to remove co-host',
    );
  }

  /**
   * Get a specific co-host by ID
   */
  @Get(':id')
  @ApiEndpoint({
    summary: 'Get co-host',
    description: 'Get details of a specific co-host',
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
   * List co-hosts with filters
   */
  @Get()
  @ApiEndpoint({
    summary: 'List co-hosts',
    description: 'List all co-hosts for your properties or properties you co-host',
    responseType: CoHostListDto,
  })
  async listCoHosts(
    @Query() dto: QueryCoHostsDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.executeWithErrorHandling(
      async () => {
        return await this.coHostService.listCoHosts(dto, userId);
      },
      'list co-hosts',
    );
  }

  /**
   * Get co-host statistics
   */
  @Get('statistics/summary')
  @ApiEndpoint({
    summary: 'Get co-host statistics',
    description: 'Get co-host statistics including counts and activity metrics',
    responseType: CoHostStatisticsDto,
  })
  async getCoHostStatistics(
    @CurrentUser('userId') userId: string,
  ) {
    return this.executeWithErrorHandling(
      async () => {
        return await this.coHostService.getCoHostStatistics(userId);
      },
      'get co-host statistics',
    );
  }
}
