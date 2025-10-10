import { Types, Document, Model, PipelineStage } from 'mongoose';
import { DateUtils } from '../../common/utils/date.utils';
import {
  PaginatedResult,
  PaginationConfig,
  QueryOptions,
  AggregationOptions,
  AggregationResult,
} from '../interfaces/database.interfaces';

/**
 * Database Utility Functions
 * Common helper functions for MongoDB operations
 */

/**
 * Validate if a string is a valid MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

/**
 * Convert string to ObjectId with validation
 */
export function toObjectId(id: string): Types.ObjectId | null {
  if (isValidObjectId(id)) {
    return new Types.ObjectId(id);
  }
  return null;
}

/**
 * Convert array of strings to ObjectIds with validation
 */
export function toObjectIds(ids: string[]): Types.ObjectId[] {
  return ids.filter((id) => isValidObjectId(id)).map((id) => new Types.ObjectId(id));
}

/**
 * Calculate skip value for pagination
 */
export function calculateSkip(page: number, limit: number): number {
  return Math.max(0, (Math.max(1, page) - 1) * Math.max(1, limit));
}

/**
 * Validate and normalize limit
 */
export function validateLimit(limit: number, maxLimit = 100, minLimit = 1): number {
  return Math.min(Math.max(minLimit, limit), maxLimit);
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / Math.max(1, limit));
}

/**
 * Build paginated result object
 */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages = calculateTotalPages(total, limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
}

/**
 * Validate and normalize pagination parameters
 */
export function validatePagination(config: PaginationConfig): {
  page: number;
  limit: number;
  skip: number;
} {
  const { page, limit, maxLimit = 100, minLimit = 1 } = config;

  const validPage = Math.max(1, page);
  const validLimit = Math.min(Math.max(minLimit, limit), maxLimit);
  const skip = calculateSkip(validPage, validLimit);

  return { page: validPage, limit: validLimit, skip };
}

/**
 * Execute paginated query with count
 */
export async function executePaginatedQuery<T>(
  model: Model<T>,
  filter: Record<string, unknown>,
  options: QueryOptions,
): Promise<PaginatedResult<T>> {
  const { page, limit, sort, populate, select, lean = false } = options;

  const skip = calculateSkip(page, limit);

  // Execute count and find queries in parallel
  const [total, data] = await Promise.all([
    model.countDocuments(filter),
    model
      .find(filter, select)
      .sort(sort || {})
      .skip(skip)
      .limit(limit)
      .populate(populate || [])
      .lean(lean),
  ]);

  return buildPaginatedResult(data as T[], total, page, limit);
}

/**
 * Execute aggregation with pagination
 */
export async function executeAggregationWithPagination<T>(
  model: Model<T>,
  pipeline: PipelineStage[],
  options: AggregationOptions = {},
): Promise<PaginatedResult<T>> {
  const { page = 1, limit = 20, maxLimit = 100 } = options;

  const validLimit = validateLimit(limit, maxLimit);
  const skip = calculateSkip(page, validLimit);

  // Add pagination stages to pipeline
  const paginationPipeline: PipelineStage[] = [
    ...pipeline,
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: validLimit }],
        totalCount: [{ $count: 'count' }],
      },
    },
  ];

  const result = await model.aggregate<AggregationResult<T>>(paginationPipeline);

  const aggregationResult = result[0];
  const data = aggregationResult?.data || [];
  const total = aggregationResult?.totalCount[0]?.count || 0;

  return buildPaginatedResult(data, total, page, validLimit);
}

/**
 * Ensure document exists or throw error
 */
export function ensureDocumentExists<T extends Document>(
  document: T | null,
  errorMessage = 'Document not found',
): T {
  if (!document) {
    throw new Error(errorMessage);
  }
  return document;
}

/**
 * Safely convert document to plain object
 */
export function toPlainObject<T extends Document>(document: T): Record<string, unknown> {
  if ('toObject' in document && typeof document.toObject === 'function') {
    return document.toObject() as Record<string, unknown>;
  }
  return document as unknown as Record<string, unknown>;
}

/**
 * Clean undefined values from object (useful for updates)
 */
export function cleanUndefinedValues<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      (cleaned as Record<string, unknown>)[key] = value;
    }
  });

  return cleaned;
}

/**
 * Build update object with timestamps
 */
export function buildUpdateObject<T extends Record<string, any>>(
  updates: T,
  includeTimestamp = true,
): T & { updatedAt?: Date } {
  const cleanedUpdates = cleanUndefinedValues(updates);

  if (includeTimestamp) {
    return {
      ...cleanedUpdates,
      updatedAt: DateUtils.now(),
    } as T & { updatedAt: Date };
  }

  return cleanedUpdates as T & { updatedAt?: Date };
}

/**
 * Check if document is modified within time period
 */
export function isRecentlyModified(document: Document, minutes = 5): boolean {
  const docWithTimestamp = document as unknown as Record<string, unknown>;
  const updatedAt = docWithTimestamp.updatedAt;

  if (!updatedAt || !(updatedAt instanceof Date)) {
    return false;
  }

  const now = DateUtils.now();
  const diffMs = now.getTime() - updatedAt.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  return diffMinutes <= minutes;
}

/**
 * Generate aggregation pipeline for text search
 */
export function buildTextSearchPipeline(
  searchTerm: string,
  searchFields: string[],
  additionalStages: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
  const searchRegex = new RegExp(searchTerm, 'i');

  return [
    {
      $match: {
        $or: searchFields.map((field) => ({
          [field]: { $regex: searchRegex },
        })),
      },
    },
    ...additionalStages,
  ];
}

/**
 * Build lookup pipeline for population
 */
export function buildLookupPipeline(
  from: string,
  localField: string,
  foreignField: string,
  as: string,
  additionalPipeline: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
  return [
    {
      $lookup: {
        from,
        localField,
        foreignField,
        as,
        pipeline: additionalPipeline,
      },
    },
  ];
}

/**
 * Add conditional stages to aggregation pipeline
 */
export function addConditionalStages(
  pipeline: Record<string, unknown>[],
  condition: boolean,
  stages: Record<string, unknown>[],
): Record<string, unknown>[] {
  return condition ? [...pipeline, ...stages] : pipeline;
}

/**
 * Build match stage for date range
 */
export function buildDateRangeMatch(
  field: string,
  fromDate?: string,
  toDate?: string,
): Record<string, unknown> | null {
  if (!fromDate && !toDate) {
    return null;
  }

  const dateMatch: Record<string, Date> = {};

  if (fromDate) {
    dateMatch.$gte = DateUtils.create(fromDate);
  }

  if (toDate) {
    dateMatch.$lte = DateUtils.create(toDate);
  }

  return { [field]: dateMatch };
}

/**
 * Convert lean document to include string _id
 */
export function addStringId<T extends { _id: unknown }>(document: T): T & { id: string } {
  const id = document._id;
  const stringId =
    typeof id === 'object' && id !== null && 'toString' in id
      ? (id as { toString(): string }).toString()
      : String(id);

  return {
    ...document,
    id: stringId,
  };
}

/**
 * Convert array of lean documents to include string ids
 */
export function addStringIds<T extends { _id: unknown }>(documents: T[]): (T & { id: string })[] {
  return documents.map(addStringId);
}

/**
 * Database transaction helper
 */
export async function withTransaction<T>(
  operation: (session: unknown) => Promise<T>,
  model: Model<unknown>,
): Promise<T> {
  const session = await model.startSession();

  try {
    session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Batch operations helper
 */
export async function executeBatch<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  batchSize = 10,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((item) => operation(item)));
    results.push(...batchResults);
  }

  return results;
}
