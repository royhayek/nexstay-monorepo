import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiEndpoint, PublicEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { UserRole } from '../../../database/schemas/user.schema';

import { BaseController } from '../../../common/controllers/base.controller';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';

import { TaxCalculationService } from '../tax-calculation.service';
import { CalculateTaxDto } from '../dto/calculate-tax.dto';
import { TaxCalculationResponseDto } from '../dto/tax-calculation-response.dto';
import { TaxCalculationDocument } from '../../../database/schemas/tax-calculation.schema';
import { DateUtils } from '../../../common/utils/date.utils';

@ApiTags('Tax Calculation')
@Controller('tax')
export class TaxCalculationController extends BaseController {
  constructor(private readonly taxCalculationService: TaxCalculationService) {
    super();
  }

  @Post('calculate')
  @ApiEndpoint({
    summary: 'Calculate taxes for a booking',
    description:
      'Calculate applicable taxes based on property location, booking details, and guest information',
    auth: {
      required: true,
      roles: [UserRole.GUEST, UserRole.HOST, UserRole.ADMIN],
    },
    responses: {
      success: {
        description: 'Tax calculation completed successfully',
        type: TaxCalculationResponseDto,
      },
      errors: {
        badRequest: 'Invalid request data',
      },
    },
  })
  async calculateTax(@Body() calculateTaxDto: CalculateTaxDto): Promise<TaxCalculationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const request = {
          ...calculateTaxDto,
          checkInDate: DateUtils.create(calculateTaxDto.checkInDate),
          checkOutDate: DateUtils.create(calculateTaxDto.checkOutDate),
        };

        const calculation = await this.taxCalculationService.calculateTaxes(request);

        return {
          subtotalAmount: calculation.subtotalAmount,
          totalTaxAmount: calculation.totalTaxAmount,
          totalAmount: calculation.totalAmount,
          currency: calculation.currency,
          taxBreakdown: calculation.taxBreakdown.map((item) => ({
            taxRateId: item.taxRateId,
            jurisdictionId: item.jurisdictionId,
            taxType: item.taxType,
            taxName: item.taxName,
            applicability: item.applicability,
            calculationMethod: item.calculationMethod,
            baseAmount: item.baseAmount,
            rate: item.rate,
            taxAmount: item.taxAmount,
            isExempted: item.isExempted,
            exemptionReason: item.exemptionReason,
            metadata: item.metadata,
          })),
          exemptionSummary: calculation.exemptionSummary
            ? {
                totalExemptedAmount: calculation.exemptionSummary.totalExemptedAmount,
                exemptedTaxes: calculation.exemptionSummary.exemptedTaxes,
              }
            : undefined,
        };
      },
      'Calculating taxes',
      'Tax Calculation Completed',
      'Taxes have been calculated successfully for your booking.',
      'Failed to calculate taxes',
    );
  }

  @Get('booking/:bookingId')
  @ApiEndpoint({
    summary: 'Get tax calculation for booking',
    description: 'Retrieve saved tax calculation details for a specific booking',
    auth: {
      required: true,
      roles: [UserRole.GUEST, UserRole.HOST, UserRole.ADMIN],
    },
    responses: {
      success: {
        description: 'Tax calculation retrieved successfully',
      },
      errors: {
        notFound: 'Tax calculation not found for this booking',
      },
    },
  })
  async getTaxCalculationByBooking(
    @Param('bookingId') bookingId: string,
  ): Promise<BaseResponseDto<TaxCalculationDocument | null>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const taxCalculation =
          await this.taxCalculationService.getTaxCalculationByBookingId(bookingId);

        if (!taxCalculation) {
          return null;
        }

        return taxCalculation;
      },
      'Retrieving tax calculation by booking ID',
      'Tax Calculation Retrieved',
      'Tax calculation details have been retrieved successfully.',
      'Failed to retrieve tax calculation',
    );
  }

  @Post('estimate')
  @PublicEndpoint(
    'Estimate taxes for booking preview',
    'Get a tax estimate before creating a booking (public endpoint for booking preview)',
  )
  async estimateTax(@Body() calculateTaxDto: CalculateTaxDto): Promise<TaxCalculationResponseDto> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const request = {
          ...calculateTaxDto,
          checkInDate: DateUtils.create(calculateTaxDto.checkInDate),
          checkOutDate: DateUtils.create(calculateTaxDto.checkOutDate),
        };

        const calculation = await this.taxCalculationService.calculateTaxes(request);

        return {
          subtotalAmount: calculation.subtotalAmount,
          totalTaxAmount: calculation.totalTaxAmount,
          totalAmount: calculation.totalAmount,
          currency: calculation.currency,
          taxBreakdown: calculation.taxBreakdown.map((item) => ({
            taxRateId: item.taxRateId,
            jurisdictionId: item.jurisdictionId,
            taxType: item.taxType,
            taxName: item.taxName,
            applicability: item.applicability,
            calculationMethod: item.calculationMethod,
            baseAmount: item.baseAmount,
            rate: item.rate,
            taxAmount: item.taxAmount,
            isExempted: item.isExempted,
            exemptionReason: item.exemptionReason,
            metadata: item.metadata,
          })),
          exemptionSummary: calculation.exemptionSummary
            ? {
                totalExemptedAmount: calculation.exemptionSummary.totalExemptedAmount,
                exemptedTaxes: calculation.exemptionSummary.exemptedTaxes,
              }
            : undefined,
        };
      },
      'Estimating taxes',
      'Tax Estimate Calculated',
      'Tax estimate has been calculated successfully.',
      'Failed to estimate taxes',
    );
  }
}
