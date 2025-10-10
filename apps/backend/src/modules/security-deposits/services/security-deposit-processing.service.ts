import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { SecurityDepositDocument } from '../../../database/schemas/security-deposit.schema';
import {
  SecurityDepositStatus,
  SecurityDepositReleaseReason,
} from '../../../common/enums/security-deposit.enums';
import { LoggingUtil } from '../../../common/utils/logging.util';

@Injectable()
export class SecurityDepositProcessingService {
  holdDeposit(deposit: SecurityDepositDocument, _paymentMethodId: string): SecurityDepositDocument {
    // Implementation for holding security deposit
    LoggingUtil.log(
      `Holding security deposit ${String(deposit._id)}`,
      'SecurityDepositProcessingService',
    );

    // Mock implementation - in production, integrate with payment provider
    deposit.status = SecurityDepositStatus.HELD;
    deposit.holdPaymentIntentId = `pi_mock_${DateUtils.now().getTime()}`;
    deposit.heldAt = DateUtils.now();

    // Mock save method - should be handled by service layer
    return deposit;
  }

  releaseDeposit(
    deposit: SecurityDepositDocument,
    releaseReason: SecurityDepositReleaseReason,
    adminNotes?: string,
    _releasedBy?: string,
  ): SecurityDepositDocument {
    // Implementation for releasing security deposit
    LoggingUtil.log(
      `Releasing security deposit ${String(deposit._id)}, reason: ${releaseReason}`,
      'SecurityDepositProcessingService',
    );

    // Mock implementation - in production, integrate with payment provider
    deposit.status = SecurityDepositStatus.RELEASED;
    deposit.releasedAt = DateUtils.now();
    deposit.refundPaymentIntentId = `pi_refund_${DateUtils.now().getTime()}`;

    if (adminNotes) {
      deposit.adminNotes = adminNotes;
    }

    // Mock save method - should be handled by service layer
    return deposit;
  }
}
