import { router } from "expo-router";
import React, { useState } from "react";
import { View, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert, RefreshControl } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Calendar, User, DollarCircle, TickCircle, CloseCircle } from "iconsax-react-native";
import { useQueryClient } from "@tanstack/react-query";

import { Button, Text } from "@/components/atoms";
import { ScreenTemplate } from "@/components/templates";
import { EmptyState } from "@/components/molecules";
import { ms, mvs } from "@/utils/scaling";
import {
  useBookingsAppControllerGetHostBookings,
  useBookingsAppControllerAccept,
  useBookingsAppControllerReject,
  getBookingsAppControllerGetHostBookingsQueryKey,
} from "@/api/queries/protected/bookings/bookings";
import type { BookingResponseDto } from "@/api/models/protected";

/**
 * Booking Management Screen
 *
 * Allows hosts to:
 * - View all bookings for their properties
 * - Accept/reject pending bookings
 * - View booking details
 * - Filter by status
 */
export default function BookingManageScreen() {
  const { theme } = useUnistyles();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch host bookings
  const { data, isLoading, error, refetch } = useBookingsAppControllerGetHostBookings({
    status: statusFilter,
  });

  // Accept booking mutation
  const { mutateAsync: acceptBooking, isPending: isAccepting } = useBookingsAppControllerAccept({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getBookingsAppControllerGetHostBookingsQueryKey(),
        });
      },
    },
  });

  // Reject booking mutation
  const { mutateAsync: rejectBooking, isPending: isRejecting } = useBookingsAppControllerReject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getBookingsAppControllerGetHostBookingsQueryKey(),
        });
      },
    },
  });

  const bookings = data?.data?.items || [];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAcceptBooking = (booking: BookingResponseDto) => {
    Alert.alert(
      "Accept Booking",
      `Accept booking from ${booking.guest.firstName} ${booking.guest.lastName}?\n\nCheck-in: ${new Date(
        booking.checkIn
      ).toLocaleDateString()}\nCheck-out: ${new Date(booking.checkOut).toLocaleDateString()}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            try {
              await acceptBooking({ id: booking._id });
              Alert.alert("Success", "Booking accepted successfully");
            } catch (error: any) {
              Alert.alert("Error", error?.response?.data?.message || "Failed to accept booking");
            }
          },
        },
      ]
    );
  };

  const handleRejectBooking = (booking: BookingResponseDto) => {
    Alert.alert(
      "Reject Booking",
      `Reject booking from ${booking.guest.firstName} ${booking.guest.lastName}?\n\nThis action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              await rejectBooking({ id: booking._id });
              Alert.alert("Success", "Booking rejected successfully");
            } catch (error: any) {
              Alert.alert("Error", error?.response?.data?.message || "Failed to reject booking");
            }
          },
        },
      ]
    );
  };

  const handleBookingPress = (booking: BookingResponseDto) => {
    // Navigate to booking details screen (to be implemented)
    console.log("View booking details:", booking._id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return theme.colors.success;
      case "pending":
        return theme.colors.warning;
      case "cancelled":
        return theme.colors.error;
      case "checked_in":
        return theme.colors.info;
      case "checked_out":
        return theme.colors.neutral500;
      default:
        return theme.colors.neutral500;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmed";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      case "checked_in":
        return "Checked In";
      case "checked_out":
        return "Checked Out";
      default:
        return status;
    }
  };

  const statusFilters = [
    { label: "All", value: undefined },
    { label: "Pending", value: "pending" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Cancelled", value: "cancelled" },
  ];

  if (isLoading) {
    return (
      <ScreenTemplate title="Bookings" onBackPress={() => router.back()}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.loadingText}>
            Loading bookings...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  if (error) {
    return (
      <ScreenTemplate title="Bookings" onBackPress={() => router.back()}>
        <View style={styles.errorContainer}>
          <Text variant="bodyMediumRegular" color="error" style={styles.errorText}>
            Failed to load bookings
          </Text>
          <Button variant="outlined" onPress={() => refetch()}>
            Try Again
          </Button>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate title="Bookings" onBackPress={() => router.back()}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          bookings.length === 0 && styles.emptyContent,
          { paddingBottom: mvs(40) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Status Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {statusFilters.map((filter) => (
              <TouchableOpacity
                key={filter.label}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: statusFilter === filter.value ? theme.colors.primary : theme.colors.neutral100,
                  },
                ]}
                onPress={() => setStatusFilter(filter.value)}
              >
                <Text variant="bodySmallSemiBold" color={statusFilter === filter.value ? "neutral0" : "neutral700"}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {bookings.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <EmptyState
              icon={<Calendar size={ms(64)} variant="Bulk" color={theme.colors.primary} />}
              title="No bookings yet"
              description={
                statusFilter
                  ? `No ${statusFilter} bookings found`
                  : "You don't have any bookings for your properties yet"
              }
            />
          </View>
        ) : (
          <View style={styles.bookingsContainer}>
            {bookings.map((booking: BookingResponseDto) => {
              const isPending = booking.status === "pending";
              const propertyImage = booking.property.images?.[0]?.url;

              return (
                <TouchableOpacity
                  key={booking._id}
                  style={styles.bookingCard}
                  onPress={() => handleBookingPress(booking)}
                  activeOpacity={0.7}
                  disabled={isAccepting || isRejecting}
                >
                  {/* Property Image */}
                  <View style={styles.imageContainer}>
                    {propertyImage ? (
                      <Image source={{ uri: propertyImage }} style={styles.propertyImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.propertyImage, styles.placeholderImage]}>
                        <Calendar size={ms(32)} color={theme.colors.neutral400} variant="Outline" />
                      </View>
                    )}

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: theme.colors.surface }]}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
                      <Text variant="bodySmallSemiBold" color="neutral900">
                        {getStatusLabel(booking.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Booking Info */}
                  <View style={styles.bookingInfo}>
                    <Text variant="bodyLargeSemiBold" color="neutral900" numberOfLines={1}>
                      {booking.property.name}
                    </Text>

                    {/* Guest Info */}
                    <View style={styles.infoRow}>
                      <User size={ms(16)} color={theme.colors.neutral600} variant="Outline" />
                      <Text variant="bodySmallRegular" color="neutral600">
                        {booking.guest.firstName} {booking.guest.lastName}
                      </Text>
                    </View>

                    {/* Dates */}
                    <View style={styles.infoRow}>
                      <Calendar size={ms(16)} color={theme.colors.neutral600} variant="Outline" />
                      <Text variant="bodySmallRegular" color="neutral600">
                        {new Date(booking.checkIn).toLocaleDateString()} -{" "}
                        {new Date(booking.checkOut).toLocaleDateString()} • {booking.nights} night
                        {booking.nights > 1 ? "s" : ""}
                      </Text>
                    </View>

                    {/* Pricing */}
                    <View style={styles.infoRow}>
                      <DollarCircle size={ms(16)} color={theme.colors.neutral600} variant="Outline" />
                      <Text variant="bodySmallSemiBold" color="neutral900">
                        ${booking.pricing.totalAmount.toFixed(2)}
                      </Text>
                      <Text variant="bodySmallRegular" color="neutral600">
                        ({booking.guests.adults + (booking.guests.children || 0)} guest
                        {booking.guests.adults + (booking.guests.children || 0) > 1 ? "s" : ""})
                      </Text>
                    </View>

                    {/* Action Buttons for Pending Bookings */}
                    {isPending && (
                      <View style={styles.actionButtons}>
                        <Button
                          variant="outlined"
                          onPress={() => handleRejectBooking(booking)}
                          style={styles.actionButton}
                          disabled={isAccepting || isRejecting}
                        >
                          <View style={styles.buttonContent}>
                            <CloseCircle size={ms(18)} color={theme.colors.error} variant="Bold" />
                            <Text variant="bodyMediumSemiBold" color="error">
                              Reject
                            </Text>
                          </View>
                        </Button>

                        <Button
                          variant="filled"
                          onPress={() => handleAcceptBooking(booking)}
                          style={styles.actionButton}
                          disabled={isAccepting || isRejecting}
                        >
                          <View style={styles.buttonContent}>
                            <TickCircle size={ms(18)} color={theme.colors.neutral0} variant="Bold" />
                            <Text variant="bodyMediumSemiBold" color="neutral0">
                              Accept
                            </Text>
                          </View>
                        </Button>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenTemplate>
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
  filtersContainer: {
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  filters: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  bookingsContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
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
  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: theme.colors.neutral100,
  },
  propertyImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    backgroundColor: theme.colors.neutral100,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    position: "absolute",
    top: theme.spacing.base,
    left: theme.spacing.base,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statusDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
  },
  bookingInfo: {
    padding: theme.spacing.base,
    gap: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  actionButtons: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
}));
