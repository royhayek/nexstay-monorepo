import { Types, FlattenMaps } from 'mongoose';
import {
  ConversationType,
  ConversationPriority,
  SupportTicketStatus,
  ConversationDocument,
} from '../../database/schemas/conversation.schema';
import { MessageDocument } from '../../database/schemas/message.schema';
import { UserPresenceStatus } from '../../common/enums/user-presence.enums';

// Populated user is essentially the User schema with _id for Mongoose populated documents
export interface PopulatedUser {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  presenceStatus?: string;
  lastActiveAt?: Date;
}

// User data that can be used for transformation - flexible interface for various user document types
export interface TransformableUser {
  _id: Types.ObjectId | string | FlattenMaps<unknown>;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  presenceStatus?: UserPresenceStatus | string;
  lastActiveAt?: Date;
}

// Populated message with proper typing for Mongoose documents
// Supports both populated and non-populated field names
export type PopulatedMessage = MessageDocument & {
  sender_id?: PopulatedUser | Types.ObjectId;
  sender?: PopulatedUser;
  read_by?: Array<{
    user_id?: Types.ObjectId | PopulatedUser;
    user?: PopulatedUser;
    read_at: Date;
  }>;
  reply_to?: PopulatedMessage | Types.ObjectId;
};

// Use the existing MessageDataDto instead of creating a duplicate
export type { MessageDataDto } from './dto/message-response.dto';

// Populated conversation with proper typing for Mongoose documents
// Supports both populated and non-populated field names
export type PopulatedConversation = ConversationDocument & {
  participants: (PopulatedUser | Types.ObjectId)[];
  assigned_support_agent?: PopulatedUser | Types.ObjectId;
  last_message_id?: PopulatedMessage | Types.ObjectId;
};

// Use the existing ConversationDataDto instead of creating a duplicate
export type { ConversationDataDto } from './dto/conversation-response.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ConversationFilters {
  page: number;
  limit: number;
  search?: string;
  type?: string;
  userId?: string;
  status?: string;
  from?: string;
  to?: string;
}

export interface MessageFilters {
  page: number;
  limit: number;
  fromDate?: string;
  toDate?: string;
}

export interface MongooseConversationDoc {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  booking_id?: Types.ObjectId;
  property_id?: Types.ObjectId;
  title: string;
  type: ConversationType;
  priority: ConversationPriority;
  support_status?: SupportTicketStatus;
  assigned_support_agent?: Types.ObjectId;
  support_category?: string;
  last_message_id?: Types.ObjectId;
  last_activity: Date;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
  toObject(): unknown;
}

export interface MongooseMessageDoc {
  _id: Types.ObjectId;
  conversation_id: Types.ObjectId;
  sender_id: Types.ObjectId;
  content: string;
  message_type: string;
  attachments: Array<{
    url: string;
    filename: string;
    mimetype: string;
    size: number;
  }>;
  read_by: Array<{
    user_id: Types.ObjectId;
    read_at: Date;
  }>;
  is_deleted: boolean;
  reply_to?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toObject(): unknown;
}

// MongoDB query interfaces
export interface ConversationQueryFilter {
  type?: ConversationType | { $in: ConversationType[] } | { $nin: ConversationType[] };
  is_active?: boolean;
  support_status?: SupportTicketStatus;
  assigned_support_agent?: Types.ObjectId;
  booking_id?: Types.ObjectId;
  property_id?: Types.ObjectId;
  participants?:
    | Types.ObjectId
    | { $in: Types.ObjectId[] }
    | { $all: Types.ObjectId[]; $size: number };
  $or?: Array<{
    'participants.firstName'?: { $regex: string; $options: string };
    'participants.lastName'?: { $regex: string; $options: string };
    title?: { $regex: string; $options: string };
  }>;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export interface MessageQueryFilter {
  conversation_id: Types.ObjectId;
  is_deleted?: boolean;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export interface SupportAgentResult {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles: string[];
  activeConversations?: number;
  presenceStatus?: UserPresenceStatus;
}

// Analytics interfaces
export interface DateFilter {
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export interface MessageStatsResult {
  _id: null;
  totalMessages: number;
  averageMessageLength: number;
}

export interface ConversationStatsResult {
  _id: ConversationType;
  count: number;
}

export interface MessagingStats {
  totalMessages: number;
  averageMessageLength: number;
  conversationsByType: Record<string, number>;
  dateRange: { from?: string; to?: string };
}

export interface DateRangeFilter {
  from?: string;
  to?: string;
}
