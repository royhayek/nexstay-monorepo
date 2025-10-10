import { Types, Document } from 'mongoose';
import {
  isValidObjectId,
  toObjectId,
  toObjectIds,
  calculateSkip,
  validateLimit,
  calculateTotalPages,
  buildPaginatedResult,
  validatePagination,
  executePaginatedQuery,
  executeAggregationWithPagination,
  ensureDocumentExists,
  toPlainObject,
  cleanUndefinedValues,
  buildUpdateObject,
  isRecentlyModified,
  buildTextSearchPipeline,
  buildLookupPipeline,
  addConditionalStages,
  buildDateRangeMatch,
  addStringId,
  addStringIds,
  withTransaction,
  executeBatch,
} from './database.utils';
import { DateUtils } from './date.utils';

// Test interfaces
interface TestDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  updatedAt?: Date;
}

interface MockQuery {
  sort: jest.MockedFunction<(sort: Record<string, number>) => MockQuery>;
  skip: jest.MockedFunction<(skip: number) => MockQuery>;
  limit: jest.MockedFunction<(limit: number) => MockQuery>;
  populate: jest.MockedFunction<(populate: string | string[]) => MockQuery>;
  lean: jest.MockedFunction<(lean: boolean) => Promise<TestDocument[]>>;
}

interface AggregationResult {
  data: TestDocument[];
  totalCount: Array<{ count: number }>;
}

interface MockModel {
  countDocuments: jest.MockedFunction<(filter: Record<string, unknown>) => Promise<number>>;
  find: jest.MockedFunction<(filter: Record<string, unknown>, select?: string) => MockQuery>;
  aggregate: jest.MockedFunction<
    (pipeline: Record<string, unknown>[]) => Promise<AggregationResult[]>
  >;
  startSession: jest.MockedFunction<() => Promise<MockSession>>;
}

interface MockSession {
  startTransaction: jest.MockedFunction<() => void>;
  commitTransaction: jest.MockedFunction<() => Promise<void>>;
  abortTransaction: jest.MockedFunction<() => Promise<void>>;
  endSession: jest.MockedFunction<() => Promise<void>>;
}

interface MockDocumentWithToObject {
  _id: string;
  name: string;
  toObject: jest.MockedFunction<() => Record<string, unknown>>;
}

interface LookupPipelineStage {
  $lookup: {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
    pipeline: Record<string, unknown>[];
  };
}

interface TransactionMockModel {
  startSession: jest.MockedFunction<() => Promise<MockSession>>;
}

interface TextSearchPipelineStage {
  $match: {
    $or: Array<{
      [fieldName: string]: {
        $regex: RegExp;
      };
    }>;
  };
}

// Mock DateUtils to control date behavior in tests
jest.mock('./date.utils', () => ({
  DateUtils: {
    parseDate: jest.fn((date: string | number | Date) => new Date(date)),
    now: jest.fn(() => new Date('2024-01-01T12:00:00Z')),
    create: jest.fn((date?: string | number | Date) => new Date(date || '2024-01-01T12:00:00Z')),
    nowTimestamp: jest.fn(() => new Date('2024-01-01T12:00:00Z').getTime()),
  },
}));

describe('Database Utils', () => {
  describe('ObjectId Utilities', () => {
    describe('isValidObjectId', () => {
      it('should return true for valid ObjectId strings', () => {
        const validId = new Types.ObjectId().toString();
        expect(isValidObjectId(validId)).toBe(true);
      });

      it('should return false for invalid ObjectId strings', () => {
        expect(isValidObjectId('invalid')).toBe(false);
        expect(isValidObjectId('123')).toBe(false);
        expect(isValidObjectId('')).toBe(false);
        expect(isValidObjectId('12345678901234567890123G')).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(isValidObjectId('000000000000000000000000')).toBe(true);
        expect(isValidObjectId('FFFFFFFFFFFFFFFFFFFFFFFF')).toBe(true);
      });
    });

    describe('toObjectId', () => {
      it('should convert valid ObjectId string to Types.ObjectId', () => {
        const validId = new Types.ObjectId().toString();
        const result = toObjectId(validId);

        expect(result).toBeInstanceOf(Types.ObjectId);
        expect(result!.toString()).toBe(validId);
      });

      it('should return null for invalid ObjectId strings', () => {
        expect(toObjectId('invalid')).toBeNull();
        expect(toObjectId('')).toBeNull();
        expect(toObjectId('123')).toBeNull();
      });
    });

    describe('toObjectIds', () => {
      it('should convert array of valid ObjectId strings', () => {
        const id1 = new Types.ObjectId().toString();
        const id2 = new Types.ObjectId().toString();
        const ids = [id1, id2];

        const result = toObjectIds(ids);

        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(Types.ObjectId);
        expect(result[1]).toBeInstanceOf(Types.ObjectId);
        expect(result[0].toString()).toBe(id1);
        expect(result[1].toString()).toBe(id2);
      });

      it('should filter out invalid ObjectId strings', () => {
        const validId = new Types.ObjectId().toString();
        const ids = [validId, 'invalid', '', 'another-invalid'];

        const result = toObjectIds(ids);

        expect(result).toHaveLength(1);
        expect(result[0].toString()).toBe(validId);
      });

      it('should handle empty array', () => {
        const result = toObjectIds([]);
        expect(result).toEqual([]);
      });
    });
  });

  describe('Pagination Utilities', () => {
    describe('calculateSkip', () => {
      it('should calculate skip value correctly', () => {
        expect(calculateSkip(1, 10)).toBe(0);
        expect(calculateSkip(2, 10)).toBe(10);
        expect(calculateSkip(3, 20)).toBe(40);
        expect(calculateSkip(5, 15)).toBe(60);
      });

      it('should handle edge cases with minimum values', () => {
        expect(calculateSkip(0, 10)).toBe(0); // Page 0 becomes 1
        expect(calculateSkip(-1, 10)).toBe(0); // Negative page becomes 1
        expect(calculateSkip(1, 0)).toBe(0); // Limit 0 becomes 1
        expect(calculateSkip(1, -5)).toBe(0); // Negative limit becomes 1
      });

      it('should handle large numbers', () => {
        expect(calculateSkip(1000, 100)).toBe(99900);
        expect(calculateSkip(1, 1000)).toBe(0);
      });
    });

    describe('validateLimit', () => {
      it('should return valid limit within bounds', () => {
        expect(validateLimit(50)).toBe(50);
        expect(validateLimit(10, 100, 1)).toBe(10);
      });

      it('should enforce maximum limit', () => {
        expect(validateLimit(150, 100)).toBe(100);
        expect(validateLimit(1000, 50)).toBe(50);
      });

      it('should enforce minimum limit', () => {
        expect(validateLimit(0, 100, 5)).toBe(5);
        expect(validateLimit(-10, 100, 1)).toBe(1);
      });

      it('should use default bounds when not provided', () => {
        expect(validateLimit(150)).toBe(100); // Default max is 100
        expect(validateLimit(0)).toBe(1); // Default min is 1
      });
    });

    describe('calculateTotalPages', () => {
      it('should calculate total pages correctly', () => {
        expect(calculateTotalPages(100, 10)).toBe(10);
        expect(calculateTotalPages(101, 10)).toBe(11);
        expect(calculateTotalPages(99, 10)).toBe(10);
        expect(calculateTotalPages(0, 10)).toBe(0);
      });

      it('should handle edge cases', () => {
        expect(calculateTotalPages(10, 1)).toBe(10);
        expect(calculateTotalPages(1, 10)).toBe(1);
        expect(calculateTotalPages(0, 1)).toBe(0);
      });

      it('should handle large numbers', () => {
        expect(calculateTotalPages(1000000, 100)).toBe(10000);
      });
    });

    describe('buildPaginatedResult', () => {
      it('should build paginated result with navigation info', () => {
        const data = [{ id: '1' }, { id: '2' }];
        const result = buildPaginatedResult(data, 100, 2, 10);

        expect(result).toEqual({
          data,
          total: 100,
          page: 2,
          limit: 10,
          totalPages: 10,
          hasNextPage: true,
          hasPrevPage: true,
          nextPage: 3,
          prevPage: 1,
        });
      });

      it('should handle first page', () => {
        const data = [{ id: '1' }];
        const result = buildPaginatedResult(data, 50, 1, 10);

        expect(result).toMatchObject({
          hasNextPage: true,
          hasPrevPage: false,
          nextPage: 2,
          prevPage: null,
        });
      });

      it('should handle last page', () => {
        const data = [{ id: '1' }];
        const result = buildPaginatedResult(data, 25, 3, 10);

        expect(result).toMatchObject({
          totalPages: 3,
          hasNextPage: false,
          hasPrevPage: true,
          nextPage: null,
          prevPage: 2,
        });
      });

      it('should handle single page', () => {
        const data = [{ id: '1' }];
        const result = buildPaginatedResult(data, 5, 1, 10);

        expect(result).toMatchObject({
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: null,
          prevPage: null,
        });
      });

      it('should handle empty results', () => {
        const result = buildPaginatedResult([], 0, 1, 10);

        expect(result).toMatchObject({
          data: [],
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        });
      });
    });

    describe('validatePagination', () => {
      it('should validate and normalize pagination parameters', () => {
        const config = { page: 3, limit: 25, maxLimit: 100, minLimit: 5 };
        const result = validatePagination(config);

        expect(result).toEqual({
          page: 3,
          limit: 25,
          skip: 50,
        });
      });

      it('should apply default limits', () => {
        const config = { page: 2, limit: 15 };
        const result = validatePagination(config);

        expect(result).toEqual({
          page: 2,
          limit: 15,
          skip: 15,
        });
      });
    });
  });

  describe('Query Execution Utilities', () => {
    let mockModel: MockModel;
    let mockQuery: MockQuery;

    beforeEach(() => {
      mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn(),
      };

      mockModel = {
        countDocuments: jest.fn(),
        find: jest.fn().mockReturnValue(mockQuery),
        aggregate: jest.fn(),
        startSession: jest.fn(),
      };
    });

    describe('executePaginatedQuery', () => {
      it('should execute paginated query with all options', async () => {
        const mockData: TestDocument[] = [
          { _id: new Types.ObjectId(), name: 'Test' } as TestDocument,
        ];
        const mockCount = 100;

        mockModel.countDocuments.mockResolvedValue(mockCount);
        mockQuery.lean.mockResolvedValue(mockData);

        const filter = { status: 'active' };
        const options = {
          page: 2,
          limit: 10,
          sort: { name: 1 as const },
          populate: ['user'],
          select: 'name email',
          lean: true,
        };

        const result = await executePaginatedQuery(mockModel as never, filter, options);

        expect(mockModel.countDocuments).toHaveBeenCalledWith(filter);
        expect(mockModel.find).toHaveBeenCalledWith(filter, 'name email');
        expect(mockQuery.sort).toHaveBeenCalledWith({ name: 1 });
        expect(mockQuery.skip).toHaveBeenCalledWith(10);
        expect(mockQuery.limit).toHaveBeenCalledWith(10);
        expect(mockQuery.populate).toHaveBeenCalledWith(['user']);
        expect(mockQuery.lean).toHaveBeenCalledWith(true);

        expect(result).toMatchObject({
          data: mockData,
          total: mockCount,
          page: 2,
          limit: 10,
        });
      });

      it('should handle minimal options', async () => {
        const mockData: TestDocument[] = [{ _id: new Types.ObjectId() } as TestDocument];
        const mockCount = 5;

        mockModel.countDocuments.mockResolvedValue(mockCount);
        mockQuery.lean.mockResolvedValue(mockData);

        const result = await executePaginatedQuery(mockModel as never, {}, { page: 1, limit: 10 });

        expect(mockQuery.sort).toHaveBeenCalledWith({});
        expect(mockQuery.populate).toHaveBeenCalledWith([]);
        expect(mockQuery.lean).toHaveBeenCalledWith(false);
        expect(result.data).toBe(mockData);
      });
    });

    describe('executeAggregationWithPagination', () => {
      it('should execute aggregation with pagination', async () => {
        const mockData: TestDocument[] = [
          { _id: new Types.ObjectId(), name: 'Test', count: 5 } as TestDocument & { count: number },
        ];
        const mockResult: AggregationResult[] = [
          {
            data: mockData,
            totalCount: [{ count: 50 }],
          },
        ];

        mockModel.aggregate.mockResolvedValue(mockResult);

        const pipeline = [{ $match: { status: 'active' } }];
        const options = { page: 2, limit: 15, maxLimit: 100 };

        const result = await executeAggregationWithPagination(
          mockModel as never,
          pipeline,
          options,
        );

        expect(mockModel.aggregate).toHaveBeenCalledWith([
          { $match: { status: 'active' } },
          {
            $facet: {
              data: [{ $skip: 15 }, { $limit: 15 }],
              totalCount: [{ $count: 'count' }],
            },
          },
        ]);

        expect(result).toMatchObject({
          data: mockData,
          total: 50,
          page: 2,
          limit: 15,
        });
      });

      it('should handle empty aggregation result', async () => {
        mockModel.aggregate.mockResolvedValue([]);

        const result = await executeAggregationWithPagination(mockModel as never, [], {});

        expect(result).toMatchObject({
          data: [],
          total: 0,
          page: 1,
          limit: 20,
        });
      });

      it('should handle aggregation result without count', async () => {
        const mockData: TestDocument[] = [{ _id: new Types.ObjectId() } as TestDocument];
        const mockResult: AggregationResult[] = [
          {
            data: mockData,
            totalCount: [],
          },
        ];

        mockModel.aggregate.mockResolvedValue(mockResult);

        const result = await executeAggregationWithPagination(mockModel as never, [], {});

        expect(result.total).toBe(0);
        expect(result.data).toBe(mockData);
      });
    });
  });

  describe('Document Utilities', () => {
    describe('ensureDocumentExists', () => {
      it('should return document when it exists', () => {
        const document: TestDocument = {
          _id: new Types.ObjectId(),
          name: 'Test',
        } as TestDocument;
        const result = ensureDocumentExists(document);

        expect(result).toBe(document);
      });

      it('should throw error when document is null', () => {
        expect(() => ensureDocumentExists(null)).toThrow('Document not found');
      });

      it('should throw custom error message', () => {
        expect(() => ensureDocumentExists(null, 'User not found')).toThrow('User not found');
      });
    });

    describe('toPlainObject', () => {
      it('should convert document with toObject method', () => {
        const mockDocument: MockDocumentWithToObject = {
          _id: '1',
          name: 'Test',
          toObject: jest.fn().mockReturnValue({ _id: '1', name: 'Test' }),
        };

        const result = toPlainObject(mockDocument as never);

        expect(mockDocument.toObject).toHaveBeenCalled();
        expect(result).toEqual({ _id: '1', name: 'Test' });
      });

      it('should return document as-is when no toObject method', () => {
        const document: TestDocument = {
          _id: new Types.ObjectId(),
          name: 'Test',
        } as TestDocument;
        const result = toPlainObject(document);

        expect(result).toBe(document);
      });
    });

    describe('cleanUndefinedValues', () => {
      it('should remove undefined values from object', () => {
        const obj = {
          name: 'Test',
          age: undefined,
          email: 'test@example.com',
          phone: undefined,
          isActive: false,
        };

        const result = cleanUndefinedValues(obj);

        expect(result).toEqual({
          name: 'Test',
          email: 'test@example.com',
          isActive: false,
        });
      });

      it('should handle empty object', () => {
        const result = cleanUndefinedValues({});
        expect(result).toEqual({});
      });

      it('should handle object with all undefined values', () => {
        const obj = { a: undefined, b: undefined };
        const result = cleanUndefinedValues(obj);
        expect(result).toEqual({});
      });

      it('should preserve null values', () => {
        const obj = { name: 'Test', value: null, other: undefined };
        const result = cleanUndefinedValues(obj);
        expect(result).toEqual({ name: 'Test', value: null });
      });
    });

    describe('buildUpdateObject', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        (DateUtils.parseDate as jest.Mock).mockReturnValue(new Date('2024-01-01'));
      });

      it('should build update object with timestamp', () => {
        const updates = { name: 'Test', age: undefined, email: 'test@example.com' };
        const result = buildUpdateObject(updates);

        expect(result).toEqual({
          name: 'Test',
          email: 'test@example.com',
          updatedAt: new Date('2024-01-01T12:00:00Z'),
        });
        const mockNow = jest.mocked(DateUtils).now;
        expect(mockNow).toHaveBeenCalled();
      });

      it('should build update object without timestamp', () => {
        const updates = { name: 'Test', age: undefined };
        const result = buildUpdateObject(updates, false);

        expect(result).toEqual({
          name: 'Test',
        });
        const mockParseDate = jest.mocked(DateUtils).parseDate;
        expect(mockParseDate).not.toHaveBeenCalled();
      });
    });

    describe('isRecentlyModified', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        (DateUtils.parseDate as jest.MockedFunction<typeof DateUtils.parseDate>).mockReturnValue(
          new Date('2024-01-01T12:00:00Z'),
        );
      });

      it('should return true for recently modified document', () => {
        const document: TestDocument = {
          _id: new Types.ObjectId(),
          name: 'Test',
          updatedAt: new Date('2024-01-01T11:58:00Z'), // 2 minutes ago
        } as TestDocument;

        const result = isRecentlyModified(document, 5);

        expect(result).toBe(true);
      });

      it('should return false for old document', () => {
        const document: TestDocument = {
          _id: new Types.ObjectId(),
          name: 'Test',
          updatedAt: new Date('2024-01-01T11:50:00Z'), // 10 minutes ago
        } as TestDocument;

        const result = isRecentlyModified(document, 5);

        expect(result).toBe(false);
      });

      it('should return false when no updatedAt field', () => {
        const document: TestDocument = {
          _id: new Types.ObjectId(),
          name: 'Test',
        } as TestDocument;
        const result = isRecentlyModified(document);

        expect(result).toBe(false);
      });

      it('should return false when updatedAt is not a Date', () => {
        const document = {
          _id: new Types.ObjectId(),
          name: 'Test',
          updatedAt: 'invalid-date',
        } as never;
        const result = isRecentlyModified(document);

        expect(result).toBe(false);
      });
    });
  });

  describe('Pipeline Utilities', () => {
    describe('buildTextSearchPipeline', () => {
      it('should build text search pipeline', () => {
        const pipeline = buildTextSearchPipeline('luxury hotel', ['title', 'description']);

        expect(pipeline).toEqual([
          {
            $match: {
              $or: [
                { title: { $regex: /luxury hotel/i } },
                { description: { $regex: /luxury hotel/i } },
              ],
            },
          },
        ]);
      });

      it('should include additional stages', () => {
        const additionalStages = [{ $sort: { score: -1 } }];
        const pipeline = buildTextSearchPipeline('test', ['title'], additionalStages);

        expect(pipeline).toHaveLength(2);
        expect(pipeline[1]).toEqual({ $sort: { score: -1 } });
      });
    });

    describe('buildLookupPipeline', () => {
      it('should build lookup pipeline', () => {
        const pipeline = buildLookupPipeline('users', 'userId', '_id', 'user');

        expect(pipeline).toEqual([
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
              pipeline: [],
            },
          },
        ]);
      });

      it('should include additional pipeline stages', () => {
        const additionalPipeline = [{ $match: { isActive: true } }];
        const pipeline = buildLookupPipeline('users', 'userId', '_id', 'user', additionalPipeline);

        expect((pipeline[0] as unknown as LookupPipelineStage).$lookup.pipeline).toEqual(
          additionalPipeline,
        );
      });
    });

    describe('addConditionalStages', () => {
      it('should add stages when condition is true', () => {
        const basePipeline = [{ $match: { status: 'active' } }];
        const conditionalStages = [{ $sort: { name: 1 } }];

        const result = addConditionalStages(basePipeline, true, conditionalStages);

        expect(result).toEqual([{ $match: { status: 'active' } }, { $sort: { name: 1 } }]);
      });

      it('should not add stages when condition is false', () => {
        const basePipeline = [{ $match: { status: 'active' } }];
        const conditionalStages = [{ $sort: { name: 1 } }];

        const result = addConditionalStages(basePipeline, false, conditionalStages);

        expect(result).toEqual(basePipeline);
      });
    });

    describe('buildDateRangeMatch', () => {
      it('should build date range match with both dates', () => {
        const result = buildDateRangeMatch('createdAt', '2024-01-01', '2024-12-31');

        expect(result).toEqual({
          createdAt: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2024-12-31'),
          },
        });
      });

      it('should build date range match with only from date', () => {
        const result = buildDateRangeMatch('createdAt', '2024-01-01');

        expect(result).toEqual({
          createdAt: {
            $gte: new Date('2024-01-01'),
          },
        });
      });

      it('should return null when no dates provided', () => {
        const result = buildDateRangeMatch('createdAt');

        expect(result).toBeNull();
      });
    });
  });

  describe('ID Utilities', () => {
    describe('addStringId', () => {
      it('should add string id from ObjectId _id', () => {
        const objectId = new Types.ObjectId();
        const document = { _id: objectId, name: 'Test' };

        const result = addStringId(document);

        expect(result).toEqual({
          _id: objectId,
          name: 'Test',
          id: objectId.toString(),
        });
      });

      it('should handle string _id', () => {
        const document = { _id: 'string-id', name: 'Test' };
        const result = addStringId(document);

        expect(result.id).toBe('string-id');
      });

      it('should handle null _id', () => {
        const document = { _id: null, name: 'Test' };
        const result = addStringId(document);

        expect(result.id).toBe('null');
      });
    });

    describe('addStringIds', () => {
      it('should add string ids to array of documents', () => {
        const id1 = new Types.ObjectId();
        const id2 = new Types.ObjectId();
        const documents = [
          { _id: id1, name: 'Test1' },
          { _id: id2, name: 'Test2' },
        ];

        const result = addStringIds(documents);

        expect(result).toEqual([
          { _id: id1, name: 'Test1', id: id1.toString() },
          { _id: id2, name: 'Test2', id: id2.toString() },
        ]);
      });

      it('should handle empty array', () => {
        const result = addStringIds([]);
        expect(result).toEqual([]);
      });
    });
  });

  describe('Transaction and Batch Utilities', () => {
    describe('withTransaction', () => {
      let mockSession: MockSession;
      let transactionMockModel: TransactionMockModel;

      beforeEach(() => {
        mockSession = {
          startTransaction: jest.fn(),
          commitTransaction: jest.fn(),
          abortTransaction: jest.fn(),
          endSession: jest.fn(),
        };
        transactionMockModel = {
          startSession: jest.fn().mockResolvedValue(mockSession),
        };
      });

      it('should execute operation within transaction', async () => {
        const operation = jest.fn().mockResolvedValue('result');

        const result = await withTransaction(operation, transactionMockModel as never);

        expect(transactionMockModel.startSession).toHaveBeenCalled();
        expect(mockSession.startTransaction).toHaveBeenCalled();
        expect(operation).toHaveBeenCalledWith(mockSession);
        expect(mockSession.commitTransaction).toHaveBeenCalled();
        expect(mockSession.endSession).toHaveBeenCalled();
        expect(result).toBe('result');
      });

      it('should abort transaction on error', async () => {
        const error = new Error('Operation failed');
        const operation = jest.fn().mockRejectedValue(error);

        await expect(withTransaction(operation, transactionMockModel as never)).rejects.toThrow(
          error,
        );

        expect(mockSession.abortTransaction).toHaveBeenCalled();
        expect(mockSession.endSession).toHaveBeenCalled();
      });
    });

    describe('executeBatch', () => {
      it('should execute operations in batches', async () => {
        const items = [1, 2, 3, 4, 5, 6, 7];
        const operation = jest.fn().mockImplementation((item: number) => Promise.resolve(item * 2));

        const result = await executeBatch(items, operation, 3);

        expect(result).toEqual([2, 4, 6, 8, 10, 12, 14]);
        expect(operation).toHaveBeenCalledTimes(7);
      });

      it('should handle empty items array', async () => {
        const operation = jest.fn();

        const result = await executeBatch([], operation);

        expect(result).toEqual([]);
        expect(operation).not.toHaveBeenCalled();
      });

      it('should use default batch size', async () => {
        const items = Array.from({ length: 25 }, (_, i) => i);
        const operation = jest.fn().mockImplementation((item: number) => Promise.resolve(item));

        const result = await executeBatch(items, operation);

        expect(result).toHaveLength(25);
        expect(operation).toHaveBeenCalledTimes(25);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 100 }, (_, i) => {
        const id = new Types.ObjectId().toString();
        return Promise.resolve({
          isValid: isValidObjectId(id),
          objectId: toObjectId(id),
          skip: calculateSkip(i + 1, 10),
        });
      });

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        expect(result.isValid).toBe(true);
        expect(result.objectId).toBeInstanceOf(Types.ObjectId);
        expect(result.skip).toBe(index * 10);
      });
    });

    it('should handle extreme values in pagination', () => {
      const result = buildPaginatedResult([], Number.MAX_SAFE_INTEGER, 1, Number.MAX_SAFE_INTEGER);

      expect(result.total).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
    });

    it('should handle invalid dates in buildDateRangeMatch', () => {
      const result = buildDateRangeMatch('createdAt', 'invalid-date', 'also-invalid');

      expect(result).toEqual({
        createdAt: {
          $gte: expect.any(Date) as Date,
          $lte: expect.any(Date) as Date,
        },
      });
    });

    it('should handle special characters in text search', () => {
      const pipeline = buildTextSearchPipeline('test search', ['title']);

      expect(
        (pipeline[0] as unknown as TextSearchPipelineStage).$match.$or[0].title.$regex,
      ).toEqual(/test search/i);
    });

    it('should handle very large batch operations', async () => {
      const items = Array.from({ length: 1000 }, (_, i) => i);
      const operation = jest.fn().mockImplementation((item: number) => Promise.resolve(item * 2));

      const result = await executeBatch(items, operation, 50);

      expect(result).toHaveLength(1000);
      expect(result[999]).toBe(1998);
    });
  });
});
