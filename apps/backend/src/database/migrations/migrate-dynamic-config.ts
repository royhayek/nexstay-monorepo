import { INestApplication } from '@nestjs/common';
import { Model, Document } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { AppConfig, AppConfigDocument } from '../schemas/app-config.schema';
import { BedType, BedTypeDocument } from '../schemas/bed-type.schema';
import { PropertyType, PropertyTypeDocument } from '../schemas/property-type.schema';
import { RoomType, RoomTypeDocument } from '../schemas/room-type.schema';
import {
  CancellationPolicy,
  CancellationPolicyDocument,
} from '../schemas/cancellation-policy.schema';
import { Currency, CurrencyDocument } from '../schemas/currency.schema';
import { NotificationType, NotificationTypeDocument } from '../schemas/notification-type.schema';
import { PaymentProvider, PaymentProviderDocument } from '../schemas/payment-provider.schema';
import { CatalogVersion, CatalogVersionDocument } from '../schemas/catalog-version.schema';
import { LoggingUtil } from '../../common/utils/logging.util';

interface MigrationContext {
  appConfigModel: Model<AppConfigDocument>;
  bedTypeModel: Model<BedTypeDocument>;
  propertyTypeModel: Model<PropertyTypeDocument>;
  roomTypeModel: Model<RoomTypeDocument>;
  cancellationPolicyModel: Model<CancellationPolicyDocument>;
  currencyModel: Model<CurrencyDocument>;
  notificationTypeModel: Model<NotificationTypeDocument>;
  paymentProviderModel: Model<PaymentProviderDocument>;
  catalogVersionModel: Model<CatalogVersionDocument>;
}

/**
 * Migration script to convert DynamicConfig entries to new catalog system
 */
export async function migrateDynamicConfig(appContext: INestApplication): Promise<void> {
  LoggingUtil.migrationLog('🔄 Starting DynamicConfig migration...');

  const ctx: MigrationContext = {
    appConfigModel: appContext.get(getModelToken(AppConfig.name)),
    bedTypeModel: appContext.get(getModelToken(BedType.name)),
    propertyTypeModel: appContext.get(getModelToken(PropertyType.name)),
    roomTypeModel: appContext.get(getModelToken(RoomType.name)),
    cancellationPolicyModel: appContext.get(getModelToken(CancellationPolicy.name)),
    currencyModel: appContext.get(getModelToken(Currency.name)),
    notificationTypeModel: appContext.get(getModelToken(NotificationType.name)),
    paymentProviderModel: appContext.get(getModelToken(PaymentProvider.name)),
    catalogVersionModel: appContext.get(getModelToken(CatalogVersion.name)),
  };

  try {
    // Get all existing DynamicConfig entries
    const configs = await ctx.appConfigModel.find().exec();
    LoggingUtil.migrationLog(`📊 Found ${configs.length} DynamicConfig entries`);

    if (configs.length === 0) {
      LoggingUtil.migrationSuccess('✅ No DynamicConfig entries to migrate');
      return;
    }

    // Migrate each category
    await migrateCatalogItems(ctx, configs);

    // Initialize catalog version
    await initializeCatalogVersion(ctx);

    LoggingUtil.migrationSuccess('✅ DynamicConfig migration completed successfully');
  } catch (error) {
    LoggingUtil.migrationError(
      '❌ DynamicConfig migration failed:',
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
}

async function migrateCatalogItems(
  ctx: MigrationContext,
  configs: AppConfigDocument[],
): Promise<void> {
  LoggingUtil.migrationLog('🔄 Migrating catalog items...');

  // Map config keys to catalog types
  const catalogMappings = [
    {
      prefix: 'BED_TYPE_',
      model: ctx.bedTypeModel,
      name: 'bed types',
    },
    {
      prefix: 'PROPERTY_TYPE_',
      model: ctx.propertyTypeModel,
      name: 'property types',
    },
    {
      prefix: 'ROOM_TYPE_',
      model: ctx.roomTypeModel,
      name: 'room types',
    },
    {
      prefix: 'CANCELLATION_POLICY_',
      model: ctx.cancellationPolicyModel,
      name: 'cancellation policies',
    },
    {
      prefix: 'CURRENCY_',
      model: ctx.currencyModel,
      name: 'currencies',
    },
    {
      prefix: 'NOTIFICATION_TYPE_',
      model: ctx.notificationTypeModel,
      name: 'notification types',
    },
    {
      prefix: 'PAYMENT_PROVIDER_',
      model: ctx.paymentProviderModel,
      name: 'payment providers',
    },
  ];

  for (const mapping of catalogMappings) {
    const catalogConfigs = configs.filter((config) => config.key.startsWith(mapping.prefix));

    if (catalogConfigs.length === 0) {
      LoggingUtil.migrationLog(`⏩ No ${mapping.name} configs found, skipping`);
      continue;
    }

    LoggingUtil.migrationLog(`🔄 Migrating ${catalogConfigs.length} ${mapping.name}...`);

    for (const config of catalogConfigs) {
      try {
        const key = config.key;
        const slug = key.toLowerCase().replace(/_/g, '-');

        // Check if item already exists
        const modelTyped = mapping.model as Model<Document>;
        const existing = await modelTyped.findOne({ key } as Record<string, unknown>).exec();
        if (existing) {
          LoggingUtil.migrationLog(`⏩ ${mapping.name} ${key} already exists, skipping`);
          continue;
        }

        // Create catalog item base properties
        const baseProperties = {
          key,
          slug,
          name: { en: config.title || config.value },
          description: config.description ? { en: config.description } : undefined,
          sortOrder: config.sortOrder || 0,
          isActive: true,
          isDeprecated: false,
          createdBy: 'migration',
          updatedBy: 'migration',
        };

        // Add specific properties for certain catalog types
        let catalogItemData: Record<string, unknown> = { ...baseProperties };

        if (mapping.prefix === 'CURRENCY_' && config.value.length === 3) {
          catalogItemData = {
            ...catalogItemData,
            isoCode: config.value,
            symbol: getCurrencySymbol(config.value),
            isSupported: true,
          };
        }

        if (mapping.prefix === 'PAYMENT_PROVIDER_') {
          catalogItemData = {
            ...catalogItemData,
            isEnabled: config.value === 'true',
            supportedMethods: ['card'], // Default
          };
        }

        const catalogItem = new mapping.model(catalogItemData);

        await catalogItem.save();
        LoggingUtil.migrationSuccess(`✅ Created ${mapping.name}: ${key}`);
      } catch (error) {
        LoggingUtil.migrationError(
          `❌ Failed to migrate ${mapping.name} ${config.key}:`,
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }
  }
}

async function initializeCatalogVersion(ctx: MigrationContext): Promise<void> {
  LoggingUtil.migrationLog('🔄 Initializing catalog version...');

  const existingVersion = await ctx.catalogVersionModel.findOne({ id: 'default' }).exec();

  if (existingVersion) {
    LoggingUtil.migrationLog(
      `⏩ Catalog version already exists (v${existingVersion.version}), skipping`,
    );
    return;
  }

  const versionDoc = new ctx.catalogVersionModel({
    id: 'default',
    version: 1,
    lastModifiedBy: 'migration',
  });

  await versionDoc.save();
  LoggingUtil.migrationSuccess('✅ Initialized catalog version to 1');
}

function getCurrencySymbol(isoCode: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'د.إ',
    SAR: 'ر.س',
    KWD: 'د.ك',
    BHD: 'د.ب',
    OMR: 'ر.ع',
    QAR: 'ر.ق',
    EGP: 'ج.م',
    JOD: 'د.أ',
    LBP: 'ل.ل',
  };
  return symbols[isoCode] || isoCode;
}
