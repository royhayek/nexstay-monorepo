import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Readable } from 'stream';

import {
  TaxJurisdiction,
  TaxJurisdictionDocument,
} from '../../database/schemas/tax-jurisdiction.schema';
import { TaxRate, TaxRateDocument } from '../../database/schemas/tax-rate.schema';
import { TaxReport, TaxReportDocument } from '../../database/schemas/tax-report.schema';
import {
  TaxCalculation,
  TaxCalculationDocument,
} from '../../database/schemas/tax-calculation.schema';
import { FileCategory, S3Service } from '../storage/services/s3.service';
import { TaxReportGeneratorService, ReportFormat } from './services/tax-report-generator.service';
import { QueryBuilder } from '../../common/utils/query-builder.util';
import { validatePagination, buildPaginatedResult } from '../../common/utils/database.utils';
import { PaginatedResult } from '../../common/interfaces/database.interfaces';
import { DateUtils } from '../../common/utils/date.utils';

import {
  TaxStatus,
  TaxJurisdictionLevel,
  TaxReportingPeriod,
  TaxComplianceStatus,
  TaxType,
} from '../../common/enums/tax.enums';
import { LoggingUtil } from '../../common/utils/logging.util';

// Query filter interfaces

// MongoDB aggregation result interfaces
interface TaxSummaryResult {
  _id: null;
  totalTaxCollected: number;
  count: number;
}

interface TaxByTypeResult {
  _id: string;
  amount: number;
}

interface MonthlyTrendResult {
  _id: {
    year: number;
    month: number;
  };
  amount: number;
}

interface ReportTaxBreakdownItem {
  taxType: string;
  taxCollected: number;
  taxRemitted: number;
  taxOwed: number;
  numberOfBookings: number;
  averageTaxRate: number;
}

interface AggregationResult {
  _id: null;
  totalTaxCollected: number;
  taxBreakdown: ReportTaxBreakdownItem[];
  numberOfBookings: number;
  numberOfProperties: number;
  numberOfHosts: number;
}

@Injectable()
export class TaxManagementService {
  constructor(
    @InjectModel(TaxJurisdiction.name) private taxJurisdictionModel: Model<TaxJurisdictionDocument>,
    @InjectModel(TaxRate.name) private taxRateModel: Model<TaxRateDocument>,
    @InjectModel(TaxReport.name) private taxReportModel: Model<TaxReportDocument>,
    @InjectModel(TaxCalculation.name) private taxCalculationModel: Model<TaxCalculationDocument>,
    private readonly s3Service: S3Service,
    private readonly taxReportGeneratorService: TaxReportGeneratorService,
  ) {}

  // Tax Jurisdiction Management

  async createTaxJurisdiction(
    jurisdictionData: Partial<TaxJurisdiction>,
  ): Promise<TaxJurisdictionDocument> {
    try {
      this.validateJurisdictionData(jurisdictionData);

      const jurisdiction = new this.taxJurisdictionModel({
        ...jurisdictionData,
        effectiveFrom: jurisdictionData.effectiveFrom || DateUtils.now(),
      });

      await jurisdiction.save();
      LoggingUtil.log(
        `Tax jurisdiction created: ${jurisdiction.name} (${jurisdiction.code})`,
        'TaxManagementService',
      );
      return jurisdiction;
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error creating tax jurisdiction:',
        error,
        'TaxManagementService',
      );
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to create tax jurisdiction');
    }
  }

  async updateTaxJurisdiction(
    jurisdictionId: string,
    updateData: Partial<TaxJurisdiction>,
  ): Promise<TaxJurisdictionDocument> {
    try {
      const jurisdiction = await this.taxJurisdictionModel.findById(jurisdictionId);
      if (!jurisdiction) {
        throw new NotFoundException('Tax jurisdiction not found');
      }

      Object.assign(jurisdiction, updateData);
      await jurisdiction.save();

      LoggingUtil.log(
        `Tax jurisdiction updated: ${jurisdiction.name} (${jurisdiction.code})`,
        'TaxManagementService',
      );
      return jurisdiction;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error updating tax jurisdiction ${jurisdictionId}:`,
        error,
        'TaxManagementService',
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update tax jurisdiction');
    }
  }

  async getTaxJurisdictions(filters?: {
    country?: string;
    level?: TaxJurisdictionLevel;
    status?: TaxStatus;
    page?: number;
    limit?: number;
  }): Promise<{
    jurisdictions: TaxJurisdictionDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const { country, level, status, page = 1, limit = 10 } = filters || {};

      // Validate pagination
      const pagination = validatePagination({ page, limit, maxLimit: 50 });

      // Build query using QueryBuilder
      const query = QueryBuilder.create()
        .addStringFilter('country', country)
        .addEnumFilter('level', level)
        .addEnumFilter('status', status)
        .build();

      const [jurisdictions, total] = await Promise.all([
        this.taxJurisdictionModel
          .find(query)
          .populate('parentJurisdiction')
          .sort({ country: 1, level: 1, name: 1 })
          .skip(pagination.skip)
          .limit(pagination.limit),
        this.taxJurisdictionModel.countDocuments(query),
      ]);

      const result = buildPaginatedResult(jurisdictions, total, pagination.page, pagination.limit);

      return {
        jurisdictions: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error fetching tax jurisdictions:',
        error,
        'TaxManagementService',
      );
      throw new InternalServerErrorException('Failed to fetch tax jurisdictions');
    }
  }

  // Tax Rate Management

  async createTaxRate(taxRateData: Partial<TaxRate>): Promise<TaxRateDocument> {
    try {
      this.validateTaxRateData(taxRateData);

      const taxRate = new this.taxRateModel({
        ...taxRateData,
        effectiveFrom: taxRateData.effectiveFrom || DateUtils.now(),
      });

      await taxRate.save();
      LoggingUtil.log(
        `Tax rate created: ${taxRate.name} (${taxRate.type})`,
        'TaxManagementService',
      );
      return taxRate;
    } catch (error) {
      LoggingUtil.errorWithException('Error creating tax rate:', error, 'TaxManagementService');
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to create tax rate');
    }
  }

  async updateTaxRate(taxRateId: string, updateData: Partial<TaxRate>): Promise<TaxRateDocument> {
    try {
      const taxRate = await this.taxRateModel.findById(taxRateId);
      if (!taxRate) {
        throw new NotFoundException('Tax rate not found');
      }

      Object.assign(taxRate, updateData);
      await taxRate.save();

      LoggingUtil.log(
        `Tax rate updated: ${taxRate.name} (${taxRate.type})`,
        'TaxManagementService',
      );
      return taxRate;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error updating tax rate ${taxRateId}:`,
        error,
        'TaxManagementService',
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update tax rate');
    }
  }

  async getTaxRates(filters?: {
    jurisdictionId?: string;
    type?: TaxType;
    status?: TaxStatus;
    effectiveDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<TaxRateDocument>> {
    try {
      const { jurisdictionId, type, status, effectiveDate, page = 1, limit = 10 } = filters || {};

      const query = QueryBuilder.create()
        .addObjectIdFilter('jurisdictionId', jurisdictionId)
        .addEnumFilter('type', type?.toString())
        .addEnumFilter('status', status?.toString())
        .build();

      if (effectiveDate) {
        query.effectiveFrom = { $lte: effectiveDate };
        query.$or = [{ effectiveTo: { $exists: false } }, { effectiveTo: { $gte: effectiveDate } }];
      }

      const pagination = validatePagination({ page, limit });

      const [taxRates, total] = await Promise.all([
        this.taxRateModel
          .find(query)
          .populate('jurisdiction')
          .sort({ priority: 1, effectiveFrom: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        this.taxRateModel.countDocuments(query),
      ]);

      return buildPaginatedResult(taxRates, total, pagination.page, pagination.limit);
    } catch (error) {
      LoggingUtil.errorWithException('Error fetching tax rates:', error, 'TaxManagementService');
      throw new InternalServerErrorException('Failed to fetch tax rates');
    }
  }

  async deactivateTaxRate(taxRateId: string, effectiveDate?: Date): Promise<TaxRateDocument> {
    try {
      const taxRate = await this.taxRateModel.findById(taxRateId);
      if (!taxRate) {
        throw new NotFoundException('Tax rate not found');
      }

      taxRate.status = TaxStatus.INACTIVE;
      taxRate.effectiveTo = effectiveDate || DateUtils.now();
      await taxRate.save();

      LoggingUtil.log(
        `Tax rate deactivated: ${taxRate.name} (${taxRate.type})`,
        'TaxManagementService',
      );
      return taxRate;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error deactivating tax rate ${taxRateId}:`,
        error,
        'TaxManagementService',
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to deactivate tax rate');
    }
  }

  // Tax Reporting

  async generateTaxReport(
    jurisdictionId: string,
    reportingPeriod: TaxReportingPeriod,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<TaxReportDocument> {
    try {
      LoggingUtil.log(
        `Generating tax report for jurisdiction ${jurisdictionId}: ${DateUtils.toISO(periodStart)} to ${DateUtils.toISO(periodEnd)}`,
        'TaxManagementService',
      );

      // Check if report already exists
      const existingReport = await this.taxReportModel.findOne({
        jurisdictionId: new Types.ObjectId(jurisdictionId),
        reportingPeriod,
        periodStart,
        periodEnd,
      });

      if (existingReport) {
        throw new BadRequestException('Tax report already exists for this period');
      }

      // Aggregate tax data for the period
      const taxData = await this.aggregateTaxData(jurisdictionId, periodStart, periodEnd);

      const reportId = this.generateReportId(jurisdictionId, reportingPeriod, periodStart);
      const dueDate = this.calculateDueDate(reportingPeriod, periodEnd);

      const taxReport = new this.taxReportModel({
        reportId,
        reportingPeriod,
        periodStart,
        periodEnd,
        jurisdictionId: new Types.ObjectId(jurisdictionId),
        totalTaxCollected: taxData.totalTaxCollected,
        totalTaxRemitted: 0, // Initially 0, updated when remitted
        totalTaxOwed: taxData.totalTaxCollected,
        currency: taxData.currency,
        taxBreakdown: taxData.taxBreakdown,
        numberOfBookings: taxData.numberOfBookings,
        numberOfProperties: taxData.numberOfProperties,
        numberOfHosts: taxData.numberOfHosts,
        complianceStatus: TaxComplianceStatus.PENDING_REVIEW,
        dueDate,
        remittanceHistory: [],
        auditTrail: {
          createdBy: new Types.ObjectId('000000000000000000000000'), // System generated
          actions: [
            {
              action: 'REPORT_GENERATED',
              performedBy: new Types.ObjectId('000000000000000000000000'),
              performedAt: DateUtils.now(),
              details: `System generated tax report for period ${DateUtils.toISO(periodStart)} to ${DateUtils.toISO(periodEnd)}`,
            },
          ],
        },
      });

      await taxReport.save();
      LoggingUtil.log(`Tax report generated: ${reportId}`, 'TaxManagementService');
      return taxReport;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error generating tax report for jurisdiction ${jurisdictionId}:`,
        error,
        'TaxManagementService',
      );
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to generate tax report');
    }
  }

  async getTaxReports(filters?: {
    jurisdictionId?: string;
    reportingPeriod?: TaxReportingPeriod;
    complianceStatus?: TaxComplianceStatus;
    periodStart?: Date;
    periodEnd?: Date;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<TaxReportDocument>> {
    try {
      const {
        jurisdictionId,
        reportingPeriod,
        complianceStatus,
        periodStart,
        periodEnd,
        page = 1,
        limit = 10,
      } = filters || {};

      const query = QueryBuilder.create()
        .addObjectIdFilter('jurisdictionId', jurisdictionId)
        .addEnumFilter('reportingPeriod', reportingPeriod?.toString())
        .addEnumFilter('complianceStatus', complianceStatus?.toString())
        .build();

      if (periodStart) {
        query.periodStart = { $gte: periodStart };
      }
      if (periodEnd) {
        query.periodEnd = { $lte: periodEnd };
      }

      const pagination = validatePagination({ page, limit });

      const [reports, total] = await Promise.all([
        this.taxReportModel
          .find(query)
          .populate('jurisdiction')
          .sort({ periodEnd: -1 })
          .skip(pagination.skip)
          .limit(pagination.limit)
          .lean(),
        this.taxReportModel.countDocuments(query),
      ]);

      return buildPaginatedResult(reports, total, pagination.page, pagination.limit);
    } catch (error) {
      LoggingUtil.errorWithException('Error fetching tax reports:', error, 'TaxManagementService');
      throw new InternalServerErrorException('Failed to fetch tax reports');
    }
  }

  // Compliance and Analytics

  async getTaxAnalytics(
    jurisdictionId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalTaxCollected: number;
    totalTaxRemitted: number;
    totalTaxOwed: number;
    complianceRate: number;
    topTaxTypes: Array<{ type: string; amount: number; percentage: number }>;
    monthlyTrends: Array<{ month: string; amount: number }>;
  }> {
    try {
      const matchStage: Record<string, unknown> = {};
      if (jurisdictionId) {
        matchStage['taxBreakdown.jurisdictionId'] = new Types.ObjectId(jurisdictionId);
      }
      if (startDate || endDate) {
        const calculationDateFilter: Record<string, Date> = {};
        if (startDate) calculationDateFilter.$gte = startDate;
        if (endDate) calculationDateFilter.$lte = endDate;
        matchStage.calculationDate = calculationDateFilter;
      }

      const [taxSummary, taxByType, monthlyTrends] = await Promise.all([
        // Total tax summary
        this.taxCalculationModel.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalTaxCollected: { $sum: '$totalTaxAmount' },
              count: { $sum: 1 },
            },
          },
        ]),

        // Tax by type
        this.taxCalculationModel.aggregate([
          { $match: matchStage },
          { $unwind: '$taxBreakdown' },
          {
            $group: {
              _id: '$taxBreakdown.taxType',
              amount: { $sum: '$taxBreakdown.taxAmount' },
            },
          },
          { $sort: { amount: -1 } },
          { $limit: 5 },
        ]),

        // Monthly trends
        this.taxCalculationModel.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: {
                year: { $year: '$calculationDate' },
                month: { $month: '$calculationDate' },
              },
              amount: { $sum: '$totalTaxAmount' },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
          { $limit: 12 },
        ]),
      ]);

      const taxSummaryResult = taxSummary as TaxSummaryResult[];
      const taxByTypeResults = taxByType as TaxByTypeResult[];
      const monthlyTrendResults = monthlyTrends as MonthlyTrendResult[];

      const totalCollected = taxSummaryResult[0]?.totalTaxCollected || 0;
      const topTaxTypes = taxByTypeResults.map((item) => ({
        type: item._id,
        amount: item.amount,
        percentage: totalCollected > 0 ? (item.amount / totalCollected) * 100 : 0,
      }));

      const monthlyTrendsFormatted = monthlyTrendResults.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        amount: item.amount,
      }));

      // Get compliance rate from reports
      const reports = await this.taxReportModel.find(
        jurisdictionId ? { jurisdictionId: new Types.ObjectId(jurisdictionId) } : {},
      );

      const compliantReports = reports.filter(
        (r) => r.complianceStatus === TaxComplianceStatus.COMPLIANT,
      );
      const complianceRate =
        reports.length > 0 ? (compliantReports.length / reports.length) * 100 : 0;

      return {
        totalTaxCollected: totalCollected,
        totalTaxRemitted: 0, // Would need integration with payment system
        totalTaxOwed: totalCollected, // Simplified calculation
        complianceRate,
        topTaxTypes,
        monthlyTrends: monthlyTrendsFormatted,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        'Error generating tax analytics:',
        error,
        'TaxManagementService',
      );
      throw new InternalServerErrorException('Failed to generate tax analytics');
    }
  }

  // Private helper methods

  private async aggregateTaxData(
    jurisdictionId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<{
    totalTaxCollected: number;
    currency: string;
    taxBreakdown: ReportTaxBreakdownItem[];
    numberOfBookings: number;
    numberOfProperties: number;
    numberOfHosts: number;
  }> {
    const matchStage = {
      'taxBreakdown.jurisdictionId': new Types.ObjectId(jurisdictionId),
      calculationDate: { $gte: periodStart, $lte: periodEnd },
    };

    const aggregationResults = await this.taxCalculationModel.aggregate([
      { $match: matchStage },
      { $unwind: '$taxBreakdown' },
      { $match: { 'taxBreakdown.jurisdictionId': new Types.ObjectId(jurisdictionId) } },
      {
        $group: {
          _id: '$taxBreakdown.taxType',
          taxCollected: { $sum: '$taxBreakdown.taxAmount' },
          taxRemitted: { $sum: 0 }, // Initially 0
          taxOwed: { $sum: '$taxBreakdown.taxAmount' },
          numberOfBookings: { $addToSet: '$bookingId' },
          numberOfProperties: { $addToSet: '$propertyId' },
          numberOfHosts: { $addToSet: '$hostId' },
          averageTaxRate: { $avg: '$taxBreakdown.rate' },
        },
      },
      {
        $group: {
          _id: null,
          totalTaxCollected: { $sum: '$taxCollected' },
          taxBreakdown: {
            $push: {
              taxType: '$_id',
              taxCollected: '$taxCollected',
              taxRemitted: '$taxRemitted',
              taxOwed: '$taxOwed',
              numberOfBookings: { $size: '$numberOfBookings' },
              averageTaxRate: '$averageTaxRate',
            },
          },
          allBookings: { $push: '$numberOfBookings' },
          allProperties: { $push: '$numberOfProperties' },
          allHosts: { $push: '$numberOfHosts' },
        },
      },
      {
        $project: {
          totalTaxCollected: 1,
          taxBreakdown: 1,
          numberOfBookings: {
            $size: {
              $reduce: {
                input: '$allBookings',
                initialValue: [],
                in: { $setUnion: ['$$value', '$$this'] },
              },
            },
          },
          numberOfProperties: {
            $size: {
              $reduce: {
                input: '$allProperties',
                initialValue: [],
                in: { $setUnion: ['$$value', '$$this'] },
              },
            },
          },
          numberOfHosts: {
            $size: {
              $reduce: {
                input: '$allHosts',
                initialValue: [],
                in: { $setUnion: ['$$value', '$$this'] },
              },
            },
          },
        },
      },
    ]);

    const aggregationResult = aggregationResults[0] as AggregationResult | undefined;

    return {
      totalTaxCollected: aggregationResult?.totalTaxCollected || 0,
      currency: 'USD',
      taxBreakdown: aggregationResult?.taxBreakdown || [],
      numberOfBookings: aggregationResult?.numberOfBookings || 0,
      numberOfProperties: aggregationResult?.numberOfProperties || 0,
      numberOfHosts: aggregationResult?.numberOfHosts || 0,
    };
  }

  private generateReportId(
    jurisdictionId: string,
    reportingPeriod: TaxReportingPeriod,
    periodStart: Date,
  ): string {
    const parsedDate = DateUtils.parseDate(periodStart);
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const jurisdictionCode = jurisdictionId.substring(0, 8).toUpperCase();
    const periodCode = reportingPeriod.charAt(0).toUpperCase();

    return `TAX-${jurisdictionCode}-${year}${month}-${periodCode}`;
  }

  private calculateDueDate(reportingPeriod: TaxReportingPeriod, periodEnd: Date): Date {
    const dueDate = DateUtils.parseDate(periodEnd);

    switch (reportingPeriod) {
      case TaxReportingPeriod.MONTHLY: {
        // 15th of next month
        const nextMonth = DateUtils.addMonths(dueDate, 1);
        const result = DateUtils.parseDate(nextMonth);
        result.setDate(15);
        return result;
      }
      case TaxReportingPeriod.QUARTERLY: {
        // 15th of second month after quarter end
        const secondMonthAfter = DateUtils.addMonths(dueDate, 2);
        const result = DateUtils.parseDate(secondMonthAfter);
        result.setDate(15);
        return result;
      }
      case TaxReportingPeriod.ANNUALLY: {
        // March 31st of next year
        const nextYear = DateUtils.addYears(dueDate, 1);
        const result = DateUtils.parseDate(nextYear);
        result.setMonth(2, 31); // March (month 2) 31st
        return result;
      }
      default: {
        // Default to 15th of next month
        const nextMonth = DateUtils.addMonths(dueDate, 1);
        const result = DateUtils.parseDate(nextMonth);
        result.setDate(15);
        return result;
      }
    }
  }

  private validateJurisdictionData(data: Partial<TaxJurisdiction>): void {
    if (!data.name || !data.code || !data.level || !data.country) {
      throw new BadRequestException('Name, code, level, and country are required');
    }
  }

  private validateTaxRateData(data: Partial<TaxRate>): void {
    if (!data.name || !data.type || !data.jurisdictionId || !data.calculationMethod) {
      throw new BadRequestException(
        'Name, type, jurisdiction, and calculation method are required',
      );
    }

    if (data.rate === undefined && !data.fixedAmount) {
      throw new BadRequestException('Either rate or fixed amount must be provided');
    }
  }

  // Report File Generation

  /**
   * Generate and upload report file
   */
  async generateReportFile(
    reportId: string,
    format: ReportFormat,
  ): Promise<{
    fileName: string;
    fileSize: number;
    mimeType: string;
    s3Key: string;
    downloadUrl: string;
    generatedAt: Date;
  }> {
    try {
      // Get the report
      const report = await this.taxReportModel.findById(reportId).exec();
      if (!report) {
        throw new NotFoundException('Tax report not found');
      }

      // Get the jurisdiction
      const jurisdiction = await this.taxJurisdictionModel.findById(report.jurisdictionId).exec();
      if (!jurisdiction) {
        throw new NotFoundException('Tax jurisdiction not found');
      }

      LoggingUtil.log(
        `Generating ${format} file for report ${report.reportId}`,
        'TaxManagementService',
      );

      // Generate the report file
      const generationResult = await this.taxReportGeneratorService.generateReport(
        report,
        jurisdiction,
        format,
      );

      // Upload to S3 using the report ID as the user ID to create organized structure
      const uploadResult = await this.s3Service.uploadFile(
        generationResult.buffer,
        generationResult.fileName,
        generationResult.mimeType,
        FileCategory.DOCUMENTS,
        report.reportId, // Use reportId as userId to organize files
        false,
      );

      // Generate download URL (valid for 1 hour)
      const downloadUrl = await this.s3Service.generatePresignedDownloadUrl(uploadResult.key, 3600);

      // Update the report with file information
      const reportFileInfo = {
        fileName: generationResult.fileName,
        fileSize: generationResult.fileSize,
        mimeType: generationResult.mimeType,
        s3Key: uploadResult.key,
        downloadUrl,
        generatedAt: DateUtils.now(),
      };

      const updatedReport = await this.taxReportModel.findByIdAndUpdate(
        reportId,
        { reportFile: reportFileInfo },
        { new: true },
      );

      LoggingUtil.log(
        `Report file uploaded successfully: ${uploadResult.key}`,
        'TaxManagementService',
      );
      LoggingUtil.log(`Report file info saved`, 'TaxManagementService');
      LoggingUtil.log(
        `Updated report has reportFile: ${!!updatedReport?.reportFile}`,
        'TaxManagementService',
      );
      return reportFileInfo;
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error generating report file for ${reportId}:`,
        error,
        'TaxManagementService',
      );
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate report file');
    }
  }

  /**
   * Get download URL for existing report file
   */
  async getReportFileDownloadUrl(
    reportId: string,
    expirationSeconds: number = 3600,
  ): Promise<string> {
    try {
      const report = await this.taxReportModel.findById(reportId).exec();
      if (!report) {
        throw new NotFoundException('Tax report not found');
      }

      LoggingUtil.log(`Report found: ${reportId}`, 'TaxManagementService');
      LoggingUtil.log(`Report has reportFile: ${!!report.reportFile}`, 'TaxManagementService');
      LoggingUtil.log(`Report file s3Key: ${report.reportFile?.s3Key}`, 'TaxManagementService');

      if (!report.reportFile || !report.reportFile.s3Key) {
        throw new BadRequestException(
          'No report file available for download. Please generate the file first.',
        );
      }

      return await this.s3Service.generatePresignedDownloadUrl(
        report.reportFile.s3Key,
        expirationSeconds,
      );
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error getting download URL for report ${reportId}:`,
        error,
        'TaxManagementService',
      );
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get download URL');
    }
  }

  /**
   * Download report file as stream
   */
  async downloadReportFile(reportId: string): Promise<{
    fileStream: Readable;
    fileName: string;
    mimeType: string;
  }> {
    try {
      const report = await this.taxReportModel.findById(reportId).exec();
      if (!report) {
        throw new NotFoundException('Tax report not found');
      }

      if (!report.reportFile || !report.reportFile.s3Key) {
        throw new BadRequestException(
          'No report file available for download. Please generate the file first.',
        );
      }

      const fileStream = await this.s3Service.getObjectStream(report.reportFile.s3Key);

      return {
        fileStream,
        fileName: report.reportFile.fileName,
        mimeType: report.reportFile.mimeType,
      };
    } catch (error) {
      LoggingUtil.errorWithException(
        `Error downloading report file for report ${reportId}:`,
        error,
        'TaxManagementService',
      );
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to download report file');
    }
  }
}
