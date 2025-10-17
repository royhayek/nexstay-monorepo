import { IsOptional } from 'class-validator';
import { IsDateField } from '../../../common/validators/standardized-validators';
import { BaseResponseDto } from '../../../common/dto/base-response.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Monthly Compliance Report DTO
 * Comprehensive statistics for compliance reporting
 */
export class MonthlyComplianceReportDto {
  @ApiProperty({
    description: 'Report month (YYYY-MM format)',
    example: '2025-10',
  })
  month!: string;

  @ApiProperty({ description: 'Total verifications submitted', example: 245 })
  totalSubmissions!: number;

  @ApiProperty({ description: 'Total verifications approved', example: 198 })
  totalApproved!: number;

  @ApiProperty({ description: 'Total verifications rejected', example: 32 })
  totalRejected!: number;

  @ApiProperty({ description: 'Total verifications pending review', example: 15 })
  totalPending!: number;

  @ApiProperty({ description: 'Approval rate (percentage)', example: 86.1 })
  approvalRate!: number;

  @ApiProperty({ description: 'Rejection rate (percentage)', example: 13.9 })
  rejectionRate!: number;

  @ApiProperty({
    description: 'Average review time in hours',
    example: 18.5,
  })
  avgReviewTimeHours!: number;

  @ApiProperty({
    description: 'Breakdown by document type',
    example: {
      passport: { total: 120, approved: 110, rejected: 10 },
      national_id: { total: 85, approved: 65, rejected: 20 },
      drivers_license: { total: 40, approved: 23, rejected: 2 },
    },
  })
  byDocumentType!: Record<
    string,
    {
      total: number;
      approved: number;
      rejected: number;
      pending: number;
    }
  >;

  @ApiProperty({
    description: 'Breakdown by country',
    example: {
      US: { total: 80, approved: 75, rejected: 5 },
      LB: { total: 120, approved: 95, rejected: 25 },
      CA: { total: 45, approved: 28, rejected: 2 },
    },
  })
  byCountry!: Record<
    string,
    {
      total: number;
      approved: number;
      rejected: number;
      pending: number;
    }
  >;

  @ApiProperty({
    description: 'Breakdown by rejection reason',
    example: {
      document_unclear: 12,
      document_expired: 8,
      personal_info_mismatch: 7,
      poor_image_quality: 5,
    },
  })
  rejectionReasons!: Record<string, number>;

  @ApiProperty({
    description: 'Top reviewers by volume',
    example: [
      { reviewerId: '507f1f77bcf86cd799439011', reviewerName: 'Jane Smith', count: 45 },
      { reviewerId: '507f1f77bcf86cd799439012', reviewerName: 'John Doe', count: 38 },
    ],
  })
  topReviewers!: Array<{
    reviewerId: string;
    reviewerName: string;
    count: number;
    avgReviewTimeHours: number;
  }>;

  @ApiProperty({
    description: 'Verifications aging (pending > X days)',
    example: {
      lessThan24Hours: 5,
      between24And48Hours: 7,
      between2And7Days: 2,
      moreThan7Days: 1,
    },
  })
  agingBuckets!: {
    lessThan24Hours: number;
    between24And48Hours: number;
    between2And7Days: number;
    moreThan7Days: number;
  };

  @ApiProperty({
    description: 'Report generated timestamp',
    example: '2025-10-12T10:30:00.000Z',
  })
  generatedAt!: Date;
}

/**
 * Compliance Statistics DTO
 * Real-time compliance metrics
 */
export class ComplianceStatisticsDto {
  @ApiProperty({
    description: 'Total pending verifications',
    example: 42,
  })
  totalPending!: number;

  @ApiProperty({
    description: 'Total under review',
    example: 18,
  })
  totalUnderReview!: number;

  @ApiProperty({
    description: 'Verifications pending > 24 hours',
    example: 12,
  })
  pendingOver24Hours!: number;

  @ApiProperty({
    description: 'Verifications pending > 48 hours',
    example: 5,
  })
  pendingOver48Hours!: number;

  @ApiProperty({
    description: 'Verifications pending > 7 days (critical)',
    example: 2,
  })
  pendingOver7Days!: number;

  @ApiProperty({
    description: 'Average review time in hours (last 30 days)',
    example: 14.3,
  })
  avgReviewTimeHours!: number;

  @ApiProperty({
    description: 'Approval rate (last 30 days)',
    example: 87.5,
  })
  approvalRateLast30Days!: number;

  @ApiProperty({
    description: 'Total approved (last 30 days)',
    example: 234,
  })
  approvedLast30Days!: number;

  @ApiProperty({
    description: 'Total rejected (last 30 days)',
    example: 33,
  })
  rejectedLast30Days!: number;

  @ApiProperty({
    description: 'Verifications requiring immediate attention',
    example: 8,
  })
  requiresImmediateAttention!: number;

  @ApiProperty({
    description: 'Statistics generated timestamp',
    example: '2025-10-12T10:30:00.000Z',
  })
  generatedAt!: Date;
}

/**
 * Request DTO for monthly report
 */
export class GetMonthlyReportDto {
  @IsDateField({
    required: false,
    description: 'Month to generate report for (YYYY-MM format, defaults to current month)',
    example: '2025-10',
  })
  @IsOptional()
  month?: string;
}

/**
 * Response DTOs using BaseResponseDto factory
 */
export type MonthlyComplianceReportResponseDto = BaseResponseDto<MonthlyComplianceReportDto>;
export type ComplianceStatisticsResponseDto = BaseResponseDto<ComplianceStatisticsDto>;
