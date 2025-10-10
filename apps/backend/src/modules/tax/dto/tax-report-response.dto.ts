import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { TaxReportingPeriod, TaxComplianceStatus } from '../../../common/enums/tax.enums';

export class TaxBreakdownItemDto {
  @ApiProperty({ description: 'Tax type' })
  taxType: string;

  @ApiProperty({ description: 'Tax collected' })
  taxCollected: number;

  @ApiProperty({ description: 'Tax remitted' })
  taxRemitted: number;

  @ApiProperty({ description: 'Tax owed' })
  taxOwed: number;

  @ApiProperty({ description: 'Number of bookings' })
  numberOfBookings: number;

  @ApiProperty({ description: 'Average tax rate' })
  averageTaxRate: number;
}

export class ReportFileDto {
  @ApiProperty({ description: 'File name' })
  fileName: string;

  @ApiProperty({ description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ description: 'MIME type' })
  mimeType: string;

  @ApiProperty({ description: 'S3 key' })
  s3Key: string;

  @ApiProperty({ description: 'Download URL' })
  downloadUrl: string;

  @ApiProperty({ description: 'Generated date' })
  generatedAt: Date;
}

export class RemittanceHistoryDto {
  @ApiProperty({ description: 'Payment date' })
  paymentDate: Date;

  @ApiProperty({ description: 'Payment amount' })
  amount: number;

  @ApiProperty({ description: 'Payment method' })
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Transaction ID' })
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Reference' })
  reference?: string;

  @ApiProperty({ description: 'Payment status' })
  status: string;
}

export class AuditActionDto {
  @ApiProperty({ description: 'Action performed' })
  action: string;

  @ApiProperty({ description: 'User who performed action' })
  performedBy: string;

  @ApiProperty({ description: 'When action was performed' })
  performedAt: Date;

  @ApiPropertyOptional({ description: 'Action details' })
  details?: string;
}

export class AuditTrailDto {
  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiPropertyOptional({ description: 'Modified by user ID' })
  modifiedBy?: string;

  @ApiPropertyOptional({ description: 'Submitted by user ID' })
  submittedBy?: string;

  @ApiPropertyOptional({ description: 'Reviewed by user ID' })
  reviewedBy?: string;

  @ApiProperty({ type: [AuditActionDto], description: 'Audit actions' })
  actions: AuditActionDto[];
}

export class TaxReportDataDto {
  @ApiProperty({ description: 'Tax report ID' })
  _id: string;

  @ApiProperty({ description: 'Report ID' })
  reportId: string;

  @ApiProperty({ enum: TaxReportingPeriod, description: 'Reporting period' })
  reportingPeriod: TaxReportingPeriod;

  @ApiProperty({ description: 'Period start date' })
  periodStart: Date;

  @ApiProperty({ description: 'Period end date' })
  periodEnd: Date;

  @ApiProperty({ description: 'Tax jurisdiction ID' })
  jurisdictionId: string;

  @ApiProperty({ description: 'Total tax collected' })
  totalTaxCollected: number;

  @ApiProperty({ description: 'Total tax remitted' })
  totalTaxRemitted: number;

  @ApiProperty({ description: 'Total tax owed' })
  totalTaxOwed: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ type: [TaxBreakdownItemDto], description: 'Tax breakdown by type' })
  taxBreakdown: TaxBreakdownItemDto[];

  @ApiProperty({ description: 'Number of bookings' })
  numberOfBookings: number;

  @ApiProperty({ description: 'Number of properties' })
  numberOfProperties: number;

  @ApiProperty({ description: 'Number of hosts' })
  numberOfHosts: number;

  @ApiProperty({ enum: TaxComplianceStatus, description: 'Compliance status' })
  complianceStatus: TaxComplianceStatus;

  @ApiPropertyOptional({ description: 'Submitted at' })
  submittedAt?: Date;

  @ApiProperty({ description: 'Due date' })
  dueDate: Date;

  @ApiPropertyOptional({ description: 'Approved at' })
  approvedAt?: Date;

  @ApiPropertyOptional({ description: 'Approved by user ID' })
  approvedBy?: string;

  @ApiPropertyOptional({ type: ReportFileDto, description: 'Report file information' })
  reportFile?: ReportFileDto;

  @ApiProperty({ type: [RemittanceHistoryDto], description: 'Remittance history' })
  remittanceHistory: RemittanceHistoryDto[];

  @ApiPropertyOptional({ type: AuditTrailDto, description: 'Audit trail' })
  auditTrail?: AuditTrailDto;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class TaxReportListDataDto {
  @ApiProperty({ description: 'Tax reports', type: [TaxReportDataDto] })
  items: TaxReportDataDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrevPage: boolean;
}

export class TaxReportResponseDto extends BaseResponseDto<TaxReportDataDto> {
  @ApiProperty({
    description: 'Tax report data',
    type: TaxReportDataDto,
  })
  declare data: TaxReportDataDto;
}

export class TaxReportListResponseDto extends BaseResponseDto<TaxReportListDataDto> {
  @ApiProperty({
    description: 'Tax report list data',
    type: TaxReportListDataDto,
  })
  declare data: TaxReportListDataDto;
}
