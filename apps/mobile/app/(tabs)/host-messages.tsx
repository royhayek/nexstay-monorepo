import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Messages3, User, Calendar } from "iconsax-react-native";

import { Button, Text } from "@/components/atoms";
import { TabScreenTemplate } from "@/components/templates";
import { EmptyState } from "@/components/molecules";
import { ms, mvs } from "@/utils/scaling";
import {
  useMessagingAppControllerGetConversations,
  useMessagingAppControllerGetUnreadCount,
} from "@/api/queries/protected/messaging/messaging";
import type { ConversationDataDto } from "@/api/models/protected";

/**
 * Host Messages Screen
 *
 * Displays conversations with guests, allows hosts to communicate
 * with current and prospective guests.
 */
export default function HostMessagesScreen() {
  const { theme } = useUnistyles();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch conversations
  const {
    data: conversationsData,
    isLoading,
    error,
    refetch,
  } = useMessagingAppControllerGetConversations({
    page: 1,
    limit: 50,
  });

  // Fetch unread count
  const { data: unreadData } = useMessagingAppControllerGetUnreadCount();

  const conversations = conversationsData?.data?.conversations || [];
  const unreadCount = unreadData?.data?.unreadCount || 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleConversationPress = (conversation: ConversationDataDto) => {
    router.push(`/messages/${conversation.id}` as any);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getOtherParticipant = (conversation: ConversationDataDto) => {
    // For now, just get the first participant that's not the current user
    return conversation.participants[0] || { name: "Unknown", avatar: null };
  };

  if (isLoading) {
    return (
      <TabScreenTemplate
        title="Messages"
        headerRight={
          unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text variant="bodySmallSemiBold" color="neutral0">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          ) : undefined
        }
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.loadingText}>
            Loading messages...
          </Text>
        </View>
      </TabScreenTemplate>
    );
  }

  if (error) {
    return (
      <TabScreenTemplate title="Messages">
        <View style={styles.errorContainer}>
          <Text variant="bodyMediumRegular" color="error" style={styles.errorText}>
            Failed to load messages
          </Text>
          <Button variant="outlined" onPress={() => refetch()}>
            Try Again
          </Button>
        </View>
      </TabScreenTemplate>
    );
  }

  return (
    <TabScreenTemplate
      title="Messages"
      headerRight={
        unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text variant="bodySmallSemiBold" color="neutral0">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        ) : undefined
      }
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          conversations.length === 0 && styles.emptyContent,
          { paddingBottom: mvs(120) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {conversations.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <EmptyState
              icon={<Messages3 size={ms(64)} variant="Bulk" color={theme.colors.primary} />}
              title="No messages yet"
              description="Your conversations with guests and hosts will appear here"
            />
          </View>
        ) : (
          <View style={styles.conversationsContainer}>
            {conversations.map((conversation: ConversationDataDto) => {
              const otherParticipant = getOtherParticipant(conversation);
              const hasUnread = conversation.unread_count > 0;

              return (
                <TouchableOpacity
                  key={conversation.id}
                  style={styles.conversationCard}
                  onPress={() => handleConversationPress(conversation)}
                  activeOpacity={0.7}
                >
                  <View style={styles.conversationContent}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                      {otherParticipant.avatar ? (
                        <View style={styles.avatar}>
                          {/* TODO: Add actual image when avatar URLs are available */}
                          <User size={ms(24)} color={theme.colors.neutral0} variant="Bold" />
                        </View>
                      ) : (
                        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                          <User size={ms(24)} color={theme.colors.neutral0} variant="Bold" />
                        </View>
                      )}
                      {hasUnread && <View style={styles.unreadIndicator} />}
                    </View>

                    {/* Conversation Info */}
                    <View style={styles.conversationInfo}>
                      <View style={styles.conversationHeader}>
                        <Text
                          variant="bodyLargeSemiBold"
                          color={hasUnread ? "neutral900" : "neutral800"}
                          numberOfLines={1}
                          style={styles.conversationTitle}
                        >
                          {conversation.title || otherParticipant.name}
                        </Text>
                        <View style={styles.timestampRow}>
                          <Calendar size={ms(12)} color={theme.colors.neutral500} variant="Outline" />
                          <Text variant="bodyXSmallRegular" color="neutral500">
                            {formatTimestamp(conversation.last_activity)}
                          </Text>
                        </View>
                      </View>

                      {conversation.last_message && (
                        <Text
                          variant={hasUnread ? "bodyMediumRegular" : "bodySmallRegular"}
                          color={hasUnread ? "neutral700" : "neutral600"}
                          numberOfLines={2}
                          style={styles.lastMessage}
                        >
                          {conversation.last_message.content}
                        </Text>
                      )}
                    </View>

                    {/* Unread Badge */}
                    {hasUnread && (
                      <View style={styles.conversationUnreadBadge}>
                        <Text variant="bodyXSmallSemiBold" color="neutral0">
                          {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </TabScreenTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
  },
  emptyContent: {
    justifyContent: "center",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  errorText: {
    marginBottom: theme.spacing.md,
  },
  unreadBadge: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.full,
    minWidth: ms(24),
    alignItems: "center",
  },
  conversationsContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  conversationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  conversationContent: {
    padding: theme.spacing.base,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.base,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    backgroundColor: theme.colors.neutral200,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadIndicator: {
    position: "absolute",
    top: 0,
    right: 0,
    width: ms(12),
    height: ms(12),
    borderRadius: ms(6),
    backgroundColor: theme.colors.error,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  conversationInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  conversationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  conversationTitle: {
    flex: 1,
  },
  timestampRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  lastMessage: {
    lineHeight: mvs(18),
  },
  conversationUnreadBadge: {
    backgroundColor: theme.colors.primary,
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    justifyContent: "center",
    alignItems: "center",
  },
}));
