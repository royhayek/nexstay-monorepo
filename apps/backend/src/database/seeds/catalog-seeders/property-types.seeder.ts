import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { PropertyType, PropertyTypeDocument } from '../../schemas/property-type.schema';
import { SeederLogger, runSeeder } from '../seeder.helpers';

export async function seedPropertyTypes(appContext: INestApplication) {
  await runSeeder('property types', async () => {
    const propertyTypeModel: Model<PropertyTypeDocument> = appContext.get(
      getModelToken(PropertyType.name),
    );

    const propertyTypes = [
      {
        key: 'APARTMENT',
        slug: 'apartment',
        name: { en: 'Apartment', fr: 'Appartement', ar: 'شقة' },
        description: {
          en: 'A self-contained housing unit in a building',
          fr: 'Un logement autonome dans un immeuble',
          ar: 'وحدة سكنية مستقلة في مبنى',
        },
        category: 'residential',
        isEntirePlace: true,
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'HOUSE',
        slug: 'house',
        name: { en: 'House', fr: 'Maison', ar: 'منزل' },
        description: {
          en: 'A standalone residential building',
          fr: 'Un bâtiment résidentiel indépendant',
          ar: 'مبنى سكني مستقل',
        },
        category: 'residential',
        isEntirePlace: true,
        sortOrder: 2,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'VILLA',
        slug: 'villa',
        name: { en: 'Villa', fr: 'Villa', ar: 'فيلا' },
        description: {
          en: 'A large, luxurious house with gardens',
          fr: 'Une grande maison luxueuse avec jardins',
          ar: 'منزل كبير وفاخر مع حدائق',
        },
        category: 'luxury',
        isEntirePlace: true,
        sortOrder: 3,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'STUDIO',
        slug: 'studio',
        name: { en: 'Studio', fr: 'Studio', ar: 'استوديو' },
        description: {
          en: 'A single room apartment with kitchenette',
          fr: "Un appartement d'une pièce avec kitchenette",
          ar: 'شقة بغرفة واحدة مع مطبخ صغير',
        },
        category: 'residential',
        isEntirePlace: true,
        sortOrder: 4,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'LOFT',
        slug: 'loft',
        name: { en: 'Loft', fr: 'Loft', ar: 'علوي' },
        description: {
          en: 'A large, open space converted from industrial building',
          fr: "Un grand espace ouvert converti d'un bâtiment industriel",
          ar: 'مساحة كبيرة ومفتوحة محولة من مبنى صناعي',
        },
        category: 'unique',
        isEntirePlace: true,
        sortOrder: 5,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'TOWNHOUSE',
        slug: 'townhouse',
        name: { en: 'Townhouse', fr: 'Maison de ville', ar: 'منزل في المدينة' },
        description: {
          en: 'A multi-level house attached to similar units',
          fr: 'Une maison à plusieurs niveaux attachée à des unités similaires',
          ar: 'منزل متعدد المستويات متصل بوحدات مماثلة',
        },
        category: 'residential',
        isEntirePlace: true,
        sortOrder: 6,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'PENTHOUSE',
        slug: 'penthouse',
        name: { en: 'Penthouse', fr: 'Penthouse', ar: 'بنتهاوس' },
        description: {
          en: 'A luxury apartment on the top floor',
          fr: 'Un appartement de luxe au dernier étage',
          ar: 'شقة فاخرة في الطابق الأخير',
        },
        category: 'luxury',
        isEntirePlace: true,
        sortOrder: 7,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'CABIN',
        slug: 'cabin',
        name: { en: 'Cabin', fr: 'Cabane', ar: 'كوخ' },
        description: {
          en: 'A small house, typically in rural or forest area',
          fr: 'Une petite maison, typiquement en zone rurale ou forestière',
          ar: 'منزل صغير، عادة في منطقة ريفية أو غابات',
        },
        category: 'unique',
        isEntirePlace: true,
        sortOrder: 8,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'COTTAGE',
        slug: 'cottage',
        name: { en: 'Cottage', fr: 'Cottage', ar: 'كوخ ريفي' },
        description: {
          en: 'A small, cozy house in countryside',
          fr: 'Une petite maison confortable à la campagne',
          ar: 'منزل صغير ومريح في الريف',
        },
        category: 'unique',
        isEntirePlace: true,
        sortOrder: 9,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'CHALET',
        slug: 'chalet',
        name: { en: 'Chalet', fr: 'Chalet', ar: 'شاليه' },
        description: {
          en: 'A wooden house, typically in mountains',
          fr: 'Une maison en bois, typiquement en montagne',
          ar: 'منزل خشبي، عادة في الجبال',
        },
        category: 'unique',
        isEntirePlace: true,
        sortOrder: 10,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'BOAT',
        slug: 'boat',
        name: { en: 'Boat', fr: 'Bateau', ar: 'قارب' },
        description: {
          en: 'A floating accommodation on water',
          fr: "Un hébergement flottant sur l'eau",
          ar: 'إقامة عائمة على الماء',
        },
        category: 'unique',
        isEntirePlace: true,
        sortOrder: 11,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'TREEHOUSE',
        slug: 'treehouse',
        name: { en: 'Treehouse', fr: 'Cabane dans les arbres', ar: 'بيت الشجرة' },
        description: {
          en: 'An accommodation built in trees',
          fr: 'Un hébergement construit dans les arbres',
          ar: 'إقامة مبنية في الأشجار',
        },
        category: 'unique',
        isEntirePlace: true,
        sortOrder: 12,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'CASTLE',
        slug: 'castle',
        name: { en: 'Castle', fr: 'Château', ar: 'قلعة' },
        description: {
          en: 'A historic fortress or palace',
          fr: 'Une forteresse ou un palais historique',
          ar: 'قلعة أو قصر تاريخي',
        },
        category: 'luxury',
        isEntirePlace: true,
        sortOrder: 13,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'PRIVATE_ROOM',
        slug: 'private-room',
        name: { en: 'Private Room', fr: 'Chambre privée', ar: 'غرفة خاصة' },
        description: {
          en: 'A private bedroom in a shared property',
          fr: 'Une chambre privée dans une propriété partagée',
          ar: 'غرفة نوم خاصة في عقار مشترك',
        },
        category: 'shared',
        isEntirePlace: false,
        sortOrder: 14,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'SHARED_ROOM',
        slug: 'shared-room',
        name: { en: 'Shared Room', fr: 'Chambre partagée', ar: 'غرفة مشتركة' },
        description: {
          en: 'A bedroom shared with other guests',
          fr: "Une chambre partagée avec d'autres invités",
          ar: 'غرفة نوم مشتركة مع ضيوف آخرين',
        },
        category: 'shared',
        isEntirePlace: false,
        sortOrder: 15,
        isActive: true,
        isDeprecated: false,
      },
    ];

    const existingCount = await propertyTypeModel.countDocuments();
    if (existingCount > 0) {
      SeederLogger.skipped('property types');
      return;
    }

    for (const propertyType of propertyTypes) {
      const existing = await propertyTypeModel.findOne({ key: propertyType.key }).exec();

      if (!existing) {
        await propertyTypeModel.create({
          ...propertyType,
          createdBy: 'seeder',
          updatedBy: 'seeder',
        });
      }
    }

    SeederLogger.success('property types');
  });
}
