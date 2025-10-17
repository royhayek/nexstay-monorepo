import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Import all core schemas
import { User, UserSchema } from '../../database/schemas/user.schema';
import { Property, PropertySchema } from '../../database/schemas/property.schema';
import { Booking, BookingSchema } from '../../database/schemas/booking.schema';
import { Review, ReviewSchema } from '../../database/schemas/review.schema';
import { BlockedDate, BlockedDateSchema } from '../../database/schemas/blocked-date.schema';
import {
  HostOnboarding,
  HostOnboardingSchema,
} from '../../database/schemas/host-onboarding.schema';
import { SavedSearch, SavedSearchSchema } from '../../database/schemas/saved-search.schema';
import { SearchHistory, SearchHistorySchema } from '../../database/schemas/search-history.schema';

/**
 * Centralized module for shared schemas
 * Eliminates duplication and provides single source of truth for core schemas
 *
 * Benefits:
 * - Reduces memory usage by eliminating schema duplication
 * - Prevents version conflicts between modules
 * - Centralizes schema management
 * - Improves dependency injection clarity
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Property.name, schema: PropertySchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: BlockedDate.name, schema: BlockedDateSchema },
      { name: HostOnboarding.name, schema: HostOnboardingSchema },
      { name: SavedSearch.name, schema: SavedSearchSchema },
      { name: SearchHistory.name, schema: SearchHistorySchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class SharedSchemasModule {}
