import { Module } from '@nestjs/common';
import { DynamicConfigModule } from '../config/config.module';
import { FeeCalculationService } from './services/fee-calculation.service';

@Module({
  imports: [DynamicConfigModule],
  providers: [FeeCalculationService],
  exports: [FeeCalculationService],
})
export class FeesModule {}
