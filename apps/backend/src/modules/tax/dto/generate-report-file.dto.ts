import { ApiProperty } from '@nestjs/swagger';
import { ReportFormat } from '../services/tax-report-generator.service';
import { IsEnumField } from '../../../common/validators/standardized-validators';

export class GenerateReportFileDto {
  @IsEnumField(ReportFormat, { required: true, example: ReportFormat.PDF })
  format: ReportFormat;
}

export class ReportFileResponseDto {
  @ApiProperty({ description: 'File name' })
  fileName: string;

  @ApiProperty({ description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ description: 'MIME type' })
  mimeType: string;

  @ApiProperty({ description: 'S3 key for the file' })
  s3Key: string;

  @ApiProperty({ description: 'Download URL (presigned)' })
  downloadUrl: string;

  @ApiProperty({ description: 'File generation timestamp' })
  generatedAt: Date;
}
