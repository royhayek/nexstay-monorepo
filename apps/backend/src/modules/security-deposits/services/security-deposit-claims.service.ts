import { Injectable } from '@nestjs/common';
import { DateUtils } from '../../../common/utils/date.utils';
import { Types } from 'mongoose';
import { SecurityDepositDocument } from '../../../database/schemas/security-deposit.schema';
import { ClaimReason } from '../../../common/enums/security-deposit.enums';
import { LoggingUtil } from '../../../common/utils/logging.util';

export interface CreateClaimRequest {
  reason: ClaimReason;
  amount: number;
  description: string;
  evidence?: string[];
}

@Injectable()
export class SecurityDepositClaimsService {
  createClaim(
    deposit: SecurityDepositDocument,
    claimRequest: CreateClaimRequest,
    claimedBy: string,
  ): SecurityDepositDocument {
    LoggingUtil.log(
      `Creating claim for security deposit ${String(deposit._id)}`,
      'SecurityDepositClaimsService',
    );

    const claim = {
      reason: claimRequest.reason,
      amount: claimRequest.amount,
      description: claimRequest.description,
      evidence: claimRequest.evidence || [],
      claimedAt: DateUtils.now(),
      claimedBy: new Types.ObjectId(claimedBy),
    };

    deposit.claims.push(claim);
    deposit.hasActiveClaims = true;
    deposit.totalClaimedAmount += claimRequest.amount;

    // Mock save method - should be handled by service layer
    return deposit;
  }
}
