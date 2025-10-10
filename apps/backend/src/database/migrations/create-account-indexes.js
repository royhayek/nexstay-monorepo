// MongoDB Migration Script: Account System Indexes
// Run with: mongosh your-database-url < create-account-indexes.js

// Accounts collection indexes
db.accounts.createIndex({ accountType: 1, status: 1 });
db.accounts.createIndex({ ownerId: 1, accountType: 1 });
db.accounts.createIndex({ accountNumber: 1 }, { unique: true });
db.accounts.createIndex({ currency: 1, accountType: 1 });
db.accounts.createIndex({ status: 1, isActive: 1 });
db.accounts.createIndex({ parentAccountId: 1 }, { sparse: true });

// Account Ledger collection indexes
db.account_ledger.createIndex({ transactionId: 1 }, { unique: true });
db.account_ledger.createIndex({ debitAccountId: 1, createdAt: -1 });
db.account_ledger.createIndex({ creditAccountId: 1, createdAt: -1 });
db.account_ledger.createIndex({ status: 1, processedAt: 1 });
db.account_ledger.createIndex({ entryType: 1, status: 1 });
db.account_ledger.createIndex({ 'reference.type': 1, 'reference.id': 1 });
db.account_ledger.createIndex({ batchId: 1, sequenceInBatch: 1 });
db.account_ledger.createIndex({ settlementDate: 1, isSettled: 1 });
db.account_ledger.createIndex({ reversalOfId: 1 });
db.account_ledger.createIndex({ requiresReview: 1, reviewedAt: 1 });

// Compound indexes for common queries
db.account_ledger.createIndex({
  debitAccountId: 1,
  creditAccountId: 1,
  createdAt: -1,
});

db.account_ledger.createIndex({
  status: 1,
  entryType: 1,
  createdAt: -1,
});

// Text index for searching
db.account_ledger.createIndex({
  description: 'text',
  narrative: 'text',
  'reference.description': 'text',
});

// Transaction Journals collection indexes
db.transaction_journals.createIndex({ journalId: 1 }, { unique: true });
db.transaction_journals.createIndex({ type: 1, status: 1 });
db.transaction_journals.createIndex({ 'reference.type': 1, 'reference.id': 1 });
db.transaction_journals.createIndex({ createdAt: -1, status: 1 });
db.transaction_journals.createIndex({ processedAt: 1, status: 1 });

print('Account system indexes created successfully!');
