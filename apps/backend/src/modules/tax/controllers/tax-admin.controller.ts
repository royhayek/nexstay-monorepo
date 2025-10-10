import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminEndpoint } from '../../../common/decorators/api-endpoint.decorator';
import { Types } from 'mongoose';

import { BaseController } from '../../../common/controllers/base.controller';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { PaginatedDto } from '../../../common/dto/paginated.dto';

import { TaxManagementService } from '../tax-management.service';
import { CreateTaxJurisdictionDto } from '../dto/create-tax-jurisdiction.dto';
import { CreateTaxRateDto } from '../dto/create-tax-rate.dto';
import {
  TaxStatus,
  TaxType,
  TaxJurisdictionLevel,
  TaxReportingPeriod,
  TaxComplianceStatus,
} from '../../../common/enums/tax.enums';
import { TaxJurisdictionDocument } from '../../../database/schemas/tax-jurisdiction.schema';
import { TaxRateDocument } from '../../../database/schemas/tax-rate.schema';
import { TaxReportDocument } from '../../../database/schemas/tax-report.schema';
import { TaxAnalyticsResponseDto } from '../dto/tax-analytics-response.dto';
import { GenerateTaxReportDto } from '../dto/generate-tax-report.dto';
import { JurisdictionOptionDto } from '../dto/jurisdiction-option.dto';
import { GenerateReportFileDto, ReportFileResponseDto } from '../dto/generate-report-file.dto';
import { DateUtils } from '../../../common/utils/date.utils';

@ApiTags('Tax Management')
@Controller('admin/tax')
export class TaxAdminController extends BaseController {
  constructor(private readonly taxManagementService: TaxManagementService) {
    super();
  }

  // Tax Jurisdictions Management

  @Post('jurisdictions')
  @AdminEndpoint(
    'Create tax jurisdiction',
    'Create a new tax jurisdiction for tax calculation purposes',
  )
  async createTaxJurisdiction(
    @Body() createJurisdictionDto: CreateTaxJurisdictionDto,
  ): Promise<BaseResponseDto<TaxJurisdictionDocument>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const jurisdictionData = {
          ...createJurisdictionDto,
          effectiveFrom: DateUtils.create(createJurisdictionDto.effectiveFrom),
          effectiveTo: createJurisdictionDto.effectiveTo
            ? DateUtils.create(createJurisdictionDto.effectiveTo)
            : undefined,
          parentJurisdiction: createJurisdictionDto.parentJurisdiction
            ? new Types.ObjectId(createJurisdictionDto.parentJurisdiction)
            : undefined,
        };

        return await this.taxManagementService.createTaxJurisdiction(jurisdictionData);
      },
      'Creating tax jurisdiction',
      'Tax Jurisdiction Created',
      'Tax jurisdiction has been created successfully.',
      'Failed to create tax jurisdiction',
    );
  }

  @Get('jurisdictions')
  @AdminEndpoint('Get tax jurisdictions', 'Retrieve all tax jurisdictions with optional filtering')
  @ApiQuery({ name: 'country', required: false, description: 'Filter by country' })
  @ApiQuery({
    name: 'level',
    required: false,
    enum: TaxJurisdictionLevel,
    description: 'Filter by jurisdiction level',
  })
  @ApiQuery({ name: 'status', required: false, enum: TaxStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  async getTaxJurisdictions(
    @Query('country') country?: string,
    @Query('level') level?: TaxJurisdictionLevel,
    @Query('status') status?: TaxStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<BaseResponseDto<PaginatedDto<TaxJurisdictionDocument>>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const filters = { country, level, status, page, limit };
        const result = await this.taxManagementService.getTaxJurisdictions(filters);

        return {
          items: result.jurisdictions,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
          hasNextPage: result.page < Math.ceil(result.total / result.limit),
          hasPrevPage: result.page > 1,
        };
      },
      'Retrieving tax jurisdictions',
      'Tax Jurisdictions Retrieved',
      'Tax jurisdictions have been retrieved successfully.',
      'Failed to retrieve tax jurisdictions',
    );
  }

  @Get('jurisdictions/options')
  @AdminEndpoint(
    'Get jurisdiction options for forms',
    'Get a simplified list of jurisdictions for dropdown/form use',
  )
  @ApiQuery({ name: 'country', required: false, description: 'Filter by country' })
  @ApiQuery({
    name: 'level',
    required: false,
    enum: TaxJurisdictionLevel,
    description: 'Filter by jurisdiction level',
  })
  async getJurisdictionOptions(
    @Query('country') country?: string,
    @Query('level') level?: TaxJurisdictionLevel,
  ): Promise<BaseResponseDto<JurisdictionOptionDto[]>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const filters = { country, level, status: TaxStatus.ACTIVE };
        const result = await this.taxManagementService.getTaxJurisdictions(filters);

        return result.jurisdictions.map((jurisdiction) => ({
          id: String(jurisdiction._id),
          name: jurisdiction.name,
          code: jurisdiction.code,
          level: jurisdiction.level,
          country: jurisdiction.country,
          state: jurisdiction.state,
          city: jurisdiction.city,
          displayName: this.createDisplayName(jurisdiction),
        }));
      },
      'Retrieving jurisdiction options',
      'Jurisdiction Options Retrieved',
      'Jurisdiction options have been retrieved successfully.',
      'Failed to retrieve jurisdiction options',
    );
  }

  @Put('jurisdictions/:jurisdictionId')
  @AdminEndpoint('Update tax jurisdiction', 'Update an existing tax jurisdiction', undefined)
  async updateTaxJurisdiction(
    @Param('jurisdictionId') jurisdictionId: string,
    @Body() updateJurisdictionDto: Partial<CreateTaxJurisdictionDto>,
  ): Promise<BaseResponseDto<TaxJurisdictionDocument>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const updateData = {
          ...updateJurisdictionDto,
          effectiveFrom: updateJurisdictionDto.effectiveFrom
            ? DateUtils.create(updateJurisdictionDto.effectiveFrom)
            : undefined,
          effectiveTo: updateJurisdictionDto.effectiveTo
            ? DateUtils.create(updateJurisdictionDto.effectiveTo)
            : undefined,
          parentJurisdiction: updateJurisdictionDto.parentJurisdiction
            ? new Types.ObjectId(updateJurisdictionDto.parentJurisdiction)
            : undefined,
        };

        return await this.taxManagementService.updateTaxJurisdiction(jurisdictionId, updateData);
      },
      'Updating tax jurisdiction',
      'Tax Jurisdiction Updated',
      'Tax jurisdiction has been updated successfully.',
      'Failed to update tax jurisdiction',
    );
  }

  // Tax Rates Management

  @Post('rates')
  @AdminEndpoint('Create tax rate', 'Create a new tax rate for a specific jurisdiction', undefined)
  async createTaxRate(
    @Body() createTaxRateDto: CreateTaxRateDto,
  ): Promise<BaseResponseDto<TaxRateDocument>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const taxRateData = {
          ...createTaxRateDto,
          effectiveFrom: DateUtils.create(createTaxRateDto.effectiveFrom),
          effectiveTo: createTaxRateDto.effectiveTo
            ? DateUtils.create(createTaxRateDto.effectiveTo)
            : undefined,
          jurisdictionId: new Types.ObjectId(createTaxRateDto.jurisdictionId),
        };

        return await this.taxManagementService.createTaxRate(taxRateData);
      },
      'Creating tax rate',
      'Tax Rate Created',
      'Tax rate has been created successfully.',
      'Failed to create tax rate',
    );
  }

  @Get('rates')
  @AdminEndpoint('Get tax rates', 'Retrieve all tax rates with optional filtering', undefined)
  @ApiQuery({ name: 'jurisdictionId', required: false, description: 'Filter by jurisdiction ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by tax type' })
  @ApiQuery({ name: 'status', required: false, enum: TaxStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'effectiveDate', required: false, description: 'Filter by effective date' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  async getTaxRates(
    @Query('jurisdictionId') jurisdictionId?: string,
    @Query('type') type?: string,
    @Query('status') status?: TaxStatus,
    @Query('effectiveDate') effectiveDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<BaseResponseDto<PaginatedDto<TaxRateDocument>>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const filters = {
          jurisdictionId,
          type: type as TaxType,
          status,
          effectiveDate: effectiveDate ? DateUtils.create(effectiveDate) : undefined,
          page,
          limit,
        };

        const result = await this.taxManagementService.getTaxRates(filters);

        return {
          items: result.data,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };
      },
      'Retrieving tax rates',
      'Tax Rates Retrieved',
      'Tax rates have been retrieved successfully.',
      'Failed to retrieve tax rates',
    );
  }

  @Put('rates/:taxRateId')
  @AdminEndpoint('Update tax rate', 'Update an existing tax rate', undefined)
  async updateTaxRate(
    @Param('taxRateId') taxRateId: string,
    @Body() updateTaxRateDto: Partial<CreateTaxRateDto>,
  ): Promise<BaseResponseDto<TaxRateDocument>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const updateData = {
          ...updateTaxRateDto,
          effectiveFrom: updateTaxRateDto.effectiveFrom
            ? DateUtils.create(updateTaxRateDto.effectiveFrom)
            : undefined,
          effectiveTo: updateTaxRateDto.effectiveTo
            ? DateUtils.create(updateTaxRateDto.effectiveTo)
            : undefined,
          jurisdictionId: updateTaxRateDto.jurisdictionId
            ? new Types.ObjectId(updateTaxRateDto.jurisdictionId)
            : undefined,
        };

        return await this.taxManagementService.updateTaxRate(taxRateId, updateData);
      },
      'Updating tax rate',
      'Tax Rate Updated',
      'Tax rate has been updated successfully.',
      'Failed to update tax rate',
    );
  }

  @Delete('rates/:taxRateId/deactivate')
  @AdminEndpoint('Deactivate tax rate', 'Deactivate a tax rate (soft delete)', undefined)
  async deactivateTaxRate(
    @Param('taxRateId') taxRateId: string,
    @Query('effectiveDate') effectiveDate?: string,
  ): Promise<BaseResponseDto<TaxRateDocument>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const deactivationDate = effectiveDate ? DateUtils.create(effectiveDate) : undefined;
        return await this.taxManagementService.deactivateTaxRate(taxRateId, deactivationDate);
      },
      'Deactivating tax rate',
      'Tax Rate Deactivated',
      'Tax rate has been deactivated successfully.',
      'Failed to deactivate tax rate',
    );
  }

  // Tax Reporting

  @Post('reports/generate')
  @AdminEndpoint(
    'Generate tax report',
    'Generate a tax report for a specific jurisdiction and period',
  )
  async generateTaxReport(
    @Body() generateReportDto: GenerateTaxReportDto,
  ): Promise<BaseResponseDto<TaxReportDocument>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.taxManagementService.generateTaxReport(
          generateReportDto.jurisdictionId,
          generateReportDto.reportingPeriod,
          DateUtils.create(generateReportDto.periodStart),
          DateUtils.create(generateReportDto.periodEnd),
        );
      },
      'Generating tax report',
      'Tax Report Generated',
      'Tax report has been generated successfully.',
      'Failed to generate tax report',
    );
  }

  @Get('reports')
  @AdminEndpoint('Get tax reports', 'Retrieve tax reports with optional filtering', undefined)
  @ApiQuery({ name: 'jurisdictionId', required: false, description: 'Filter by jurisdiction ID' })
  @ApiQuery({
    name: 'reportingPeriod',
    required: false,
    enum: TaxReportingPeriod,
    description: 'Filter by reporting period',
  })
  @ApiQuery({
    name: 'complianceStatus',
    required: false,
    enum: TaxComplianceStatus,
    description: 'Filter by compliance status',
  })
  @ApiQuery({ name: 'periodStart', required: false, description: 'Filter by period start date' })
  @ApiQuery({ name: 'periodEnd', required: false, description: 'Filter by period end date' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  async getTaxReports(
    @Query('jurisdictionId') jurisdictionId?: string,
    @Query('reportingPeriod') reportingPeriod?: TaxReportingPeriod,
    @Query('complianceStatus') complianceStatus?: TaxComplianceStatus,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<BaseResponseDto<PaginatedDto<TaxReportDocument>>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const filters = {
          jurisdictionId,
          reportingPeriod,
          complianceStatus,
          periodStart: periodStart ? DateUtils.create(periodStart) : undefined,
          periodEnd: periodEnd ? DateUtils.create(periodEnd) : undefined,
          page,
          limit,
        };

        const result = await this.taxManagementService.getTaxReports(filters);

        return {
          items: result.data,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        };
      },
      'Retrieving tax reports',
      'Tax Reports Retrieved',
      'Tax reports have been retrieved successfully.',
      'Failed to retrieve tax reports',
    );
  }

  // Analytics

  @Get('analytics')
  @AdminEndpoint('Get tax analytics', 'Retrieve tax analytics and compliance statistics', undefined)
  @ApiQuery({ name: 'jurisdictionId', required: false, description: 'Filter by jurisdiction ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for analytics' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for analytics' })
  async getTaxAnalytics(
    @Query('jurisdictionId') jurisdictionId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<BaseResponseDto<TaxAnalyticsResponseDto['data']>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        return await this.taxManagementService.getTaxAnalytics(
          jurisdictionId,
          startDate ? DateUtils.create(startDate) : undefined,
          endDate ? DateUtils.create(endDate) : undefined,
        );
      },
      'Retrieving tax analytics',
      'Tax Analytics Retrieved',
      'Tax analytics have been retrieved successfully.',
      'Failed to retrieve tax analytics',
    );
  }

  // Report File Generation and Download

  @Post('reports/:reportId/generate-file')
  @AdminEndpoint(
    'Generate report file',
    'Generate a downloadable report file in the specified format (PDF, Excel, CSV)',
  )
  async generateReportFile(
    @Param('reportId') reportId: string,
    @Body() generateFileDto: GenerateReportFileDto,
  ): Promise<BaseResponseDto<ReportFileResponseDto>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const format = generateFileDto.format;
        const fileInfo = await this.taxManagementService.generateReportFile(reportId, format);

        return {
          fileName: fileInfo.fileName,
          fileSize: fileInfo.fileSize,
          mimeType: fileInfo.mimeType,
          s3Key: fileInfo.s3Key,
          downloadUrl: fileInfo.downloadUrl,
          generatedAt: fileInfo.generatedAt,
        };
      },
      'Generating report file',
      'Report File Generated',
      'Report file has been generated and is ready for download.',
      'Failed to generate report file',
    );
  }

  @Get('reports/:reportId/download-url')
  @AdminEndpoint('Get report download URL', 'Get a presigned URL to download the report file')
  @ApiQuery({
    name: 'expiration',
    required: false,
    type: Number,
    description: 'URL expiration time in seconds (default: 3600)',
  })
  async getReportDownloadUrl(
    @Param('reportId') reportId: string,
    @Query('expiration') expiration?: number,
  ): Promise<BaseResponseDto<{ downloadUrl: string; expiresIn: number }>> {
    return this.executeWithErrorHandlingAndMessage(
      async () => {
        const expirationSeconds = expiration || 3600;
        const downloadUrl = await this.taxManagementService.getReportFileDownloadUrl(
          reportId,
          expirationSeconds,
        );

        return {
          downloadUrl,
          expiresIn: expirationSeconds,
        };
      },
      'Generating download URL',
      'Download URL Generated',
      'Report download URL has been generated successfully.',
      'Failed to generate download URL',
    );
  }

  @Get('reports/:reportId/download')
  @AdminEndpoint(
    'Download report file directly',
    'Download the report file directly from the server',
  )
  async downloadReportFile(
    @Param('reportId') reportId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { fileStream, fileName, mimeType } =
      await this.taxManagementService.downloadReportFile(reportId);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    return new StreamableFile(fileStream);
  }

  /**
   * Create a display name for jurisdiction dropdown
   */
  private createDisplayName(jurisdiction: TaxJurisdictionDocument): string {
    if (jurisdiction.city && jurisdiction.state) {
      return `${jurisdiction.city}, ${jurisdiction.state}, ${jurisdiction.country}`;
    } else if (jurisdiction.state) {
      return `${jurisdiction.name}, ${jurisdiction.country}`;
    } else {
      return `${jurisdiction.name} (${jurisdiction.country})`;
    }
  }
}
