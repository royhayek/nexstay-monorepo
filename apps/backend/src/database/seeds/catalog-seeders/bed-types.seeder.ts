import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { BedType, BedTypeDocument } from '../../schemas/bed-type.schema';
import { SeederLogger, runSeeder } from '../seeder.helpers';

export async function seedBedTypes(appContext: INestApplication) {
  await runSeeder('bed types', async () => {
    const bedTypeModel: Model<BedTypeDocument> = appContext.get(getModelToken(BedType.name));

    const bedTypes = [
      {
        key: 'SINGLE',
        slug: 'single',
        name: { en: 'Single Bed', fr: 'Lit simple', ar: 'سرير فردي' },
        description: {
          en: 'Single bed suitable for one person',
          fr: 'Lit simple pour une personne',
          ar: 'سرير فردي مناسب لشخص واحد',
        },
        dimensions: { width: 90, length: 190, unit: 'cm' },
        capacity: 1,
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'TWIN',
        slug: 'twin',
        name: { en: 'Twin Bed', fr: 'Lit jumeau', ar: 'سرير توأم' },
        description: {
          en: 'Twin bed, same size as single bed',
          fr: "Lit jumeau, même taille qu'un lit simple",
          ar: 'سرير توأم، نفس حجم السرير الفردي',
        },
        dimensions: { width: 90, length: 190, unit: 'cm' },
        capacity: 1,
        sortOrder: 2,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'DOUBLE',
        slug: 'double',
        name: { en: 'Double Bed', fr: 'Lit double', ar: 'سرير مزدوج' },
        description: {
          en: 'Double bed suitable for two people',
          fr: 'Lit double pour deux personnes',
          ar: 'سرير مزدوج مناسب لشخصين',
        },
        dimensions: { width: 135, length: 190, unit: 'cm' },
        capacity: 2,
        sortOrder: 3,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'QUEEN',
        slug: 'queen',
        name: { en: 'Queen Bed', fr: 'Lit queen', ar: 'سرير كوين' },
        description: {
          en: 'Queen size bed, larger than double',
          fr: "Lit queen, plus grand qu'un double",
          ar: 'سرير بحجم كوين، أكبر من المزدوج',
        },
        dimensions: { width: 150, length: 200, unit: 'cm' },
        capacity: 2,
        sortOrder: 4,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'KING',
        slug: 'king',
        name: { en: 'King Bed', fr: 'Lit king', ar: 'سرير كينغ' },
        description: {
          en: 'King size bed, largest standard size',
          fr: 'Lit king, la plus grande taille standard',
          ar: 'سرير بحجم كينغ، أكبر حجم قياسي',
        },
        dimensions: { width: 180, length: 200, unit: 'cm' },
        capacity: 2,
        sortOrder: 5,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'SUPER_KING',
        slug: 'super-king',
        name: { en: 'Super King Bed', fr: 'Lit super king', ar: 'سرير سوبر كينغ' },
        description: {
          en: 'Super king size bed, extra large',
          fr: 'Lit super king, extra large',
          ar: 'سرير سوبر كينغ، كبير جداً',
        },
        dimensions: { width: 200, length: 200, unit: 'cm' },
        capacity: 2,
        sortOrder: 6,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'SOFA_BED',
        slug: 'sofa-bed',
        name: { en: 'Sofa Bed', fr: 'Canapé-lit', ar: 'أريكة سرير' },
        description: {
          en: 'Convertible sofa that transforms into a bed',
          fr: 'Canapé convertible qui se transforme en lit',
          ar: 'أريكة قابلة للتحويل إلى سرير',
        },
        dimensions: { width: 140, length: 190, unit: 'cm' },
        capacity: 2,
        sortOrder: 7,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'BUNK_BED',
        slug: 'bunk-bed',
        name: { en: 'Bunk Bed', fr: 'Lit superposé', ar: 'سرير بطابقين' },
        description: {
          en: 'Bunk bed with two sleeping levels',
          fr: 'Lit superposé avec deux niveaux de couchage',
          ar: 'سرير بطابقين مع مستويين للنوم',
        },
        dimensions: { width: 90, length: 190, unit: 'cm' },
        capacity: 2,
        sortOrder: 8,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'MURPHY_BED',
        slug: 'murphy-bed',
        name: { en: 'Murphy Bed', fr: 'Lit escamotable', ar: 'سرير قابل للطي' },
        description: {
          en: 'Wall-mounted foldable bed',
          fr: 'Lit pliable monté au mur',
          ar: 'سرير قابل للطي مثبت على الحائط',
        },
        dimensions: { width: 140, length: 190, unit: 'cm' },
        capacity: 2,
        sortOrder: 9,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'FUTON',
        slug: 'futon',
        name: { en: 'Futon', fr: 'Futon', ar: 'فوتون' },
        description: {
          en: 'Japanese-style foldable mattress',
          fr: 'Matelas pliable de style japonais',
          ar: 'مرتبة قابلة للطي على الطراز الياباني',
        },
        dimensions: { width: 140, length: 190, unit: 'cm' },
        capacity: 2,
        sortOrder: 10,
        isActive: true,
        isDeprecated: false,
      },
    ];

    const existingCount = await bedTypeModel.countDocuments();
    if (existingCount > 0) {
      SeederLogger.skipped('bed types');
      return;
    }

    for (const bedType of bedTypes) {
      const existing = await bedTypeModel.findOne({ key: bedType.key }).exec();

      if (!existing) {
        await bedTypeModel.create({
          ...bedType,
          createdBy: 'seeder',
          updatedBy: 'seeder',
        });
      }
    }

    SeederLogger.success('bed types');
  });
}
