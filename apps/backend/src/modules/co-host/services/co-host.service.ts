import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CoHost,
  CoHostDocument,
  CoHostPermission,
  CoHostAccessLevel,
  CoHostStatus,
  ACCESS_LEVEL_PERMISSIONS,
  MAX_CO_HOSTS_PER_PROPERTY,
  INVITATION_EXPIRATION_DAYS,
} from '../../../database/schemas/co-host.schema';
import { Property, PropertyDocument } from '../../../database/schemas/property.schema';
import { User, UserDocument, UserRole } from '../../../database/schemas/user.schema';
import { AuditLog, AuditLogAction } from '../../../database/schemas/audit-log.schema';
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
import { DateUtils } from '../../../common/utils/date.utils';

@Injectable()
export class CoHostService {
  constructor(
    @InjectModel(CoHost.name) private coHostModel: Model<CoHostDocument>,
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
  ) {}

  /**
   * Invite a user to be a co-host for a property
   */
  async inviteCoHost(
    dto: InviteCoHostDto,
    hostUserId: string,
    ipAddress?: string,
  ): Promise<CoHostItemDto> {
    const now = DateUtils.now();

    // Validate property exists and requester is the owner
    const property = await this.propertyModel
      .findById(dto.propertyId)
      .populate('hostId')
      .lean()
      .exec();

    if (!property) {
      throw new NotFoundException(`Property not found: ${dto.propertyId}`);
    }

    if (property.hostId.toString() !== hostUserId) {
      throw new ForbiddenException('Only the property owner can invite co-hosts');
    }

    // Validate co-host user exists and is not the host themselves
    if (dto.coHostUserId === hostUserId) {
      throw new BadRequestException('You cannot invite yourself as a co-host');
    }

    const coHostUser = await this.userModel.findById(dto.coHostUserId).lean().exec();
    if (!coHostUser) {
      throw new NotFoundException(`User not found: ${dto.coHostUserId}`);
    }

    // Check if user already has an active/pending invitation for this property
    const existingCoHost = await this.coHostModel
      .findOne({
        userId: new Types.ObjectId(dto.coHostUserId),
        propertyId: new Types.ObjectId(dto.propertyId),
        status: { $in: [CoHostStatus.INVITED, CoHostStatus.ACCEPTED] },
      })
      .exec();

    if (existingCoHost) {
      if (existingCoHost.status === CoHostStatus.ACCEPTED) {
        throw new ConflictException('This user is already a co-host for this property');
      }
      throw new ConflictException('This user already has a pending invitation for this property');
    }

    // Check co-host limit per property
    const activeCoHostCount = await this.coHostModel.countDocuments({
      propertyId: new Types.ObjectId(dto.propertyId),
      status: { $in: [CoHostStatus.INVITED, CoHostStatus.ACCEPTED] },
    });

    if (activeCoHostCount >= MAX_CO_HOSTS_PER_PROPERTY) {
      throw new BadRequestException(
        `Maximum ${MAX_CO_HOSTS_PER_PROPERTY} co-hosts per property allowed`,
      );
    }

    // Determine permissions based on access level
    let permissions: CoHostPermission[];
    if (dto.accessLevel === CoHostAccessLevel.CUSTOM) {
      if (!dto.permissions || dto.permissions.length === 0) {
        throw new BadRequestException('Permissions must be specified for custom access level');
      }
      permissions = dto.permissions;
    } else {
      permissions = ACCESS_LEVEL_PERMISSIONS[dto.accessLevel];
    }

    // Calculate invitation expiration date
    const expiresAt = new Date(now.getTime() + INVITATION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

    // Create co-host invitation
    const coHost = await this.coHostModel.create({
      userId: new Types.ObjectId(dto.coHostUserId),
      propertyId: new Types.ObjectId(dto.propertyId),
      invitedBy: new Types.ObjectId(hostUserId),
      accessLevel: dto.accessLevel,
      permissions,
      status: CoHostStatus.INVITED,
      invitedAt: now,
      expiresAt,
      invitationMessage: dto.invitationMessage,
      receiveNotifications: dto.receiveNotifications ?? true,
      ipAddress,
    });

    // Create audit log
    const coHostUserName = coHostUser.firstName && coHostUser.lastName
      ? `${coHostUser.firstName} ${coHostUser.lastName}`
      : coHostUser.email;

    await this.auditLogModel.create({
      userId: new Types.ObjectId(hostUserId),
      action: AuditLogAction.ADMIN_ACTION_PERFORMED,
      result: 'success',
      resourceType: 'CoHost',
      resourceId: (coHost._id as Types.ObjectId).toString(),
      ipAddress,
      metadata: {
        coHostId: (coHost._id as Types.ObjectId).toString(),
        propertyId: dto.propertyId,
        coHostUserId: dto.coHostUserId,
        accessLevel: dto.accessLevel,
        permissions,
      },
      description: `Invited ${coHostUserName} as co-host for property ${property.name}`,
    });

    return this.mapToDto(await coHost.populate(['userId', 'propertyId', 'invitedBy']));
  }

  /**
   * Accept or reject a co-host invitation
   */
  async respondToInvitation(
    coHostId: string,
    dto: RespondToInvitationDto,
    userId: string,
    ipAddress?: string,
  ): Promise<CoHostItemDto> {
    const now = DateUtils.now();

    const coHost = await this.coHostModel
      .findById(coHostId)
      .populate(['userId', 'propertyId', 'invitedBy'])
      .exec();

    if (!coHost) {
      throw new NotFoundException(`Co-host invitation not found: ${coHostId}`);
    }

    // Verify the user is the invited co-host
    if (coHost.userId.toString() !== userId) {
      throw new ForbiddenException('You can only respond to your own invitations');
    }

    // Verify invitation is pending
    if (coHost.status !== CoHostStatus.INVITED) {
      throw new BadRequestException(
        `Cannot respond to invitation with status: ${coHost.status}`,
      );
    }

    // Check if invitation has expired
    if (coHost.expiresAt && coHost.expiresAt < now) {
      coHost.status = CoHostStatus.EXPIRED;
      await coHost.save();
      throw new BadRequestException('This invitation has expired');
    }

    // Update status
    coHost.status = dto.response;
    if (dto.response === CoHostStatus.ACCEPTED) {
      coHost.acceptedAt = now;
    }

    await coHost.save();

    // Create audit log
    await this.auditLogModel.create({
      userId: new Types.ObjectId(userId),
      action: AuditLogAction.ADMIN_ACTION_PERFORMED,
      result: 'success',
      resourceType: 'CoHost',
      resourceId: (coHost._id as Types.ObjectId).toString(),
      ipAddress,
      metadata: {
        coHostId: (coHost._id as Types.ObjectId).toString(),
        response: dto.response,
        propertyId: coHost.propertyId._id.toString(),
      },
      description: `${dto.response === CoHostStatus.ACCEPTED ? 'Accepted' : 'Rejected'} co-host invitation for property ${(coHost.propertyId as any).name}`,
    });

    return this.mapToDto(coHost);
  }

  /**
   * Update co-host permissions
   */
  async updateCoHostPermissions(
    coHostId: string,
    dto: UpdateCoHostPermissionsDto,
    hostUserId: string,
    ipAddress?: string,
  ): Promise<CoHostItemDto> {
    const coHost = await this.coHostModel
      .findById(coHostId)
      .populate(['userId', 'propertyId', 'invitedBy'])
      .exec();

    if (!coHost) {
      throw new NotFoundException(`Co-host not found: ${coHostId}`);
    }

    // Verify requester is the property owner
    const property = await this.propertyModel.findById(coHost.propertyId).exec();
    if (!property || property.hostId.toString() !== hostUserId) {
      throw new ForbiddenException('Only the property owner can update co-host permissions');
    }

    // Verify co-host is active
    if (coHost.status !== CoHostStatus.ACCEPTED) {
      throw new BadRequestException('Can only update permissions for active co-hosts');
    }

    // Determine new permissions
    let newPermissions: CoHostPermission[];
    if (dto.accessLevel === CoHostAccessLevel.CUSTOM) {
      if (!dto.permissions || dto.permissions.length === 0) {
        throw new BadRequestException('Permissions must be specified for custom access level');
      }
      newPermissions = dto.permissions;
    } else {
      newPermissions = ACCESS_LEVEL_PERMISSIONS[dto.accessLevel];
    }

    const oldAccessLevel = coHost.accessLevel;
    const oldPermissions = coHost.permissions;

    // Update permissions
    coHost.accessLevel = dto.accessLevel;
    coHost.permissions = newPermissions;
    if (dto.receiveNotifications !== undefined) {
      coHost.receiveNotifications = dto.receiveNotifications;
    }

    await coHost.save();

    // Create audit log
    await this.auditLogModel.create({
      userId: new Types.ObjectId(hostUserId),
      action: AuditLogAction.ADMIN_ACTION_PERFORMED,
      result: 'success',
      resourceType: 'CoHost',
      resourceId: (coHost._id as Types.ObjectId).toString(),
      ipAddress,
      metadata: {
        coHostId: (coHost._id as Types.ObjectId).toString(),
        propertyId: coHost.propertyId._id.toString(),
        coHostUserId: coHost.userId._id.toString(),
        oldAccessLevel,
        newAccessLevel: dto.accessLevel,
        oldPermissions,
        newPermissions,
      },
      description: `Updated co-host permissions for ${(coHost.userId as any).fullName} on property ${(coHost.propertyId as any).name}`,
    });

    return this.mapToDto(coHost);
  }

  /**
   * Remove a co-host from a property
   */
  async removeCoHost(
    coHostId: string,
    dto: RemoveCoHostDto,
    hostUserId: string,
    ipAddress?: string,
  ): Promise<CoHostItemDto> {
    const now = DateUtils.now();

    const coHost = await this.coHostModel
      .findById(coHostId)
      .populate(['userId', 'propertyId', 'invitedBy'])
      .exec();

    if (!coHost) {
      throw new NotFoundException(`Co-host not found: ${coHostId}`);
    }

    // Verify requester is the property owner
    const property = await this.propertyModel.findById(coHost.propertyId).exec();
    if (!property || property.hostId.toString() !== hostUserId) {
      throw new ForbiddenException('Only the property owner can remove co-hosts');
    }

    // Verify co-host is active or invited
    if (![CoHostStatus.ACCEPTED, CoHostStatus.INVITED].includes(coHost.status)) {
      throw new BadRequestException(`Cannot remove co-host with status: ${coHost.status}`);
    }

    // Update status to removed
    coHost.status = CoHostStatus.REMOVED;
    coHost.removedAt = now;
    coHost.removalReason = dto.reason;

    await coHost.save();

    // Create audit log
    await this.auditLogModel.create({
      userId: new Types.ObjectId(hostUserId),
      action: AuditLogAction.ADMIN_ACTION_PERFORMED,
      result: 'success',
      resourceType: 'CoHost',
      resourceId: (coHost._id as Types.ObjectId).toString(),
      ipAddress,
      metadata: {
        coHostId: (coHost._id as Types.ObjectId).toString(),
        propertyId: coHost.propertyId._id.toString(),
        coHostUserId: coHost.userId._id.toString(),
        reason: dto.reason,
      },
      description: `Removed ${(coHost.userId as any).fullName} as co-host from property ${(coHost.propertyId as any).name}`,
    });

    return this.mapToDto(coHost);
  }

  /**
   * Get a specific co-host by ID
   */
  async getCoHost(coHostId: string, userId: string): Promise<CoHostItemDto> {
    const coHost = await this.coHostModel
      .findById(coHostId)
      .populate(['userId', 'propertyId', 'invitedBy'])
      .exec();

    if (!coHost) {
      throw new NotFoundException(`Co-host not found: ${coHostId}`);
    }

    // Verify user has permission to view this co-host
    const property = await this.propertyModel.findById(coHost.propertyId).exec();
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const isPropertyOwner = property.hostId.toString() === userId;
    const isCoHost = coHost.userId.toString() === userId;

    if (!isPropertyOwner && !isCoHost) {
      throw new ForbiddenException('You do not have permission to view this co-host');
    }

    return this.mapToDto(coHost);
  }

  /**
   * List co-hosts with filters
   */
  async listCoHosts(dto: QueryCoHostsDto, userId: string): Promise<CoHostListDto> {
    const page = dto.page || 1;
    const limit = Math.min(dto.limit || 20, 100);
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    // If property ID is specified, verify user is the owner or a co-host
    if (dto.propertyId) {
      const property = await this.propertyModel.findById(dto.propertyId).exec();
      if (!property) {
        throw new NotFoundException(`Property not found: ${dto.propertyId}`);
      }

      const isOwner = property.hostId.toString() === userId;
      const isCoHost = await this.coHostModel.exists({
        userId: new Types.ObjectId(userId),
        propertyId: new Types.ObjectId(dto.propertyId),
        status: CoHostStatus.ACCEPTED,
      });

      if (!isOwner && !isCoHost) {
        throw new ForbiddenException('You do not have permission to view co-hosts for this property');
      }

      query.propertyId = new Types.ObjectId(dto.propertyId);
    } else {
      // Show co-hosts for properties owned by user OR where user is a co-host
      const userProperties = await this.propertyModel
        .find({ hostId: new Types.ObjectId(userId) })
        .select('_id')
        .lean()
        .exec();

      const userPropertyIds = userProperties.map((p) => p._id);

      query.$or = [
        { propertyId: { $in: userPropertyIds } },
        { userId: new Types.ObjectId(userId) },
      ];
    }

    if (dto.status) {
      query.status = dto.status;
    }

    if (dto.accessLevel) {
      query.accessLevel = dto.accessLevel;
    }

    // Execute query
    const [items, total] = await Promise.all([
      this.coHostModel
        .find(query)
        .populate(['userId', 'propertyId', 'invitedBy'])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.coHostModel.countDocuments(query),
    ]);

    // Get status counts
    const statusCounts = await this.coHostModel.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusCountsMap = {
      invited: 0,
      accepted: 0,
      rejected: 0,
      removed: 0,
      expired: 0,
    };

    statusCounts.forEach((item) => {
      statusCountsMap[item._id as CoHostStatus] = item.count;
    });

    // Get access level counts
    const accessLevelCounts = await this.coHostModel.aggregate([
      { $match: query },
      { $group: { _id: '$accessLevel', count: { $sum: 1 } } },
    ]);

    const accessLevelCountsMap = {
      full: 0,
      limited: 0,
      custom: 0,
    };

    accessLevelCounts.forEach((item) => {
      accessLevelCountsMap[item._id as CoHostAccessLevel] = item.count;
    });

    return {
      items: items.map((item) => this.mapToDto(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      statusCounts: statusCountsMap,
      accessLevelCounts: accessLevelCountsMap,
    };
  }

  /**
   * Get co-host statistics for a user
   */
  async getCoHostStatistics(userId: string): Promise<CoHostStatisticsDto> {
    const now = DateUtils.now();

    // Get properties owned by user
    const userProperties = await this.propertyModel
      .find({ hostId: new Types.ObjectId(userId) })
      .select('_id')
      .lean()
      .exec();

    const userPropertyIds = userProperties.map((p) => p._id);

    // Get statistics
    const [
      activeCoHosts,
      pendingInvitations,
      propertiesWithCoHosts,
      propertiesICoHost,
      accessLevelCounts,
    ] = await Promise.all([
      // Total active co-hosts for my properties
      this.coHostModel.countDocuments({
        propertyId: { $in: userPropertyIds },
        status: CoHostStatus.ACCEPTED,
      }),

      // Total pending invitations I've sent
      this.coHostModel.countDocuments({
        propertyId: { $in: userPropertyIds },
        status: CoHostStatus.INVITED,
        expiresAt: { $gte: now },
      }),

      // Count of properties with at least one co-host
      this.coHostModel.distinct('propertyId', {
        propertyId: { $in: userPropertyIds },
        status: CoHostStatus.ACCEPTED,
      }),

      // Count of properties where I'm a co-host
      this.coHostModel.distinct('propertyId', {
        userId: new Types.ObjectId(userId),
        status: CoHostStatus.ACCEPTED,
      }),

      // Access level breakdown
      this.coHostModel.aggregate([
        {
          $match: {
            propertyId: { $in: userPropertyIds },
            status: CoHostStatus.ACCEPTED,
          },
        },
        { $group: { _id: '$accessLevel', count: { $sum: 1 } } },
      ]),
    ]);

    const accessLevelMap: any = {
      full: 0,
      limited: 0,
      custom: 0,
    };

    accessLevelCounts.forEach((item) => {
      accessLevelMap[item._id] = item.count;
    });

    return {
      totalActive: activeCoHosts,
      totalPending: pendingInvitations,
      propertiesWithCoHosts: propertiesWithCoHosts.length,
      coHostsManagedByMe: activeCoHosts,
      propertiesICoHost: propertiesICoHost.length,
      fullAccessCoHosts: accessLevelMap.full,
      limitedAccessCoHosts: accessLevelMap.limited,
      generatedAt: now,
    };
  }

  /**
   * Check if user has a specific permission for a property as a co-host
   */
  async checkCoHostPermission(
    userId: string,
    propertyId: string,
    permission: CoHostPermission,
  ): Promise<boolean> {
    // Check if user is the property owner (owner has all permissions)
    const property = await this.propertyModel.findById(propertyId).lean().exec();
    if (!property) {
      return false;
    }

    if (property.hostId.toString() === userId) {
      return true; // Owner has all permissions
    }

    // Check if user is an active co-host with the permission
    const coHost = await this.coHostModel
      .findOne({
        userId: new Types.ObjectId(userId),
        propertyId: new Types.ObjectId(propertyId),
        status: CoHostStatus.ACCEPTED,
        permissions: permission,
      })
      .lean()
      .exec();

    return !!coHost;
  }

  /**
   * Check if user has any co-host access to a property
   */
  async hasCoHostAccess(userId: string, propertyId: string): Promise<boolean> {
    const property = await this.propertyModel.findById(propertyId).lean().exec();
    if (!property) {
      return false;
    }

    // Check if user is the property owner
    if (property.hostId.toString() === userId) {
      return true;
    }

    // Check if user is an active co-host
    const coHost = await this.coHostModel
      .findOne({
        userId: new Types.ObjectId(userId),
        propertyId: new Types.ObjectId(propertyId),
        status: CoHostStatus.ACCEPTED,
      })
      .lean()
      .exec();

    return !!coHost;
  }

  /**
   * Get all permissions a user has for a property
   */
  async getCoHostPermissions(
    userId: string,
    propertyId: string,
  ): Promise<CoHostPermission[]> {
    const property = await this.propertyModel.findById(propertyId).lean().exec();
    if (!property) {
      return [];
    }

    // If user is the property owner, return all permissions
    if (property.hostId.toString() === userId) {
      return Object.values(CoHostPermission);
    }

    // Get co-host permissions
    const coHost = await this.coHostModel
      .findOne({
        userId: new Types.ObjectId(userId),
        propertyId: new Types.ObjectId(propertyId),
        status: CoHostStatus.ACCEPTED,
      })
      .lean()
      .exec();

    return coHost ? coHost.permissions : [];
  }

  /**
   * Expire old pending invitations
   * (Should be called by a cron job)
   */
  async expireOldInvitations(): Promise<{ expiredCount: number }> {
    const now = DateUtils.now();

    const result = await this.coHostModel.updateMany(
      {
        status: CoHostStatus.INVITED,
        expiresAt: { $lt: now },
      },
      {
        $set: { status: CoHostStatus.EXPIRED },
      },
    );

    return { expiredCount: result.modifiedCount };
  }

  /**
   * Map co-host document to DTO
   */
  private mapToDto(coHost: CoHostDocument): CoHostItemDto {
    const userId = coHost.userId as any;
    const propertyId = coHost.propertyId as any;
    const invitedBy = coHost.invitedBy as any;

    return {
      id: (coHost._id as Types.ObjectId).toString(),
      userId: userId._id.toString(),
      coHostName: userId.fullName || `${userId.firstName} ${userId.lastName}`,
      coHostEmail: userId.email,
      coHostProfilePicture: userId.profilePicture,
      propertyId: propertyId._id.toString(),
      propertyName: propertyId.name,
      invitedBy: invitedBy._id.toString(),
      invitedByName: invitedBy.fullName || `${invitedBy.firstName} ${invitedBy.lastName}`,
      accessLevel: coHost.accessLevel,
      permissions: coHost.permissions,
      status: coHost.status,
      invitedAt: coHost.invitedAt,
      acceptedAt: coHost.acceptedAt,
      expiresAt: coHost.expiresAt,
      removedAt: coHost.removedAt,
      removalReason: coHost.removalReason,
      invitationMessage: coHost.invitationMessage,
      receiveNotifications: coHost.receiveNotifications,
      createdAt: coHost.createdAt!,
      updatedAt: coHost.updatedAt!,
    };
  }
}
