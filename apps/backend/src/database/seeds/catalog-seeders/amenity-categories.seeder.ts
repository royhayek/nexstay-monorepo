import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { AmenityCategory, AmenityCategoryDocument } from '../../schemas/amenity-category.schema';
import { SeederLogger, runSeeder } from '../seeder.helpers';

export async function seedAmenityCategories(appContext: INestApplication) {
  await runSeeder('amenity categories', async () => {
    const amenityCategoryModel: Model<AmenityCategoryDocument> = appContext.get(
      getModelToken(AmenityCategory.name),
    );

    const amenityCategories = [
      {
        key: 'ESSENTIAL',
        slug: 'essential',
        name: {
          en: 'Essential Amenities',
          fr: 'Équipements essentiels',
          ar: 'وسائل الراحة الأساسية',
        },
        description: {
          en: 'Basic amenities every guest expects',
          fr: 'Équipements de base que chaque invité attend',
          ar: 'وسائل الراحة الأساسية التي يتوقعها كل ضيف',
        },
        icon: 'essential',
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'KITCHEN',
        slug: 'kitchen',
        name: {
          en: 'Kitchen & Dining',
          fr: 'Cuisine et salle à manger',
          ar: 'المطبخ وغرفة الطعام',
        },
        description: {
          en: 'Kitchen appliances and dining amenities',
          fr: 'Appareils de cuisine et équipements de restauration',
          ar: 'أجهزة المطبخ ووسائل الراحة للطعام',
        },
        icon: 'kitchen',
        sortOrder: 2,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'ENTERTAINMENT',
        slug: 'entertainment',
        name: { en: 'Entertainment', fr: 'Divertissement', ar: 'الترفيه' },
        description: {
          en: 'Entertainment and media amenities',
          fr: 'Équipements de divertissement et médias',
          ar: 'وسائل الراحة الترفيهية والإعلامية',
        },
        icon: 'entertainment',
        sortOrder: 3,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'BATHROOM',
        slug: 'bathroom',
        name: { en: 'Bathroom', fr: 'Salle de bain', ar: 'الحمام' },
        description: {
          en: 'Bathroom amenities and toiletries',
          fr: 'Équipements de salle de bain et articles de toilette',
          ar: 'وسائل الراحة والمستلزمات الحمام',
        },
        icon: 'bathroom',
        sortOrder: 4,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'OUTDOOR',
        slug: 'outdoor',
        name: { en: 'Outdoor', fr: 'Extérieur', ar: 'في الهواء الطلق' },
        description: {
          en: 'Outdoor and garden amenities',
          fr: 'Équipements extérieurs et de jardin',
          ar: 'وسائل الراحة الخارجية والحديقة',
        },
        icon: 'outdoor',
        sortOrder: 5,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'SAFETY',
        slug: 'safety',
        name: { en: 'Safety & Security', fr: 'Sécurité et sûreté', ar: 'السلامة والأمان' },
        description: {
          en: 'Safety and security features',
          fr: 'Caractéristiques de sécurité et de sûreté',
          ar: 'ميزات السلامة والأمان',
        },
        icon: 'safety',
        sortOrder: 6,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'ACCESSIBILITY',
        slug: 'accessibility',
        name: { en: 'Accessibility', fr: 'Accessibilité', ar: 'إمكانية الوصول' },
        description: {
          en: 'Accessibility features for guests with disabilities',
          fr: "Caractéristiques d'accessibilité pour les invités handicapés",
          ar: 'ميزات إمكانية الوصول للضيوف ذوي الإعاقة',
        },
        icon: 'accessibility',
        sortOrder: 7,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'FAMILY',
        slug: 'family',
        name: { en: 'Family Friendly', fr: 'Adapté aux familles', ar: 'صديق للعائلة' },
        description: {
          en: 'Amenities suitable for families with children',
          fr: 'Équipements adaptés aux familles avec enfants',
          ar: 'وسائل الراحة المناسبة للعائلات مع الأطفال',
        },
        icon: 'family',
        sortOrder: 8,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'BUSINESS',
        slug: 'business',
        name: { en: 'Business & Work', fr: 'Affaires et travail', ar: 'الأعمال والعمل' },
        description: {
          en: 'Business and remote work amenities',
          fr: "Équipements d'affaires et de travail à distance",
          ar: 'وسائل الراحة للأعمال والعمل عن بُعد',
        },
        icon: 'business',
        sortOrder: 9,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'LUXURY',
        slug: 'luxury',
        name: { en: 'Luxury', fr: 'Luxe', ar: 'فاخر' },
        description: {
          en: 'Premium and luxury amenities',
          fr: 'Équipements premium et de luxe',
          ar: 'وسائل الراحة المتميزة والفاخرة',
        },
        icon: 'luxury',
        sortOrder: 10,
        isActive: true,
        isDeprecated: false,
      },
    ];

    const existingCount = await amenityCategoryModel.countDocuments();
    if (existingCount > 0) {
      SeederLogger.skipped('amenity categories');
      return;
    }

    for (const category of amenityCategories) {
      const existing = await amenityCategoryModel.findOne({ key: category.key }).exec();

      if (!existing) {
        await amenityCategoryModel.create({
          ...category,
          createdBy: 'seeder',
          updatedBy: 'seeder',
        });
      }
    }

    SeederLogger.success('amenity categories');
  });
}
