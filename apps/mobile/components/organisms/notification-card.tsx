import React from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "@/components/atoms/text";
import { mvs } from "@/utils/scaling";

export interface NotificationData {
  _id: string;
  type: string;
  title: string;
  body: string;
  image_url?: string;
  is_read: boolean;
  createdAt: string | Date;
  data?: {
    booking_id?: string;
    property_id?: string;
    review_id?: string;
    message_id?: string;
    amount?: number;
    currency?: string;
    property_name?: string;
    guest_name?: string;
    host_name?: string;
  };
}

interface NotificationCardProps {
  notification: NotificationData;
  onPress?: () => void;
  onMarkAsRead?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onPress }) => {
  const getTimeAgo = (date: string | Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return notificationDate.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[styles.container, !notification.is_read && styles.unreadContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="bodyMediumSemiBold" numberOfLines={1} style={styles.title}>
            {notification.title}
          </Text>
          {!notification.is_read && <View style={styles.unreadBadge} />}
        </View>

        <Text variant="bodySmallRegular" color="textSecondary" numberOfLines={2} style={styles.body}>
          {notification.body}
        </Text>

        <Text variant="caption" color="secondaryLight" style={styles.timestamp}>
          {getTimeAgo(notification.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unreadContainer: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  content: {
    gap: theme.spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
  },
  unreadBadge: {
    width: mvs(8),
    height: mvs(8),
    borderRadius: mvs(4),
    backgroundColor: theme.colors.primary,
  },
  body: {
    lineHeight: mvs(20),
  },
  timestamp: {
    marginTop: theme.spacing.xxs,
  },
}));
