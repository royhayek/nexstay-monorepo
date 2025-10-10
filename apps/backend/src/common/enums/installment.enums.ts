export enum InstallmentStatus {
  SCHEDULED = 'scheduled', // Payment scheduled for future
  PROCESSING = 'processing', // Currently being processed
  PAID = 'paid', // Successfully paid
  FAILED = 'failed', // Payment failed
  CANCELLED = 'cancelled', // Booking cancelled, installment cancelled
  REFUNDED = 'refunded', // Payment refunded
  OVERDUE = 'overdue', // Past due date
  RESCHEDULED = 'rescheduled', // Due date moved
  PARTIAL = 'partial', // Partially paid (rare case)
}

export enum InstallmentType {
  INITIAL = 'initial', // First payment (typically 50% or deposit amount)
  MONTHLY = 'monthly', // Monthly payment installment
  FINAL = 'final', // Final payment before/at check-in
  SECURITY_DEPOSIT = 'security_deposit', // Security deposit installment
  LATE_FEE = 'late_fee', // Late payment fee
  ADJUSTMENT = 'adjustment', // Price adjustments
}

// Payment scheduling strategies
export enum InstallmentScheduleType {
  PERCENTAGE_BASED = 'percentage_based', // Split by percentages (50%, 30%, 20%)
  EQUAL_MONTHLY = 'equal_monthly', // Equal monthly amounts
  CUSTOM = 'custom', // Host-defined custom schedule
  FRONTLOADED = 'frontloaded', // Larger initial payment
  CHECKOUT_HEAVY = 'checkout_heavy', // Larger final payment
}

// Retry strategies for failed payments
export enum InstallmentRetryStrategy {
  EXPONENTIAL = 'exponential', // 1 day, 2 days, 4 days, etc.
  DAILY = 'daily', // Every day
  WEEKLY = 'weekly', // Every week
  MANUAL = 'manual', // Manual retry only
  DISABLED = 'disabled', // No retries
}

// Payment reminder types
export enum InstallmentReminderType {
  SEVEN_DAYS = 'seven_days_before',
  THREE_DAYS = 'three_days_before',
  ONE_DAY = 'one_day_before',
  DUE_TODAY = 'due_today',
  OVERDUE = 'overdue',
  FINAL_NOTICE = 'final_notice',
}

// Actions that can be taken on installments
export enum InstallmentAction {
  PROCESS_PAYMENT = 'process_payment',
  RETRY_PAYMENT = 'retry_payment',
  CANCEL = 'cancel',
  RESCHEDULE = 'reschedule',
  REFUND = 'refund',
  APPLY_LATE_FEE = 'apply_late_fee',
  SEND_REMINDER = 'send_reminder',
  MARK_OVERDUE = 'mark_overdue',
  ADMIN_OVERRIDE = 'admin_override',
}
