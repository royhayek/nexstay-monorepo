import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAmenityCategoryDto } from './create-amenity-category.dto';

export class UpdateAmenityCategoryDto extends PartialType(
  OmitType(CreateAmenityCategoryDto, ['key'] as const),
) {}
