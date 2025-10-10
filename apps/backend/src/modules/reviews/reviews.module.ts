import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedSchemasModule } from '../../common/schemas/shared-schemas.module';

// Additional schemas specific to reviews
import { Review, ReviewSchema } from '../../database/schemas/review.schema';

// Services - New Architecture
import { ReviewCoreService } from './services/review-core.service';
import { ReviewAdminService } from './services/review-admin.service';
import { ReviewFacadeService } from './services/review-facade.service';

// Controllers
import { ReviewsAppController } from './controllers/reviews-app.controller';
import { ReviewsAdminController } from './controllers/reviews-admin.controller';
import { ReviewsPublicController } from './controllers/reviews-public.controller';

// External module dependencies
import { PropertiesModule } from '../properties/properties.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { I18nModule } from '../i18n/i18n.module';

@Module({
  imports: [
    SharedSchemasModule,
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    forwardRef(() => PropertiesModule), // Forward reference to avoid circular dependency
    NotificationsModule,
    I18nModule,
  ],
  providers: [ReviewCoreService, ReviewAdminService, ReviewFacadeService],
  controllers: [ReviewsAppController, ReviewsAdminController, ReviewsPublicController],
  exports: [ReviewFacadeService, ReviewCoreService, ReviewAdminService],
})
export class ReviewsModule {}
