import React, { useState } from "react";
import { ActivityIndicator, FlatList, Image, RefreshControl, View, TouchableOpacity } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { router } from "expo-router";
import { ScreenTemplate } from "@/components/templates";

import type { SegmentedControlOption } from "@/components/molecules";
import { EmptyState, SegmentedControl } from "@/components/molecules";
import type { NotificationData } from "@/components/organisms/notification-card";
import { NotificationCard } from "@/components/organisms/notification-card";
import { Button } from "@/components/atoms/button";
import { Text } from "@/components/atoms/text";
import { mvs } from "@/utils/scaling";
import {
  useNotificationsAppControllerFindAll,
  useNotificationsAppControllerMarkAsRead,
  useNotificationsAppControllerMarkAllAsRead,
} from "@/api/queries/protected/notifications/notifications";

const notificationTabs: SegmentedControlOption[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
];

export default function NotificationsScreen() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [page, setPage] = useState(1);

  // Fetch notifications with generated API hook
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useNotificationsAppControllerFindAll(
    {
      page,
      limit: 20,
      unread_only: selectedTab === "unread",
    },
    {
      query: {
        staleTime: 10 * 1000, // 10 seconds
      },
    }
  );

  const markAsReadMutation = useNotificationsAppControllerMarkAsRead();
  const markAllAsReadMutation = useNotificationsAppControllerMarkAllAsRead();

  // Parse the response data
  // Note: The API returns void type in generated code, but actual response has data
  const responseData = response as any;
  const notifications = responseData?.data?.notifications || [];
  const total = responseData?.data?.total || 0;
  const hasNextPage = responseData?.data?.hasNext || false;
  const unreadCount = responseData?.data?.unread_count || 0;

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setPage(1);
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isLoading) {
      setPage((prev) => prev + 1);
    }
  };

  const handleNotificationPress = (notification: NotificationData) => {
    // Mark as read
    if (!notification.is_read) {
      markAsReadMutation.mutate(
        { id: notification._id },
        {
          onSuccess: () => {
            refetch();
          },
        }
      );
    }

    // Navigate based on notification data
    if (notification.data?.booking_id) {
      router.push(`/booking/${notification.data.booking_id}`);
    } else if (notification.data?.property_id) {
      router.push(`/property/${notification.data.property_id}`);
    } else if (notification.data?.message_id) {
      router.push(`/messages/${notification.data.message_id}`);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate(undefined, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  const getEmptyStateMessage = () => {
    switch (selectedTab) {
      case "all":
        return {
          title: "No Notifications",
          description: "You don't have any notifications yet.\nWe'll notify you when something happens.",
        };
      case "unread":
        return {
          title: "No Unread Notifications",
          description: "You&apos;re all caught up!\nCheck back later for new updates.",
        };
      default:
        return {
          title: "No Notifications",
          description: "You don't have any notifications yet.",
        };
    }
  };

  const renderNotificationCard = ({ item }: { item: NotificationData }) => (
    <NotificationCard notification={item} onPress={() => handleNotificationPress(item)} />
  );

  const renderListHeader = () => (
    <>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <SegmentedControl
          options={notificationTabs}
          selectedValue={selectedTab}
          onValueChange={handleTabChange}
          variant="default"
          size="medium"
        />
      </View>

      {/* Results Count and Mark All as Read */}
      {notifications.length > 0 && (
        <View style={styles.resultsHeader}>
          <Text variant="bodyMediumSemiBold">
            {total} {total === 1 ? "Notification" : "Notifications"}
            {unreadCount > 0 && ` (${unreadCount} unread)`}
          </Text>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead}>
              <Text variant="bodySmallSemiBold" color="primary">
                Mark all as read
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );

  const renderListFooter = () => {
    if (isLoading && page > 1) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" />
          <Text variant="bodySmallRegular" color="textSecondary">
            Loading more...
          </Text>
        </View>
      );
    }

    if (hasNextPage && !isLoading) {
      return (
        <View style={styles.loadMoreContainer}>
          <Button variant="outlined" size="medium" onPress={handleLoadMore}>
            Load More
          </Button>
        </View>
      );
    }

    if (notifications.length > 0 && !hasNextPage) {
      return (
        <View style={styles.endMessage}>
          <Text variant="bodySmallRegular" color="textSecondary" textAlign="center">
            You&apos;ve reached the end
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderEmptyState = () => {
    const emptyMessage = getEmptyStateMessage();

    return (
      <View style={styles.emptyStateWrapper}>
        <EmptyState
          icon={
            <Image source={require("@/assets/images/empty-folder.png")} style={styles.emptyIcon} resizeMode="contain" />
          }
          title={emptyMessage.title}
          description={emptyMessage.description}
        />
      </View>
    );
  };

  const renderErrorState = () => (
    <View style={styles.errorStateWrapper}>
      <Text variant="bodyLargeSemiBold" textAlign="center">
        Unable to Load Notifications
      </Text>
      <Text variant="bodyMediumRegular" color="textSecondary" textAlign="center" style={styles.errorMessage}>
        {error instanceof Error ? error.message : "Something went wrong. Please try again."}
      </Text>
      <Button variant="filled" size="medium" onPress={() => refetch()}>
        Try Again
      </Button>
    </View>
  );

  return (
    <ScreenTemplate title="Notifications">
      <View style={styles.container}>
        {isError ? (
          renderErrorState()
        ) : isLoading && page === 1 ? (
          <>
            {renderListHeader()}
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text variant="bodyMediumRegular" color="textSecondary" style={styles.loadingText}>
                Loading notifications...
              </Text>
            </View>
          </>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationCard}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={renderListHeader}
            ListFooterComponent={renderListFooter}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={[styles.listContent, notifications.length === 0 && styles.emptyListContent]}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
          />
        )}
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabsContainer: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyStateWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: mvs(100),
  },
  emptyIcon: {
    width: mvs(200),
    height: mvs(200),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
  },
  loadingFooter: {
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  loadMoreContainer: {
    paddingVertical: theme.spacing.lg,
    alignItems: "center",
  },
  endMessage: {
    paddingVertical: theme.spacing.xl,
    alignItems: "center",
  },
  errorStateWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  errorMessage: {
    marginBottom: theme.spacing.md,
  },
}));
