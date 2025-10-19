import React, { useState } from "react";
import { ActivityIndicator, FlatList, Image, RefreshControl, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { router } from "expo-router";

import type { SegmentedControlOption } from "@/components/molecules";
import { EmptyState, SegmentedControl } from "@/components/molecules";
import { BookingCard } from "@/components/organisms/booking-card";
import { TabScreenTemplate } from "@/components/templates";
import { Button } from "@/components/atoms/button";
import { Text } from "@/components/atoms/text";
import { mvs } from "@/utils/scaling";
import { useBookingsAppControllerGetMyBookings } from "@/api/queries/protected/bookings/bookings";

const bookingTabs: SegmentedControlOption[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function BookingHistoryScreen() {
  const [selectedTab, setSelectedTab] = useState("all");
  const [page, setPage] = useState(1);

  // Fetch bookings with generated API hook
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useBookingsAppControllerGetMyBookings(
    {
      page,
      limit: 20,
      status: selectedTab === "all" ? undefined : selectedTab,
    },
    {
      query: {
        staleTime: 30 * 1000, // 30 seconds
      },
    }
  );

  // Extract pagination data from API response
  const data = response?.data;

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    setPage(1); // Reset to first page when changing tabs
  };

  const handleLoadMore = () => {
    if (data?.hasNextPage && !isLoading) {
      setPage((prev) => prev + 1);
    }
  };

  const handleBookingPress = (bookingId: string) => {
    router.push(`/booking/${bookingId}`);
  };

  const handleExploreProperties = () => {
    router.push("/(tabs)");
  };

  const getEmptyStateMessage = () => {
    switch (selectedTab) {
      case "all":
        return {
          title: "No Bookings Yet",
          description: "Start planning your next adventure.\nBrowse properties now",
        };
      case "pending":
        return {
          title: "No Pending Bookings",
          description: "Your pending bookings will appear here",
        };
      case "confirmed":
        return {
          title: "No Confirmed Bookings",
          description: "Your confirmed bookings will appear here",
        };
      case "cancelled":
        return {
          title: "No Cancelled Bookings",
          description: "You don't have any cancelled bookings",
        };
      default:
        return {
          title: "No Bookings Yet",
          description: "Start planning your next adventure",
        };
    }
  };

  const renderBookingCard = ({ item }: { item: any }) => (
    <BookingCard booking={item} onPress={() => handleBookingPress(item._id)} />
  );

  const renderListHeader = () => (
    <>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <SegmentedControl
          options={bookingTabs}
          selectedValue={selectedTab}
          onValueChange={handleTabChange}
          variant="default"
          size="medium"
        />
      </View>

      {/* Results Count */}
      {data && data.items.length > 0 && (
        <View style={styles.resultsHeader}>
          <Text variant="bodyMediumSemiBold">
            {data.total} {data.total === 1 ? "Booking" : "Bookings"}
          </Text>
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

    if (data?.hasNextPage && !isLoading) {
      return (
        <View style={styles.loadMoreContainer}>
          <Button variant="outlined" size="medium" onPress={handleLoadMore}>
            Load More
          </Button>
        </View>
      );
    }

    if (data && data.items.length > 0 && !data.hasNextPage) {
      return (
        <View style={styles.endMessage}>
          <Text variant="bodySmallRegular" color="textSecondary" textAlign="center">
            You've reached the end
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
        {selectedTab === "all" && (
          <Button variant="filled" size="medium" onPress={handleExploreProperties} style={styles.exploreButton}>
            Explore Properties
          </Button>
        )}
      </View>
    );
  };

  const renderErrorState = () => (
    <View style={styles.errorStateWrapper}>
      <Text variant="bodyLargeSemiBold" textAlign="center">
        Unable to Load Bookings
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
    <TabScreenTemplate title="My Bookings">
      <View style={styles.container}>
        {isError ? (
          renderErrorState()
        ) : isLoading && page === 1 ? (
          <>
            {renderListHeader()}
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text variant="bodyMediumRegular" color="textSecondary" style={styles.loadingText}>
                Loading bookings...
              </Text>
            </View>
          </>
        ) : (
          <FlatList
            data={data?.items || []}
            renderItem={renderBookingCard}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={renderListHeader}
            ListFooterComponent={renderListFooter}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={[styles.listContent, (data?.items.length || 0) === 0 && styles.emptyListContent]}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
          />
        )}
      </View>
    </TabScreenTemplate>
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
    paddingBottom: mvs(100), // Account for tab bar height
  },
  emptyIcon: {
    width: mvs(200),
    height: mvs(200),
  },
  exploreButton: {
    marginTop: theme.spacing.xl,
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
