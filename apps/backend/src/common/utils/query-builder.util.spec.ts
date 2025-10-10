import { Types } from 'mongoose';
import {
  QueryBuilder,
  buildDateRangeFilter,
  buildObjectIdFilter,
  buildTextSearchFilter,
  buildSortQuery,
  calculateSkip,
  validatePagination,
  buildPaginatedQuery,
} from './query-builder.util';
import { SortDirectionEnum } from '../enums/sort.enums';
import { DateUtils } from './date.utils';

describe('QueryBuilder', () => {
  describe('QueryBuilder class', () => {
    let queryBuilder: QueryBuilder;

    beforeEach(() => {
      queryBuilder = QueryBuilder.create();
    });

    describe('create', () => {
      it('should create a new QueryBuilder instance', () => {
        const builder = QueryBuilder.create();
        expect(builder).toBeInstanceOf(QueryBuilder);
      });
    });

    describe('addObjectIdFilter', () => {
      it('should add valid ObjectId filter to query', () => {
        const validId = new Types.ObjectId().toString();
        const result = queryBuilder.addObjectIdFilter('userId', validId).build();

        expect(result.userId).toBeInstanceOf(Types.ObjectId);
        expect((result.userId as Types.ObjectId).toString()).toBe(validId);
      });

      it('should ignore invalid ObjectId', () => {
        const result = queryBuilder.addObjectIdFilter('userId', 'invalid-id').build();

        expect(result.userId).toBeUndefined();
      });

      it('should ignore undefined value', () => {
        const result = queryBuilder.addObjectIdFilter('userId', undefined).build();

        expect(result.userId).toBeUndefined();
      });

      it('should return QueryBuilder instance for chaining', () => {
        const result = queryBuilder.addObjectIdFilter('userId', new Types.ObjectId().toString());
        expect(result).toBe(queryBuilder);
      });
    });

    describe('addObjectIdFilters', () => {
      it('should add multiple ObjectId filters', () => {
        const userId = new Types.ObjectId().toString();
        const propertyId = new Types.ObjectId().toString();

        const result = queryBuilder
          .addObjectIdFilters({
            userId,
            propertyId,
            invalidId: 'invalid',
            undefinedId: undefined,
          })
          .build();

        expect(result.userId).toBeInstanceOf(Types.ObjectId);
        expect(result.propertyId).toBeInstanceOf(Types.ObjectId);
        expect(result.invalidId).toBeUndefined();
        expect(result.undefinedId).toBeUndefined();
      });
    });

    describe('addDateRangeFilter', () => {
      it('should add date range filter with both dates', () => {
        const fromDate = '2024-01-01';
        const toDate = '2024-12-31';

        const result = queryBuilder.addDateRangeFilter('createdAt', fromDate, toDate).build();

        expect(result.createdAt).toEqual({
          $gte: DateUtils.safeParse(fromDate),
          $lte: DateUtils.safeParse(toDate),
        });
      });

      it('should add date range filter with only from date', () => {
        const fromDate = '2024-01-01';

        const result = queryBuilder.addDateRangeFilter('createdAt', fromDate).build();

        expect(result.createdAt).toEqual({
          $gte: DateUtils.safeParse(fromDate),
        });
      });

      it('should add date range filter with only to date', () => {
        const toDate = '2024-12-31';

        const result = queryBuilder.addDateRangeFilter('createdAt', undefined, toDate).build();

        expect(result.createdAt).toEqual({
          $lte: DateUtils.safeParse(toDate),
        });
      });

      it('should ignore when both dates are undefined', () => {
        const result = queryBuilder.addDateRangeFilter('createdAt').build();

        expect(result.createdAt).toBeUndefined();
      });
    });

    describe('addNumberRangeFilter', () => {
      it('should add number range filter with both values', () => {
        const result = queryBuilder.addNumberRangeFilter('price', 100, 500).build();

        expect(result.price).toEqual({
          $gte: 100,
          $lte: 500,
        });
      });

      it('should add number range filter with only min value', () => {
        const result = queryBuilder.addNumberRangeFilter('price', 100).build();

        expect(result.price).toEqual({
          $gte: 100,
        });
      });

      it('should add number range filter with only max value', () => {
        const result = queryBuilder.addNumberRangeFilter('price', undefined, 500).build();

        expect(result.price).toEqual({
          $lte: 500,
        });
      });

      it('should handle zero values correctly', () => {
        const result = queryBuilder.addNumberRangeFilter('price', 0, 0).build();

        expect(result.price).toEqual({
          $gte: 0,
          $lte: 0,
        });
      });
    });

    describe('addBooleanFilter', () => {
      it('should add boolean filter for true', () => {
        const result = queryBuilder.addBooleanFilter('isActive', true).build();

        expect(result.isActive).toBe(true);
      });

      it('should add boolean filter for false', () => {
        const result = queryBuilder.addBooleanFilter('isActive', false).build();

        expect(result.isActive).toBe(false);
      });

      it('should ignore undefined value', () => {
        const result = queryBuilder.addBooleanFilter('isActive', undefined).build();

        expect(result.isActive).toBeUndefined();
      });
    });

    describe('addStringFilter', () => {
      it('should add string filter and trim value', () => {
        const result = queryBuilder.addStringFilter('status', '  active  ').build();

        expect(result.status).toBe('active');
      });

      it('should ignore empty string', () => {
        const result = queryBuilder.addStringFilter('status', '').build();

        expect(result.status).toBeUndefined();
      });

      it('should ignore whitespace-only string', () => {
        const result = queryBuilder.addStringFilter('status', '   ').build();

        expect(result.status).toBeUndefined();
      });

      it('should ignore undefined value', () => {
        const result = queryBuilder.addStringFilter('status', undefined).build();

        expect(result.status).toBeUndefined();
      });
    });

    describe('addEnumFilter', () => {
      it('should add enum filter with valid value', () => {
        const allowedValues = ['active', 'inactive', 'pending'];
        const result = queryBuilder.addEnumFilter('status', ' active ', allowedValues).build();

        expect(result.status).toBe('active');
      });

      it('should ignore invalid enum value', () => {
        const allowedValues = ['active', 'inactive', 'pending'];
        const result = queryBuilder.addEnumFilter('status', 'invalid', allowedValues).build();

        expect(result.status).toBeUndefined();
      });

      it('should add enum filter without validation when no allowed values provided', () => {
        const result = queryBuilder.addEnumFilter('status', ' active ').build();

        expect(result.status).toBe('active');
      });
    });

    describe('addArrayContainsFilter', () => {
      it('should add array contains filter', () => {
        const result = queryBuilder.addArrayContainsFilter('tags', ' luxury ').build();

        expect(result.tags).toEqual({ $in: ['luxury'] });
      });

      it('should ignore empty string', () => {
        const result = queryBuilder.addArrayContainsFilter('tags', '').build();

        expect(result.tags).toBeUndefined();
      });
    });

    describe('addSearchFilter', () => {
      it('should add case-insensitive search filter', () => {
        const options = { fields: ['title', 'description'] };
        const result = queryBuilder.addSearchFilter('luxury hotel', options).build();

        expect(result.$or).toEqual([
          { title: { $regex: 'luxury hotel', $options: 'i' } },
          { description: { $regex: 'luxury hotel', $options: 'i' } },
        ]);
      });

      it('should add case-sensitive search filter', () => {
        const options = { fields: ['title', 'description'], caseSensitive: true };
        const result = queryBuilder.addSearchFilter('Luxury Hotel', options).build();

        expect(result.$or).toEqual([
          { title: { $regex: 'Luxury Hotel', $options: '' } },
          { description: { $regex: 'Luxury Hotel', $options: '' } },
        ]);
      });

      it('should add exact match search filter', () => {
        const options = { fields: ['title'], exactMatch: true };
        const result = queryBuilder.addSearchFilter('luxury hotel', options).build();

        expect(result.$or).toEqual([{ title: { $regex: '^luxury hotel$', $options: 'i' } }]);
      });

      it('should ignore empty search term', () => {
        const options = { fields: ['title'] };
        const result = queryBuilder.addSearchFilter('', options).build();

        expect(result.$or).toBeUndefined();
      });
    });

    describe('addCustomFilter', () => {
      it('should add custom filter condition', () => {
        const customCondition = { $exists: true };
        const result = queryBuilder.addCustomFilter('email', customCondition).build();

        expect(result.email).toBe(customCondition);
      });

      it('should ignore null condition', () => {
        const result = queryBuilder.addCustomFilter('email', null).build();

        expect(result.email).toBeUndefined();
      });

      it('should ignore undefined condition', () => {
        const result = queryBuilder.addCustomFilter('email', undefined).build();

        expect(result.email).toBeUndefined();
      });
    });

    describe('build', () => {
      it('should return a copy of the query object', () => {
        const validId = new Types.ObjectId().toString();
        queryBuilder.addObjectIdFilter('userId', validId);

        const query1 = queryBuilder.build();
        const query2 = queryBuilder.build();

        expect(query1).toEqual(query2);
        expect(query1).not.toBe(query2); // Should be different objects
      });
    });

    describe('reset', () => {
      it('should reset the query and return QueryBuilder instance', () => {
        const validId = new Types.ObjectId().toString();
        queryBuilder.addObjectIdFilter('userId', validId);

        const result = queryBuilder.reset();
        const query = queryBuilder.build();

        expect(result).toBe(queryBuilder);
        expect(query).toEqual({});
      });
    });

    describe('chaining', () => {
      it('should support method chaining', () => {
        const userId = new Types.ObjectId().toString();
        const result = queryBuilder
          .addObjectIdFilter('userId', userId)
          .addStringFilter('status', 'active')
          .addBooleanFilter('isVisible', true)
          .addNumberRangeFilter('price', 100, 500)
          .build();

        expect(result).toMatchObject({
          userId: expect.any(Types.ObjectId) as Types.ObjectId,
          status: 'active',
          isVisible: true,
          price: { $gte: 100, $lte: 500 },
        });
        expect(result.userId).toBeInstanceOf(Types.ObjectId);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('buildDateRangeFilter', () => {
      it('should build date range filter with both dates', () => {
        const fromDate = '2024-01-01';
        const toDate = '2024-12-31';

        const result = buildDateRangeFilter(fromDate, toDate);

        expect(result).toEqual({
          $gte: DateUtils.safeParse(fromDate),
          $lte: DateUtils.safeParse(toDate),
        });
      });

      it('should build date range filter with only from date', () => {
        const fromDate = '2024-01-01';

        const result = buildDateRangeFilter(fromDate);

        expect(result).toEqual({
          $gte: DateUtils.safeParse(fromDate),
        });
      });

      it('should return undefined when no dates provided', () => {
        const result = buildDateRangeFilter();

        expect(result).toBeUndefined();
      });
    });

    describe('buildObjectIdFilter', () => {
      it('should build ObjectId filter with valid ID', () => {
        const validId = new Types.ObjectId().toString();
        const result = buildObjectIdFilter(validId);

        expect(result).toBeInstanceOf(Types.ObjectId);
        expect(result!.toString()).toBe(validId);
      });

      it('should return undefined for invalid ID', () => {
        const result = buildObjectIdFilter('invalid-id');

        expect(result).toBeUndefined();
      });

      it('should return undefined for undefined input', () => {
        const result = buildObjectIdFilter(undefined);

        expect(result).toBeUndefined();
      });
    });

    describe('buildTextSearchFilter', () => {
      it('should build case-insensitive text search filter', () => {
        const result = buildTextSearchFilter('luxury hotel', ['title', 'description']);

        expect(result).toEqual([
          { title: { $regex: 'luxury hotel', $options: 'i' } },
          { description: { $regex: 'luxury hotel', $options: 'i' } },
        ]);
      });

      it('should build case-sensitive text search filter', () => {
        const result = buildTextSearchFilter('Luxury Hotel', ['title', 'description'], true);

        expect(result).toEqual([
          { title: { $regex: 'Luxury Hotel', $options: '' } },
          { description: { $regex: 'Luxury Hotel', $options: '' } },
        ]);
      });

      it('should return undefined for empty search term', () => {
        const result = buildTextSearchFilter('', ['title']);

        expect(result).toBeUndefined();
      });

      it('should return undefined for whitespace-only search term', () => {
        const result = buildTextSearchFilter('   ', ['title']);

        expect(result).toBeUndefined();
      });
    });

    describe('buildSortQuery', () => {
      it('should build sort query with valid field and direction', () => {
        const result = buildSortQuery('title', SortDirectionEnum.ASC, ['title', 'createdAt']);

        expect(result).toEqual({ title: 1 });
      });

      it('should use default field when sortBy is not in allowed fields', () => {
        const result = buildSortQuery('invalid', SortDirectionEnum.ASC, ['title', 'createdAt']);

        expect(result).toEqual({ createdAt: 1 });
      });

      it('should use default direction when invalid direction provided', () => {
        const result = buildSortQuery('title', 'invalid' as SortDirectionEnum, ['title']);

        expect(result).toEqual({ title: -1 });
      });

      it('should handle case-insensitive direction strings', () => {
        const result1 = buildSortQuery('title', 'ASC' as SortDirectionEnum, ['title']);
        const result2 = buildSortQuery('title', 'asc' as SortDirectionEnum, ['title']);

        expect(result1).toEqual({ title: 1 });
        expect(result2).toEqual({ title: 1 });
      });

      it('should use custom default field', () => {
        const result = buildSortQuery(undefined, SortDirectionEnum.ASC, [], 'updatedAt');

        expect(result).toEqual({ updatedAt: 1 });
      });
    });

    describe('calculateSkip', () => {
      it('should calculate skip value correctly', () => {
        expect(calculateSkip(1, 10)).toBe(0);
        expect(calculateSkip(2, 10)).toBe(10);
        expect(calculateSkip(3, 20)).toBe(40);
      });

      it('should handle edge cases', () => {
        expect(calculateSkip(0, 10)).toBe(0); // Invalid page becomes 1
        expect(calculateSkip(-1, 10)).toBe(0); // Invalid page becomes 1
        expect(calculateSkip(1, 0)).toBe(0); // Invalid limit becomes 1
        expect(calculateSkip(1, -5)).toBe(0); // Invalid limit becomes 1
      });
    });

    describe('validatePagination', () => {
      it('should validate and normalize pagination parameters', () => {
        const config = { page: 2, limit: 15 };
        const result = validatePagination(config);

        expect(result).toEqual({
          page: 2,
          limit: 15,
          skip: 15,
        });
      });

      it('should enforce minimum page', () => {
        const config = { page: 0, limit: 10 };
        const result = validatePagination(config);

        expect(result.page).toBe(1);
        expect(result.skip).toBe(0);
      });

      it('should enforce maximum limit', () => {
        const config = { page: 1, limit: 200, maxLimit: 50 };
        const result = validatePagination(config);

        expect(result.limit).toBe(50);
      });

      it('should enforce minimum limit', () => {
        const config = { page: 1, limit: 0, minLimit: 5 };
        const result = validatePagination(config);

        expect(result.limit).toBe(5);
      });
    });

    describe('buildPaginatedQuery', () => {
      it('should build complete paginated query', () => {
        const baseQuery = { status: 'active' };
        const sortConfig = {
          field: 'title',
          direction: SortDirectionEnum.ASC,
          allowedFields: ['title', 'createdAt'],
          defaultField: 'createdAt',
        };
        const paginationConfig = { page: 2, limit: 15 };

        const result = buildPaginatedQuery(baseQuery, sortConfig, paginationConfig);

        expect(result).toEqual({
          filter: baseQuery,
          sort: { title: 1 },
          pagination: {
            page: 2,
            limit: 15,
            skip: 15,
          },
        });
      });

      it('should handle invalid sort field', () => {
        const baseQuery = { status: 'active' };
        const sortConfig = {
          field: 'invalid',
          direction: SortDirectionEnum.ASC,
          allowedFields: ['title'],
          defaultField: 'createdAt',
        };
        const paginationConfig = { page: 1, limit: 10 };

        const result = buildPaginatedQuery(baseQuery, sortConfig, paginationConfig);

        expect(result.sort).toEqual({ createdAt: 1 });
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent query building', async () => {
      const promises = Array.from({ length: 100 }, () => {
        const builder = QueryBuilder.create();
        const userId = new Types.ObjectId().toString();
        return Promise.resolve(
          builder.addObjectIdFilter('userId', userId).addStringFilter('status', 'active').build(),
        );
      });

      const results = await Promise.all(promises);
      results.forEach((result) => {
        expect(result.userId).toBeInstanceOf(Types.ObjectId);
        expect(result.status).toBe('active');
      });
    });

    it('should handle invalid date strings gracefully', () => {
      const result = QueryBuilder.create()
        .addDateRangeFilter('createdAt', 'invalid-date', '2024-12-31')
        .build();

      expect((result.createdAt as { $gte: Date; $lte: Date }).$gte).toEqual(expect.any(Date)); // Invalid dates still create Date objects
      expect((result.createdAt as { $gte: Date; $lte: Date }).$lte).toEqual(
        DateUtils.safeParse('2024-12-31'),
      );
    });

    it('should handle very long search terms', () => {
      const longTerm = 'a'.repeat(1000);
      const options = { fields: ['title'] };
      const result = QueryBuilder.create().addSearchFilter(longTerm, options).build();

      expect(result.$or).toEqual([{ title: { $regex: longTerm, $options: 'i' } }]);
    });

    it('should handle special regex characters in search', () => {
      const specialChars = '.*+?^${}()|[]\\';
      const options = { fields: ['title'] };
      const result = QueryBuilder.create().addSearchFilter(specialChars, options).build();

      expect(result.$or).toEqual([{ title: { $regex: specialChars, $options: 'i' } }]);
    });

    it('should handle empty allowedFields array in sort', () => {
      const result = buildSortQuery('title', SortDirectionEnum.ASC, []);

      expect(result).toEqual({ createdAt: 1 });
    });

    it('should handle extreme pagination values', () => {
      const config = { page: Number.MAX_SAFE_INTEGER, limit: Number.MAX_SAFE_INTEGER };
      const result = validatePagination(config);

      expect(result.page).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.limit).toBe(100); // Should be capped at maxLimit
    });
  });
});
