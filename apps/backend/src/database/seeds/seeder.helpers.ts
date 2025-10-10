import { Model, Document } from 'mongoose';
import { LoggingUtil } from '../../common/utils/logging.util';
import { JsonUtils } from '../../common/utils/json.utils';

/**
 * Standard seeder logging functions
 */
export class SeederLogger {
  static success(name: string): void {
    LoggingUtil.seedLog(name, 'seeded!');
  }

  static error(name: string, error?: unknown): void {
    LoggingUtil.seedError(name, error instanceof Error ? error : new Error(String(error)));
  }

  static modified(name: string, count: number): void {
    LoggingUtil.seedWarn(name, `modified! (${count} updates)`, { count });
  }

  static skipped(name: string, reason?: string): void {
    LoggingUtil.seedSkip(name, reason);
  }
}

export interface SeederData {
  [key: string]: string | number | boolean | Date | object;
}

export interface UpdateOperation {
  filter: Record<string, string | number | boolean>;
  update: SeederData;
}

export interface ChangeDetectionResult {
  hasChanges: boolean;
  toCreate: SeederData[];
  toUpdate: UpdateOperation[];
  existingCount: number;
}

/**
 * Change detection utility for seeder data
 */
export class ChangeDetector {
  /**
   * Checks if array of objects has changes compared to existing data
   * @param model Mongoose model
   * @param newData Array of objects to seed
   * @param keyFields Fields to use for matching existing records
   * @returns Object with hasChanges boolean and details
   */
  static async detectChanges<T extends Document>(
    model: Model<T>,
    newData: SeederData[],
    keyFields: string[] = ['_id'],
  ): Promise<ChangeDetectionResult> {
    const existingData = await model.find({}).lean();
    const existingCount = existingData.length;

    if (existingCount === 0) {
      return {
        hasChanges: true,
        toCreate: newData,
        toUpdate: [],
        existingCount: 0,
      };
    }

    const toCreate: SeederData[] = [];
    const toUpdate: UpdateOperation[] = [];

    for (const newItem of newData) {
      const existingItem = existingData.find((existing) =>
        keyFields.every((field) => {
          const existingValue = existing[field] as string | number | boolean | Date | object;
          const newValue = newItem[field];
          return existingValue === newValue;
        }),
      );

      if (!existingItem) {
        toCreate.push(newItem);
      } else {
        // Check if any field has changed
        const hasChanges = Object.keys(newItem).some((key) => {
          const existingValue = existingItem[key] as string | number | boolean | Date | object;
          const newValue = newItem[key];
          return !JsonUtils.deepEqual(existingValue, newValue);
        });

        if (hasChanges) {
          const filter: Record<string, string | number | boolean> = {};
          for (const field of keyFields) {
            const value = newItem[field];
            if (
              typeof value === 'string' ||
              typeof value === 'number' ||
              typeof value === 'boolean'
            ) {
              filter[field] = value;
            }
          }

          toUpdate.push({
            filter,
            update: newItem,
          });
        }
      }
    }

    return {
      hasChanges: toCreate.length > 0 || toUpdate.length > 0,
      toCreate,
      toUpdate,
      existingCount,
    };
  }

  /**
   * Simplified change detection for basic count-based checking
   * @param model Mongoose model
   * @param expectedCount Expected number of records
   * @returns true if no records exist or count doesn't match
   */
  static async needsSeeding<T extends Document>(
    model: Model<T>,
    expectedCount?: number,
  ): Promise<boolean> {
    const existingCount = await model.countDocuments();

    if (existingCount === 0) {
      return true;
    }

    if (expectedCount && existingCount !== expectedCount) {
      return true;
    }

    return false;
  }

  /**
   * Check if any field has changed between two objects
   * @param existing Existing object
   * @param newData New data object
   * @param ignoreFields Fields to ignore in comparison
   * @returns true if any field has changed
   */
  static hasObjectChanged(
    existing: SeederData,
    newData: SeederData,
    ignoreFields: string[] = ['createdAt', 'updatedAt', '__v'],
  ): boolean {
    const fieldsToCheck = Object.keys(newData).filter((key) => !ignoreFields.includes(key));

    return fieldsToCheck.some((key) => {
      const existingValue = existing[key];
      const newValue = newData[key];
      return !JsonUtils.deepEqual(existingValue, newValue);
    });
  }
}

/**
 * Wrapper for seeder functions to provide consistent error handling and logging
 * @param seederName Name of the seeder (e.g., "dynamic config")
 * @param seederFunction Function that performs the seeding logic
 */
export async function runSeeder(
  seederName: string,
  seederFunction: () => Promise<void>,
): Promise<void> {
  try {
    await seederFunction();
  } catch (error) {
    SeederLogger.error(seederName, error);
    throw error;
  }
}
