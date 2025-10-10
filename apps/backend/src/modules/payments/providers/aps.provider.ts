import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import {
  PaymentProviderInterface,
  CreatePaymentIntentRequest,
  PaymentIntent,
  PaymentTransaction,
  CreateCustomerRequest,
  PaymentCustomer,
  PaymentMethod,
} from '../../../common/interfaces/payment.interfaces';
import {
  PaymentProvider,
  PaymentIntentStatus,
  PaymentTransactionStatus,
  CurrencyCode,
} from '../../../common/enums/payment.enums';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { DateUtils } from '../../../common/utils/date.utils';

// APS API Response interfaces
interface APSResponse {
  response_code: string;
  response_message: string;
  fort_id: string;
  status: string;
  amount: string;
  currency: string;
}

interface APSConfig {
  merchantIdentifier: string;
  accessCode: string;
  shaRequestPhrase: string;
  shaResponsePhrase: string;
  sandbox: boolean;
  apiUrl: string;
}

@Injectable()
export class APSProvider implements PaymentProviderInterface {
  private readonly httpClient: AxiosInstance;
  private readonly config: APSConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      merchantIdentifier: this.configService.get<string>('APS_MERCHANT_IDENTIFIER')!,
      accessCode: this.configService.get<string>('APS_ACCESS_CODE')!,
      shaRequestPhrase: this.configService.get<string>('APS_SHA_REQUEST_PHRASE')!,
      shaResponsePhrase: this.configService.get<string>('APS_SHA_RESPONSE_PHRASE')!,
      sandbox: this.configService.get<boolean>('APS_SANDBOX', true),
      apiUrl: this.configService.get<string>(
        'APS_API_URL',
        'https://sbcheckout.payfort.com/FortAPI/paymentApi',
      ),
    };

    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntent> {
    try {
      const merchantReference = this.generateMerchantReference();

      // Use mock responses in development/sandbox mode
      if (this.config.sandbox || process.env.NODE_ENV === 'development') {
        LoggingUtil.log('Using mock APS response in development mode', 'APSProvider');
        return this.createMockPaymentIntent(request, merchantReference);
      }

      const requestData = {
        command: 'AUTHORIZATION',
        access_code: this.config.accessCode,
        merchant_identifier: this.config.merchantIdentifier,
        merchant_reference: merchantReference,
        amount: (request.amount.amount * 100).toString(), // Convert to smallest currency unit
        currency: request.amount.currency,
        language: 'en',
        customer_email: (request.metadata?.email as string) || '',
        return_url: request.returnUrl || '',
      };

      // Generate signature
      requestData['signature'] = this.generateSignature(requestData, this.config.shaRequestPhrase);

      const response = await this.httpClient.post<APSResponse>(this.config.apiUrl, requestData);

      if (response.data.response_code !== '20000') {
        throw new Error(`APS Error: ${response.data.response_message}`);
      }

      return {
        id: merchantReference,
        amount: request.amount,
        status: PaymentIntentStatus.REQUIRES_PAYMENT_METHOD,
        provider: PaymentProvider.APS,
        metadata: request.metadata,
        clientSecret: response.data.fort_id,
        providerIntentId: response.data.fort_id,
        createdAt: DateUtils.now(),
        updatedAt: DateUtils.now(),
      };
    } catch (error) {
      LoggingUtil.errorWithException('Failed to create APS payment intent', error, 'APSProvider');
      throw error;
    }
  }

  async confirmPaymentIntent(
    intentId: string,
    _paymentMethodId?: string,
    actualIntent?: PaymentIntent,
  ): Promise<PaymentIntent> {
    try {
      // Use mock responses in development/sandbox mode
      if (this.config.sandbox || process.env.NODE_ENV === 'development') {
        LoggingUtil.log('Using mock APS confirm response in development mode', 'APSProvider');
        return this.createMockConfirmPaymentIntent(intentId, actualIntent);
      }

      const requestData = {
        command: 'CAPTURE',
        access_code: this.config.accessCode,
        merchant_identifier: this.config.merchantIdentifier,
        fort_id: intentId,
        language: 'en',
      };

      requestData['signature'] = this.generateSignature(requestData, this.config.shaRequestPhrase);

      const response = await this.httpClient.post<APSResponse>(this.config.apiUrl, requestData);

      const status = this.mapAPSStatusToIntentStatus(response.data.status);

      return {
        id: intentId,
        amount: {
          amount: parseInt(response.data.amount) / 100,
          currency: response.data.currency as CurrencyCode,
        },
        status,
        provider: PaymentProvider.APS,
        providerIntentId: response.data.fort_id,
        createdAt: DateUtils.now(),
        updatedAt: DateUtils.now(),
      };
    } catch (error) {
      LoggingUtil.errorWithException('Failed to confirm APS payment intent', error, 'APSProvider');
      throw error;
    }
  }

  async cancelPaymentIntent(intentId: string): Promise<PaymentIntent> {
    try {
      const requestData = {
        command: 'VOID_AUTHORIZATION',
        access_code: this.config.accessCode,
        merchant_identifier: this.config.merchantIdentifier,
        fort_id: intentId,
        language: 'en',
      };

      requestData['signature'] = this.generateSignature(requestData, this.config.shaRequestPhrase);

      const response = await this.httpClient.post<APSResponse>(this.config.apiUrl, requestData);

      return {
        id: intentId,
        amount: {
          amount: parseInt(response.data.amount) / 100,
          currency: response.data.currency as CurrencyCode,
        },
        status: PaymentIntentStatus.CANCELLED,
        provider: PaymentProvider.APS,
        providerIntentId: response.data.fort_id,
        createdAt: DateUtils.now(),
        updatedAt: DateUtils.now(),
      };
    } catch (error) {
      LoggingUtil.errorWithException('Failed to cancel APS payment intent', error, 'APSProvider');
      throw error;
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<PaymentTransaction> {
    try {
      const requestData = {
        command: 'REFUND',
        access_code: this.config.accessCode,
        merchant_identifier: this.config.merchantIdentifier,
        fort_id: transactionId,
        language: 'en',
      };

      if (amount) {
        requestData['amount'] = (amount * 100).toString();
      }

      requestData['signature'] = this.generateSignature(requestData, this.config.shaRequestPhrase);

      const response = await this.httpClient.post<APSResponse>(this.config.apiUrl, requestData);

      return {
        id: this.generateTransactionId(),
        paymentIntentId: transactionId,
        amount: {
          amount: parseInt(response.data.amount) / 100,
          currency: response.data.currency as CurrencyCode,
        },
        status: PaymentTransactionStatus.REFUNDED,
        provider: PaymentProvider.APS,
        providerTransactionId: response.data.fort_id,
        providerResponse: response.data,
        createdAt: DateUtils.now(),
        updatedAt: DateUtils.now(),
      };
    } catch (error) {
      LoggingUtil.errorWithException('Failed to refund APS payment', error, 'APSProvider');
      throw error;
    }
  }

  getPaymentIntent(_intentId: string): Promise<PaymentIntent> {
    // APS doesn't provide a direct GET endpoint for payment intents
    // This would need to be implemented using stored data
    return Promise.reject(new Error('Method not implemented for APS provider'));
  }

  getTransaction(_transactionId: string): Promise<PaymentTransaction> {
    // APS doesn't provide a direct GET endpoint for transactions
    // This would need to be implemented using stored data
    return Promise.reject(new Error('Method not implemented for APS provider'));
  }

  createCustomer(customerData: CreateCustomerRequest): Promise<PaymentCustomer> {
    // APS doesn't have a separate customer creation endpoint
    // Customer information is included in payment requests
    return Promise.resolve({
      id: this.generateCustomerId(),
      email: customerData.email,
      name: customerData.name,
      phone: customerData.phone,
      provider: PaymentProvider.APS,
      providerCustomerId: customerData.email, // Use email as identifier
      metadata: customerData.metadata,
      createdAt: DateUtils.now(),
      updatedAt: DateUtils.now(),
    });
  }

  attachPaymentMethod(_customerId: string, _paymentMethodId: string): Promise<PaymentMethod> {
    // APS handles payment methods differently
    return Promise.reject(new Error('Method not implemented for APS provider'));
  }

  detachPaymentMethod(_paymentMethodId: string): Promise<void> {
    // APS handles payment methods differently
    return Promise.reject(new Error('Method not implemented for APS provider'));
  }

  listCustomerPaymentMethods(_customerId: string): Promise<PaymentMethod[]> {
    // APS handles payment methods differently
    return Promise.resolve([]);
  }

  private generateSignature(
    data: Record<string, string | number | boolean>,
    shaPhrase: string,
  ): string {
    // Sort parameters alphabetically and build signature string
    const sortedKeys = Object.keys(data).sort();
    let signatureString = shaPhrase;

    for (const key of sortedKeys) {
      const value = data[key];
      if (value != null && key !== 'signature') {
        signatureString += `${key}=${String(value)}`;
      }
    }

    signatureString += shaPhrase;

    return crypto.createHash('sha256').update(signatureString).digest('hex');
  }

  private validateSignature(
    data: Record<string, string | number | boolean>,
    signature: string,
  ): boolean {
    const calculatedSignature = this.generateSignature(data, this.config.shaResponsePhrase);
    return calculatedSignature === signature;
  }

  private mapAPSStatusToIntentStatus(apsStatus: string): PaymentIntentStatus {
    switch (apsStatus) {
      case '02':
      case '14':
        return PaymentIntentStatus.SUCCEEDED;
      case '01':
      case '03':
        return PaymentIntentStatus.PROCESSING;
      case '04':
      case '05':
      case '06':
      case '07':
      case '08':
      case '09':
      case '10':
      case '11':
      case '12':
      case '13':
        return PaymentIntentStatus.REQUIRES_ACTION;
      default:
        return PaymentIntentStatus.REQUIRES_PAYMENT_METHOD;
    }
  }

  private mapAPSStatusToTransactionStatus(apsStatus: string): PaymentTransactionStatus {
    switch (apsStatus) {
      case '02':
      case '14':
        return PaymentTransactionStatus.SUCCESS;
      case '01':
      case '03':
        return PaymentTransactionStatus.PROCESSING;
      default:
        return PaymentTransactionStatus.FAILED;
    }
  }

  private generateMerchantReference(): string {
    return `APS_${DateUtils.nowTimestamp()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateTransactionId(): string {
    return `txn_${DateUtils.nowTimestamp()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateCustomerId(): string {
    return `cus_${DateUtils.nowTimestamp()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Mock methods for development/sandbox mode
  private createMockPaymentIntent(
    request: CreatePaymentIntentRequest,
    merchantReference: string,
  ): PaymentIntent {
    const mockFortId = `mock_${merchantReference}`;

    return {
      id: merchantReference,
      amount: request.amount,
      status: PaymentIntentStatus.REQUIRES_PAYMENT_METHOD,
      provider: PaymentProvider.APS,
      metadata: request.metadata,
      clientSecret: mockFortId,
      providerIntentId: mockFortId,
      createdAt: DateUtils.now(),
      updatedAt: DateUtils.now(),
    };
  }

  private createMockConfirmPaymentIntent(
    intentId: string,
    actualIntent?: PaymentIntent,
  ): PaymentIntent {
    // Use actual payment intent data if available, otherwise use defaults
    const amount = actualIntent?.amount || {
      amount: 395.0, // Fallback amount only if no actual intent provided
      currency: CurrencyCode.USD,
    };

    return {
      id: intentId,
      amount: amount, // Use actual booking amount
      status: PaymentIntentStatus.SUCCEEDED,
      provider: PaymentProvider.APS,
      providerIntentId: intentId,
      metadata: actualIntent?.metadata, // Use actual booking metadata
      createdAt: actualIntent?.createdAt || DateUtils.now(),
      updatedAt: DateUtils.now(),
    };
  }
}
