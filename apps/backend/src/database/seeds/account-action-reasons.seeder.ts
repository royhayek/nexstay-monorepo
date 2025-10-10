import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AccountActionReason,
  AccountActionReasonDocument,
  AccountActionType,
} from '../schemas/account-action-reason.schema';
import { SeederLogger, runSeeder } from './seeder.helpers';

const initialReasons = [
  // Deactivation reasons
  {
    title: 'Taking a break from the platform',
    description: 'Temporarily stepping away from using the service',
    actionType: AccountActionType.DEACTIVATION,
    isActive: true,
    sortOrder: 1,
    isDefault: true,
  },
  {
    title: 'Privacy concerns',
    description: 'Concerns about data privacy and security',
    actionType: AccountActionType.DEACTIVATION,
    isActive: true,
    sortOrder: 2,
  },
  {
    title: 'Not using the service anymore',
    description: 'No longer need or use the platform',
    actionType: AccountActionType.DEACTIVATION,
    isActive: true,
    sortOrder: 3,
  },
  {
    title: 'Too many notifications',
    description: 'Overwhelmed by platform notifications and communications',
    actionType: AccountActionType.DEACTIVATION,
    isActive: true,
    sortOrder: 4,
  },
  {
    title: 'Technical issues',
    description: 'Experiencing persistent technical problems',
    actionType: AccountActionType.DEACTIVATION,
    isActive: true,
    sortOrder: 5,
  },
  {
    title: 'Other reason',
    description: 'Reason not listed above',
    actionType: AccountActionType.DEACTIVATION,
    isActive: true,
    sortOrder: 999,
  },

  // Deletion reasons
  {
    title: 'No longer need account',
    description: 'Permanent removal - no longer using the service',
    actionType: AccountActionType.DELETION,
    isActive: true,
    sortOrder: 1,
    isDefault: true,
  },
  {
    title: 'Privacy concerns',
    description: 'Want all personal data permanently removed',
    actionType: AccountActionType.DELETION,
    isActive: true,
    sortOrder: 2,
  },
  {
    title: 'Switching to different service',
    description: 'Moving to a competitor or alternative platform',
    actionType: AccountActionType.DELETION,
    isActive: true,
    sortOrder: 3,
  },
  {
    title: 'Account security compromised',
    description: 'Account has been hacked or compromised',
    actionType: AccountActionType.DELETION,
    isActive: true,
    sortOrder: 4,
  },
  {
    title: 'GDPR data erasure request',
    description: 'Legal right to be forgotten under GDPR Article 17',
    actionType: AccountActionType.DELETION,
    isActive: true,
    sortOrder: 5,
  },
  {
    title: 'Other reason',
    description: 'Reason not listed above',
    actionType: AccountActionType.DELETION,
    isActive: true,
    sortOrder: 999,
  },

  // Suspension reasons (admin use)
  {
    title: 'Terms of Service violation',
    description: 'Violated platform terms and conditions',
    actionType: AccountActionType.SUSPENSION,
    isActive: true,
    sortOrder: 1,
    requiresAdminApproval: true,
    isDefault: true,
  },
  {
    title: 'Inappropriate content',
    description: 'Posted inappropriate or offensive content',
    actionType: AccountActionType.SUSPENSION,
    isActive: true,
    sortOrder: 2,
    requiresAdminApproval: true,
  },
  {
    title: 'Fraudulent activity',
    description: 'Engaged in fraudulent or deceptive practices',
    actionType: AccountActionType.SUSPENSION,
    isActive: true,
    sortOrder: 3,
    requiresAdminApproval: true,
  },
  {
    title: 'Spam or abuse',
    description: 'Sending spam or abusing other users',
    actionType: AccountActionType.SUSPENSION,
    isActive: true,
    sortOrder: 4,
    requiresAdminApproval: true,
  },
  {
    title: 'Multiple policy violations',
    description: 'Repeated violations of platform policies',
    actionType: AccountActionType.SUSPENSION,
    isActive: true,
    sortOrder: 5,
    requiresAdminApproval: true,
  },
];

export async function seedAccountActionReasons(app: INestApplication): Promise<void> {
  await runSeeder('account action reasons', async () => {
    const reasonModel = app.get<Model<AccountActionReasonDocument>>(
      getModelToken(AccountActionReason.name),
    );

    const existingCount = await reasonModel.countDocuments();
    if (existingCount > 0) {
      SeederLogger.skipped('account action reasons');
      return;
    }

    await reasonModel.insertMany(initialReasons);
    SeederLogger.success('account action reasons');
  });
}
