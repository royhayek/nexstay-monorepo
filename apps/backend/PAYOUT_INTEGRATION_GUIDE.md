# Host Payout System - Frontend Integration Guide

This comprehensive guide provides everything needed to integrate the Host Payout System APIs with your frontend application.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Frontend Integration Steps](#frontend-integration-steps)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)
8. [Example Code](#example-code)

## Overview

The Host Payout System allows hosts to:

- Manage payout methods (bank accounts, debit cards, wallets)
- Configure automatic payout preferences (frequency, minimum amount)
- View eligible earnings from completed bookings
- Request payouts with different processing speeds
- Track payout history and status
- Receive automated payouts via scheduled processing (daily/weekly/monthly)

Administrators can:

- Manage all payouts across the platform
- View payout statistics and analytics
- Manually create payouts for hosts
- Update payout statuses for administrative purposes

## Authentication

All payout endpoints require authentication with Bearer tokens and appropriate user roles.

### Required Headers

```javascript
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

### User Roles

- **HOST**: Can manage their own payout methods and request payouts
- **ADMIN**: Can manage all payouts and view system-wide analytics

## API Endpoints

### Host Endpoints (`/v1/host/payouts`)

#### 1. Create Payout Method

```http
POST /v1/host/payouts/methods
```

**Request Body:**

```typescript
{
  type: 'bank_account' | 'debit_card' | 'wallet';
  currency: 'USD' | 'EUR' | 'GBP' | 'AED' | string;
  nickname?: string;
  isDefault?: boolean;

  // For bank_account type
  bankAccount?: {
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
    bankName?: string;
    swiftCode?: string;
    iban?: string;
  };

  // For wallet type
  wallet?: {
    walletAddress: string;
    walletType: string;
  };
}
```

**Response:**

```typescript
{
  success: true;
  status: 201;
  title: 'Payout Method Created';
  message: 'Your payout method has been successfully added.';
  data: PayoutMethod;
}
```

#### 2. Get Payout Methods

```http
GET /v1/host/payouts/methods
```

**Response:**

```typescript
{
  success: true;
  status: 200;
  title: "Payout Methods Retrieved";
  message: "Your payout methods have been retrieved successfully.";
  data: PayoutMethod[];
}
```

#### 3. Update Payout Method

```http
PUT /v1/host/payouts/methods/:methodId
```

**Request Body:** Same as create, but all fields optional

#### 4. Delete Payout Method

```http
DELETE /v1/host/payouts/methods/:methodId
```

#### 5. Get Eligible Earnings

```http
GET /v1/host/payouts/eligible-earnings
```

**Response:**

```typescript
{
  success: true;
  status: 200;
  title: 'Eligible Earnings Retrieved';
  message: 'Your eligible earnings have been calculated successfully.';
  data: {
    totalEarnings: number;
    currency: string;
    bookingsCount: number;
    bookings: Array<{
      bookingId: string;
      propertyName: string;
      totalAmount: number;
      hostEarning: number;
      checkOutDate: Date;
      guestName: string;
    }>;
  }
}
```

#### 6. Request Payout

```http
POST /v1/host/payouts
```

**Request Body:**

```typescript
{
  payoutMethodId: string;
  type: 'instant' | 'standard' | 'manual';
  amount?: number; // Optional, defaults to all eligible earnings
  description?: string;
}
```

#### 7. Get Payout History

```http
GET /v1/host/payouts?page=1&limit=10&status=completed&fromDate=2024-01-01&toDate=2024-12-31
```

**Query Parameters:**

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `status` (PayoutStatus, optional): Filter by status
- `fromDate` (string, optional): Filter from date (ISO string)
- `toDate` (string, optional): Filter to date (ISO string)

#### 8. Get Payout Details

```http
GET /v1/host/payouts/:payoutId
```

#### 9. Get Payout Preferences

```http
GET /v1/host/payouts/preferences
```

**Response:**

```typescript
{
  success: true;
  status: 200;
  title: "Payout Preferences Retrieved";
  message: "Your payout preferences have been retrieved successfully.";
  data: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
    minimumAmount: number;
    preferredMethodId?: string;
    autoPayoutEnabled: boolean;
    lastAutoPayoutDate?: Date;
    nextScheduledPayout?: Date;
  };
}
```

#### 10. Update Payout Preferences

```http
PUT /v1/host/payouts/preferences
```

**Request Body:**

```typescript
{
  frequency?: 'daily' | 'weekly' | 'monthly' | 'manual';
  minimumAmount?: number;
  preferredMethodId?: string;
  autoPayoutEnabled?: boolean;
}
```

### Admin Endpoints (`/v1/admin/payouts`)

#### 1. Get All Payouts

```http
GET /v1/admin/payouts?page=1&limit=10&status=pending&hostId=123&fromDate=2024-01-01
```

#### 2. Get Host Payouts

```http
GET /v1/admin/payouts/host/:hostId?page=1&limit=10
```

#### 3. Get Payout Details

```http
GET /v1/admin/payouts/:payoutId
```

#### 4. Get Host Eligible Earnings

```http
GET /v1/admin/payouts/host/:hostId/eligible-earnings
```

#### 5. Create Host Payout

```http
POST /v1/admin/payouts/host/:hostId
```

#### 6. Update Payout Status

```http
PUT /v1/admin/payouts/:payoutId/status
```

**Request Body:**

```typescript
{
  status: 'pending' | 'processing' | 'in_transit' | 'completed' | 'failed' | 'cancelled' | 'returned';
  reason?: string;
}
```

#### 7. Get Payout Statistics

```http
GET /v1/admin/payouts/statistics/summary?fromDate=2024-01-01&toDate=2024-12-31
```

### Automated Payouts

The system includes automated payout processing that runs daily at 1:00 AM UTC via a cron job. The automation:

- Processes payouts for hosts with `autoPayoutEnabled: true`
- Respects frequency settings (daily, weekly, monthly)
- Enforces minimum amount thresholds
- Maintains a hold period for completed bookings (configurable via admin settings)
- Automatically creates payouts when conditions are met
- Handles error scenarios gracefully with detailed logging

#### Dynamic Configuration Keys

Admins can configure automated payout behavior through the dynamic configuration system:

| Key                                | Description                            | Default  |
| ---------------------------------- | -------------------------------------- | -------- |
| `AUTO_PAYOUT_ENABLED`              | Enable automatic payout processing     | `true`   |
| `AUTO_PAYOUT_DEFAULT_FREQUENCY`    | Default payout frequency for new hosts | `weekly` |
| `AUTO_PAYOUT_DEFAULT_MINIMUM`      | Default minimum amount for payouts     | `100`    |
| `AUTO_PAYOUT_HOLD_PERIOD_DAYS`     | Days to hold earnings after checkout   | `7`      |
| `AUTO_PAYOUT_MAX_DAILY_PROCESSING` | Max hosts processed per day            | `1000`   |

## Data Models

### PayoutMethod

```typescript
interface PayoutMethod {
  id: string;
  type: 'bank_account' | 'debit_card' | 'wallet';
  status: 'pending' | 'verified' | 'rejected' | 'suspended';
  currency: string;
  nickname?: string;
  isDefault: boolean;
  bankAccount?: {
    accountNumber: string; // Masked in response
    routingNumber: string;
    accountHolderName: string;
    bankName?: string;
  };
  wallet?: {
    walletAddress: string; // Masked in response
    walletType: string;
  };
  verifiedAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Payout

```typescript
interface Payout {
  id: string;
  hostId: string;
  payoutMethodId: string;
  type: 'instant' | 'standard' | 'manual' | 'emergency';
  status:
    | 'pending'
    | 'processing'
    | 'in_transit'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'returned';
  grossAmount: {
    amount: number;
    currency: string;
  };
  fees: {
    platformFee: number;
    processingFee: number;
    withdrawalFee: number;
    taxWithholding: number;
    totalFees: number;
  };
  netAmount: {
    amount: number;
    currency: string;
  };
  bookings: Array<{
    bookingId: string;
    bookingAmount: number;
    hostEarning: number;
    checkOutDate: Date;
    propertyName: string;
  }>;
  provider: 'aps' | 'bank_transfer' | 'manual';
  providerPayoutId?: string;
  payoutDate: Date;
  expectedArrival?: Date;
  completedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  failureCode?: string;
  reference: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### PayoutPreferences

```typescript
interface PayoutPreferences {
  frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
  minimumAmount: number;
  preferredMethodId?: string;
  autoPayoutEnabled: boolean;
  lastAutoPayoutDate?: Date;
  nextScheduledPayout?: Date;
}
```

### PaginatedResponse

```typescript
interface PaginatedPayoutsResponse {
  payouts: Payout[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
```

## Frontend Integration Steps

### 1. Setup API Client

```typescript
class PayoutApiClient {
  private baseURL: string;
  private authToken: string;

  constructor(baseURL: string, authToken: string) {
    this.baseURL = baseURL;
    this.authToken = authToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Payout method methods
  async createPayoutMethod(data: CreatePayoutMethodRequest): Promise<PayoutMethod> {
    const response = await this.request<PayoutMethod>('/v1/host/payouts/methods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getPayoutMethods(): Promise<PayoutMethod[]> {
    const response = await this.request<PayoutMethod[]>('/v1/host/payouts/methods');
    return response.data;
  }

  async updatePayoutMethod(
    methodId: string,
    data: UpdatePayoutMethodRequest,
  ): Promise<PayoutMethod> {
    const response = await this.request<PayoutMethod>(`/v1/host/payouts/methods/${methodId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deletePayoutMethod(methodId: string): Promise<void> {
    await this.request(`/v1/host/payouts/methods/${methodId}`, {
      method: 'DELETE',
    });
  }

  // Earnings and payout methods
  async getEligibleEarnings(): Promise<EligibleEarnings> {
    const response = await this.request<EligibleEarnings>('/v1/host/payouts/eligible-earnings');
    return response.data;
  }

  async requestPayout(data: CreatePayoutRequest): Promise<Payout> {
    const response = await this.request<Payout>('/v1/host/payouts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async getPayoutHistory(filters: PayoutFilters = {}): Promise<PaginatedPayoutsResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, String(value));
    });

    const response = await this.request<PaginatedPayoutsResponse>(
      `/v1/host/payouts?${queryParams.toString()}`,
    );
    return response.data;
  }

  async getPayoutDetails(payoutId: string): Promise<Payout> {
    const response = await this.request<Payout>(`/v1/host/payouts/${payoutId}`);
    return response.data;
  }

  // Payout preferences methods
  async getPayoutPreferences(): Promise<PayoutPreferences> {
    const response = await this.request<PayoutPreferences>('/v1/host/payouts/preferences');
    return response.data;
  }

  async updatePayoutPreferences(data: Partial<PayoutPreferences>): Promise<PayoutPreferences> {
    const response = await this.request<PayoutPreferences>('/v1/host/payouts/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }
}
```

### 2. React Hooks for Payout Management

```typescript
// hooks/usePayout.ts
import { useState, useEffect, useCallback } from 'react';
import { PayoutApiClient } from '../api/payoutClient';

export const usePayout = (apiClient: PayoutApiClient) => {
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [eligibleEarnings, setEligibleEarnings] = useState<EligibleEarnings | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PaginatedPayoutsResponse | null>(null);
  const [payoutPreferences, setPayoutPreferences] = useState<PayoutPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayoutMethods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const methods = await apiClient.getPayoutMethods();
      setPayoutMethods(methods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payout methods');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const fetchEligibleEarnings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const earnings = await apiClient.getEligibleEarnings();
      setEligibleEarnings(earnings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch eligible earnings');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const createPayoutMethod = useCallback(
    async (data: CreatePayoutMethodRequest) => {
      setLoading(true);
      setError(null);
      try {
        const newMethod = await apiClient.createPayoutMethod(data);
        setPayoutMethods((prev) => [...prev, newMethod]);
        return newMethod;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create payout method');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient],
  );

  const requestPayout = useCallback(
    async (data: CreatePayoutRequest) => {
      setLoading(true);
      setError(null);
      try {
        const payout = await apiClient.requestPayout(data);
        // Refresh earnings after successful payout request
        await fetchEligibleEarnings();
        return payout;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to request payout');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient, fetchEligibleEarnings],
  );

  const fetchPayoutHistory = useCallback(
    async (filters: PayoutFilters = {}) => {
      setLoading(true);
      setError(null);
      try {
        const history = await apiClient.getPayoutHistory(filters);
        setPayoutHistory(history);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch payout history');
      } finally {
        setLoading(false);
      }
    },
    [apiClient],
  );

  const fetchPayoutPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const preferences = await apiClient.getPayoutPreferences();
      setPayoutPreferences(preferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payout preferences');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  const updatePayoutPreferences = useCallback(
    async (data: Partial<PayoutPreferences>) => {
      setLoading(true);
      setError(null);
      try {
        const preferences = await apiClient.updatePayoutPreferences(data);
        setPayoutPreferences(preferences);
        return preferences;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update payout preferences');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiClient],
  );

  return {
    payoutMethods,
    eligibleEarnings,
    payoutHistory,
    payoutPreferences,
    loading,
    error,
    fetchPayoutMethods,
    fetchEligibleEarnings,
    createPayoutMethod,
    requestPayout,
    fetchPayoutHistory,
    fetchPayoutPreferences,
    updatePayoutPreferences,
  };
};
```

### 3. React Components Examples

```typescript
// components/PayoutMethodForm.tsx
import React, { useState } from 'react';

interface PayoutMethodFormProps {
  onSubmit: (data: CreatePayoutMethodRequest) => Promise<void>;
  loading: boolean;
}

export const PayoutMethodForm: React.FC<PayoutMethodFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    type: 'bank_account' as const,
    currency: 'USD',
    nickname: '',
    isDefault: false,
    // Bank account fields
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
    bankName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreatePayoutMethodRequest = {
      type: formData.type,
      currency: formData.currency,
      nickname: formData.nickname || undefined,
      isDefault: formData.isDefault,
    };

    if (formData.type === 'bank_account') {
      payload.bankAccount = {
        accountNumber: formData.accountNumber,
        routingNumber: formData.routingNumber,
        accountHolderName: formData.accountHolderName,
        bankName: formData.bankName || undefined,
      };
    }

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Payout Method Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          <option value="bank_account">Bank Account</option>
          <option value="debit_card">Debit Card</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Currency</label>
        <select
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="AED">AED</option>
        </select>
      </div>

      {formData.type === 'bank_account' && (
        <>
          <div>
            <label className="block text-sm font-medium">Account Number</label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Routing Number</label>
            <input
              type="text"
              value={formData.routingNumber}
              onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Account Holder Name</label>
            <input
              type="text"
              value={formData.accountHolderName}
              onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300"
              required
            />
          </div>
        </>
      )}

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isDefault}
            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="ml-2 text-sm">Set as default payout method</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Add Payout Method'}
      </button>
    </form>
  );
};
```

```typescript
// components/EligibleEarnings.tsx
import React from 'react';

interface EligibleEarningsProps {
  earnings: EligibleEarnings;
  onRequestPayout: () => void;
}

export const EligibleEarnings: React.FC<EligibleEarningsProps> = ({
  earnings,
  onRequestPayout
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Available Earnings</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600">Total Earnings</p>
          <p className="text-2xl font-bold text-green-600">
            {earnings.currency} {earnings.totalEarnings.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">From Bookings</p>
          <p className="text-lg font-semibold">{earnings.bookingsCount}</p>
        </div>
      </div>

      {earnings.totalEarnings > 0 && (
        <button
          onClick={onRequestPayout}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Request Payout
        </button>
      )}

      <div className="mt-6">
        <h3 className="font-medium mb-2">Earnings Breakdown</h3>
        <div className="space-y-2">
          {earnings.bookings.map((booking) => (
            <div key={booking.bookingId} className="flex justify-between text-sm">
              <span className="truncate">
                {booking.propertyName} - {booking.guestName}
              </span>
              <span className="font-medium">
                {earnings.currency} {booking.hostEarning.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

```typescript
// components/PayoutHistory.tsx
import React from 'react';

interface PayoutHistoryProps {
  payouts: PaginatedPayoutsResponse;
  onPageChange: (page: number) => void;
}

export const PayoutHistory: React.FC<PayoutHistoryProps> = ({
  payouts,
  onPageChange
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Payout History</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Provider
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payouts.payouts.map((payout) => (
              <tr key={payout.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {payout.reference}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {payout.netAmount.currency} {payout.netAmount.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payout.status)}`}>
                    {payout.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(payout.payoutDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {payout.provider}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          Showing {((payouts.page - 1) * payouts.limit) + 1} to{' '}
          {Math.min(payouts.page * payouts.limit, payouts.total)} of {payouts.total} results
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onPageChange(payouts.page - 1)}
            disabled={!payouts.hasPrevPage}
            className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(payouts.page + 1)}
            disabled={!payouts.hasNextPage}
            className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
```

## Error Handling

### Common Error Responses

```typescript
interface ApiError {
  success: false;
  status: number;
  title: string;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

### Error Handling Pattern

```typescript
try {
  const payout = await apiClient.requestPayout(payoutData);
  // Handle success
} catch (error) {
  if (error.status === 400) {
    // Bad request - validation errors
    console.error('Validation errors:', error.errors);
  } else if (error.status === 401) {
    // Unauthorized - redirect to login
    redirectToLogin();
  } else if (error.status === 403) {
    // Forbidden - insufficient permissions
    showErrorMessage('You do not have permission to perform this action');
  } else if (error.status === 404) {
    // Not found
    showErrorMessage('The requested resource was not found');
  } else {
    // Server error
    showErrorMessage('An unexpected error occurred. Please try again later.');
  }
}
```

## Best Practices

### 1. Security

- Always validate user permissions on the frontend
- Mask sensitive information (account numbers, wallet addresses)
- Use HTTPS for all API communications
- Implement proper authentication token management

### 2. UX Considerations

- Show clear payout processing timelines based on payout type
- Display fee breakdowns before payout confirmation
- Provide real-time payout status updates
- Implement progressive disclosure for complex forms

### 3. Performance

- Cache payout methods and eligible earnings data appropriately
- Implement pagination for payout history
- Use optimistic updates where appropriate
- Debounce search and filter operations

### 4. Data Management

- Refresh earnings data after successful payouts
- Update payout status in real-time using WebSocket connections
- Implement offline support for viewing historical data
- Cache frequently accessed data

### 5. Error Recovery

- Implement retry logic for failed API calls
- Provide clear error messages with actionable steps
- Allow users to retry failed operations
- Gracefully handle network connectivity issues

## Example Implementation

### Complete Host Payout Dashboard

```typescript
// pages/HostPayoutDashboard.tsx
import React, { useEffect, useState } from 'react';
import { PayoutApiClient } from '../api/payoutClient';
import { usePayout } from '../hooks/usePayout';
import { EligibleEarnings } from '../components/EligibleEarnings';
import { PayoutHistory } from '../components/PayoutHistory';
import { PayoutMethodForm } from '../components/PayoutMethodForm';

export const HostPayoutDashboard: React.FC = () => {
  const apiClient = new PayoutApiClient(process.env.REACT_APP_API_URL!, getAuthToken());
  const {
    payoutMethods,
    eligibleEarnings,
    payoutHistory,
    loading,
    error,
    fetchPayoutMethods,
    fetchEligibleEarnings,
    createPayoutMethod,
    requestPayout,
    fetchPayoutHistory,
  } = usePayout(apiClient);

  const [showAddMethod, setShowAddMethod] = useState(false);
  const [showRequestPayout, setShowRequestPayout] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchPayoutMethods(),
      fetchEligibleEarnings(),
      fetchPayoutHistory({ page: 1, limit: 10 }),
    ]);
  }, [fetchPayoutMethods, fetchEligibleEarnings, fetchPayoutHistory]);

  const handleCreatePayoutMethod = async (data: CreatePayoutMethodRequest) => {
    await createPayoutMethod(data);
    setShowAddMethod(false);
  };

  const handleRequestPayout = async (payoutMethodId: string, amount?: number) => {
    await requestPayout({
      payoutMethodId,
      type: 'standard',
      amount,
    });
    setShowRequestPayout(false);
    // Refresh data
    await Promise.all([
      fetchEligibleEarnings(),
      fetchPayoutHistory({ page: 1, limit: 10 }),
    ]);
  };

  if (loading && !eligibleEarnings) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Payout Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Eligible Earnings */}
        {eligibleEarnings && (
          <EligibleEarnings
            earnings={eligibleEarnings}
            onRequestPayout={() => setShowRequestPayout(true)}
          />
        )}

        {/* Payout Methods */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Payout Methods</h2>
            <button
              onClick={() => setShowAddMethod(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add Method
            </button>
          </div>

          <div className="space-y-3">
            {payoutMethods.map((method) => (
              <div key={method.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {method.type.replace('_', ' ').toUpperCase()}
                      {method.isDefault && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Default</span>}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    method.status === 'verified' ? 'bg-green-100 text-green-800' :
                    method.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {method.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payout History */}
      {payoutHistory && (
        <PayoutHistory
          payouts={payoutHistory}
          onPageChange={(page) => fetchPayoutHistory({ page, limit: 10 })}
        />
      )}

      {/* Modals */}
      {showAddMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Payout Method</h2>
              <button
                onClick={() => setShowAddMethod(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <PayoutMethodForm
              onSubmit={handleCreatePayoutMethod}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Request Payout Modal would go here */}
    </div>
  );
};
```

This comprehensive guide provides everything needed to successfully integrate the Host Payout System with your frontend application. The examples demonstrate best practices for API integration, error handling, and user experience design.
