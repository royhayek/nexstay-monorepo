import { Types } from 'mongoose';

import {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
} from '../../../common/enums/notification.enums';

/**
 * Interface for MongoDB notification filter criteria
 */
export interface NotificationFilter {
  recipient_id: string | Types.ObjectId;
  is_active: boolean;
  is_read?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  created_at?: {
    $gte?: Date;
    $lte?: Date;
    $gt?: Date;
    $lt?: Date;
  };
  title?: string | { $regex: string; $options: string };
  body?: string | { $regex: string; $options: string };
}

/**
 * Interface for notification delivery update operations
 */
export interface NotificationDeliveryUpdate {
  'deliveries.$.status': string;
  'deliveries.$.sent_at'?: Date;
  'deliveries.$.delivered_at'?: Date;
  'deliveries.$.failed_at'?: Date;
  'deliveries.$.error_message'?: string;
}
