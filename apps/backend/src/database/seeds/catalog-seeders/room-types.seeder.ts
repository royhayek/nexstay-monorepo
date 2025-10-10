import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { RoomType, RoomTypeDocument } from '../../schemas/room-type.schema';
import { SeederLogger, runSeeder } from '../seeder.helpers';

export async function seedRoomTypes(appContext: INestApplication) {
  await runSeeder('room types', async () => {
    const roomTypeModel: Model<RoomTypeDocument> = appContext.get(getModelToken(RoomType.name));

    const roomTypes = [
      {
        key: 'BEDROOM',
        slug: 'bedroom',
        name: { en: 'Bedroom', fr: 'Chambre à coucher', ar: 'غرفة نوم' },
        description: {
          en: 'A room primarily for sleeping',
          fr: 'Une pièce principalement pour dormir',
          ar: 'غرفة مخصصة للنوم بشكل أساسي',
        },
        category: 'sleeping',
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'MASTER_BEDROOM',
        slug: 'master-bedroom',
        name: { en: 'Master Bedroom', fr: 'Chambre principale', ar: 'غرفة النوم الرئيسية' },
        description: {
          en: 'The largest bedroom, usually with en-suite bathroom',
          fr: 'La plus grande chambre, généralement avec salle de bain attenante',
          ar: 'أكبر غرفة نوم، عادة مع حمام ملحق',
        },
        category: 'sleeping',
        sortOrder: 2,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'GUEST_BEDROOM',
        slug: 'guest-bedroom',
        name: { en: 'Guest Bedroom', fr: "Chambre d'invités", ar: 'غرفة ضيوف' },
        description: {
          en: 'A bedroom designated for guests',
          fr: 'Une chambre désignée pour les invités',
          ar: 'غرفة نوم مخصصة للضيوف',
        },
        category: 'sleeping',
        sortOrder: 3,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'LIVING_ROOM',
        slug: 'living-room',
        name: { en: 'Living Room', fr: 'Salon', ar: 'غرفة المعيشة' },
        description: {
          en: 'A room for relaxation and entertainment',
          fr: 'Une pièce pour la détente et le divertissement',
          ar: 'غرفة للاسترخاء والترفيه',
        },
        category: 'common',
        sortOrder: 4,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'DINING_ROOM',
        slug: 'dining-room',
        name: { en: 'Dining Room', fr: 'Salle à manger', ar: 'غرفة الطعام' },
        description: {
          en: 'A room for eating meals',
          fr: 'Une pièce pour prendre les repas',
          ar: 'غرفة لتناول الوجبات',
        },
        category: 'common',
        sortOrder: 5,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'KITCHEN',
        slug: 'kitchen',
        name: { en: 'Kitchen', fr: 'Cuisine', ar: 'مطبخ' },
        description: {
          en: 'A room for food preparation and cooking',
          fr: 'Une pièce pour la préparation et la cuisson des aliments',
          ar: 'غرفة لإعداد الطعام والطبخ',
        },
        category: 'functional',
        sortOrder: 6,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'BATHROOM',
        slug: 'bathroom',
        name: { en: 'Bathroom', fr: 'Salle de bain', ar: 'حمام' },
        description: {
          en: 'A room with bath or shower for washing',
          fr: 'Une pièce avec baignoire ou douche pour se laver',
          ar: 'غرفة مع حوض استحمام أو دش للغسل',
        },
        category: 'functional',
        sortOrder: 7,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'POWDER_ROOM',
        slug: 'powder-room',
        name: { en: 'Powder Room', fr: "Toilettes d'invités", ar: 'دورة مياه صغيرة' },
        description: {
          en: 'A small bathroom without shower or bath',
          fr: 'Une petite salle de bain sans douche ni baignoire',
          ar: 'حمام صغير بدون دش أو حوض استحمام',
        },
        category: 'functional',
        sortOrder: 8,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'HOME_OFFICE',
        slug: 'home-office',
        name: { en: 'Home Office', fr: 'Bureau à domicile', ar: 'مكتب منزلي' },
        description: {
          en: 'A room designated for work and study',
          fr: "Une pièce désignée pour le travail et l'étude",
          ar: 'غرفة مخصصة للعمل والدراسة',
        },
        category: 'functional',
        sortOrder: 9,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'LIBRARY',
        slug: 'library',
        name: { en: 'Library', fr: 'Bibliothèque', ar: 'مكتبة' },
        description: {
          en: 'A room for books and reading',
          fr: 'Une pièce pour les livres et la lecture',
          ar: 'غرفة للكتب والقراءة',
        },
        category: 'entertainment',
        sortOrder: 10,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'GAME_ROOM',
        slug: 'game-room',
        name: { en: 'Game Room', fr: 'Salle de jeux', ar: 'غرفة ألعاب' },
        description: {
          en: 'A room for games and entertainment',
          fr: 'Une pièce pour les jeux et le divertissement',
          ar: 'غرفة للألعاب والترفيه',
        },
        category: 'entertainment',
        sortOrder: 11,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'MEDIA_ROOM',
        slug: 'media-room',
        name: { en: 'Media Room', fr: 'Salle multimédia', ar: 'غرفة الوسائط' },
        description: {
          en: 'A room for watching movies and entertainment',
          fr: 'Une pièce pour regarder des films et se divertir',
          ar: 'غرفة لمشاهدة الأفلام والترفيه',
        },
        category: 'entertainment',
        sortOrder: 12,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'GYM',
        slug: 'gym',
        name: { en: 'Gym', fr: 'Salle de sport', ar: 'صالة رياضية' },
        description: {
          en: 'A room for exercise and fitness',
          fr: "Une pièce pour l'exercice et la forme physique",
          ar: 'غرفة للتمارين واللياقة البدنية',
        },
        category: 'recreation',
        sortOrder: 13,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'LAUNDRY_ROOM',
        slug: 'laundry-room',
        name: { en: 'Laundry Room', fr: 'Buanderie', ar: 'غرفة الغسيل' },
        description: {
          en: 'A room for washing and drying clothes',
          fr: 'Une pièce pour laver et sécher les vêtements',
          ar: 'غرفة لغسل وتجفيف الملابس',
        },
        category: 'functional',
        sortOrder: 14,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'STORAGE_ROOM',
        slug: 'storage-room',
        name: { en: 'Storage Room', fr: 'Débarras', ar: 'غرفة تخزين' },
        description: {
          en: 'A room for storing items',
          fr: 'Une pièce pour ranger les objets',
          ar: 'غرفة لتخزين الأشياء',
        },
        category: 'functional',
        sortOrder: 15,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'BALCONY',
        slug: 'balcony',
        name: { en: 'Balcony', fr: 'Balcon', ar: 'شرفة' },
        description: {
          en: 'An outdoor platform attached to building',
          fr: 'Une plateforme extérieure attachée au bâtiment',
          ar: 'منصة خارجية متصلة بالمبنى',
        },
        category: 'outdoor',
        sortOrder: 16,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'TERRACE',
        slug: 'terrace',
        name: { en: 'Terrace', fr: 'Terrasse', ar: 'تراس' },
        description: {
          en: 'A large outdoor area, often rooftop',
          fr: 'Une grande zone extérieure, souvent sur le toit',
          ar: 'منطقة خارجية كبيرة، غالباً على السطح',
        },
        category: 'outdoor',
        sortOrder: 17,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'GARDEN',
        slug: 'garden',
        name: { en: 'Garden', fr: 'Jardin', ar: 'حديقة' },
        description: {
          en: 'An outdoor area with plants and landscaping',
          fr: 'Une zone extérieure avec des plantes et un aménagement paysager',
          ar: 'منطقة خارجية مع النباتات وتنسيق الحدائق',
        },
        category: 'outdoor',
        sortOrder: 18,
        isActive: true,
        isDeprecated: false,
      },
    ];

    const existingCount = await roomTypeModel.countDocuments();
    if (existingCount > 0) {
      SeederLogger.skipped('room types');
      return;
    }

    for (const roomType of roomTypes) {
      const existing = await roomTypeModel.findOne({ key: roomType.key }).exec();

      if (!existing) {
        await roomTypeModel.create({
          ...roomType,
          createdBy: 'seeder',
          updatedBy: 'seeder',
        });
      }
    }

    SeederLogger.success('room types');
  });
}
