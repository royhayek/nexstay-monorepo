import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedSchemasModule } from '../../common/schemas/shared-schemas.module';

// Additional schemas specific to reviews
import { Review, ReviewSchema } from '../../database/schemas/review.schema';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from '../../database/schemas/payment-transaction.schema';

// Services - New Architecture
import { ReviewCoreService } from './services/review-core.service';
import { ReviewAdminService } from './services/review-admin.service';
import { ReviewFacadeService } from './services/review-facade.service';
import { ReviewReminderService } from './services/review-reminder.service';

// Enhancement Services
import { ReviewPhotoService } from './services/review-photo.service';
import { ReviewTranslationService } from './services/review-translation.service';
import { ReviewSentimentService } from './services/review-sentiment.service';
import { ReviewVotingService } from './services/review-voting.service';
import { ReviewVerificationService } from './services/review-verification.service';

// Controllers
import { ReviewsAppController } from './controllers/reviews-app.controller';
import { ReviewsAdminController } from './controllers/reviews-admin.controller';
import { ReviewsPublicController } from './controllers/reviews-public.controller';

// External module dependencies
import { PropertiesModule } from '../properties/properties.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { I18nModule } from '../i18n/i18n.module';
import { UsersModule } from '../users/users.module';
import { StorageModule } from '../storage/storage.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    SharedSchemasModule,
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
    ]),
    forwardRef(() => PropertiesModule), // Forward reference to avoid circular dependency
    NotificationsModule,
    I18nModule,
    UsersModule,
    StorageModule,
    PaymentsModule,
  ],
  providers: [
    // Core Services
    ReviewCoreService,
    ReviewAdminService,
    ReviewFacadeService,
    ReviewReminderService,
    // Enhancement Services
    ReviewPhotoService,
    ReviewTranslationService,
    ReviewSentimentService,
    ReviewVotingService,
    ReviewVerificationService,
  ],
  controllers: [ReviewsAppController, ReviewsAdminController, ReviewsPublicController],
  exports: [
    // Core Services
    ReviewFacadeService,
    ReviewCoreService,
    ReviewAdminService,
    ReviewReminderService,
    // Enhancement Services
    ReviewPhotoService,
    ReviewTranslationService,
    ReviewSentimentService,
    ReviewVotingService,
    ReviewVerificationService,
  ],
})
export class ReviewsModule {}
