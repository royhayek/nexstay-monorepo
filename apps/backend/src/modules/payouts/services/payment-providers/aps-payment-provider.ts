import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../../common/utils/date.utils';
import { ConfigService } from '@nestjs/config';
import { BasePaymentProvider } from './base-payment-provider';
import { LoggingUtil } from '../../../../common/utils/logging.util';
import { PayoutStatus, PayoutMethodType } from '../../../../common/enums/payout.enums';
import type {
  PaymentResult,
  PayoutMethodData,
  PopulatedPayoutDocument,
  MockApsTransferResponse,
  MockApsStatusResponse,
} from '../../interfaces';
import {
  PAYOUT_PROVIDER_CONSTANTS,
  PAYOUT_TIME_CONSTANTS,
  PAYOUT_CONFIG_KEYS,
} from '../../constants/payout.constants';

/**
 * Amazon Payment Services (APS) payment provider implementation
 */
@Injectable()
export class ApsPaymentProvider extends BasePaymentProvider {
  readonly name = 'aps';
  readonly supportedMethods = [PayoutMethodType.BANK_ACCOUNT, PayoutMethodType.WALLET];

  constructor(private configService: ConfigService) {
    super({
      apiKey: configService.get<string>(PAYOUT_CONFIG_KEYS.APS_ACCESS_CODE, ''),
      apiSecret: configService.get<string>(PAYOUT_CONFIG_KEYS.APS_SHA_REQUEST_PHRASE, ''),
      environment: configService.get<'sandbox' | 'production'>(
        PAYOUT_CONFIG_KEYS.APS_ENVIRONMENT,
        'sandbox',
      ),
      webhookUrl: configService.get<string>(PAYOUT_CONFIG_KEYS.APS_WEBHOOK_URL, ''),
      timeout: PAYOUT_PROVIDER_CONSTANTS.APS.TIMEOUT,
      retryAttempts: PAYOUT_PROVIDER_CONSTANTS.APS.MAX_RETRIES,
    });
  }

  /**
   * Process payout via APS
   */
  async processPayout(payout: PopulatedPayoutDocument): Promise<PaymentResult> {
    try {
      this.validatePayout(payout);

      if (!this.isConfigured()) {
        throw new Error('APS provider not properly configured');
      }

      // Mock implementation for development - integrate with APS SDK for production
      const mockResponse = await this.mockApsTransfer(payout);

      this.logSuccess('APS payout', {
        payoutId: payout._id,
        amount: payout.netAmount.amount,
        currency: payout.netAmount.currency,
        merchantReference: mockResponse.merchant_reference,
      });

      return {
        success: true,
        status: PayoutStatus.IN_TRANSIT,
        externalTransactionId: mockResponse.fort_id,
        providerTransactionId: mockResponse.merchant_reference,
        estimatedArrival: DateUtils.create(
          DateUtils.nowTimestamp() +
            PAYOUT_TIME_CONSTANTS.STANDARD_ARRIVAL_DAYS *
              PAYOUT_TIME_CONSTANTS.MILLISECONDS_PER_DAY,
        ),
        providerResponse: mockResponse,
      };
    } catch (error) {
      const err = error instanceof Error ? error : { message: String(error) };
      return this.handleError(err, 'APS payout processing');
    }
  }

  /**
   * Check payout status from APS
   */
  async checkPayoutStatus(externalTransactionId: string): Promise<PaymentResult> {
    try {
      // Mock implementation for development - integrate with APS SDK for production
      const mockStatus = await this.mockApsStatusCheck(externalTransactionId);

      const status = this.mapApsStatusToPayoutStatus(mockStatus.response_code);

      return {
        success: true,
        status,
        externalTransactionId,
        providerTransactionId: mockStatus.merchant_reference,
        providerResponse: mockStatus,
      };
    } catch (error) {
      const err = error instanceof Error ? error : { message: String(error) };
      return this.handleError(err, 'APS status check');
    }
  }

  /**
   * Cancel pending payout
   */
  async cancelPayout(externalTransactionId: string): Promise<boolean> {
    try {
      // Mock implementation for development - integrate with APS SDK for production
      await this.mockApsCancelTransfer(externalTransactionId);

      this.logSuccess('APS payout cancellation', {
        fortId: externalTransactionId,
      });

      return true;
    } catch (error) {
      LoggingUtil.errorWithException(
        'APS payout cancellation failed:',
        error,
        'ApsPaymentProvider',
      );
      return false;
    }
  }

  /**
   * Validate payout method for APS
   */
  validatePayoutMethod(payoutMethod: PayoutMethodData): Promise<boolean> {
    return Promise.resolve(
      (() => {
        try {
          if (!payoutMethod?.type) {
            return false;
          }

          switch (payoutMethod.type) {
            case PayoutMethodType.BANK_ACCOUNT:
              return this.validateBankAccount(payoutMethod);
            case PayoutMethodType.WALLET:
              return this.validateDigitalWallet(payoutMethod);
            default:
              return false;
          }
        } catch (error) {
          LoggingUtil.errorWithException(
            'APS payout method validation failed:',
            error,
            'ApsPaymentProvider',
          );
          return false;
        }
      })(),
    );
  }

  /**
   * Get supported currencies for APS
   */
  getSupportedCurrencies(): string[] {
    return [...PAYOUT_PROVIDER_CONSTANTS.APS.SUPPORTED_CURRENCIES];
  }

  /**
   * Calculate APS fees
   */
  calculateProviderFees(amount: number, currency: string, _method: string): number {
    // APS standard payout fees (varies by region and method)
    const baseFee =
      currency === 'AED'
        ? PAYOUT_PROVIDER_CONSTANTS.APS.BASE_FEES.AED
        : PAYOUT_PROVIDER_CONSTANTS.APS.BASE_FEES.DEFAULT;
    const percentageFee = 0.029; // 2.9% standard rate

    return baseFee + amount * percentageFee;
  }

  /**
   * Check if provider is properly configured (override for APS specific requirements)
   */
  isConfigured(): boolean {
    return !!(
      this.config &&
      this.config.apiKey &&
      this.config.apiSecret &&
      this.config.environment
    );
  }

  /**
   * Mock APS transfer creation (replace with actual APS SDK)
   */
  private async mockApsTransfer(payout: PopulatedPayoutDocument): Promise<MockApsTransferResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

    return {
      response_code: '20000',
      response_message: 'Success',
      fort_id: `ft_${DateUtils.nowTimestamp().toString(36)}${Math.random().toString(36).substring(2, 10)}`,
      merchant_reference: `MR_${String(payout._id)}_${DateUtils.nowTimestamp()}`,
      amount: (payout.netAmount.amount * 100).toString(), // APS uses minor units
      currency: payout.netAmount.currency,
      status: '02', // Processing
      payment_option: this.mapPayoutMethodToAps(payout.payoutMethod?.type || ''),
    };
  }

  /**
   * Mock APS status check (replace with actual APS SDK)
   */
  private async mockApsStatusCheck(fortId: string): Promise<MockApsStatusResponse> {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API call

    const responseCodes = ['20000', '40000', '50000']; // Success, Pending, Failed
    const randomCode = responseCodes[Math.floor(Math.random() * responseCodes.length)];

    return {
      response_code: randomCode,
      response_message: this.getApsResponseMessage(randomCode),
      fort_id: fortId,
      merchant_reference: `MR_${DateUtils.nowTimestamp()}`,
      status: randomCode === '20000' ? '14' : randomCode === '40000' ? '02' : '10',
      transaction_status: randomCode === '20000' ? '14' : randomCode === '40000' ? '02' : '10',
      transaction_date: DateUtils.toISO(DateUtils.now()),
      amount: '1000',
      currency: 'USD',
    };
  }

  /**
   * Mock APS transfer cancellation (replace with actual APS SDK)
   */
  private async mockApsCancelTransfer(
    fortId: string,
  ): Promise<{ response_code: string; response_message: string; fort_id: string; status: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

    return {
      response_code: '20000',
      response_message: 'Successfully cancelled',
      fort_id: fortId,
      status: '08', // Cancelled
    };
  }

  /**
   * Map APS response code to internal payout status
   */
  private mapApsStatusToPayoutStatus(responseCode: string): PayoutStatus {
    switch (responseCode) {
      case '20000': // Success
        return PayoutStatus.COMPLETED;
      case '40000': // Processing/Pending
        return PayoutStatus.IN_TRANSIT;
      case '50000': // Failed
      case '60000': // Declined
        return PayoutStatus.FAILED;
      default:
        return PayoutStatus.PROCESSING;
    }
  }

  /**
   * Map payout method type to APS payment option
   */
  private mapPayoutMethodToAps(methodType?: string): string {
    switch (methodType) {
      case PayoutMethodType.BANK_ACCOUNT:
        return 'BANK_TRANSFER';
      case PayoutMethodType.WALLET:
        return 'DIGITAL_WALLET';
      default:
        return 'BANK_TRANSFER';
    }
  }

  /**
   * Get APS response message for code
   */
  private getApsResponseMessage(code: string): string {
    const messages: Record<string, string> = {
      '20000': 'Success',
      '40000': 'Processing',
      '50000': 'Failed',
      '60000': 'Declined',
    };

    return messages[code] || 'Unknown status';
  }

  /**
   * Validate bank account for APS
   */
  private validateBankAccount(payoutMethod: PayoutMethodData): boolean {
    return !!(
      payoutMethod.bankDetails?.accountNumber &&
      payoutMethod.bankDetails?.bankCode &&
      payoutMethod.bankDetails?.accountHolderName
    );
  }

  /**
   * Validate digital wallet for APS
   */
  private validateDigitalWallet(payoutMethod: PayoutMethodData): boolean {
    return !!(payoutMethod.walletDetails?.email || payoutMethod.walletDetails?.phoneNumber);
  }
}
