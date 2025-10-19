import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { CatalogItem, CatalogItemDocument } from '../schemas/catalog-item.schema';
import { SeederLogger, runSeeder } from './seeder.helpers';

/**
 * Initial catalog items seeder
 * Creates PropertyType, RoomType, BedType, CancellationPolicy, and Amenity catalog items
 */
export async function seedCatalogItems(appContext: INestApplication) {
  await runSeeder('catalog items', async () => {
    // Get model from app context
    const catalogItemModel = appContext.get<Model<CatalogItemDocument>>(`${CatalogItem.name}Model`);

    // Check if catalog items already exist
    const existingCount = await catalogItemModel.countDocuments();
    if (existingCount > 0) {
      SeederLogger.skipped('catalog items');
      return;
    }

    const catalogItems = [
      // ==================== PROPERTY TYPES ====================
      {
        catalogType: 'PropertyType',
        key: 'APARTMENT',
        slug: 'apartment',
        label: { en: 'Apartment', fr: 'Appartement', ar: 'شقة' },
        description: {
          en: 'A self-contained housing unit within a larger building',
          fr: 'Un logement autonome dans un immeuble',
          ar: 'وحدة سكنية مستقلة ضمن مبنى أكبر',
        },
        sortOrder: 1,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'PropertyType',
        key: 'HOUSE',
        slug: 'house',
        label: { en: 'House', fr: 'Maison', ar: 'منزل' },
        description: {
          en: 'A standalone residential building with private entrance',
          fr: 'Un bâtiment résidentiel indépendant avec entrée privée',
          ar: 'مبنى سكني مستقل مع مدخل خاص',
        },
        sortOrder: 2,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'PropertyType',
        key: 'STUDIO',
        slug: 'studio',
        label: { en: 'Studio', fr: 'Studio', ar: 'ستوديو' },
        description: {
          en: 'A compact apartment with open-plan living space',
          fr: 'Un appartement compact avec espace de vie ouvert',
          ar: 'شقة مدمجة مع مساحة معيشة مفتوحة',
        },
        sortOrder: 3,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'PropertyType',
        key: 'VILLA',
        slug: 'villa',
        label: { en: 'Villa', fr: 'Villa', ar: 'فيلا' },
        description: {
          en: 'A luxurious detached home with premium amenities',
          fr: 'Une maison luxueuse indépendante avec équipements haut de gamme',
          ar: 'منزل فاخر مستقل مع مرافق متميزة',
        },
        sortOrder: 4,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'PropertyType',
        key: 'CABIN',
        slug: 'cabin',
        label: { en: 'Cabin', fr: 'Cabane', ar: 'كابينة' },
        description: {
          en: 'A cozy rustic retreat typically in natural settings',
          fr: 'Un refuge rustique confortable généralement dans un cadre naturel',
          ar: 'ملاذ ريفي مريح عادة في أماكن طبيعية',
        },
        sortOrder: 5,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'PropertyType',
        key: 'COTTAGE',
        slug: 'cottage',
        label: { en: 'Cottage', fr: 'Chalet', ar: 'كوخ' },
        description: {
          en: 'A small charming house often in countryside or coastal areas',
          fr: 'Une petite maison charmante souvent à la campagne ou en bord de mer',
          ar: 'منزل صغير ساحر غالبًا في المناطق الريفية أو الساحلية',
        },
        sortOrder: 6,
        isVisible: true,
        isActive: true,
      },

      // ==================== ROOM TYPES ====================
      {
        catalogType: 'RoomType',
        key: 'ENTIRE_PLACE',
        slug: 'entire-place',
        label: { en: 'Entire place', fr: 'Lieu entier', ar: 'المكان بالكامل' },
        description: {
          en: 'You have the whole property to yourself with private entrance',
          fr: 'Vous avez toute la propriété pour vous avec entrée privée',
          ar: 'لديك العقار بأكمله لنفسك مع مدخل خاص',
        },
        sortOrder: 2,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'RoomType',
        key: 'PRIVATE_ROOM',
        slug: 'private-room',
        label: { en: 'Private room', fr: 'Chambre privée', ar: 'غرفة خاصة' },
        description: {
          en: 'Your own private bedroom while sharing common areas',
          fr: 'Votre propre chambre privée avec espaces communs partagés',
          ar: 'غرفة نوم خاصة بك مع مشاركة المساحات العامة',
        },
        sortOrder: 3,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'RoomType',
        key: 'SHARED_ROOM',
        slug: 'shared-room',
        label: { en: 'Shared room', fr: 'Chambre partagée', ar: 'غرفة مشتركة' },
        description: {
          en: 'A sleeping area shared with others in a common space',
          fr: "Un espace de couchage partagé avec d'autres dans un espace commun",
          ar: 'منطقة نوم مشتركة مع آخرين في مساحة عامة',
        },
        sortOrder: 4,
        isVisible: true,
        isActive: true,
      },
      // ==================== BED TYPES ====================
      {
        catalogType: 'BedType',
        key: 'SINGLE',
        slug: 'single-bed',
        label: { en: 'Single bed', fr: 'Lit simple', ar: 'سرير مفرد' },
        description: {
          en: 'Comfortable for one person (90-100cm wide)',
          fr: 'Confortable pour une personne (90-100cm de large)',
          ar: 'مريح لشخص واحد (عرض 90-100 سم)',
        },
        sortOrder: 1,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'BedType',
        key: 'TWIN',
        slug: 'twin-bed',
        label: { en: 'Twin bed', fr: 'Lit jumeau', ar: 'سرير توأم' },
        description: {
          en: 'Two separate single beds in the same room',
          fr: 'Deux lits simples séparés dans la même pièce',
          ar: 'سريران منفصلان في نفس الغرفة',
        },
        sortOrder: 2,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'BedType',
        key: 'FULL_DOUBLE',
        slug: 'full-double-bed',
        label: { en: 'Full/Double bed', fr: 'Lit double', ar: 'سرير مزدوج' },
        description: {
          en: 'Spacious for two people (135-140cm wide)',
          fr: 'Spacieux pour deux personnes (135-140cm de large)',
          ar: 'واسع لشخصين (عرض 135-140 سم)',
        },
        sortOrder: 3,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'BedType',
        key: 'QUEEN',
        slug: 'queen-bed',
        label: { en: 'Queen bed', fr: 'Lit queen', ar: 'سرير كوين' },
        description: {
          en: 'Generous space for couples (150-160cm wide)',
          fr: 'Espace généreux pour les couples (150-160cm de large)',
          ar: 'مساحة سخية للأزواج (عرض 150-160 سم)',
        },
        sortOrder: 4,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'BedType',
        key: 'KING',
        slug: 'king-bed',
        label: { en: 'King bed', fr: 'Lit king', ar: 'سرير كينج' },
        description: {
          en: 'Maximum comfort for two people (180-200cm wide)',
          fr: 'Confort maximal pour deux personnes (180-200cm de large)',
          ar: 'راحة قصوى لشخصين (عرض 180-200 سم)',
        },
        sortOrder: 5,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'BedType',
        key: 'SUPER_KING',
        slug: 'super-king-bed',
        label: { en: 'Super King bed', fr: 'Lit super king', ar: 'سرير سوبر كينج' },
        description: {
          en: 'Ultra-spacious luxury bed (200cm+ wide)',
          fr: 'Lit de luxe ultra-spacieux (200cm+ de large)',
          ar: 'سرير فاخر واسع جدًا (عرض 200 سم+)',
        },
        sortOrder: 6,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'BedType',
        key: 'SOFA_BED',
        slug: 'sofa-bed',
        label: { en: 'Sofa bed', fr: 'Canapé-lit', ar: 'أريكة سرير' },
        description: {
          en: 'Convertible seating that transforms into a bed',
          fr: 'Siège convertible qui se transforme en lit',
          ar: 'مقعد قابل للتحويل إلى سرير',
        },
        sortOrder: 7,
        isVisible: true,
        isActive: true,
      },

      // ==================== CANCELLATION POLICIES ====================
      {
        catalogType: 'CancellationPolicy',
        key: 'FLEXIBLE',
        slug: 'flexible',
        label: { en: 'Flexible', fr: 'Flexible', ar: 'مرن' },
        description: {
          en: 'Full refund 24 hours before check-in',
          fr: "Remboursement intégral 24h avant l'arrivée",
          ar: 'استرداد كامل قبل 24 ساعة من تسجيل الوصول',
        },
        sortOrder: 1,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'CancellationPolicy',
        key: 'MODERATE',
        slug: 'moderate',
        label: { en: 'Moderate', fr: 'Modéré', ar: 'متوسط' },
        description: {
          en: 'Full refund 5 days before check-in',
          fr: "Remboursement intégral 5 jours avant l'arrivée",
          ar: 'استرداد كامل قبل 5 أيام من تسجيل الوصول',
        },
        sortOrder: 2,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'CancellationPolicy',
        key: 'STRICT',
        slug: 'strict',
        label: { en: 'Strict', fr: 'Strict', ar: 'صارم' },
        description: {
          en: '50% refund up to 7 days before check-in',
          fr: "Remboursement de 50% jusqu'à 7 jours avant l'arrivée",
          ar: 'استرداد 50% حتى 7 أيام قبل تسجيل الوصول',
        },
        sortOrder: 3,
        isVisible: true,
        isActive: true,
      },

      // ==================== AMENITIES ====================
      {
        catalogType: 'Amenity',
        key: 'WIFI',
        slug: 'wifi',
        label: { en: 'WiFi', fr: 'Wi-Fi', ar: 'واي فاي' },
        icon: 'wifi',
        group: 'connectivity',
        sortOrder: 1,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'Amenity',
        key: 'PARKING',
        slug: 'parking',
        label: { en: 'Free parking', fr: 'Parking gratuit', ar: 'موقف سيارات مجاني' },
        icon: 'car',
        group: 'parking',
        sortOrder: 2,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'Amenity',
        key: 'POOL',
        slug: 'pool',
        label: { en: 'Pool', fr: 'Piscine', ar: 'مسبح' },
        icon: 'activity',
        group: 'recreation',
        sortOrder: 3,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'Amenity',
        key: 'KITCHEN',
        slug: 'kitchen',
        label: { en: 'Kitchen', fr: 'Cuisine', ar: 'مطبخ' },
        icon: 'cup',
        group: 'cooking',
        sortOrder: 4,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'Amenity',
        key: 'AIR_CONDITIONING',
        slug: 'air-conditioning',
        label: { en: 'Air conditioning', fr: 'Climatisation', ar: 'تكييف' },
        icon: 'wind',
        group: 'climate',
        sortOrder: 5,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'Amenity',
        key: 'HEATING',
        slug: 'heating',
        label: { en: 'Heating', fr: 'Chauffage', ar: 'تدفئة' },
        icon: 'flame',
        group: 'climate',
        sortOrder: 6,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'Amenity',
        key: 'TV',
        slug: 'tv',
        label: { en: 'TV', fr: 'Télévision', ar: 'تلفاز' },
        icon: 'monitor',
        group: 'entertainment',
        sortOrder: 7,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'Amenity',
        key: 'WASHER',
        slug: 'washer',
        label: { en: 'Washer', fr: 'Lave-linge', ar: 'غسالة' },
        icon: 'refresh',
        group: 'laundry',
        sortOrder: 8,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'Amenity',
        key: 'WORKSPACE',
        slug: 'workspace',
        label: { en: 'Dedicated workspace', fr: 'Espace de travail', ar: 'مساحة عمل مخصصة' },
        icon: 'monitor-mobbile',
        group: 'work',
        sortOrder: 9,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'Amenity',
        key: 'PETS_ALLOWED',
        slug: 'pets-allowed',
        label: { en: 'Pets allowed', fr: 'Animaux autorisés', ar: 'يسمح بالحيوانات الأليفة' },
        icon: 'pet',
        group: 'policies',
        sortOrder: 10,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'Amenity',
        key: 'GYM',
        slug: 'gym',
        label: { en: 'Gym', fr: 'Salle de sport', ar: 'صالة رياضية' },
        icon: 'weight',
        group: 'fitness',
        sortOrder: 11,
        isVisible: true,
        isActive: true,
      },
      {
        catalogType: 'Amenity',
        key: 'ELEVATOR',
        slug: 'elevator',
        label: { en: 'Elevator', fr: 'Ascenseur', ar: 'مصعد' },
        icon: 'arrow-up-down',
        group: 'accessibility',
        sortOrder: 12,
        isVisible: true,
        isActive: true,
      },
    ];

    await catalogItemModel.insertMany(catalogItems);
    console.log(`Seeded ${catalogItems.length} catalog items successfully`);
  });
}
