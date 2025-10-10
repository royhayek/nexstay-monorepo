import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProtectedEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { SecurityDepositService } from '../services/security-deposit.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { UserDocument } from '../../../database/schemas/user.schema';

@ApiTags('Security Deposits')
@Controller('security-deposits')
export class SecurityDepositController {
  constructor(private readonly securityDepositService: SecurityDepositService) {}

  @Get('my-deposits')
  @ProtectedEndpoint(
    'Get user security deposits',
    'Retrieve all security deposits associated with the authenticated user',
  )
  async getMySecurityDeposits(
    @CurrentUser() user: UserDocument,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const filters = {
      guestId: String(user._id),
    };
    return this.securityDepositService.getSecurityDeposits(filters, page, limit);
  }

  @Get('booking/:bookingId')
  @ProtectedEndpoint(
    'Get security deposit for booking',
    'Retrieve security deposit details for a specific booking',
  )
  async getSecurityDepositByBooking(@Param('bookingId') bookingId: string) {
    return this.securityDepositService.getSecurityDepositByBookingId(bookingId);
  }

  @Get(':depositId')
  @ProtectedEndpoint(
    'Get security deposit by ID',
    'Retrieve detailed information about a specific security deposit',
  )
  async getSecurityDeposit(@Param('depositId') depositId: string) {
    return this.securityDepositService.getSecurityDepositById(depositId);
  }
}
