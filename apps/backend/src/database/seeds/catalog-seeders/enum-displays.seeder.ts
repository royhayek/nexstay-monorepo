import { INestApplication } from '@nestjs/common';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { EnumDisplay, EnumDisplayDocument } from '../../schemas/enum-display.schema';
import { SystemEnumName } from '../../../common/enums/system.enums';
import { SeederLogger, runSeeder } from '../seeder.helpers';

export async function seedEnumDisplays(appContext: INestApplication) {
  await runSeeder('enum displays', async () => {
    const enumDisplayModel: Model<EnumDisplayDocument> = appContext.get(
      getModelToken(EnumDisplay.name),
    );

    const enumDisplays = [
      // Booking Status Displays
      {
        enumName: 'BookingStatus' as SystemEnumName,
        key: 'pending',
        label: { en: 'Pending', fr: 'En attente', ar: 'في الانتظار' },
        sortOrder: 1,
        isVisible: true,
      },
      {
        enumName: 'BookingStatus' as SystemEnumName,
        key: 'confirmed',
        label: { en: 'Confirmed', fr: 'Confirmé', ar: 'مؤكد' },
        sortOrder: 2,
        isVisible: true,
      },
      {
        enumName: 'BookingStatus' as SystemEnumName,
        key: 'checked_in',
        label: { en: 'Checked In', fr: 'Enregistré', ar: 'تم تسجيل الوصول' },
        sortOrder: 3,
        isVisible: true,
      },
      {
        enumName: 'BookingStatus' as SystemEnumName,
        key: 'checked_out',
        label: { en: 'Checked Out', fr: 'Départ effectué', ar: 'تم تسجيل المغادرة' },
        sortOrder: 4,
        isVisible: true,
      },
      {
        enumName: 'BookingStatus' as SystemEnumName,
        key: 'cancelled',
        label: { en: 'Cancelled', fr: 'Annulé', ar: 'ملغى' },
        sortOrder: 5,
        isVisible: true,
      },

      // Payment Status Displays
      {
        enumName: 'PaymentStatus' as SystemEnumName,
        key: 'pending',
        label: { en: 'Pending', fr: 'En attente', ar: 'في الانتظار' },
        sortOrder: 1,
        isVisible: true,
      },
      {
        enumName: 'PaymentStatus' as SystemEnumName,
        key: 'processing',
        label: { en: 'Processing', fr: 'En cours', ar: 'قيد المعالجة' },
        sortOrder: 2,
        isVisible: true,
      },
      {
        enumName: 'PaymentStatus' as SystemEnumName,
        key: 'completed',
        label: { en: 'Completed', fr: 'Terminé', ar: 'مكتمل' },
        sortOrder: 3,
        isVisible: true,
      },
      {
        enumName: 'PaymentStatus' as SystemEnumName,
        key: 'failed',
        label: { en: 'Failed', fr: 'Échec', ar: 'فشل' },
        sortOrder: 4,
        isVisible: true,
      },
      {
        enumName: 'PaymentStatus' as SystemEnumName,
        key: 'cancelled',
        label: { en: 'Cancelled', fr: 'Annulé', ar: 'ملغى' },
        sortOrder: 5,
        isVisible: true,
      },
      {
        enumName: 'PaymentStatus' as SystemEnumName,
        key: 'refunded',
        label: { en: 'Refunded', fr: 'Remboursé', ar: 'مسترد' },
        sortOrder: 6,
        isVisible: true,
      },

      // Invoice Status Displays
      {
        enumName: 'InvoiceStatus' as SystemEnumName,
        key: 'draft',
        label: { en: 'Draft', fr: 'Brouillon', ar: 'مسودة' },
        sortOrder: 1,
        isVisible: true,
      },
      {
        enumName: 'InvoiceStatus' as SystemEnumName,
        key: 'sent',
        label: { en: 'Sent', fr: 'Envoyé', ar: 'مرسل' },
        sortOrder: 2,
        isVisible: true,
      },
      {
        enumName: 'InvoiceStatus' as SystemEnumName,
        key: 'paid',
        label: { en: 'Paid', fr: 'Payé', ar: 'مدفوع' },
        sortOrder: 3,
        isVisible: true,
      },
      {
        enumName: 'InvoiceStatus' as SystemEnumName,
        key: 'overdue',
        label: { en: 'Overdue', fr: 'En retard', ar: 'متأخر' },
        sortOrder: 4,
        isVisible: true,
      },
      {
        enumName: 'InvoiceStatus' as SystemEnumName,
        key: 'cancelled',
        label: { en: 'Cancelled', fr: 'Annulé', ar: 'ملغى' },
        sortOrder: 5,
        isVisible: true,
      },

      // Notification Status Displays
      {
        enumName: 'NotificationStatus' as SystemEnumName,
        key: 'unread',
        label: { en: 'Unread', fr: 'Non lu', ar: 'غير مقروء' },
        sortOrder: 1,
        isVisible: true,
      },
      {
        enumName: 'NotificationStatus' as SystemEnumName,
        key: 'read',
        label: { en: 'Read', fr: 'Lu', ar: 'مقروء' },
        sortOrder: 2,
        isVisible: true,
      },
      {
        enumName: 'NotificationStatus' as SystemEnumName,
        key: 'archived',
        label: { en: 'Archived', fr: 'Archivé', ar: 'مؤرشف' },
        sortOrder: 3,
        isVisible: true,
      },

      // Notification Priority Displays
      {
        enumName: 'NotificationPriority' as SystemEnumName,
        key: 'low',
        label: { en: 'Low', fr: 'Basse', ar: 'منخفض' },
        sortOrder: 1,
        isVisible: true,
      },
      {
        enumName: 'NotificationPriority' as SystemEnumName,
        key: 'medium',
        label: { en: 'Medium', fr: 'Moyenne', ar: 'متوسط' },
        sortOrder: 2,
        isVisible: true,
      },
      {
        enumName: 'NotificationPriority' as SystemEnumName,
        key: 'high',
        label: { en: 'High', fr: 'Haute', ar: 'عالي' },
        sortOrder: 3,
        isVisible: true,
      },
      {
        enumName: 'NotificationPriority' as SystemEnumName,
        key: 'urgent',
        label: { en: 'Urgent', fr: 'Urgent', ar: 'عاجل' },
        sortOrder: 4,
        isVisible: true,
      },
    ];

    const existingCount = await enumDisplayModel.countDocuments();
    if (existingCount > 0) {
      SeederLogger.skipped('enum displays');
      return;
    }

    for (const enumDisplay of enumDisplays) {
      const existing = await enumDisplayModel
        .findOne({ enumName: enumDisplay.enumName, key: enumDisplay.key })
        .exec();

      if (!existing) {
        await enumDisplayModel.create({
          ...enumDisplay,
          createdBy: 'seeder',
          updatedBy: 'seeder',
        });
      }
    }

    SeederLogger.success('enum displays');
  });
}
