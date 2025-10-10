import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Property, PropertyDocument } from '../../../database/schemas/property.schema';
import { PropertyType } from '../../../common/enums/property.enums';
import { AccountsFacadeService } from '../../accounts/services/accounts-facade.service';
import { DynamicConfigService } from '../../config/config.service';
import { FeeCalculationService } from '../../fees/services/fee-calculation.service';
import { LoggingUtil } from '../../../common/utils/logging.util';

export interface PropertyFeeCalculation {
  baseAmount: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  hostEarnings: number;
  currency: string;
}

export interface PropertyCommissionSetup {
  propertyId: string;
  hostId: string;
  customFeeRate?: number;
  feeStructure: 'standard' | 'premium' | 'custom';
  effectiveDate: Date;
}

export interface PopulatedProperty extends PropertyDocument {
  host?: {
    joinedAt?: Date;
    totalEarnings?: number;
    _id?: string | Types.ObjectId;
  };
  commission?: {
    customRate?: number;
    feeStructure?: string;
    effectiveDate?: Date;
    updatedAt?: Date;
  };
  isPremium?: boolean;
}

/**
 * Service handling property-specific fee calculations and account integrations
 */
@Injectable()
export class PropertyFeeService {
  constructor(
    @InjectModel(Property.name)
    private readonly propertyModel: Model<PropertyDocument>,
    private readonly accountsFacade: AccountsFacadeService,
    private readonly configService: DynamicConfigService,
    private readonly feeCalculationService: FeeCalculationService,
  ) {}

  /**
   * Calculate platform fees for a property booking
   */
  async calculatePropertyFees(
    propertyId: string,
    bookingAmount: number,
    currency = 'USD',
  ): Promise<PropertyFeeCalculation> {
    try {
      const property = await this.propertyModel.findById(propertyId).exec();
      if (!property) {
        throw new Error('Property not found');
      }

      // Use FeeCalculationService for base fee calculation
      const baseFeeBreakdown = await this.feeCalculationService.calculateFeeBreakdown(
        bookingAmount,
        undefined,
        currency,
      );

      // Check for property-specific fee overrides
      const propertyFeeRate = await this.getPropertySpecificFeeRate(
        propertyId,
        baseFeeBreakdown.hostCommission / bookingAmount,
      );

      // Apply any promotional discounts or premium adjustments
      const finalFeeRate = await this.applyFeeAdjustments(property, propertyFeeRate, bookingAmount);

      const platformFeeAmount = Math.round(bookingAmount * finalFeeRate);
      const hostEarnings = bookingAmount - platformFeeAmount;

      LoggingUtil.log(
        `Calculated fees for property ${propertyId}: Rate=${finalFeeRate}, Fee=${platformFeeAmount}`,
        'PropertyFeeService',
      );

      return {
        baseAmount: bookingAmount,
        platformFeeRate: finalFeeRate,
        platformFeeAmount,
        hostEarnings,
        currency,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error calculating property fees: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error,
        'PropertyFeeService',
      );
      throw error;
    }
  }

  /**
   * Setup commission structure for a property
   */
  async setupPropertyCommission(setup: PropertyCommissionSetup): Promise<void> {
    try {
      const property = await this.propertyModel.findById(setup.propertyId).exec();
      if (!property) {
        throw new Error('Property not found');
      }

      // Verify host ownership
      if (property.hostId.toString() !== setup.hostId) {
        throw new Error('Only property owner can setup commission structure');
      }

      // Update property commission settings
      await this.propertyModel.findByIdAndUpdate(setup.propertyId, {
        $set: {
          'commission.feeStructure': setup.feeStructure,
          'commission.customRate': setup.customFeeRate,
          'commission.effectiveDate': setup.effectiveDate,
          'commission.updatedAt': DateUtils.now(),
        },
      });

      LoggingUtil.log(
        `Commission structure updated for property ${setup.propertyId}`,
        'PropertyFeeService',
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error setting up property commission: ${(error as Error).message}`,
        error,
        'PropertyFeeService',
      );
      throw error;
    }
  }

  /**
   * Get property-specific fee rate (considers premium properties, long-term hosts, etc.)
   */
  private async getPropertySpecificFeeRate(
    propertyId: string,
    baseFeeRate: number,
  ): Promise<number> {
    try {
      const property = await this.propertyModel
        .findById(propertyId)
        .populate('host', 'joinedAt totalEarnings')
        .exec();

      if (!property) {
        return baseFeeRate;
      }

      // Check for custom commission settings
      const propertyWithMetadata = property as PopulatedProperty;

      const customRate = propertyWithMetadata.commission?.customRate;
      if (customRate && typeof customRate === 'number') {
        return customRate;
      }

      // Premium property discounts
      if (propertyWithMetadata.isPremium) {
        const premiumDiscountRate = parseFloat(
          await this.configService.get('PREMIUM_PROPERTY_FEE_DISCOUNT', '0.01'),
        );
        return Math.max(0.02, baseFeeRate - premiumDiscountRate); // Minimum 2% fee
      }

      // Long-term host discounts (hosts with >1 year experience)
      const populatedProperty = property as PopulatedProperty;
      const host = populatedProperty.host;
      if (host && host.joinedAt) {
        const hostExperienceYears =
          (DateUtils.nowTimestamp() - DateUtils.create(host.joinedAt).getTime()) /
          (1000 * 60 * 60 * 24 * 365);

        if (hostExperienceYears >= 1) {
          const experienceDiscountRate = parseFloat(
            await this.configService.get('EXPERIENCED_HOST_FEE_DISCOUNT', '0.005'),
          );
          return Math.max(0.025, baseFeeRate - experienceDiscountRate); // Minimum 2.5% fee
        }
      }

      return baseFeeRate;
    } catch (error) {
      LoggingUtil.warn(
        `Failed to get property-specific fee rate for ${propertyId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PropertyFeeService',
      );
      return baseFeeRate; // Fallback to base rate
    }
  }

  /**
   * Apply dynamic fee adjustments based on booking amount, seasonality, etc.
   */
  private async applyFeeAdjustments(
    property: PropertyDocument,
    baseFeeRate: number,
    bookingAmount: number,
  ): Promise<number> {
    try {
      let adjustedRate = baseFeeRate;

      // High-value booking discounts
      const highValueThreshold = parseFloat(
        await this.configService.get('HIGH_VALUE_BOOKING_THRESHOLD', '2000'),
      );

      if (bookingAmount >= highValueThreshold) {
        const highValueDiscountRate = parseFloat(
          await this.configService.get('HIGH_VALUE_BOOKING_FEE_DISCOUNT', '0.01'),
        );
        adjustedRate = Math.max(0.03, adjustedRate - highValueDiscountRate); // Minimum 3% for high-value bookings
      }

      // Property category adjustments
      const propertyType = property.propertyType;
      if (propertyType === PropertyType.VILLA || propertyType === PropertyType.CASTLE) {
        const luxuryFeeRate = parseFloat(
          await this.configService.get('LUXURY_PROPERTY_FEE_RATE', '0.07'),
        );
        adjustedRate = Math.max(adjustedRate, luxuryFeeRate); // Higher fee for luxury properties
      }

      // Ensure minimum and maximum fee bounds
      const minFeeRate = parseFloat(
        await this.configService.get('MINIMUM_PLATFORM_FEE_RATE', '0.02'),
      );
      const maxFeeRate = parseFloat(
        await this.configService.get('MAXIMUM_PLATFORM_FEE_RATE', '0.15'),
      );

      return Math.min(maxFeeRate, Math.max(minFeeRate, adjustedRate));
    } catch (error) {
      LoggingUtil.warn(
        `Failed to apply fee adjustments for property ${String(property._id)}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PropertyFeeService',
      );
      return baseFeeRate; // Fallback to base rate
    }
  }

  /**
   * Get commission summary for a host's properties
   */
  async getHostCommissionSummary(hostId: string): Promise<{
    totalProperties: number;
    averageFeeRate: number;
    totalEarnings: number;
    totalPlatformFees: number;
    properties: Array<{
      propertyId: string;
      propertyName: string;
      feeRate: number;
      earnings: number;
      platformFees: number;
    }>;
  }> {
    try {
      const properties = await this.propertyModel
        .find({ hostId: hostId })
        .select('name propertyType commission')
        .exec();

      if (!properties.length) {
        return {
          totalProperties: 0,
          averageFeeRate: 0,
          totalEarnings: 0,
          totalPlatformFees: 0,
          properties: [],
        };
      }

      // Get earnings data from accounts module
      const hostAccounts = await this.accountsFacade.getUserAccounts(hostId);
      const totalEarnings = hostAccounts.hostEarnings?.balance.available || 0;

      // Calculate average fee rate across properties
      const baseFeeRate = parseFloat(await this.configService.get('PLATFORM_FEE_RATE', '0.05'));

      const propertyDetails = await Promise.all(
        properties.map(async (property) => {
          const feeRate = await this.getPropertySpecificFeeRate(String(property._id), baseFeeRate);
          const propertyWithName = property as PropertyDocument & { name: string };
          return {
            propertyId: String(property._id),
            propertyName: propertyWithName.name,
            feeRate,
            earnings: 0, // Would need booking history to calculate actual earnings
            platformFees: 0, // Would need booking history to calculate actual fees
          };
        }),
      );

      const averageFeeRate =
        propertyDetails.reduce((sum, p) => sum + p.feeRate, 0) / propertyDetails.length;
      const estimatedTotalPlatformFees = totalEarnings * (averageFeeRate / (1 - averageFeeRate));

      return {
        totalProperties: properties.length,
        averageFeeRate,
        totalEarnings,
        totalPlatformFees: estimatedTotalPlatformFees,
        properties: propertyDetails,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error getting host commission summary: ${(error as Error).message}`,
        error,
        'PropertyFeeService',
      );
      throw error;
    }
  }

  /**
   * Validate fee calculation for external audit/verification
   */
  async validateFeeCalculation(
    propertyId: string,
    bookingAmount: number,
    expectedFeeAmount: number,
  ): Promise<{ isValid: boolean; actualFeeAmount: number; variance: number }> {
    try {
      const calculation = await this.calculatePropertyFees(propertyId, bookingAmount);
      const variance = Math.abs(expectedFeeAmount - calculation.platformFeeAmount);
      const variancePercentage = (variance / expectedFeeAmount) * 100;

      // Allow 1% variance for rounding differences
      const isValid = variancePercentage <= 1;

      return {
        isValid,
        actualFeeAmount: calculation.platformFeeAmount,
        variance,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error validating fee calculation: ${(error as Error).message}`,
        error,
        'PropertyFeeService',
      );
      return {
        isValid: false,
        actualFeeAmount: 0,
        variance: expectedFeeAmount,
      };
    }
  }
}
