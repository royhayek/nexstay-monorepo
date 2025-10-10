import { Types } from 'mongoose';
import {
  InstallmentStatus,
  InstallmentType,
  InstallmentScheduleType,
} from '../../../common/enums/installment.enums';

export interface CreateInstallmentPlanRequest {
  bookingId: string;
  totalAmount: number;
  currency: string;
  scheduleType: InstallmentScheduleType;
  numberOfInstallments?: number;
  checkInDate: Date;
  customSchedule?: CustomScheduleItem[];
}

export interface CustomScheduleItem {
  installmentNumber: number;
  percentage: number;
  dueDate: Date;
  type: InstallmentType;
}

export interface InstallmentFilters {
  bookingId?: string;
  guestId?: string;
  hostId?: string;
  status?: InstallmentStatus;
  type?: InstallmentType;
  isOverdue?: boolean;
  dueDateBefore?: Date;
  dueDateAfter?: Date;
  reminderNotSent?: boolean;
}

export interface InstallmentScheduleItem {
  installmentNumber: number;
  amount: number;
  currency: string;
  dueDate: Date;
  type: InstallmentType;
  percentage: number;
}

export interface InstallmentQuery {
  bookingId?: Types.ObjectId;
  guestId?: Types.ObjectId;
  hostId?: Types.ObjectId;
  status?: InstallmentStatus;
  type?: InstallmentType;
  isOverdue?: boolean;
  dueDate?: {
    $lt?: Date;
    $gt?: Date;
  };
  reminderSent?: boolean;
}

export interface InstallmentStatsQuery {
  hostId?: Types.ObjectId;
  status?: InstallmentStatus;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
  dueDate?: {
    $lte?: Date;
  };
  isOverdue?: boolean;
}

export interface InstallmentStatsResult {
  total: number;
  totalAmount: number;
  averageAmount: number;
  activeClaimsCount: number;
  statuses: Record<InstallmentStatus, number>;
}

export interface InstallmentStatsAggregationResult {
  _id: null;
  total: number;
  totalAmount: number;
  statuses: string[];
  overdueCount: number;
  overdueAmount: number;
  paidCount: number;
}

export interface InstallmentsPaginatedResponse {
  installments: unknown[];
  total: number;
  pages: number;
}
