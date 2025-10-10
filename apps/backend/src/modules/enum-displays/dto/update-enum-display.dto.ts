import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEnumDisplayDto } from './create-enum-display.dto';

export class UpdateEnumDisplayDto extends PartialType(
  OmitType(CreateEnumDisplayDto, ['enumName', 'key'] as const),
) {}
