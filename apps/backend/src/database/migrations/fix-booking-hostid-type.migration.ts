import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../schemas/booking.schema';

/**
 * Migration to fix hostId field type in bookings
 * Converts string hostId values to ObjectId
 *
 * Run this migration ONCE to fix existing data:
 * - Find all bookings where hostId is stored as string
 * - Convert to proper ObjectId type
 */
@Injectable()
export class FixBookingHostIdTypeMigration {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
  ) {}

  async run(): Promise<void> {
    console.log('Starting migration: Fix booking hostId type...');

    try {
      // Find all bookings
      const bookings = await this.bookingModel.find({}).exec();

      let fixedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const booking of bookings) {
        try {
          // Check if hostId is a string (not ObjectId)
          const hostIdValue = booking.hostId;

          // If it's already an ObjectId, skip
          if (hostIdValue instanceof Types.ObjectId) {
            skippedCount++;
            continue;
          }

          // Convert string to ObjectId
          const hostIdString = String(hostIdValue);

          // Validate it's a valid ObjectId string
          if (!Types.ObjectId.isValid(hostIdString)) {
            console.error(`Invalid ObjectId string for booking ${booking._id}: ${hostIdString}`);
            errorCount++;
            continue;
          }

          // Update the booking with proper ObjectId
          await this.bookingModel.updateOne(
            { _id: booking._id },
            { $set: { hostId: new Types.ObjectId(hostIdString) } }
          ).exec();

          fixedCount++;
          console.log(`Fixed booking ${booking._id} - hostId: ${hostIdString}`);
        } catch (error) {
          console.error(`Error processing booking ${booking._id}:`, error);
          errorCount++;
        }
      }

      console.log('\n=== Migration Complete ===');
      console.log(`Total bookings processed: ${bookings.length}`);
      console.log(`Fixed: ${fixedCount}`);
      console.log(`Already correct (skipped): ${skippedCount}`);
      console.log(`Errors: ${errorCount}`);
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}
