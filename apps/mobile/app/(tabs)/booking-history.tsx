import React, { useState } from "react";
import { Image, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import type { SegmentedControlOption } from "@/components/molecules";
import { EmptyState, ModalHeader, SegmentedControl } from "@/components/molecules";
import { TabScreenTemplate } from "@/components/templates";
import { mvs } from "@/utils/scaling";

const bookingTabs: SegmentedControlOption[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Canceled" },
];

export default function BookingHistoryScreen() {
  const [selectedTab, setSelectedTab] = useState("upcoming");

  // Mock data - would come from your state management
  const bookings = {
    upcoming: [],
    completed: [],
    canceled: [],
  };

  const currentBookings = bookings[selectedTab as keyof typeof bookings];

  const getEmptyStateMessage = () => {
    switch (selectedTab) {
      case "upcoming":
        return {
          title: "No Bookings Yet",
          description: "Start planning your next adventure.\nBrowse our hotels now",
        };
      case "completed":
        return {
          title: "No Completed Bookings",
          description: "Your completed bookings will appear here",
        };
      case "canceled":
        return {
          title: "No Canceled Bookings",
          description: "You don't have any canceled bookings",
        };
      default:
        return {
          title: "No Bookings Yet",
          description: "Start planning your next adventure",
        };
    }
  };

  const emptyMessage = getEmptyStateMessage();

  return (
    <TabScreenTemplate>
      <View style={styles.container}>
        {/* Header */}
        <ModalHeader title="My Booking History" showBackButton={false} />

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <SegmentedControl
            options={bookingTabs}
            selectedValue={selectedTab}
            onValueChange={setSelectedTab}
            variant="default"
            size="medium"
          />
        </View>

        {/* Content */}
        {currentBookings.length === 0 ? (
          <View style={styles.emptyStateWrapper}>
            <EmptyState
              icon={
                <Image
                  source={require("@/assets/images/empty-folder.png")}
                  style={styles.emptyIcon}
                  resizeMode="contain"
                />
              }
              title={emptyMessage.title}
              description={emptyMessage.description}
            />
          </View>
        ) : (
          <View style={styles.content}>{/* Booking list would go here based on selected tab */}</View>
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
  emptyStateWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: mvs(100), // Account for tab bar height
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyIcon: {
    width: mvs(200),
    height: mvs(200),
  },
}));
