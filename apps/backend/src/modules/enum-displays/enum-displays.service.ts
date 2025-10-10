import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EnumDisplay, EnumDisplayDocument } from '../../database/schemas/enum-display.schema';
import {
  CatalogVersion,
  CatalogVersionDocument,
} from '../../database/schemas/catalog-version.schema';
import { SystemEnumName, SystemEnumValue, SYSTEM_ENUMS } from '../../common/enums/system.enums';

interface DefaultEnumDisplay {
  _id: string | null;
  enumName: SystemEnumName;
  key: SystemEnumValue;
  label: Record<string, string>;
  sortOrder: number;
  isVisible: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}
import { CreateEnumDisplayDto } from './dto/create-enum-display.dto';
import { UpdateEnumDisplayDto } from './dto/update-enum-display.dto';
import { LoggingUtil } from '../../common/utils/logging.util';
import { DateUtils } from '../../common/utils/date.utils';

@Injectable()
export class EnumDisplaysService {
  // Optimized field selection for frontend responses (inclusion-only)
  private readonly FRONTEND_FIELDS = '_id key enumName label sortOrder isVisible';

  constructor(
    @InjectModel(EnumDisplay.name)
    private readonly enumDisplayModel: Model<EnumDisplayDocument>,
    @InjectModel(CatalogVersion.name)
    private readonly catalogVersionModel: Model<CatalogVersionDocument>,
  ) {}

  async findByEnumName(enumName: SystemEnumName): Promise<EnumDisplayDocument[]> {
    return this.enumDisplayModel.find({ enumName }).sort({ sortOrder: 1, key: 1 }).exec();
  }

  // Frontend-optimized version
  async findByEnumNameForFrontend(
    enumName: SystemEnumName,
  ): Promise<Partial<EnumDisplayDocument>[]> {
    return this.enumDisplayModel
      .find({ enumName })
      .select(this.FRONTEND_FIELDS)
      .sort({ sortOrder: 1, key: 1 })
      .lean()
      .exec();
  }

  async findById(id: string): Promise<EnumDisplayDocument | null> {
    return this.enumDisplayModel.findById(id).exec();
  }

  // Frontend-optimized version
  async findByIdForFrontend(id: string): Promise<Partial<EnumDisplayDocument> | null> {
    return this.enumDisplayModel.findById(id).select(this.FRONTEND_FIELDS).lean().exec();
  }

  async findByKey(enumName: SystemEnumName, key: string): Promise<EnumDisplayDocument | null> {
    return this.enumDisplayModel.findOne({ enumName, key }).exec();
  }

  async create(createDto: CreateEnumDisplayDto, userId?: string): Promise<EnumDisplayDocument> {
    const { enumName, key } = createDto;

    // Validate that the enum name exists
    if (!SYSTEM_ENUMS[enumName]) {
      throw new BadRequestException(`Invalid enum name: ${enumName}`);
    }

    // Validate that the key exists in the enum
    const enumValues = Object.values(SYSTEM_ENUMS[enumName]);
    if (!enumValues.includes(key)) {
      throw new BadRequestException(
        `Invalid key "${String(key)}" for enum "${String(enumName)}". Valid keys: ${enumValues.join(', ')}`,
      );
    }

    const existingDisplay = await this.findByKey(enumName, key);
    if (existingDisplay) {
      throw new BadRequestException(
        `Display configuration for ${String(enumName)}.${String(key)} already exists`,
      );
    }

    const enumDisplay = new this.enumDisplayModel({
      ...createDto,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await enumDisplay.save();
    await this.incrementCatalogVersion(userId);
    return saved;
  }

  async update(
    enumName: SystemEnumName,
    key: string,
    updateDto: UpdateEnumDisplayDto,
    userId?: string,
  ): Promise<EnumDisplayDocument> {
    const enumDisplay = await this.findByKey(enumName, key);
    if (!enumDisplay) {
      throw new NotFoundException(`Display configuration for ${enumName}.${key} not found`);
    }

    // Key is immutable - cannot be changed
    const updateData = { ...updateDto };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    delete (updateData as any).key;

    Object.assign(enumDisplay, {
      ...updateData,
      updatedBy: userId,
    });

    const saved = await enumDisplay.save();
    await this.incrementCatalogVersion(userId);
    return saved;
  }

  async delete(enumName: SystemEnumName, key: string, userId?: string): Promise<void> {
    const result = await this.enumDisplayModel.findOneAndDelete({ enumName, key }).exec();

    if (!result) {
      throw new NotFoundException(`Display configuration for ${enumName}.${key} not found`);
    }

    await this.incrementCatalogVersion(userId);
  }

  async findAll(): Promise<Record<SystemEnumName, EnumDisplayDocument[]>> {
    const enumDisplays = await this.enumDisplayModel
      .find()
      .sort({ enumName: 1, sortOrder: 1, key: 1 })
      .exec();

    return this.buildEnumDisplayGroups(enumDisplays, false);
  }

  /**
   * Build enum display groups from database records, filling gaps with defaults
   * @param enumDisplays - Existing database records
   * @param isFrontendOptimized - Whether this is for frontend (partial fields only)
   */
  private buildEnumDisplayGroups<T extends EnumDisplayDocument | Partial<EnumDisplayDocument>>(
    enumDisplays: T[],
    isFrontendOptimized: boolean,
  ): Record<SystemEnumName, T[]> {
    // Create map of existing displays for quick lookup
    const existingDisplaysMap = new Map<string, T>();
    for (const display of enumDisplays) {
      const key = `${display.enumName}:${display.key}`;
      existingDisplaysMap.set(key, display);
    }

    // Initialize result with all available enums
    const grouped: Record<SystemEnumName, T[]> = {} as Record<SystemEnumName, T[]>;

    // Iterate through all system enums and their values
    for (const [enumName, enumObj] of Object.entries(SYSTEM_ENUMS)) {
      grouped[enumName as SystemEnumName] = [];

      // Get all enum values
      const enumValues = Object.values(enumObj);

      for (const enumValue of enumValues) {
        const lookupKey = `${enumName}:${enumValue}`;
        const existingDisplay = existingDisplaysMap.get(lookupKey);

        if (existingDisplay) {
          // Use existing display configuration
          grouped[enumName as SystemEnumName].push(existingDisplay);
        } else {
          // Create a default display configuration for enums without database records
          const defaultDisplay = this.createDefaultDisplay(
            enumName as SystemEnumName,
            enumValue as SystemEnumValue,
            isFrontendOptimized,
          ) as T;

          grouped[enumName as SystemEnumName].push(defaultDisplay);
        }
      }

      // Sort by sortOrder, then by key
      this.sortEnumDisplays(grouped[enumName as SystemEnumName]);
    }

    return grouped;
  }

  /**
   * Create a default display configuration for an enum value
   * Returns 'any' because we're creating virtual records that don't match the exact Mongoose document structure
   */
  private createDefaultDisplay(
    enumName: SystemEnumName,
    enumValue: SystemEnumValue,
    isFrontendOptimized: boolean,
  ): DefaultEnumDisplay {
    const baseDisplay = {
      _id: null, // Indicates this is not persisted
      enumName,
      key: enumValue,
      label: { en: this.generateDefaultLabel(enumValue as string) },
      sortOrder: 0,
      isVisible: true,
    };

    if (isFrontendOptimized) {
      return baseDisplay;
    }

    // For full document, include additional fields
    return {
      ...baseDisplay,
      description: `Default display for ${String(enumName)}.${String(enumValue)}`,
      createdAt: DateUtils.now(),
      updatedAt: DateUtils.now(),
    };
  }

  /**
   * Sort enum displays by sortOrder, then by key
   */
  private sortEnumDisplays<T extends { sortOrder?: number; key?: string }>(displays: T[]): void {
    displays.sort((a, b) => {
      const aSortOrder = a.sortOrder || 0;
      const bSortOrder = b.sortOrder || 0;
      if (aSortOrder !== bSortOrder) {
        return aSortOrder - bSortOrder;
      }
      return String(a.key || '').localeCompare(String(b.key || ''));
    });
  }

  /**
   * Generate a human-readable label from an enum value
   */
  private generateDefaultLabel(enumValue: string): string {
    return enumValue
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Frontend-optimized version
  async findAllForFrontend(): Promise<Record<SystemEnumName, Partial<EnumDisplayDocument>[]>> {
    const enumDisplays = await this.enumDisplayModel
      .find()
      .select(this.FRONTEND_FIELDS)
      .sort({ enumName: 1, sortOrder: 1, key: 1 })
      .lean()
      .exec();

    return this.buildEnumDisplayGroups(enumDisplays, true);
  }

  private async incrementCatalogVersion(userId?: string): Promise<void> {
    try {
      await this.catalogVersionModel
        .findOneAndUpdate(
          { id: 'default' },
          {
            $inc: { version: 1 },
            lastModifiedBy: userId,
          },
          { upsert: true, new: true },
        )
        .exec();
    } catch (error) {
      LoggingUtil.errorWithException(
        'Failed to increment catalog version',
        error,
        'EnumDisplaysService',
      );
    }
  }
}
