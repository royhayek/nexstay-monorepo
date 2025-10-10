import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamicConfigService } from './modules/config/config.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import twilioConfig from './config/twilio.config';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DynamicConfigModule } from './modules/config/config.module';
import { envValidation } from './config/env.validation';
import mailConfig from './config/mail.config';
import s3Config from './config/s3.config';
import i18nConfig from './config/i18n.config';
import firebaseConfig from './config/firebase.config';
import { StorageModule } from './modules/storage/storage.module';
import { I18nModule } from './modules/i18n/i18n.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { EnumDisplaysModule } from './modules/enum-displays/enum-displays.module';
import { AmenityCategoriesModule } from './modules/amenity-categories/amenity-categories.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { TaxModule } from './modules/tax/tax.module';
import { IdentityVerificationModule } from './modules/identity-verification/identity-verification.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { MultiCurrencyModule } from './modules/multi-currency/multi-currency.module';
import { SecurityDepositsModule } from './modules/security-deposits/security-deposits.module';
import { BookingInstallmentsModule } from './modules/booking-installments/booking-installments.module';
import { LanguageDetectionMiddleware } from './common/middleware/language-detection.middleware';

@Module({
  imports: [
    // 1) Global configuration & infra
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        twilioConfig,
        mailConfig,
        s3Config,
        i18nConfig,
        firebaseConfig,
      ],
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      validationSchema: envValidation,
    }),
    DynamicConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [DynamicConfigModule],
      useFactory: async (configService: DynamicConfigService) => {
        const rateLimit = await configService.getNumber('API_RATE_LIMIT_PER_MINUTE', 100);
        return [
          {
            name: 'short',
            ttl: 1000, // 1 second
            limit: Math.ceil(rateLimit / 60), // Convert per-minute to per-second
          },
          {
            name: 'medium',
            ttl: 60000, // 1 minute
            limit: rateLimit, // Use configured rate limit
          },
          {
            name: 'long',
            ttl: 900000, // 15 minutes
            limit: rateLimit * 15, // Scale for 15 minutes
          },
        ];
      },
      inject: [DynamicConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService) => ({ uri: cs.get<string>('database.uri') }),
      inject: [ConfigService],
    }),

    // 2) Cross-cutting feature modules
    I18nModule,
    StorageModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    BookingsModule,
    ReviewsModule,
    NotificationsModule,
    PaymentsModule,
    InvoicesModule,
    EnumDisplaysModule,
    AmenityCategoriesModule,
    AnalyticsModule,
    AdminModule,
    MessagingModule,
    PayoutsModule,
    TaxModule,
    IdentityVerificationModule,
    AccountsModule,
    MultiCurrencyModule,
    SecurityDepositsModule,
    BookingInstallmentsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LanguageDetectionMiddleware).forRoutes('*');
  }
}
