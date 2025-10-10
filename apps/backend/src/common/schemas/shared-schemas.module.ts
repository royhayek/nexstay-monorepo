import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Import all core schemas
import { User, UserSchema } from '../../database/schemas/user.schema';
import { Property, PropertySchema } from '../../database/schemas/property.schema';
import { Booking, BookingSchema } from '../../database/schemas/booking.schema';
import { Review, ReviewSchema } from '../../database/schemas/review.schema';

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
    ]),
  ],
  exports: [MongooseModule],
})
export class SharedSchemasModule {}
