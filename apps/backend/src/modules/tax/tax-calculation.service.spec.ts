import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

// Mock LoggingUtil to prevent error logs in tests
jest.mock('../../common/utils/logging.util');

import { TaxCalculationService } from './tax-calculation.service';
import { TaxJurisdiction } from '../../database/schemas/tax-jurisdiction.schema';
import { TaxRate } from '../../database/schemas/tax-rate.schema';
import { TaxCalculation } from '../../database/schemas/tax-calculation.schema';
import {
  TaxType,
  TaxCalculationMethod,
  TaxApplicability,
  TaxStatus,
  TaxExemptionType,
} from '../../common/enums/tax.enums';
import { DateUtils } from '../../common/utils/date.utils';

// Mock interfaces for test models
interface MockModel {
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  updateOne: jest.Mock;
  deleteOne: jest.Mock;
  exec: jest.Mock;
  countDocuments: jest.Mock;
  insertMany: jest.Mock;
  updateMany: jest.Mock;
  deleteMany: jest.Mock;
  constructor?: jest.Mock;
}

interface MockTaxCalculationInstance {
  save: jest.Mock;
  [key: string]: unknown;
}

type MockTaxCalculationConstructor = jest.Mock<
  MockTaxCalculationInstance,
  [Record<string, unknown>]
> &
  MockModel;

describe('TaxCalculationService', () => {
  let service: TaxCalculationService;
  let mockJurisdictionModel: MockModel;
  let mockTaxRateModel: MockModel;
  let mockTaxCalculationModel: MockTaxCalculationConstructor;

  beforeEach(async () => {
    const mockModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      exec: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
      insertMany: jest.fn(),
      updateMany: jest.fn(),
      updateOne: jest.fn(),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
    };

    mockJurisdictionModel = { ...mockModel } as MockModel;
    mockTaxRateModel = { ...mockModel } as MockModel;

    // Create a proper mock constructor for TaxCalculation model
    const MockTaxCalculationModel = jest
      .fn()
      .mockImplementation((data: Record<string, unknown>) => {
        const instance: MockTaxCalculationInstance = {
          save: jest.fn(),
          ...data,
        };
        instance.save = jest.fn().mockResolvedValue(instance);
        return instance;
      }) as MockTaxCalculationConstructor;

    // Add static methods to the constructor
    Object.assign(MockTaxCalculationModel, mockModel);

    mockTaxCalculationModel = MockTaxCalculationModel;

    // Set default mock behavior for jurisdiction model
    // Will be overridden for specific tests that need different behavior
    const defaultJurisdiction = {
      _id: 'jurisdiction123',
      name: 'San Francisco',
      code: 'US-CA-SF',
      country: 'US',
      state: 'California',
      city: 'San Francisco',
    };

    const defaultTaxRate = {
      _id: 'taxrate123',
      jurisdictionId: 'jurisdiction123',
      type: TaxType.CITY_TAX,
      name: 'SF City Tax',
      calculationMethod: TaxCalculationMethod.PERCENTAGE,
      rate: 5.0,
      applicability: TaxApplicability.GUEST_PAID,
      status: TaxStatus.ACTIVE,
      priority: 1,
    };

    // Mock find to always return a proper query object with exec method
    mockJurisdictionModel.find = jest.fn().mockImplementation((query: Record<string, unknown>) => {
      // Check if this is the QueryBuilder query for San Francisco
      const isSanFrancisco =
        query &&
        query.status === TaxStatus.ACTIVE &&
        query.country === 'US' &&
        query.state === 'California' &&
        query.city === 'San Francisco';

      return {
        exec: jest.fn().mockResolvedValue(isSanFrancisco ? [defaultJurisdiction] : []),
      };
    });

    // Set default mock behavior for tax rate model
    mockTaxRateModel.find.mockImplementation(() => ({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([defaultTaxRate]),
      }),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxCalculationService,
        {
          provide: getModelToken(TaxJurisdiction.name),
          useValue: mockJurisdictionModel,
        },
        {
          provide: getModelToken(TaxRate.name),
          useValue: mockTaxRateModel,
        },
        {
          provide: getModelToken(TaxCalculation.name),
          useValue: MockTaxCalculationModel,
        },
      ],
    }).compile();

    service = module.get<TaxCalculationService>(TaxCalculationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateTaxes', () => {
    it('should return zero taxes when no applicable tax rates found', async () => {
      const request = {
        propertyId: 'property123',
        guestId: 'guest123',
        hostId: 'host123',
        checkInDate: DateUtils.create('2024-06-01'),
        checkOutDate: DateUtils.create('2024-06-03'),
        numberOfGuests: 2,
        subtotalAmount: 200,
        currency: 'USD',
        propertyLocation: {
          address: '123 Test St',
          city: 'Test City',
          country: 'US',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
      };

      // Mock no jurisdictions found for this specific test
      mockJurisdictionModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.calculateTaxes(request);

      expect(result.totalTaxAmount).toBe(0);
      expect(result.totalAmount).toBe(200);
      expect(result.taxBreakdown).toHaveLength(0);
    });

    it('should calculate taxes with applicable tax rates', async () => {
      const request = {
        propertyId: 'property123',
        guestId: 'guest123',
        hostId: 'host123',
        checkInDate: DateUtils.create('2024-06-01'),
        checkOutDate: DateUtils.create('2024-06-03'),
        numberOfGuests: 2,
        subtotalAmount: 200,
        currency: 'USD',
        propertyLocation: {
          address: '123 Test St',
          city: 'San Francisco',
          state: 'California',
          country: 'US',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
      };

      const mockTaxRate = {
        _id: 'taxrate123',
        jurisdictionId: 'jurisdiction123',
        type: TaxType.CITY_TAX,
        name: 'SF City Tax',
        calculationMethod: TaxCalculationMethod.PERCENTAGE,
        rate: 5.0,
        applicability: TaxApplicability.GUEST_PAID,
        status: TaxStatus.ACTIVE,
        priority: 1,
      };

      // Mock jurisdictions found for this specific test

      // Mock tax rates found
      mockTaxRateModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockTaxRate]),
        }),
      });

      const result = await service.calculateTaxes(request);

      expect(result.totalTaxAmount).toBe(10); // 5% of 200
      expect(result.totalAmount).toBe(210);
      expect(result.taxBreakdown).toHaveLength(1);
      expect(result.taxBreakdown[0].taxType).toBe(TaxType.CITY_TAX);
      expect(result.taxBreakdown[0].taxAmount).toBe(10);
    });

    it('should handle tax exemptions correctly', async () => {
      const request = {
        propertyId: 'property123',
        guestId: 'guest123',
        hostId: 'host123',
        checkInDate: DateUtils.create('2024-06-01'),
        checkOutDate: DateUtils.create('2024-07-15'), // 45 days - long term stay
        numberOfGuests: 2,
        subtotalAmount: 2000,
        currency: 'USD',
        propertyLocation: {
          address: '123 Test St',
          city: 'San Francisco',
          state: 'California',
          country: 'US',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
        exemptionDetails: {
          exemptionType: TaxExemptionType.LONG_TERM_STAY,
        },
      };

      const mockTaxRate = {
        _id: 'taxrate123',
        jurisdictionId: 'jurisdiction123',
        type: TaxType.TOURISM_TAX,
        name: 'SF Tourism Tax',
        calculationMethod: TaxCalculationMethod.PERCENTAGE,
        rate: 3.0,
        applicability: TaxApplicability.GUEST_PAID,
        status: TaxStatus.ACTIVE,
        priority: 1,
      };

      // Mock jurisdictions and tax rates found for exemption test
      mockTaxRateModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockTaxRate]),
        }),
      });

      const result = await service.calculateTaxes(request);

      // Should be exempted due to long-term stay
      expect(result.taxBreakdown[0].isExempted).toBe(true);
      expect(result.taxBreakdown[0].taxAmount).toBe(0);
      expect(result.exemptionSummary).toBeDefined();
      expect(result.exemptionSummary?.exemptedTaxes).toContain('tourism_tax');
    });

    it('should validate request parameters', async () => {
      const invalidRequest = {
        propertyId: '',
        guestId: 'guest123',
        hostId: 'host123',
        checkInDate: DateUtils.create('2024-06-01'),
        checkOutDate: DateUtils.create('2024-06-03'),
        numberOfGuests: 2,
        subtotalAmount: 200,
        currency: 'USD',
        propertyLocation: {
          address: '123 Test St',
          city: 'Test City',
          country: 'US',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
      };

      await expect(service.calculateTaxes(invalidRequest)).rejects.toThrow(
        'Property ID, Guest ID, and Host ID are required',
      );
    });
  });

  describe('saveTaxCalculation', () => {
    it('should save tax calculation successfully', async () => {
      const bookingId = '64a2b1c3d4e5f6789abcdef0';
      const request = {
        propertyId: '64a2b1c3d4e5f6789abcdef1',
        guestId: '64a2b1c3d4e5f6789abcdef2',
        hostId: '64a2b1c3d4e5f6789abcdef3',
        checkInDate: DateUtils.create('2024-06-01'),
        checkOutDate: DateUtils.create('2024-06-03'),
        numberOfGuests: 2,
        subtotalAmount: 200,
        currency: 'USD',
        propertyLocation: {
          address: '123 Test St',
          city: 'Test City',
          country: 'US',
          coordinates: { latitude: 37.7749, longitude: -122.4194 },
        },
      };
      const calculation = {
        subtotalAmount: 200,
        totalTaxAmount: 10,
        totalAmount: 210,
        currency: 'USD',
        taxBreakdown: [
          {
            taxRateId: '64a2b1c3d4e5f6789abcdef4',
            jurisdictionId: '64a2b1c3d4e5f6789abcdef5',
            taxType: TaxType.CITY_TAX,
            taxName: 'City Tax',
            applicability: TaxApplicability.GUEST_PAID,
            calculationMethod: TaxCalculationMethod.PERCENTAGE,
            baseAmount: 200,
            rate: 5.0,
            taxAmount: 10,
            isExempted: false,
          },
        ],
      };

      const mockSavedCalculation = {
        _id: 'calculation123',
        bookingId,
        ...request,
        ...calculation,
      };

      const mockInstance = {
        save: jest.fn().mockResolvedValue(mockSavedCalculation),
      };
      mockTaxCalculationModel.mockImplementation(() => mockInstance);

      const result = await service.saveTaxCalculation(bookingId, request, calculation);

      expect(result).toBeDefined();
      expect(mockTaxCalculationModel).toHaveBeenCalled();
    });
  });
});
