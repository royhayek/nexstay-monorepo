import { router } from "expo-router";
import React, { useMemo } from "react";
import { View, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Text, Button, IconContainer } from "@/components/atoms";
import { StatCard, SectionHeader } from "@/components/molecules";
import { TabScreenTemplate } from "@/components/templates";
import { QuickActions, QuickAction } from "@/components/organisms";
import { ms, mvs } from "@/utils/scaling";
import { useBookingsAppControllerGetHostBookings } from "@/api/queries/protected/bookings/bookings";
import { usePropertiesAppControllerGetMyProperties } from "@/api/queries/protected/properties/properties";
import { useAccountsAppControllerGetMyAccounts } from "@/api/queries/protected/accounts/accounts";

import { Calendar, Login, Logout as LogoutIcon, Home2, DollarCircle, Eye, Add } from "iconsax-react-native";

/**
 * Host Dashboard Screen
 *
 * Shows today's check-ins, check-outs, earnings summary, and quick actions.
 */
export default function HostDashboardScreen() {
  const { theme } = useUnistyles();

  // Fetch host bookings
  const {
    data: bookingsResponse,
    isLoading: isLoadingBookings,
    refetch: refetchBookings,
  } = useBookingsAppControllerGetHostBookings({ limit: 50 });

  // Fetch host properties
  const {
    data: propertiesResponse,
    isLoading: isLoadingProperties,
    refetch: refetchProperties,
  } = usePropertiesAppControllerGetMyProperties();

  // Fetch host accounts for earnings
  const {
    data: accountsResponse,
    isLoading: isLoadingAccounts,
    refetch: refetchAccounts,
  } = useAccountsAppControllerGetMyAccounts();

  const isLoading = isLoadingBookings || isLoadingProperties || isLoadingAccounts;
  const isRefreshing = false; // Will be true during refetch

  const handleRefresh = async () => {
    await Promise.all([refetchBookings(), refetchProperties(), refetchAccounts()]);
  };

  // Get today's date boundaries
  const today = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return { startOfDay, endOfDay };
  }, []);

  // Filter today's check-ins and check-outs
  const todaysActivity = useMemo(() => {
    const bookings = bookingsResponse?.data?.items || [];

    const checkIns = bookings.filter((booking) => {
      const checkIn = new Date(booking.checkIn);
      return checkIn >= today.startOfDay && checkIn <= today.endOfDay;
    });

    const checkOuts = bookings.filter((booking) => {
      const checkOut = new Date(booking.checkOut);
      return checkOut >= today.startOfDay && checkOut <= today.endOfDay;
    });

    return { checkIns, checkOuts };
  }, [bookingsResponse, today]);

  // Calculate earnings
  const earnings = useMemo(() => {
    const hostAccount = accountsResponse?.data?.accounts?.find(
      (account: any) => account.accountType === "host_earnings"
    );

    return {
      total: hostAccount?.balance.total || 0,
      pending: hostAccount?.balance.pending || 0,
      currency: hostAccount?.currency || "USD",
    };
  }, [accountsResponse]);

  // Get active listings count
  const listings = useMemo(() => {
    const properties = propertiesResponse?.data?.properties || [];
    const active = properties.filter((prop: any) => prop.status === "active");
    return {
      total: properties.length,
      active: active.length,
    };
  }, [propertiesResponse]);

  // Define quick actions
  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: "bookings",
        icon: <Calendar size={ms(20)} color={theme.colors.neutral700} variant="Outline" />,
        label: "View Bookings",
        onPress: () => router.push("/(tabs)/booking-history"),
      },
      {
        id: "listings",
        icon: <Home2 size={ms(20)} color={theme.colors.neutral700} variant="Outline" />,
        label: "Manage Listings",
        onPress: () => router.push("/(tabs)/host-listings"),
      },
      {
        id: "earnings",
        icon: <DollarCircle size={ms(20)} color={theme.colors.neutral700} variant="Outline" />,
        label: "View Earnings",
        onPress: () => console.log("View Analytics - Coming Soon"),
      },
    ],
    [theme.colors.neutral700]
  );

  return (
    <TabScreenTemplate title="Today">
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: mvs(120) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text variant="bodyMediumRegular" color="neutral600">
              Loading dashboard...
            </Text>
          </View>
        ) : (
          <>
            {/* Today's Activity */}
            <View style={styles.section}>
              <SectionHeader title="Today's Activity" hideAction style={styles.sectionTitle} />

              <View style={styles.activityCards}>
                <StatCard
                  icon={<Login size={ms(24)} color={theme.colors.success} variant="Bold" />}
                  value={todaysActivity.checkIns.length}
                  label="Check-ins"
                  iconBackgroundColor={`${theme.colors.success}15`}
                  onPress={() => router.push("/(tabs)/booking-history")}
                  style={styles.activityCardLeft}
                />

                <StatCard
                  icon={<LogoutIcon size={ms(24)} color={theme.colors.warning} variant="Bold" />}
                  value={todaysActivity.checkOuts.length}
                  label="Check-outs"
                  iconBackgroundColor={`${theme.colors.warning}15`}
                  onPress={() => router.push("/(tabs)/booking-history")}
                  style={styles.activityCardRight}
                />
              </View>
            </View>

            {/* Earnings Summary */}
            <View style={styles.section}>
              <SectionHeader title="Earnings" hideAction style={styles.sectionTitle} />

              <View style={styles.earningsCard}>
                <View style={styles.earningsHeader}>
                  <IconContainer
                    icon={<DollarCircle size={ms(24)} color={theme.colors.primary} variant="Bold" />}
                    backgroundColor={`${theme.colors.primary}15`}
                  />
                  <Text variant="bodyMediumSemiBold" color="neutral800" style={styles.earningsTitle}>
                    Total Earnings
                  </Text>
                </View>

                <Text variant="h3SemiBold" color="primary" style={styles.earningsAmount}>
                  ${earnings.total.toFixed(2)}
                </Text>

                {earnings.pending > 0 && (
                  <View style={styles.earningsPending}>
                    <Text variant="bodySmallRegular" color="neutral600">
                      Pending: ${earnings.pending.toFixed(2)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.earningsButton}
                  onPress={() => console.log("View Earnings - Coming Soon")}
                >
                  <Text variant="bodySmallSemiBold" color="primary">
                    View Details
                  </Text>
                  <Eye size={ms(16)} color={theme.colors.primary} variant="Bold" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Listings Overview */}
            <View style={styles.section}>
              <SectionHeader
                title="Your Listings"
                onActionPress={() => router.push("/(tabs)/host-listings")}
                style={styles.sectionHeader}
              />

              <View style={styles.listingsCard}>
                <View style={styles.listingsRow}>
                  <IconContainer
                    icon={<Home2 size={ms(20)} color={theme.colors.primary} variant="Bold" />}
                    size="medium"
                    backgroundColor={`${theme.colors.primary}15`}
                  />
                  <View style={styles.listingsInfo}>
                    <Text variant="bodyMediumSemiBold" color="neutral800">
                      {listings.total} {listings.total === 1 ? "Listing" : "Listings"}
                    </Text>
                    <Text variant="bodySmallRegular" color="success">
                      {listings.active} Active
                    </Text>
                  </View>
                </View>

                {listings.total === 0 && (
                  <View style={styles.emptyListings}>
                    <Text variant="bodySmallRegular" color="neutral600" style={styles.emptyText}>
                      You don&apos;t have any listings yet. Create your first listing to start earning!
                    </Text>
                    <Button
                      variant="filled"
                      color="primary"
                      size="small"
                      onPress={() => console.log("Create Listing - Coming Soon")}
                      style={styles.createButton}
                    >
                      <Add size={ms(16)} color={theme.colors.neutral0} variant="Bold" />
                      <Text variant="bodySmallSemiBold" color="neutral0" style={styles.createButtonText}>
                        Create Listing
                      </Text>
                    </Button>
                  </View>
                )}
              </View>
            </View>

            {/* Quick Actions */}
            <QuickActions title="Quick Actions" actions={quickActions} />
          </>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xxxl,
  },
  section: {
    marginVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.base,
  },
  sectionHeader: {
    marginBottom: theme.spacing.base,
  },
  activityCards: {
    flexDirection: "row",
    gap: theme.spacing.base,
  },
  activityCardLeft: {
    marginRight: theme.spacing.xs,
  },
  activityCardRight: {
    marginLeft: theme.spacing.xs,
  },
  earningsCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  earningsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.base,
  },
  earningsTitle: {
    marginLeft: theme.spacing.sm,
  },
  earningsAmount: {
    marginBottom: theme.spacing.xs,
  },
  earningsPending: {
    marginBottom: theme.spacing.base,
  },
  earningsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  listingsCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  listingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.base,
  },
  listingsInfo: {
    flex: 1,
  },
  emptyListings: {
    marginTop: theme.spacing.base,
    paddingTop: theme.spacing.base,
    borderTopWidth: theme.borderWidth.thin,
    borderTopColor: theme.colors.divider,
  },
  emptyText: {
    marginBottom: theme.spacing.base,
    lineHeight: mvs(18),
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  createButtonText: {
    marginLeft: theme.spacing.xs,
  },
}));
