import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Amenity, AmenityDocument } from '../../schemas/amenity.schema';
import { AmenityCategory, AmenityCategoryDocument } from '../../schemas/amenity-category.schema';
import { SeederLogger, runSeeder } from '../seeder.helpers';

export async function seedAmenities(appContext: INestApplication) {
  await runSeeder('amenities', async () => {
    const amenityModel: Model<AmenityDocument> = appContext.get(getModelToken(Amenity.name));
    const amenityCategoryModel: Model<AmenityCategoryDocument> = appContext.get(
      getModelToken(AmenityCategory.name),
    );

    // Get category IDs for reference
    const essentialCategory = await amenityCategoryModel.findOne({ key: 'ESSENTIAL' }).exec();
    const kitchenCategory = await amenityCategoryModel.findOne({ key: 'KITCHEN' }).exec();
    const entertainmentCategory = await amenityCategoryModel
      .findOne({ key: 'ENTERTAINMENT' })
      .exec();
    const bathroomCategory = await amenityCategoryModel.findOne({ key: 'BATHROOM' }).exec();
    const outdoorCategory = await amenityCategoryModel.findOne({ key: 'OUTDOOR' }).exec();
    const safetyCategory = await amenityCategoryModel.findOne({ key: 'SAFETY' }).exec();
    const accessibilityCategory = await amenityCategoryModel
      .findOne({ key: 'ACCESSIBILITY' })
      .exec();
    const familyCategory = await amenityCategoryModel.findOne({ key: 'FAMILY' }).exec();
    const businessCategory = await amenityCategoryModel.findOne({ key: 'BUSINESS' }).exec();
    const luxuryCategory = await amenityCategoryModel.findOne({ key: 'LUXURY' }).exec();

    if (
      !essentialCategory ||
      !kitchenCategory ||
      !entertainmentCategory ||
      !bathroomCategory ||
      !outdoorCategory ||
      !safetyCategory ||
      !accessibilityCategory ||
      !familyCategory ||
      !businessCategory ||
      !luxuryCategory
    ) {
      SeederLogger.error(
        'amenities',
        'Amenity categories not found. Please seed categories first.',
      );
      return;
    }

    const amenities = [
      // Essential Amenities
      {
        key: 'WIFI',
        slug: 'wifi',
        name: { en: 'WiFi', fr: 'WiFi', ar: 'واي فاي' },
        description: {
          en: 'Free wireless internet',
          fr: 'Internet sans fil gratuit',
          ar: 'إنترنت لاسلكي مجاني',
        },
        icon: 'wifi',
        categoryId: essentialCategory._id,
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'AC',
        slug: 'air-conditioning',
        name: { en: 'Air Conditioning', fr: 'Climatisation', ar: 'تكييف الهواء' },
        description: {
          en: 'Climate control system',
          fr: 'Système de contrôle climatique',
          ar: 'نظام التحكم في المناخ',
        },
        icon: 'ac',
        categoryId: essentialCategory._id,
        sortOrder: 2,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'HEATING',
        slug: 'heating',
        name: { en: 'Heating', fr: 'Chauffage', ar: 'تدفئة' },
        description: {
          en: 'Indoor heating system',
          fr: 'Système de chauffage intérieur',
          ar: 'نظام التدفئة الداخلية',
        },
        icon: 'heating',
        categoryId: essentialCategory._id,
        sortOrder: 3,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'BED_LINENS',
        slug: 'bed-linens',
        name: { en: 'Bed Linens', fr: 'Linge de lit', ar: 'أغطية السرير' },
        description: {
          en: 'Clean bed sheets and pillowcases',
          fr: "Draps et taies d'oreiller propres",
          ar: 'ملاءات نظيفة وأكياس وسائد',
        },
        icon: 'bed-linens',
        categoryId: essentialCategory._id,
        sortOrder: 4,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'TOWELS',
        slug: 'towels',
        name: { en: 'Towels', fr: 'Serviettes', ar: 'مناشف' },
        description: {
          en: 'Clean towels provided',
          fr: 'Serviettes propres fournies',
          ar: 'مناشف نظيفة مقدمة',
        },
        icon: 'towels',
        categoryId: essentialCategory._id,
        sortOrder: 5,
        isActive: true,
        isDeprecated: false,
      },

      // Kitchen & Dining
      {
        key: 'KITCHEN',
        slug: 'kitchen',
        name: { en: 'Kitchen', fr: 'Cuisine', ar: 'مطبخ' },
        description: {
          en: 'Full kitchen available',
          fr: 'Cuisine complète disponible',
          ar: 'مطبخ كامل متاح',
        },
        icon: 'kitchen',
        categoryId: kitchenCategory._id,
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'REFRIGERATOR',
        slug: 'refrigerator',
        name: { en: 'Refrigerator', fr: 'Réfrigérateur', ar: 'ثلاجة' },
        description: {
          en: 'Full-size refrigerator',
          fr: 'Réfrigérateur pleine grandeur',
          ar: 'ثلاجة بحجم كامل',
        },
        icon: 'refrigerator',
        categoryId: kitchenCategory._id,
        sortOrder: 2,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'MICROWAVE',
        slug: 'microwave',
        name: { en: 'Microwave', fr: 'Micro-ondes', ar: 'ميكروويف' },
        description: { en: 'Microwave oven', fr: 'Four à micro-ondes', ar: 'فرن ميكروويف' },
        icon: 'microwave',
        categoryId: kitchenCategory._id,
        sortOrder: 3,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'COFFEE_MAKER',
        slug: 'coffee-maker',
        name: { en: 'Coffee Maker', fr: 'Cafetière', ar: 'صانع القهوة' },
        description: {
          en: 'Coffee brewing equipment',
          fr: 'Équipement de préparation du café',
          ar: 'معدات تحضير القهوة',
        },
        icon: 'coffee-maker',
        categoryId: kitchenCategory._id,
        sortOrder: 4,
        isActive: true,
        isDeprecated: false,
      },

      // Entertainment
      {
        key: 'TV',
        slug: 'tv',
        name: { en: 'TV', fr: 'Télévision', ar: 'تلفزيون' },
        description: {
          en: 'Television with cable/satellite',
          fr: 'Télévision avec câble/satellite',
          ar: 'تلفزيون مع كابل/قمر صناعي',
        },
        icon: 'tv',
        categoryId: entertainmentCategory._id,
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'NETFLIX',
        slug: 'netflix',
        name: { en: 'Netflix', fr: 'Netflix', ar: 'نتفليكس' },
        description: {
          en: 'Netflix streaming available',
          fr: 'Streaming Netflix disponible',
          ar: 'بث نتفليكس متاح',
        },
        icon: 'netflix',
        categoryId: entertainmentCategory._id,
        sortOrder: 2,
        isActive: true,
        isDeprecated: false,
      },

      // Bathroom
      {
        key: 'SHAMPOO',
        slug: 'shampoo',
        name: { en: 'Shampoo', fr: 'Shampooing', ar: 'شامبو' },
        description: { en: 'Shampoo provided', fr: 'Shampooing fourni', ar: 'شامبو مقدم' },
        icon: 'shampoo',
        categoryId: bathroomCategory._id,
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'BODY_SOAP',
        slug: 'body-soap',
        name: { en: 'Body Soap', fr: 'Savon pour le corps', ar: 'صابون الجسم' },
        description: {
          en: 'Body soap provided',
          fr: 'Savon pour le corps fourni',
          ar: 'صابون الجسم مقدم',
        },
        icon: 'body-soap',
        categoryId: bathroomCategory._id,
        sortOrder: 2,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'HAIR_DRYER',
        slug: 'hair-dryer',
        name: { en: 'Hair Dryer', fr: 'Sèche-cheveux', ar: 'مجفف الشعر' },
        description: {
          en: 'Hair dryer available',
          fr: 'Sèche-cheveux disponible',
          ar: 'مجفف الشعر متاح',
        },
        icon: 'hair-dryer',
        categoryId: bathroomCategory._id,
        sortOrder: 3,
        isActive: true,
        isDeprecated: false,
      },

      // Outdoor
      {
        key: 'POOL',
        slug: 'pool',
        name: { en: 'Pool', fr: 'Piscine', ar: 'مسبح' },
        description: {
          en: 'Swimming pool access',
          fr: 'Accès à la piscine',
          ar: 'الوصول إلى المسبح',
        },
        icon: 'pool',
        categoryId: outdoorCategory._id,
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'PATIO',
        slug: 'patio',
        name: { en: 'Patio or Balcony', fr: 'Patio ou balcon', ar: 'فناء أو شرفة' },
        description: {
          en: 'Outdoor space with seating',
          fr: 'Espace extérieur avec sièges',
          ar: 'مساحة خارجية مع مقاعد',
        },
        icon: 'patio',
        categoryId: outdoorCategory._id,
        sortOrder: 2,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'BBQ_GRILL',
        slug: 'bbq-grill',
        name: { en: 'BBQ Grill', fr: 'Barbecue', ar: 'شواية' },
        description: {
          en: 'Barbecue grill available',
          fr: 'Barbecue disponible',
          ar: 'شواية متاحة',
        },
        icon: 'bbq-grill',
        categoryId: outdoorCategory._id,
        sortOrder: 3,
        isActive: true,
        isDeprecated: false,
      },

      // Safety & Security
      {
        key: 'SMOKE_ALARM',
        slug: 'smoke-alarm',
        name: { en: 'Smoke Alarm', fr: 'Détecteur de fumée', ar: 'جهاز إنذار الدخان' },
        description: {
          en: 'Working smoke detector',
          fr: 'Détecteur de fumée fonctionnel',
          ar: 'كاشف دخان يعمل',
        },
        icon: 'smoke-alarm',
        categoryId: safetyCategory._id,
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'CARBON_MONOXIDE_ALARM',
        slug: 'carbon-monoxide-alarm',
        name: {
          en: 'Carbon Monoxide Alarm',
          fr: 'Détecteur de monoxyde de carbone',
          ar: 'جهاز إنذار أول أكسيد الكربون',
        },
        description: {
          en: 'Working carbon monoxide detector',
          fr: 'Détecteur de monoxyde de carbone fonctionnel',
          ar: 'كاشف أول أكسيد الكربون يعمل',
        },
        icon: 'carbon-monoxide-alarm',
        categoryId: safetyCategory._id,
        sortOrder: 2,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'FIRST_AID_KIT',
        slug: 'first-aid-kit',
        name: {
          en: 'First Aid Kit',
          fr: 'Trousse de premiers secours',
          ar: 'حقيبة الإسعافات الأولية',
        },
        description: {
          en: 'Basic first aid supplies',
          fr: 'Fournitures de premiers secours de base',
          ar: 'مستلزمات الإسعافات الأولية الأساسية',
        },
        icon: 'first-aid-kit',
        categoryId: safetyCategory._id,
        sortOrder: 3,
        isActive: true,
        isDeprecated: false,
      },

      // Accessibility
      {
        key: 'WHEELCHAIR_ACCESSIBLE',
        slug: 'wheelchair-accessible',
        name: {
          en: 'Wheelchair Accessible',
          fr: 'Accessible en fauteuil roulant',
          ar: 'مناسب للكراسي المتحركة',
        },
        description: {
          en: 'Step-free access and wide doorways',
          fr: 'Accès sans marches et portes larges',
          ar: 'دخول بدون درجات وأبواب عريضة',
        },
        icon: 'wheelchair-accessible',
        categoryId: accessibilityCategory._id,
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },

      // Family Friendly
      {
        key: 'CRIB',
        slug: 'crib',
        name: { en: 'Crib', fr: 'Lit bébé', ar: 'سرير أطفال' },
        description: {
          en: 'Baby crib available',
          fr: 'Lit bébé disponible',
          ar: 'سرير أطفال متاح',
        },
        icon: 'crib',
        categoryId: familyCategory._id,
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'HIGH_CHAIR',
        slug: 'high-chair',
        name: { en: 'High Chair', fr: 'Chaise haute', ar: 'كرسي عالي' },
        description: {
          en: 'Baby high chair for feeding',
          fr: 'Chaise haute pour bébé',
          ar: 'كرسي عالي لإطعام الأطفال',
        },
        icon: 'high-chair',
        categoryId: familyCategory._id,
        sortOrder: 2,
        isActive: true,
        isDeprecated: false,
      },

      // Business & Work
      {
        key: 'DEDICATED_WORKSPACE',
        slug: 'dedicated-workspace',
        name: { en: 'Dedicated Workspace', fr: 'Espace de travail dédié', ar: 'مساحة عمل مخصصة' },
        description: {
          en: 'A room with a desk and chair for working',
          fr: 'Une pièce avec bureau et chaise pour travailler',
          ar: 'غرفة بمكتب وكرسي للعمل',
        },
        icon: 'dedicated-workspace',
        categoryId: businessCategory._id,
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },

      // Luxury
      {
        key: 'HOT_TUB',
        slug: 'hot-tub',
        name: { en: 'Hot Tub', fr: 'Bain à remous', ar: 'حوض استحمام ساخن' },
        description: {
          en: 'Private hot tub or jacuzzi',
          fr: 'Bain à remous ou jacuzzi privé',
          ar: 'حوض استحمام ساخن أو جاكوزي خاص',
        },
        icon: 'hot-tub',
        categoryId: luxuryCategory._id,
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'PIANO',
        slug: 'piano',
        name: { en: 'Piano', fr: 'Piano', ar: 'بيانو' },
        description: {
          en: 'Piano available for guests',
          fr: 'Piano disponible pour les invités',
          ar: 'بيانو متاح للضيوف',
        },
        icon: 'piano',
        categoryId: luxuryCategory._id,
        sortOrder: 2,
        isActive: true,
        isDeprecated: false,
      },
    ];

    const existingCount = await amenityModel.countDocuments();
    if (existingCount > 0) {
      SeederLogger.skipped('amenities');
      return;
    }

    let createdCount = 0;
    for (const amenity of amenities) {
      const existing = await amenityModel.findOne({ key: amenity.key }).exec();

      if (!existing) {
        await amenityModel.create({
          ...amenity,
          createdBy: 'seeder',
          updatedBy: 'seeder',
        });
        createdCount++;
      }
    }

    if (createdCount > 0) {
      SeederLogger.success('amenities');
    } else {
      SeederLogger.skipped('amenities');
    }
  });
}
