import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  AppConfig,
  AppConfigDocument,
  ConfigCategory,
} from '../../database/schemas/app-config.schema';
import { ConfigDataDto } from './dto/config-response.dto';
import { ConfigUpdateData } from '../../common/interfaces/config.interfaces';
import { LoggingUtil } from '../../common/utils/logging.util';

@Injectable()
export class DynamicConfigService {
  constructor(
    @InjectModel(AppConfig.name)
    private readonly configModel: Model<AppConfigDocument>,
  ) {}

  /** Ensure key is non-empty & matches UPPER_SNAKE_CASE */
  private validateKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new BadRequestException('Config key must be a non-empty string');
    }
    if (!/^[A-Z0-9_]+$/.test(key)) {
      throw new BadRequestException(
        `Invalid config key "${key}". Use uppercase letters, numbers, and underscores only.`,
      );
    }
  }

  /** Retrieve a single config value, or return defaultValue if provided */
  async get(key: string, defaultValue?: string): Promise<string> {
    this.validateKey(key);
    const doc = await this.configModel.findOne({ key }).lean().exec();
    if (!doc) {
      if (defaultValue !== undefined) return defaultValue;
      throw new NotFoundException(`Configuration for key "${key}" not found`);
    }
    return doc.value;
  }

  /** Retrieve all config entries, optionally filtered by category */
  async getAll(category?: ConfigCategory): Promise<ConfigDataDto[]> {
    const query = category ? { category } : {};
    return this.configModel.find(query).sort({ category: 1, sortOrder: 1, key: 1 }).lean().exec();
  }

  /** Get all configurations grouped by category */
  async getAllGroupedByCategory(): Promise<Record<string, ConfigDataDto[]>> {
    const configs = await this.configModel
      .find()
      .sort({ category: 1, sortOrder: 1, key: 1 })
      .lean()
      .exec();

    const grouped: Record<string, ConfigDataDto[]> = {};
    for (const config of configs) {
      const category = config.category || ConfigCategory.GENERAL;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(config);
    }

    return grouped;
  }

  /** Get configurations by specific category */
  async getByCategory(category: ConfigCategory): Promise<ConfigDataDto[]> {
    return this.configModel.find({ category }).sort({ sortOrder: 1, key: 1 }).lean().exec();
  }

  /** Retrieve a config document by key (for API responses) */
  async getByKey(key: string): Promise<ConfigDataDto | null> {
    this.validateKey(key);
    return this.configModel.findOne({ key }).lean().exec();
  }

  /** Create or update a config entry */
  async set(
    key: string,
    value: string,
    title?: string,
    description?: string,
    category?: ConfigCategory,
    sortOrder?: number,
  ): Promise<ConfigDataDto> {
    this.validateKey(key);
    if (typeof value !== 'string' || value.trim() === '') {
      throw new BadRequestException('Config value must be a non-empty string');
    }

    try {
      const updateData: ConfigUpdateData = {
        value: value.trim(),
        description: description?.trim(),
      };

      if (title !== undefined) {
        updateData.title = title.trim();
      }

      if (category !== undefined) {
        updateData.category = category;
      }

      if (sortOrder !== undefined) {
        updateData.sortOrder = sortOrder;
      }

      return await this.configModel
        .findOneAndUpdate({ key }, updateData, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        })
        .lean()
        .exec();
    } catch (err) {
      LoggingUtil.errorWithException(`Failed to set config "${key}"`, err, 'DynamicConfigService');
      throw new InternalServerErrorException('Failed to save configuration');
    }
  }

  /** Delete a config entry, or 404 if it doesn’t exist */
  async delete(key: string): Promise<void> {
    this.validateKey(key);
    const deleted = await this.configModel.findOneAndDelete({ key }).lean().exec();
    if (!deleted) {
      throw new NotFoundException(`Configuration for key "${key}" not found`);
    }
  }

  /** Get a config value as a number, or throw if not convertible */
  async getNumber(key: string, defaultValue?: number): Promise<number> {
    const raw = await this.get(key, defaultValue !== undefined ? String(defaultValue) : undefined);
    const n = Number(raw);
    if (Number.isNaN(n)) {
      throw new BadRequestException(`Config "${key}" must be a number, got "${raw}"`);
    }
    return n;
  }

  /** Get a config value as a boolean, or return defaultValue if provided */
  async getBoolean(key: string, defaultValue?: boolean): Promise<boolean> {
    const raw = await this.get(key, defaultValue !== undefined ? String(defaultValue) : undefined);
    return /^true$/i.test(raw);
  }

  /** Get multiple config values by keys */
  async getMany<TKeys extends readonly string[]>(
    keys: TKeys,
  ): Promise<Record<TKeys[number], string>> {
    const docs = await this.configModel
      .find({ key: { $in: keys } })
      .lean()
      .exec();
    const map = Object.fromEntries(docs.map((d) => [d.key, d.value])) as Record<string, string>;
    // backfill with empty string if missing (or throw—up to you)
    return keys.reduce(
      (acc, k) => {
        acc[k] = map[k] ?? '';
        return acc;
      },
      {} as Record<TKeys[number], string>,
    );
  }
}
