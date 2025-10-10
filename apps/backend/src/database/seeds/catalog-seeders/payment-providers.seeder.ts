import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { PaymentProvider, PaymentProviderDocument } from '../../schemas/payment-provider.schema';
import { SeederLogger, runSeeder } from '../seeder.helpers';

export async function seedPaymentProviders(appContext: INestApplication) {
  await runSeeder('payment providers', async () => {
    const paymentProviderModel: Model<PaymentProviderDocument> = appContext.get(
      getModelToken(PaymentProvider.name),
    );

    const paymentProviders = [
      {
        key: 'APS',
        slug: 'aps',
        name: {
          en: 'Amazon Payment Services',
          fr: 'Services de paiement Amazon',
          ar: 'خدمات الدفع أمازون',
        },
        description: {
          en: 'Amazon payment gateway for MENA',
          fr: 'Passerelle de paiement Amazon pour MENA',
          ar: 'بوابة دفع أمازون للشرق الأوسط وشمال أفريقيا',
        },
        isEnabled: true,
        supportedMethods: ['card', 'installments'],
        fees: { percentage: 2.5, fixed: 0 },
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
    ];

    const existingCount = await paymentProviderModel.countDocuments();
    if (existingCount > 0) {
      SeederLogger.skipped('payment providers');
      return;
    }

    for (const provider of paymentProviders) {
      const existing = await paymentProviderModel.findOne({ key: provider.key }).exec();

      if (!existing) {
        await paymentProviderModel.create({
          ...provider,
          createdBy: 'seeder',
          updatedBy: 'seeder',
        });
      }
    }

    SeederLogger.success('payment providers');
  });
}
