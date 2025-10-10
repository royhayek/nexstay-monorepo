import { UserDocument } from '../../../database/schemas/user.schema';
import { UserStatus } from '../../../common/enums/user-status.enums';

export interface UpdateData {
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  status?: UserStatus;
  updatedAt?: Date;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
  birthDate?: Date;
  locale?: string;
  timezone?: string;
}

export interface AdminUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  role?: string;
  avatarUrl?: string;
  updatedAt?: Date;
}

export interface UserSearchFilter {
  $or?: Array<{
    firstName?: { $regex: string; $options: string };
    lastName?: { $regex: string; $options: string };
    email?: { $regex: string; $options: string };
    phone?: { $regex: string; $options: string };
  }>;
  roles?: { $in: string[] };
}

export interface UserServiceResponse<T = unknown> {
  message: string;
  data?: T;
}

export interface UserStatusResponse {
  message: string;
  status: UserStatus;
}

export interface ToggleResponse {
  message: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

export interface BulkDeleteResponse {
  message: string;
  deletedCount: number;
  deletedUserIds: string[];
  failedUserIds: string[];
  deletedAt: Date;
}

export interface PaginatedUsersResponse {
  users: UserDocument[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
