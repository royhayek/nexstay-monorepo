import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryBuilder } from '../../common/utils/query-builder.util';
import { DateUtils } from '../../common/utils/date.utils';

import {
  TaxJurisdiction,
  TaxJurisdictionDocument,
} from '../../database/schemas/tax-jurisdiction.schema';
import { TaxRate, TaxRateDocument } from '../../database/schemas/tax-rate.schema';
import {
  TaxCalculation,
  TaxCalculationDocument,
} from '../../database/schemas/tax-calculation.schema';

import {
  TaxType,
  TaxCalculationMethod,
  TaxStatus,
  TaxExemptionType,
} from '../../common/enums/tax.enums';

import {
  TaxCalculationRequest,
  TaxCalculationResult,
  TaxBreakdownItem,
  TaxRateQuery,
  ApplicableTaxRate,
  TaxExemptionCheck,
  TaxExemptionResult,
} from './interfaces/tax-calculation.interface';
import { LoggingUtil } from '../../common/utils/logging.util';

@Injectable()
export class TaxCalculationService {
  constructor(
    @InjectModel(TaxJurisdiction.name) private taxJurisdictionModel: Model<TaxJurisdictionDocument>,
    @InjectModel(TaxRate.name) private taxRateModel: Model<TaxRateDocument>,
    @InjectModel(TaxCalculation.name) private taxCalculationModel: Model<TaxCalculationDocument>,
  ) {}

  /**
   * Calculate taxes for a booking
   */
  async calculateTaxes(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
    try {
      LoggingUtil.log(
        `Calculating taxes for booking: Property ${request.propertyId}`,
        'TaxCalculationService',
      );

      // Validate request
      this.validateTaxCalculationRequest(request);

      // Find applicable tax rates
      const applicableTaxRates = await this.findApplicableTaxRates({
        propertyLocation: request.propertyLocation,
        bookingDate: request.checkInDate,
        stayDuration: this.calculateStayDuration(request.checkInDate, request.checkOutDate),
        bookingAmount: request.subtotalAmount,
      });

      if (applicableTaxRates.length === 0) {
        LoggingUtil.log(
          `No applicable tax rates found for property ${request.propertyId}`,
          'TaxCalculationService',
        );
        return this.createZeroTaxResult(request);
      }

      // Check for exemptions
      const exemptionResult = this.checkTaxExemptions({
        propertyId: request.propertyId,
        guestId: request.guestId,
        hostId: request.hostId,
        exemptionType: request.exemptionDetails?.exemptionType,
        exemptionCertificate: request.exemptionDetails?.exemptionCertificate,
        businessTaxId: request.exemptionDetails?.businessTaxId,
        stayDuration: this.calculateStayDuration(request.checkInDate, request.checkOutDate),
        bookingAmount: request.subtotalAmount,
      });

      // Calculate taxes
      const taxBreakdown: TaxBreakdownItem[] = [];
      let totalTaxAmount = 0;

      for (const taxRate of applicableTaxRates) {
        const isExempted = exemptionResult.exemptedTaxTypes.includes(taxRate.type);

        if (isExempted) {
          // Add exempted tax item with zero amount
          taxBreakdown.push({
            taxRateId: taxRate.id,
            jurisdictionId: taxRate.jurisdictionId,
            taxType: taxRate.type,
            taxName: taxRate.name,
            applicability: taxRate.applicability,
            calculationMethod: taxRate.calculationMethod,
            baseAmount: this.getBaseAmount(request),
            rate: taxRate.rate,
            taxAmount: 0,
            isExempted: true,
            exemptionReason: exemptionResult.exemptionReason,
          });
          continue;
        }

        const baseAmount = this.getBaseAmount(request);
        const taxAmount = this.calculateTaxAmount(baseAmount, taxRate, request);

        taxBreakdown.push({
          taxRateId: taxRate.id,
          jurisdictionId: taxRate.jurisdictionId,
          taxType: taxRate.type,
          taxName: taxRate.name,
          applicability: taxRate.applicability,
          calculationMethod: taxRate.calculationMethod,
          baseAmount,
          rate: taxRate.rate,
          taxAmount,
          isExempted: false,
        });

        totalTaxAmount += taxAmount;
      }

      const result: TaxCalculationResult = {
        subtotalAmount: request.subtotalAmount,
        totalTaxAmount,
        totalAmount: request.subtotalAmount + totalTaxAmount,
        currency: request.currency,
        taxBreakdown,
        exemptionSummary: exemptionResult.isExempted
          ? {
              totalExemptedAmount: exemptionResult.exemptionAmount,
              exemptedTaxes: exemptionResult.exemptedTaxTypes.map((type) => type.toString()),
            }
          : undefined,
      };

      LoggingUtil.log(
        `Tax calculation completed: ${totalTaxAmount} ${request.currency} for property ${request.propertyId}`,
        'TaxCalculationService',
      );

      return result;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error calculating taxes for property ${request.propertyId}:`,
        error,
        'TaxCalculationService',
      );
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to calculate taxes');
    }
  }

  /**
   * Save tax calculation to database
   */
  async saveTaxCalculation(
    bookingId: string,
    request: TaxCalculationRequest,
    calculation: TaxCalculationResult,
  ): Promise<TaxCalculationDocument> {
    try {
      const taxCalculation = new this.taxCalculationModel({
        bookingId: new Types.ObjectId(bookingId),
        propertyId: new Types.ObjectId(request.propertyId),
        guestId: new Types.ObjectId(request.guestId),
        hostId: new Types.ObjectId(request.hostId),
        subtotalAmount: calculation.subtotalAmount,
        totalTaxAmount: calculation.totalTaxAmount,
        totalAmount: calculation.totalAmount,
        currency: calculation.currency,
        taxBreakdown: calculation.taxBreakdown.map((item) => ({
          taxRateId: new Types.ObjectId(item.taxRateId),
          jurisdictionId: new Types.ObjectId(item.jurisdictionId),
          taxType: item.taxType,
          taxName: item.taxName,
          applicability: item.applicability,
          calculationMethod: item.calculationMethod.toString(),
          baseAmount: item.baseAmount,
          rate: item.rate,
          taxAmount: item.taxAmount,
          isExempted: item.isExempted,
          exemptionReason: item.exemptionReason,
          metadata: item.metadata,
        })),
        calculationDate: DateUtils.now(),
        checkInDate: request.checkInDate,
        checkOutDate: request.checkOutDate,
        numberOfNights: this.calculateStayDuration(request.checkInDate, request.checkOutDate),
        numberOfGuests: request.numberOfGuests,
        propertyLocation: request.propertyLocation,
        exemptionDetails: request.exemptionDetails
          ? {
              isExempt: calculation.exemptionSummary ? true : false,
              exemptionType: request.exemptionDetails.exemptionType?.toString(),
              exemptionCertificate: request.exemptionDetails.exemptionCertificate,
              exemptionAmount: calculation.exemptionSummary?.totalExemptedAmount || 0,
              reason: calculation.exemptionSummary
                ? `Exempted taxes: ${calculation.exemptionSummary.exemptedTaxes.join(', ')}`
                : undefined,
            }
          : undefined,
      });

      await taxCalculation.save();
      LoggingUtil.log(`Tax calculation saved for booking ${bookingId}`, 'TaxCalculationService');
      return taxCalculation;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error saving tax calculation for booking ${bookingId}:`,
        error,
        'TaxCalculationService',
      );
      throw new InternalServerErrorException('Failed to save tax calculation');
    }
  }

  /**
   * Get tax calculation by booking ID
   */
  async getTaxCalculationByBookingId(bookingId: string): Promise<TaxCalculationDocument | null> {
    try {
      return await this.taxCalculationModel
        .findOne({ bookingId: new Types.ObjectId(bookingId) })
        .populate('taxBreakdown.taxRateId')
        .populate('taxBreakdown.jurisdictionId')
        .exec();
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error fetching tax calculation for booking ${bookingId}:`,
        error,
        'TaxCalculationService',
      );
      throw new InternalServerErrorException('Failed to fetch tax calculation');
    }
  }

  /**
   * Find applicable tax rates for a given property and booking
   */
  private async findApplicableTaxRates(query: TaxRateQuery): Promise<ApplicableTaxRate[]> {
    try {
      // Find jurisdictions that cover the property location
      const jurisdictions = await this.findJurisdictionsForLocation(query.propertyLocation);

      if (jurisdictions.length === 0) {
        LoggingUtil.log(
          `No jurisdictions found for location: ${query.propertyLocation.city}, ${query.propertyLocation.country}`,
          'TaxCalculationService',
        );
        return [];
      }

      // Find active tax rates for these jurisdictions
      const taxRates = await this.taxRateModel
        .find({
          jurisdictionId: { $in: jurisdictions.map((j) => j._id) },
          status: TaxStatus.ACTIVE,
          effectiveFrom: { $lte: query.bookingDate },
          $or: [{ effectiveTo: { $exists: false } }, { effectiveTo: { $gte: query.bookingDate } }],
          // Apply filters based on booking criteria
          ...(query.stayDuration && {
            $or: [
              { minimumStayDays: { $exists: false } },
              { minimumStayDays: { $lte: query.stayDuration } },
            ],
          }),
          ...(query.stayDuration && {
            $or: [
              { maximumStayDays: { $exists: false } },
              { maximumStayDays: { $gte: query.stayDuration } },
            ],
          }),
          ...(query.bookingAmount && {
            $or: [
              { minimumBookingAmount: { $exists: false } },
              { minimumBookingAmount: { $lte: query.bookingAmount } },
            ],
          }),
          ...(query.bookingAmount && {
            $or: [
              { maximumBookingAmount: { $exists: false } },
              { maximumBookingAmount: { $gte: query.bookingAmount } },
            ],
          }),
        })
        .sort({ priority: 1, effectiveFrom: -1 })
        .exec();

      return taxRates.map((rate) => ({
        id: String(rate._id),
        jurisdictionId: rate.jurisdictionId.toString(),
        type: rate.type,
        name: rate.name,
        calculationMethod: rate.calculationMethod,
        rate: rate.rate,
        applicability: rate.applicability,
        minimumAmount: rate.minimumAmount,
        maximumAmount: rate.maximumAmount,
        fixedAmount: rate.fixedAmount,
        progressiveRates: rate.progressiveRates,
        priority: rate.priority,
      }));
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error finding applicable tax rates:',
        error,
        'TaxCalculationService',
      );
      throw new InternalServerErrorException('Failed to find applicable tax rates');
    }
  }

  /**
   * Find jurisdictions that cover a specific location
   */
  private async findJurisdictionsForLocation(
    location: TaxRateQuery['propertyLocation'],
  ): Promise<TaxJurisdictionDocument[]> {
    try {
      // Build query using QueryBuilder
      const queryBuilder = QueryBuilder.create()
        .addEnumFilter('status', TaxStatus.ACTIVE)
        .addStringFilter('country', location.country);

      if (location.state) {
        queryBuilder.addStringFilter('state', location.state);
      }

      if (location.city) {
        queryBuilder.addStringFilter('city', location.city);
      }

      const query = queryBuilder.build();

      // First try exact match
      let jurisdictions = await this.taxJurisdictionModel.find(query).exec();

      // If no exact match and we have coordinates, try geo-spatial query
      if (jurisdictions.length === 0 && location.coordinates) {
        const geoQuery = QueryBuilder.create()
          .addEnumFilter('status', TaxStatus.ACTIVE)
          .addCustomFilter('boundaries', {
            $geoIntersects: {
              $geometry: {
                type: 'Point',
                coordinates: [location.coordinates.longitude, location.coordinates.latitude],
              },
            },
          })
          .build();

        jurisdictions = await this.taxJurisdictionModel.find(geoQuery).exec();
      }

      return jurisdictions;
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error finding jurisdictions for location:',
        error,
        'TaxCalculationService',
      );
      return [];
    }
  }

  /**
   * Check for tax exemptions
   */
  private checkTaxExemptions(check: TaxExemptionCheck): TaxExemptionResult {
    try {
      // Basic exemption logic - can be extended based on business rules
      const exemptedTaxTypes: TaxType[] = [];
      const exemptionAmount = 0;
      let exemptionReason = '';

      // Long-term stay exemption (example: stays > 30 days)
      if (check.exemptionType === TaxExemptionType.LONG_TERM_STAY && check.stayDuration > 30) {
        exemptedTaxTypes.push(TaxType.OCCUPANCY_TAX, TaxType.TOURISM_TAX);
        exemptionReason = 'Long-term stay exemption';
      }

      // Business travel exemption
      if (check.exemptionType === TaxExemptionType.BUSINESS_TRAVEL && check.businessTaxId) {
        exemptedTaxTypes.push(TaxType.VAT, TaxType.GST);
        exemptionReason = 'Business travel exemption';
      }

      // Student exemption
      if (check.exemptionType === TaxExemptionType.STUDENT) {
        exemptedTaxTypes.push(TaxType.CITY_TAX, TaxType.TOURISM_TAX);
        exemptionReason = 'Student exemption';
      }

      return {
        isExempted: exemptedTaxTypes.length > 0,
        exemptedTaxTypes,
        exemptionAmount,
        exemptionReason: exemptedTaxTypes.length > 0 ? exemptionReason : undefined,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error checking tax exemptions:',
        error,
        'TaxCalculationService',
      );
      return {
        isExempted: false,
        exemptedTaxTypes: [],
        exemptionAmount: 0,
      };
    }
  }

  /**
   * Calculate tax amount based on tax rate and calculation method
   */
  private calculateTaxAmount(
    baseAmount: number,
    taxRate: ApplicableTaxRate,
    request: TaxCalculationRequest,
  ): number {
    let taxAmount = 0;

    switch (taxRate.calculationMethod) {
      case TaxCalculationMethod.PERCENTAGE:
        taxAmount = baseAmount * (taxRate.rate / 100);
        break;

      case TaxCalculationMethod.FIXED_AMOUNT:
        taxAmount = taxRate.fixedAmount || 0;
        break;

      case TaxCalculationMethod.PER_NIGHT:
        taxAmount =
          (taxRate.fixedAmount || taxRate.rate) *
          this.calculateStayDuration(request.checkInDate, request.checkOutDate);
        break;

      case TaxCalculationMethod.PER_GUEST:
        taxAmount = (taxRate.fixedAmount || taxRate.rate) * request.numberOfGuests;
        break;

      case TaxCalculationMethod.PROGRESSIVE:
        taxAmount = this.calculateProgressiveTax(baseAmount, taxRate.progressiveRates || []);
        break;

      default:
        taxAmount = baseAmount * (taxRate.rate / 100);
        break;
    }

    // Apply minimum and maximum limits
    if (taxRate.minimumAmount && taxAmount < taxRate.minimumAmount) {
      taxAmount = taxRate.minimumAmount;
    }

    if (taxRate.maximumAmount && taxAmount > taxRate.maximumAmount) {
      taxAmount = taxRate.maximumAmount;
    }

    return Math.round(taxAmount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate progressive tax
   */
  private calculateProgressiveTax(
    amount: number,
    brackets: ApplicableTaxRate['progressiveRates'],
  ): number {
    if (!brackets || brackets.length === 0) return 0;

    let totalTax = 0;
    let remainingAmount = amount;

    for (const bracket of brackets) {
      if (remainingAmount <= 0) break;

      const bracketMax = bracket.to || Number.MAX_VALUE;
      const taxableInBracket = Math.min(remainingAmount, bracketMax - bracket.from);

      if (taxableInBracket > 0) {
        const bracketTax = taxableInBracket * (bracket.rate / 100) + (bracket.fixedAmount || 0);
        totalTax += bracketTax;
        remainingAmount -= taxableInBracket;
      }
    }

    return totalTax;
  }

  /**
   * Get base amount for tax calculation based on applicability
   */
  private getBaseAmount(request: TaxCalculationRequest): number {
    // For now, using subtotal amount as base for all tax types
    // Can be customized based on tax type and applicability
    return request.subtotalAmount;
  }

  /**
   * Calculate stay duration in nights
   */
  private calculateStayDuration(checkIn: Date, checkOut: Date): number {
    return DateUtils.daysBetween(checkIn, checkOut);
  }

  /**
   * Create zero tax result for cases with no applicable taxes
   */
  private createZeroTaxResult(request: TaxCalculationRequest): TaxCalculationResult {
    return {
      subtotalAmount: request.subtotalAmount,
      totalTaxAmount: 0,
      totalAmount: request.subtotalAmount,
      currency: request.currency,
      taxBreakdown: [],
    };
  }

  /**
   * Validate tax calculation request
   */
  private validateTaxCalculationRequest(request: TaxCalculationRequest): void {
    if (!request.propertyId || !request.guestId || !request.hostId) {
      throw new BadRequestException('Property ID, Guest ID, and Host ID are required');
    }

    if (!request.checkInDate || !request.checkOutDate) {
      throw new BadRequestException('Check-in and check-out dates are required');
    }

    if (!DateUtils.isBefore(request.checkInDate, request.checkOutDate)) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    if (request.subtotalAmount <= 0) {
      throw new BadRequestException('Subtotal amount must be greater than zero');
    }

    if (request.numberOfGuests < 1) {
      throw new BadRequestException('Number of guests must be at least 1');
    }

    if (!request.propertyLocation?.country) {
      throw new BadRequestException('Property location with country is required');
    }
  }
}
