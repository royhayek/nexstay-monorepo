import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PayoutFrequency } from '../../../common/enums/payout.enums';
import { PayoutsCoreService } from './payouts-core.service';
import { PayoutsMethodService } from './payouts-method.service';
import { PayoutsCalculationService } from './payouts-calculation.service';
import { PayoutsProcessingService } from './payouts-processing.service';
import { CreatePayoutDto } from '../dto/create-payout.dto';
import { CreatePayoutMethodDto } from '../dto/create-payout-method.dto';
import { UpdatePayoutMethodDto } from '../dto/update-payout-method.dto';
import { UpdatePayoutPreferencesDto } from '../dto/payout-preferences.dto';
import {
  IPayoutService,
  PayoutSearchFilters,
  PayoutPaginationOptions,
  PaginatedPayoutResult,
} from '../interfaces/payout-service.interface';
import {
  EligibleEarningsData,
  AutoPayoutProcessingResult,
  PayoutPreferencesResponse,
} from '../interfaces/payout-types.interface';
import { PayoutDocument } from '../../../database/schemas/payout.schema';
import { PayoutMethodDocument } from '../../../database/schemas/payout-method.schema';

/**
 * Facade service that coordinates between different payout services
 * Implements the main interface and delegates to specialized services
 */
@Injectable()
export class PayoutsFacadeService implements IPayoutService {
  constructor(
    private readonly coreService: PayoutsCoreService,
    private readonly methodService: PayoutsMethodService,
    private readonly calculationService: PayoutsCalculationService,
    private readonly processingService: PayoutsProcessingService,
  ) {}

  // ====== Payout Method Operations ======

  async createPayoutMethod(
    userId: string,
    dto: CreatePayoutMethodDto,
  ): Promise<PayoutMethodDocument> {
    return this.methodService.createPayoutMethod(userId, dto);
  }

  async updatePayoutMethod(
    userId: string,
    payoutMethodId: string,
    dto: UpdatePayoutMethodDto,
  ): Promise<PayoutMethodDocument> {
    return this.methodService.updatePayoutMethod(userId, payoutMethodId, dto);
  }

  async deletePayoutMethod(userId: string, payoutMethodId: string): Promise<void> {
    return this.methodService.deletePayoutMethod(userId, payoutMethodId);
  }

  async getPayoutMethods(userId: string): Promise<PayoutMethodDocument[]> {
    return this.methodService.getPayoutMethods(userId);
  }

  async getPayoutMethodById(userId: string, payoutMethodId: string): Promise<PayoutMethodDocument> {
    return this.methodService.getPayoutMethodById(userId, payoutMethodId);
  }

  // ====== Payout Operations ======

  async createPayout(userId: string, dto: CreatePayoutDto): Promise<PayoutDocument> {
    // Validate payout method
    const payoutMethod = await this.methodService.getPayoutMethodById(userId, dto.payoutMethodId);

    // Get eligible earnings (now using accounts module balance)
    const eligibleEarnings = await this.coreService.getEligibleEarnings(userId);

    // Calculate fees and net amount using unified fee service
    const amount = dto.amount || eligibleEarnings.totalEarnings;
    const fees = await this.calculationService.calculateFees(amount, eligibleEarnings.currency);
    const netAmount = await this.calculationService.calculateNetAmount(
      amount,
      eligibleEarnings.currency,
    );

    // Create the payout
    return this.coreService.createPayout(userId, {
      ...dto,
      payoutMethod,
      grossAmount: amount,
      fees,
      netAmount,
      bookings: eligibleEarnings.bookings.map((booking) => ({
        bookingId: new Types.ObjectId(booking.bookingId),
        bookingAmount: booking.totalAmount,
        hostEarning: booking.hostEarning,
        propertyName: booking.propertyName,
        checkOutDate: booking.checkOutDate,
        guestName: booking.guestName,
      })),
    });
  }

  async cancelPayout(userId: string, payoutId: string, reason?: string): Promise<PayoutDocument> {
    return this.coreService.cancelPayout(userId, payoutId, reason);
  }

  async retryFailedPayout(payoutId: string, adminId?: string): Promise<PayoutDocument> {
    return this.processingService.retryFailedPayout(payoutId, adminId);
  }

  async getPayouts(
    filters: PayoutSearchFilters,
    pagination: PayoutPaginationOptions,
  ): Promise<PaginatedPayoutResult> {
    return this.coreService.getPayouts(filters, pagination);
  }

  async getPayoutById(payoutId: string, userId?: string): Promise<PayoutDocument> {
    return this.coreService.getPayoutById(payoutId, userId);
  }

  // ====== Earnings Operations ======

  async getEligibleEarnings(userId: string): Promise<EligibleEarningsData> {
    return this.coreService.getEligibleEarnings(userId);
  }

  // ====== Preferences Operations ======

  async updatePayoutPreferences(
    userId: string,
    dto: UpdatePayoutPreferencesDto,
  ): Promise<PayoutPreferencesResponse> {
    return this.coreService.updatePayoutPreferences(userId, dto);
  }

  async getPayoutPreferences(userId: string): Promise<PayoutPreferencesResponse> {
    return this.coreService.getPayoutPreferences(userId);
  }

  // ====== Automated Processing ======

  async processAutomaticPayouts(): Promise<AutoPayoutProcessingResult> {
    return this.processingService.processAutomaticPayouts();
  }

  async processScheduledPayouts(): Promise<void> {
    return this.processingService.processScheduledPayouts();
  }

  // ====== Helper Methods ======

  /**
   * Calculate total fees for a payout
   */
  calculatePayoutFees(amount: number, currency: string) {
    return this.calculationService.calculateFees(amount, currency);
  }

  /**
   * Validate payout amount against business rules
   */
  validatePayoutAmount(amount: number, currency: string) {
    return this.calculationService.validatePayoutAmount(amount, currency);
  }

  /**
   * Get next scheduled payout date based on frequency
   */
  getNextPayoutDate(frequency: PayoutFrequency, lastPayoutDate?: Date): Date {
    return this.calculationService.calculateNextPayoutDate(frequency, lastPayoutDate);
  }
}
