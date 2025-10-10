import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationType, NotificationTypeDocument } from '../../schemas/notification-type.schema';
import { SeederLogger, runSeeder } from '../seeder.helpers';

export async function seedNotificationTypes(appContext: INestApplication) {
  await runSeeder('notification types', async () => {
    const notificationTypeModel: Model<NotificationTypeDocument> = appContext.get(
      getModelToken(NotificationType.name),
    );

    const notificationTypes = [
      {
        key: 'BOOKING_CONFIRMED',
        slug: 'booking-confirmed',
        name: { en: 'Booking Confirmed', fr: 'Réservation confirmée', ar: 'تأكيد الحجز' },
        description: {
          en: 'Sent when a booking is confirmed',
          fr: 'Envoyé quand une réservation est confirmée',
          ar: 'يُرسل عند تأكيد الحجز',
        },
        category: 'booking',
        isEnabled: true,
        channels: ['email', 'push', 'sms'],
        sortOrder: 1,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'BOOKING_CANCELLED',
        slug: 'booking-cancelled',
        name: { en: 'Booking Cancelled', fr: 'Réservation annulée', ar: 'إلغاء الحجز' },
        description: {
          en: 'Sent when a booking is cancelled',
          fr: 'Envoyé quand une réservation est annulée',
          ar: 'يُرسل عند إلغاء الحجز',
        },
        category: 'booking',
        isEnabled: true,
        channels: ['email', 'push'],
        sortOrder: 2,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'PAYMENT_SUCCESSFUL',
        slug: 'payment-successful',
        name: { en: 'Payment Successful', fr: 'Paiement réussi', ar: 'نجح الدفع' },
        description: {
          en: 'Sent when payment is processed successfully',
          fr: 'Envoyé quand le paiement est traité avec succès',
          ar: 'يُرسل عند معالجة الدفع بنجاح',
        },
        category: 'payment',
        isEnabled: true,
        channels: ['email', 'push'],
        sortOrder: 3,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'PAYMENT_FAILED',
        slug: 'payment-failed',
        name: { en: 'Payment Failed', fr: 'Échec du paiement', ar: 'فشل الدفع' },
        description: {
          en: 'Sent when payment processing fails',
          fr: 'Envoyé quand le traitement du paiement échoue',
          ar: 'يُرسل عند فشل معالجة الدفع',
        },
        category: 'payment',
        isEnabled: true,
        channels: ['email', 'push'],
        sortOrder: 4,
        isActive: true,
        isDeprecated: false,
      },
      {
        key: 'NEW_MESSAGE',
        slug: 'new-message',
        name: { en: 'New Message', fr: 'Nouveau message', ar: 'رسالة جديدة' },
        description: {
          en: 'Sent when user receives a new message',
          fr: 'Envoyé quand un utilisateur reçoit un nouveau message',
          ar: 'يُرسل عند استلام رسالة جديدة',
        },
        category: 'communication',
        isEnabled: true,
        channels: ['push', 'email'],
        sortOrder: 5,
        isActive: true,
        isDeprecated: false,
      },
    ];

    const existingCount = await notificationTypeModel.countDocuments();
    if (existingCount > 0) {
      SeederLogger.skipped('notification types');
      return;
    }

    for (const notificationType of notificationTypes) {
      const existing = await notificationTypeModel.findOne({ key: notificationType.key }).exec();

      if (!existing) {
        await notificationTypeModel.create({
          ...notificationType,
          createdBy: 'seeder',
          updatedBy: 'seeder',
        });
      }
    }

    SeederLogger.success('notification types');
  });
}
