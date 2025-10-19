import { PartialType } from '@nestjs/swagger';
import { CreateCatalogItemDto } from './create-catalog-item.dto';
import { OmitType } from '@nestjs/swagger';

/**
 * Update DTO - All fields optional except catalogType and key (immutable)
 */
export class UpdateCatalogItemDto extends PartialType(
  OmitType(CreateCatalogItemDto, ['catalogType', 'key'] as const),
) {}
