import { router } from "expo-router";
import React, { useState, useMemo } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Calendar, Login, Logout as LogoutIcon, ArrowRight2, Home2 } from "iconsax-react-native";

import { Text, Button } from "@/components/atoms";
import { TabScreenTemplate } from "@/components/templates";
import { SectionHeader } from "@/components/molecules";
import { ms, mvs } from "@/utils/scaling";
import { useBookingsAppControllerGetHostBookings } from "@/api/queries/protected/bookings/bookings";
import { usePropertiesAppControllerGetMyProperties } from "@/api/queries/protected/properties/properties";
import type { BookingResponseDto } from "@/api/models/protected";

/**
 * Host Calendar Screen
 *
 * Displays upcoming check-ins and check-outs across all properties.
 * Provides quick navigation to property-specific calendar management.
 */
export default function HostCalendarScreen() {
  const { theme } = useUnistyles();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch host bookings
  const {
    data: bookingsResponse,
    isLoading: isLoadingBookings,
    refetch: refetchBookings,
  } = useBookingsAppControllerGetHostBookings({ limit: 100 });

  // Fetch host properties
  const {
    data: propertiesResponse,
    isLoading: isLoadingProperties,
    refetch: refetchProperties,
  } = usePropertiesAppControllerGetMyProperties();

  const bookings = useMemo(() => bookingsResponse?.data?.items || [], [bookingsResponse]);
  const properties = useMemo(() => propertiesResponse?.data?.properties || [], [propertiesResponse]);

  const isLoading = isLoadingBookings || isLoadingProperties;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBookings(), refetchProperties()]);
    setRefreshing(false);
  };

  // Group bookings by upcoming check-ins and check-outs
  const { upcomingCheckIns, upcomingCheckOuts } = useMemo(() => {
    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const checkIns = bookings
      .filter((booking) => {
        const checkIn = new Date(booking.checkIn);
        return (
          checkIn >= now && checkIn <= next30Days && (booking.status === "confirmed" || booking.status === "checked_in")
        );
      })
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

    const checkOuts = bookings
      .filter((booking) => {
        const checkOut = new Date(booking.checkOut);
        return (
          checkOut >= now &&
          checkOut <= next30Days &&
          (booking.status === "confirmed" || booking.status === "checked_in")
        );
      })
      .sort((a, b) => new Date(a.checkOut).getTime() - new Date(b.checkOut).getTime());

    return { upcomingCheckIns: checkIns, upcomingCheckOuts: checkOuts };
  }, [bookings]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    }

    const daysUntil = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 7) {
      return `in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`;
    }

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderBookingCard = (booking: BookingResponseDto, type: "checkIn" | "checkOut") => {
    const date = type === "checkIn" ? booking.checkIn : booking.checkOut;
    const Icon = type === "checkIn" ? Login : LogoutIcon;
    const color = type === "checkIn" ? theme.colors.success : theme.colors.warning;

    return (
      <TouchableOpacity
        key={`${booking._id}-${type}`}
        style={styles.bookingCard}
        activeOpacity={0.7}
        onPress={() => console.log("Navigate to booking details:", booking._id)}
      >
        <View style={styles.bookingContent}>
          <View style={[styles.bookingIcon, { backgroundColor: `${color}15` }]}>
            <Icon size={ms(24)} color={color} variant="Bold" />
          </View>

          <View style={styles.bookingInfo}>
            <Text variant="bodyLargeSemiBold" color="neutral900" numberOfLines={1}>
              {booking.property.name}
            </Text>
            <Text variant="bodySmallRegular" color="neutral600">
              {booking.guest.firstName} {booking.guest.lastName} • {booking.guests.adults} guest
              {booking.guests.adults > 1 ? "s" : ""}
            </Text>
            <View style={styles.dateRow}>
              <Calendar size={ms(14)} color={theme.colors.neutral600} variant="Outline" />
              <Text variant="bodySmallSemiBold" color={color}>
                {formatDate(date)}
              </Text>
            </View>
          </View>

          <ArrowRight2 size={ms(20)} color={theme.colors.neutral400} variant="Outline" />
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <TabScreenTemplate title="Calendar">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.loadingText}>
            Loading calendar...
          </Text>
        </View>
      </TabScreenTemplate>
    );
  }

  return (
    <TabScreenTemplate title="Calendar">
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: mvs(120) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Properties Quick Access */}
        <View style={styles.section}>
          <SectionHeader title="Your Properties" hideAction style={styles.sectionHeader} />
          {properties.length === 0 ? (
            <View style={styles.emptyPropertiesCard}>
              <Text variant="bodyMediumRegular" color="neutral600">
                No properties yet. Create your first listing to start managing availability.
              </Text>
            </View>
          ) : (
            <View style={styles.propertiesGrid}>
              {properties.map((property: any) => (
                <TouchableOpacity
                  key={property._id}
                  style={styles.propertyCard}
                  onPress={() => router.push(`/listing/calendar/${property._id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.propertyIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Home2 size={ms(20)} color={theme.colors.primary} variant="Bold" />
                  </View>
                  <Text variant="bodySmallSemiBold" color="neutral900" numberOfLines={2} style={styles.propertyName}>
                    {property.name}
                  </Text>
                  <Text variant="bodyXSmallRegular" color="neutral600">
                    Manage dates
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Upcoming Check-ins */}
        <View style={styles.section}>
          <SectionHeader title="Upcoming Check-ins" subtitle={`Next 30 days`} hideAction style={styles.sectionHeader} />
          {upcomingCheckIns.length === 0 ? (
            <View style={styles.emptyCard}>
              <Login size={ms(32)} color={theme.colors.neutral400} variant="Bulk" />
              <Text variant="bodyMediumRegular" color="neutral600" style={styles.emptyText}>
                No upcoming check-ins
              </Text>
            </View>
          ) : (
            <View style={styles.bookingsContainer}>
              {upcomingCheckIns.map((booking) => renderBookingCard(booking, "checkIn"))}
            </View>
          )}
        </View>

        {/* Upcoming Check-outs */}
        <View style={styles.section}>
          <SectionHeader
            title="Upcoming Check-outs"
            subtitle={`Next 30 days`}
            hideAction
            style={styles.sectionHeader}
          />
          {upcomingCheckOuts.length === 0 ? (
            <View style={styles.emptyCard}>
              <LogoutIcon size={ms(32)} color={theme.colors.neutral400} variant="Bulk" />
              <Text variant="bodyMediumRegular" color="neutral600" style={styles.emptyText}>
                No upcoming check-outs
              </Text>
            </View>
          ) : (
            <View style={styles.bookingsContainer}>
              {upcomingCheckOuts.map((booking) => renderBookingCard(booking, "checkOut"))}
            </View>
          )}
        </View>

        {/* View All Bookings CTA */}
        {bookings.length > 0 && (
          <View style={styles.section}>
            <Button variant="outlined" onPress={() => router.push("/booking/manage" as any)}>
              View All Bookings
            </Button>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  section: {
    marginVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionHeader: {
    marginBottom: theme.spacing.base,
  },
  propertiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  propertyCard: {
    width: "48%",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  propertyIcon: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  propertyName: {
    minHeight: mvs(32),
  },
  emptyPropertiesCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  bookingsContainer: {
    gap: theme.spacing.sm,
  },
  bookingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bookingContent: {
    padding: theme.spacing.base,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.base,
  },
  bookingIcon: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    justifyContent: "center",
    alignItems: "center",
  },
  bookingInfo: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xxs,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  emptyText: {
    textAlign: "center",
  },
}));
