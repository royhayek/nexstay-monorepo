import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Account,
  AccountDocument,
  AccountType,
  AccountStatus,
  AccountOwnerType,
} from '../schemas/account.schema';
import { SeederLogger, runSeeder } from './seeder.helpers';

const systemAccounts = [
  {
    accountType: AccountType.PLATFORM_CASH,
    accountNumber: 'PC-000001',
    accountName: 'Platform Cash Account',
    ownerId: null,
    ownerType: AccountOwnerType.SYSTEM,
    currency: 'USD',
    balance: {
      available: 0,
      pending: 0,
      escrowed: 0,
      total: 0,
    },
    status: AccountStatus.ACTIVE,
    transactionCount: 0,
    version: 0,
    metadata: {
      description: 'Main operational account for platform cash flows',
      isSystemAccount: true,
    },
  },
  {
    accountType: AccountType.PLATFORM_REVENUE,
    accountNumber: 'PR-000001',
    accountName: 'Platform Revenue Account',
    ownerId: null,
    ownerType: AccountOwnerType.SYSTEM,
    currency: 'USD',
    balance: {
      available: 0,
      pending: 0,
      escrowed: 0,
      total: 0,
    },
    status: AccountStatus.ACTIVE,
    transactionCount: 0,
    version: 0,
    metadata: {
      description: 'Platform fees and service charges collection account',
      isSystemAccount: true,
    },
  },
  {
    accountType: AccountType.ESCROW,
    accountNumber: 'ESC-000001',
    accountName: 'Escrow Holding Account',
    ownerId: null,
    ownerType: AccountOwnerType.SYSTEM,
    currency: 'USD',
    balance: {
      available: 0,
      pending: 0,
      escrowed: 0,
      total: 0,
    },
    status: AccountStatus.ACTIVE,
    transactionCount: 0,
    version: 0,
    metadata: {
      description: 'Temporary holding account for booking payments (24h after check-in)',
      isSystemAccount: true,
    },
  },
];

export async function seedSystemAccounts(app: INestApplication): Promise<void> {
  await runSeeder('system accounts', async () => {
    const accountModel = app.get<Model<AccountDocument>>(getModelToken(Account.name));

    const existingCount = await accountModel.countDocuments({
      ownerType: AccountOwnerType.SYSTEM,
    });

    if (existingCount > 0) {
      SeederLogger.skipped('system accounts');
      return;
    }

    await accountModel.insertMany(systemAccounts);
    SeederLogger.success('system accounts');
  });
}
