import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DateUtils } from '../../../common/utils/date.utils';
import { ValidationUtils } from '../../../common/utils/validation.utils';
import { Model } from 'mongoose';
import { QueryBuilder } from '../../../common/utils/query-builder.util';
import { PayoutMethod, PayoutMethodDocument } from '../../../database/schemas/payout-method.schema';
import { Payout, PayoutDocument } from '../../../database/schemas/payout.schema';
import { PayoutMethodStatus, PayoutMethodType } from '../../../common/enums/payout.enums';
import { CreatePayoutMethodDto } from '../dto/create-payout-method.dto';
import { UpdatePayoutMethodDto } from '../dto/update-payout-method.dto';
import { PayoutErrorCode } from '../enums/payout-error.enums';
import { LoggingUtil } from '../../../common/utils/logging.util';

/**
 * Interface for payout method service operations
 */
interface IPayoutsMethodService {
  createPayoutMethod(userId: string, dto: CreatePayoutMethodDto): Promise<PayoutMethodDocument>;
  updatePayoutMethod(
    userId: string,
    payoutMethodId: string,
    dto: UpdatePayoutMethodDto,
  ): Promise<PayoutMethodDocument>;
  deletePayoutMethod(userId: string, payoutMethodId: string): Promise<void>;
  getPayoutMethods(userId: string): Promise<PayoutMethodDocument[]>;
  getPayoutMethodById(userId: string, payoutMethodId: string): Promise<PayoutMethodDocument>;
  verifyPayoutMethod(payoutMethodId: string): Promise<PayoutMethodDocument>;
  suspendPayoutMethod(
    payoutMethodId: string,
    reason: string,
    adminId?: string,
  ): Promise<PayoutMethodDocument>;
}

/**
 * Service for managing payout methods
 * Handles creation, update, deletion, and retrieval of payout methods
 */
@Injectable()
export class PayoutsMethodService implements IPayoutsMethodService {
  constructor(
    @InjectModel(PayoutMethod.name) private payoutMethodModel: Model<PayoutMethodDocument>,
    @InjectModel(Payout.name) private payoutModel: Model<PayoutDocument>,
  ) {}

  /**
   * Create a new payout method
   */
  async createPayoutMethod(
    userId: string,
    dto: CreatePayoutMethodDto,
  ): Promise<PayoutMethodDocument> {
    ValidationUtils.validateObjectId(userId, 'userId', {
      context: 'PayoutsMethodService',
    });

    try {
      // Validate bank account or wallet details based on type
      this.validatePayoutMethodData(dto);

      // If setting as default, unset other defaults
      if (dto.isDefault) {
        await this.payoutMethodModel.updateMany(
          { userId, isDefault: true },
          { $set: { isDefault: false } },
        );
      }

      // Create the payout method
      const payoutMethod = new this.payoutMethodModel({
        ...dto,
        userId,
        status: PayoutMethodStatus.PENDING, // Requires verification
        reference: this.generateReference('PM'),
      });

      await payoutMethod.save();
      LoggingUtil.log(
        `Payout method created for user ${userId}: ${String(payoutMethod._id)}`,
        'PayoutsMethodService',
      );

      return payoutMethod;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error creating payout method for user ${userId}:`,
        error,
        'PayoutsMethodService',
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        code: PayoutErrorCode.INTERNAL_ERROR,
        message: 'Failed to create payout method',
      });
    }
  }

  /**
   * Update an existing payout method
   */
  async updatePayoutMethod(
    userId: string,
    payoutMethodId: string,
    dto: UpdatePayoutMethodDto,
  ): Promise<PayoutMethodDocument> {
    try {
      const payoutMethod = await this.payoutMethodModel.findOne({
        _id: payoutMethodId,
        userId,
      });

      if (!payoutMethod) {
        throw new NotFoundException({
          code: PayoutErrorCode.METHOD_NOT_FOUND,
          message: 'Payout method not found',
        });
      }

      // Validate the update data if changing method details
      if (dto.bankAccount || dto.wallet) {
        this.validatePayoutMethodData(dto as CreatePayoutMethodDto);
      }

      // If setting as default, unset other defaults
      if (dto.isDefault && !payoutMethod.isDefault) {
        await this.payoutMethodModel.updateMany(
          { userId, isDefault: true, _id: { $ne: payoutMethodId } },
          { $set: { isDefault: false } },
        );
      }

      // Update the payout method
      Object.assign(payoutMethod, dto);
      await payoutMethod.save();

      LoggingUtil.log(`Payout method updated: ${payoutMethodId}`, 'PayoutsMethodService');
      return payoutMethod;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error updating payout method ${payoutMethodId}:`,
        error,
        'PayoutsMethodService',
      );

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException({
        code: PayoutErrorCode.INTERNAL_ERROR,
        message: 'Failed to update payout method',
      });
    }
  }

  /**
   * Delete a payout method
   */
  async deletePayoutMethod(userId: string, payoutMethodId: string): Promise<void> {
    try {
      const payoutMethod = await this.payoutMethodModel.findOne({
        _id: payoutMethodId,
        userId,
      });

      if (!payoutMethod) {
        throw new NotFoundException({
          code: PayoutErrorCode.METHOD_NOT_FOUND,
          message: 'Payout method not found',
        });
      }

      // Check if method is used in any pending payouts
      const query = QueryBuilder.create()
        .addStringFilter('payoutMethodId', payoutMethodId)
        .addCustomFilter('status', { $in: ['pending', 'processing', 'in_transit'] })
        .build();

      const pendingPayouts = await this.payoutModel.countDocuments(query);

      if (pendingPayouts > 0) {
        throw new ConflictException('Cannot delete payout method with pending payouts');
      }

      // If this was the default method, set another as default
      if (payoutMethod.isDefault) {
        const anotherMethod = await this.payoutMethodModel.findOne({
          userId,
          _id: { $ne: payoutMethodId },
          status: PayoutMethodStatus.VERIFIED,
        });

        if (anotherMethod) {
          anotherMethod.isDefault = true;
          await anotherMethod.save();
        }
      }

      await payoutMethod.deleteOne();
      LoggingUtil.log(`Payout method deleted: ${payoutMethodId}`, 'PayoutsMethodService');
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error deleting payout method ${payoutMethodId}:`,
        error,
        'PayoutsMethodService',
      );

      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException({
        code: PayoutErrorCode.INTERNAL_ERROR,
        message: 'Failed to delete payout method',
      });
    }
  }

  /**
   * Get all payout methods for a user
   */
  async getPayoutMethods(userId: string): Promise<PayoutMethodDocument[]> {
    try {
      const methods = await this.payoutMethodModel
        .find({ userId })
        .sort({ isDefault: -1, createdAt: -1 })
        .exec();

      return methods;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error fetching payout methods for user ${userId}:`,
        error,
        'PayoutsMethodService',
      );
      throw new InternalServerErrorException({
        code: PayoutErrorCode.DATABASE_ERROR,
        message: 'Failed to fetch payout methods',
      });
    }
  }

  /**
   * Get a specific payout method
   */
  async getPayoutMethodById(userId: string, payoutMethodId: string): Promise<PayoutMethodDocument> {
    try {
      const payoutMethod = await this.payoutMethodModel.findOne({
        _id: payoutMethodId,
        userId,
      });

      if (!payoutMethod) {
        throw new NotFoundException({
          code: PayoutErrorCode.METHOD_NOT_FOUND,
          message: 'Payout method not found',
        });
      }

      return payoutMethod;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      LoggingUtil.errorWithException(
        `Error fetching payout method ${payoutMethodId}:`,
        error,
        'PayoutsMethodService',
      );
      throw new InternalServerErrorException({
        code: PayoutErrorCode.DATABASE_ERROR,
        message: 'Failed to fetch payout method',
      });
    }
  }

  /**
   * Verify a payout method (admin action or automatic verification)
   */
  async verifyPayoutMethod(payoutMethodId: string): Promise<PayoutMethodDocument> {
    try {
      const payoutMethod = await this.payoutMethodModel.findById(payoutMethodId);

      if (!payoutMethod) {
        throw new NotFoundException({
          code: PayoutErrorCode.METHOD_NOT_FOUND,
          message: 'Payout method not found',
        });
      }

      payoutMethod.status = PayoutMethodStatus.VERIFIED;
      payoutMethod.verifiedAt = DateUtils.now();

      await payoutMethod.save();
      LoggingUtil.log(`Payout method verified: ${payoutMethodId}`, 'PayoutsMethodService');

      return payoutMethod;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      LoggingUtil.errorWithException(
        `Error verifying payout method ${payoutMethodId}:`,
        error,
        'PayoutsMethodService',
      );
      throw new InternalServerErrorException({
        code: PayoutErrorCode.INTERNAL_ERROR,
        message: 'Failed to verify payout method',
      });
    }
  }

  /**
   * Suspend a payout method (security or compliance action)
   */
  async suspendPayoutMethod(
    payoutMethodId: string,
    reason: string,
    adminId?: string,
  ): Promise<PayoutMethodDocument> {
    try {
      const payoutMethod = await this.payoutMethodModel.findById(payoutMethodId);

      if (!payoutMethod) {
        throw new NotFoundException({
          code: PayoutErrorCode.METHOD_NOT_FOUND,
          message: 'Payout method not found',
        });
      }

      payoutMethod.status = PayoutMethodStatus.SUSPENDED;
      // Store suspension details in metadata since specific fields don't exist in schema
      payoutMethod.metadata = {
        ...payoutMethod.metadata,
        suspensionReason: reason,
        suspendedAt: DateUtils.now(),
        suspendedBy: adminId || null,
      };

      await payoutMethod.save();
      LoggingUtil.log(`Payout method suspended: ${payoutMethodId}`, 'PayoutsMethodService');

      return payoutMethod;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      LoggingUtil.errorWithException(
        `Error suspending payout method ${payoutMethodId}:`,
        error,
        'PayoutsMethodService',
      );
      throw new InternalServerErrorException({
        code: PayoutErrorCode.INTERNAL_ERROR,
        message: 'Failed to suspend payout method',
      });
    }
  }

  /**
   * Validate payout method data based on type
   */
  private validatePayoutMethodData(dto: CreatePayoutMethodDto | UpdatePayoutMethodDto): void {
    const { type, bankAccount, wallet } = dto as CreatePayoutMethodDto;

    if (type === PayoutMethodType.BANK_ACCOUNT && !bankAccount) {
      throw new BadRequestException('Bank account details are required for bank account type');
    }

    if (type === PayoutMethodType.WALLET && !wallet) {
      throw new BadRequestException('Wallet details are required for wallet type');
    }

    // Additional validation can be added here
    // e.g., IBAN format validation, routing number checks, etc.
  }

  /**
   * Generate unique reference for payout methods
   */
  private generateReference(prefix: string): string {
    const timestamp = DateUtils.nowTimestamp();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }
}
