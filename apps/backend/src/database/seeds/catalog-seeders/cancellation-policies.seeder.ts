import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import {
  CancellationPolicy,
  CancellationPolicyDocument,
} from '../../schemas/cancellation-policy.schema';
import { SeederLogger, runSeeder } from '../seeder.helpers';

export async function seedCancellationPolicies(appContext: INestApplication) {
  await runSeeder('cancellation policies', async () => {
    const cancellationPolicyModel: Model<CancellationPolicyDocument> = appContext.get(
      getModelToken(CancellationPolicy.name),
    );

    const cancellationPolicies = [
      {
        key: 'FLEXIBLE',
        slug: 'flexible',
        name: { en: 'Flexible', fr: 'Flexible', ar: 'مرن' },
        description: {
          en: 'Full refund 1 day prior to arrival, except fees',
          fr: "Remboursement complet 1 jour avant l'arrivée, sauf frais",
          ar: 'استرداد كامل قبل يوم واحد من الوصول، باستثناء الرسوم',
        },
        rules: [
          {
            hoursBeforeCheckIn: 24,
            refundPercentage: 100,
            description: {
              en: 'Cancel up to 24 hours before check-in for a full refund',
              fr: "Annulez jusqu'à 24 heures avant l'enregistrement pour un remboursement complet",
              ar: 'ألغِ حتى 24 ساعة قبل تسجيل الوصول للحصول على استرداد كامل',
            },
          },
          {
            hoursBeforeCheckIn: 0,
            refundPercentage: 0,
            description: {
              en: 'No refund for cancellations within 24 hours',
              fr: 'Aucun remboursement pour les annulations dans les 24 heures',
              ar: 'لا استرداد للإلغاءات خلال 24 ساعة',
            },
          },
        ],
        gracePeriodHours: 24,
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'MODERATE',
        slug: 'moderate',
        name: { en: 'Moderate', fr: 'Modéré', ar: 'معتدل' },
        description: {
          en: 'Full refund 5 days prior to arrival, except fees',
          fr: "Remboursement complet 5 jours avant l'arrivée, sauf frais",
          ar: 'استرداد كامل قبل 5 أيام من الوصول، باستثناء الرسوم',
        },
        rules: [
          {
            hoursBeforeCheckIn: 120, // 5 days
            refundPercentage: 100,
            description: {
              en: 'Cancel up to 5 days before check-in for a full refund',
              fr: "Annulez jusqu'à 5 jours avant l'enregistrement pour un remboursement complet",
              ar: 'ألغِ حتى 5 أيام قبل تسجيل الوصول للحصول على استرداد كامل',
            },
          },
          {
            hoursBeforeCheckIn: 24, // 1 day
            refundPercentage: 50,
            description: {
              en: '50% refund for cancellations between 1-5 days before check-in',
              fr: "Remboursement de 50% pour les annulations entre 1-5 jours avant l'enregistrement",
              ar: 'استرداد 50% للإلغاءات بين 1-5 أيام قبل تسجيل الوصول',
            },
          },
          {
            hoursBeforeCheckIn: 0,
            refundPercentage: 0,
            description: {
              en: 'No refund for cancellations within 24 hours',
              fr: 'Aucun remboursement pour les annulations dans les 24 heures',
              ar: 'لا استرداد للإلغاءات خلال 24 ساعة',
            },
          },
        ],
        gracePeriodHours: 120,
        sortOrder: 2,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'STRICT',
        slug: 'strict',
        name: { en: 'Strict', fr: 'Strict', ar: 'صارم' },
        description: {
          en: 'Full refund for cancellations made within 48 hours of booking, if check-in is at least 14 days away',
          fr: "Remboursement complet pour les annulations effectuées dans les 48 heures suivant la réservation, si l'enregistrement est dans au moins 14 jours",
          ar: 'استرداد كامل للإلغاءات التي تتم خلال 48 ساعة من الحجز، إذا كان تسجيل الوصول بعد 14 يوماً على الأقل',
        },
        rules: [
          {
            hoursBeforeCheckIn: 336, // 14 days
            refundPercentage: 50,
            description: {
              en: '50% refund for cancellations up to 14 days before check-in',
              fr: "Remboursement de 50% pour les annulations jusqu'à 14 jours avant l'enregistrement",
              ar: 'استرداد 50% للإلغاءات حتى 14 يوماً قبل تسجيل الوصول',
            },
          },
          {
            hoursBeforeCheckIn: 0,
            refundPercentage: 0,
            description: {
              en: 'No refund for cancellations within 14 days of check-in',
              fr: "Aucun remboursement pour les annulations dans les 14 jours de l'enregistrement",
              ar: 'لا استرداد للإلغاءات خلال 14 يوماً من تسجيل الوصول',
            },
          },
        ],
        gracePeriodHours: 48,
        requiresGracePeriod: true,
        sortOrder: 3,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'SUPER_STRICT_30',
        slug: 'super-strict-30',
        name: { en: 'Super Strict 30', fr: 'Super Strict 30', ar: 'صارم جداً 30' },
        description: {
          en: '50% refund up until 30 days prior to arrival',
          fr: "Remboursement de 50% jusqu'à 30 jours avant l'arrivée",
          ar: 'استرداد 50% حتى 30 يوماً قبل الوصول',
        },
        rules: [
          {
            hoursBeforeCheckIn: 720, // 30 days
            refundPercentage: 50,
            description: {
              en: '50% refund for cancellations up to 30 days before check-in',
              fr: "Remboursement de 50% pour les annulations jusqu'à 30 jours avant l'enregistrement",
              ar: 'استرداد 50% للإلغاءات حتى 30 يوماً قبل تسجيل الوصول',
            },
          },
          {
            hoursBeforeCheckIn: 0,
            refundPercentage: 0,
            description: {
              en: 'No refund for cancellations within 30 days of check-in',
              fr: "Aucun remboursement pour les annulations dans les 30 jours de l'enregistrement",
              ar: 'لا استرداد للإلغاءات خلال 30 يوماً من تسجيل الوصول',
            },
          },
        ],
        gracePeriodHours: 48,
        requiresGracePeriod: true,
        sortOrder: 4,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'SUPER_STRICT_60',
        slug: 'super-strict-60',
        name: { en: 'Super Strict 60', fr: 'Super Strict 60', ar: 'صارم جداً 60' },
        description: {
          en: '50% refund up until 60 days prior to arrival',
          fr: "Remboursement de 50% jusqu'à 60 jours avant l'arrivée",
          ar: 'استرداد 50% حتى 60 يوماً قبل الوصول',
        },
        rules: [
          {
            hoursBeforeCheckIn: 1440, // 60 days
            refundPercentage: 50,
            description: {
              en: '50% refund for cancellations up to 60 days before check-in',
              fr: "Remboursement de 50% pour les annulations jusqu'à 60 jours avant l'enregistrement",
              ar: 'استرداد 50% للإلغاءات حتى 60 يوماً قبل تسجيل الوصول',
            },
          },
          {
            hoursBeforeCheckIn: 0,
            refundPercentage: 0,
            description: {
              en: 'No refund for cancellations within 60 days of check-in',
              fr: "Aucun remboursement pour les annulations dans les 60 jours de l'enregistrement",
              ar: 'لا استرداد للإلغاءات خلال 60 يوماً من تسجيل الوصول',
            },
          },
        ],
        gracePeriodHours: 48,
        requiresGracePeriod: true,
        sortOrder: 5,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'NON_REFUNDABLE',
        slug: 'non-refundable',
        name: { en: 'Non-refundable', fr: 'Non remboursable', ar: 'غير قابل للاسترداد' },
        description: {
          en: 'No refund available for any cancellation',
          fr: 'Aucun remboursement disponible pour toute annulation',
          ar: 'لا يوجد استرداد متاح لأي إلغاء',
        },
        rules: [
          {
            hoursBeforeCheckIn: 8760, // 365 days
            refundPercentage: 0,
            description: {
              en: 'No refund for any cancellation at any time',
              fr: 'Aucun remboursement pour toute annulation à tout moment',
              ar: 'لا استرداد لأي إلغاء في أي وقت',
            },
          },
        ],
        gracePeriodHours: 0,
        sortOrder: 6,
        isActive: true,
        isDeprecated: false,
      },
    ];

    const existingCount = await cancellationPolicyModel.countDocuments();
    if (existingCount > 0) {
      SeederLogger.skipped('cancellation policies');
      return;
    }

    for (const policy of cancellationPolicies) {
      const existing = await cancellationPolicyModel.findOne({ key: policy.key }).exec();

      if (!existing) {
        await cancellationPolicyModel.create({
          ...policy,
          createdBy: 'seeder',
          updatedBy: 'seeder',
        });
      }
    }

    SeederLogger.success('cancellation policies');
  });
}
