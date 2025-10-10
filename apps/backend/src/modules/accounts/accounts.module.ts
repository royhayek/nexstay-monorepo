import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

// Import schemas
import { Account, AccountSchema } from '../../database/schemas/account.schema';
import { AccountLedger, AccountLedgerSchema } from '../../database/schemas/account-ledger.schema';
import { Transaction, TransactionSchema } from '../../database/schemas/transaction.schema';
import {
  AccountActionReason,
  AccountActionReasonSchema,
} from '../../database/schemas/account-action-reason.schema';
import { Payout, PayoutSchema } from '../../database/schemas/payout.schema';

// Import services
import { AccountsCoreService } from './services/accounts-core.service';
import { AccountsAdminService } from './services/accounts-admin.service';
import { AccountsEscrowService } from './services/accounts-escrow.service';
import { AccountsPayoutService } from './services/accounts-payout.service';
import { AccountsTransactionService } from './services/accounts-transaction.service';
import { AccountsFacadeService } from './services/accounts-facade.service';

// Import controllers
import { AccountsAppController } from './controllers/accounts-app.controller';
import { AccountsAdminController } from './controllers/accounts-admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: AccountLedger.name, schema: AccountLedgerSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: AccountActionReason.name, schema: AccountActionReasonSchema },
      { name: Payout.name, schema: PayoutSchema },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AccountsAppController, AccountsAdminController],
  providers: [
    // Specialized services
    AccountsCoreService,
    AccountsAdminService,
    AccountsEscrowService,
    AccountsPayoutService,
    AccountsTransactionService,

    // Facade service (coordination layer)
    AccountsFacadeService,
  ],
  exports: [
    AccountsFacadeService,
    AccountsCoreService,
    AccountsEscrowService,
    AccountsPayoutService,
    AccountsTransactionService,
  ],
})
export class AccountsModule {}
