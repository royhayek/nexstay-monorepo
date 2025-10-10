import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  TaxJurisdiction,
  TaxJurisdictionSchema,
} from '../../database/schemas/tax-jurisdiction.schema';
import { TaxRate, TaxRateSchema } from '../../database/schemas/tax-rate.schema';
import {
  TaxCalculation,
  TaxCalculationSchema,
} from '../../database/schemas/tax-calculation.schema';
import { TaxReport, TaxReportSchema } from '../../database/schemas/tax-report.schema';

import { TaxCalculationService } from './tax-calculation.service';
import { TaxManagementService } from './tax-management.service';
import { TaxReportGeneratorService } from './services/tax-report-generator.service';
import { StorageModule } from '../storage/storage.module';

import { TaxCalculationController } from './controllers/tax-calculation.controller';
import { TaxAdminController } from './controllers/tax-admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaxJurisdiction.name, schema: TaxJurisdictionSchema },
      { name: TaxRate.name, schema: TaxRateSchema },
      { name: TaxCalculation.name, schema: TaxCalculationSchema },
      { name: TaxReport.name, schema: TaxReportSchema },
    ]),
    StorageModule,
  ],
  providers: [TaxCalculationService, TaxManagementService, TaxReportGeneratorService],
  controllers: [TaxCalculationController, TaxAdminController],
  exports: [TaxCalculationService, TaxManagementService, TaxReportGeneratorService],
})
export class TaxModule {}
