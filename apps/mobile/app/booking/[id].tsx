import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { IconButton } from "@/components/atoms/icon-button";
import { Text } from "@/components/atoms/text";
import { LocationDisplay } from "@/components/molecules";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChatCircleIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  UsersIcon,
} from "phosphor-react-native";
import React from "react";
import { ActivityIndicator, Alert, Image, Linking, ScrollView, Share, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { ms } from "@/utils/scaling";
import { useBookingsAppControllerFindOne, useBookingsAppControllerCancel } from "@/api/queries/protected/bookings/bookings";

export default function BookingDetailsViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // Fetch booking data from API
  const { data: response, isLoading, isError, error, refetch } = useBookingsAppControllerFindOne(id!, {
    query: {
      enabled: !!id,
    },
  });

  // Cancel booking mutation
  const cancelBookingMutation = useBookingsAppControllerCancel({
    mutation: {
      onSuccess: () => {
        Alert.alert("Booking Cancelled", "Your booking has been cancelled successfully.");
        refetch(); // Refresh booking data
      },
      onError: (error: any) => {
        Alert.alert(
          "Cancellation Failed",
          error?.response?.data?.message || error?.message || "Unable to cancel booking. Please try again."
        );
      },
    },
  });

  const booking = response?.data;

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "confirmed":
        return "success";
      case "checked_in":
        return "info";
      case "checked_out":
        return "neutral";
      case "cancelled":
        return "error";
      default:
        return "neutral";
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleBack = () => {
    router.back();
  };

  const handleCancel = () => {
    if (!id) return;

    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking? This action cannot be undone.",
      [
        { text: "No, Keep Booking", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            cancelBookingMutation.mutate({ id });
          },
        },
      ]
    );
  };

  const handleMessageHost = () => {
    router.push("/messages/host-123");
  };

  const handleGetDirections = () => {
    if (!booking?.property?.address?.location?.coordinates) return;

    const [longitude, latitude] = booking.property.address.location.coordinates;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const handleCallHost = () => {
    // Note: Phone number not available in current API response
    // This would need to be added to the backend response or fetched separately
    Alert.alert("Contact Host", "Please use the message feature to contact the host.");
  };

  const handleShare = async () => {
    if (!booking) return;

    try {
      await Share.share({
        message: `My booking at ${booking.property.name}\nConfirmation: ${booking.confirmationCode || ''}\nCheck-in: ${formatDate(booking.checkIn)}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleWriteReview = () => {
    if (!booking) return;

    router.push({
      pathname: `/review/write/${booking._id}`,
      params: {
        bookingId: booking._id,
        propertyId: booking.property._id,
        hostId: booking.property.host || '',
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <IconButton onPress={handleBack} style={styles.backButton}>
            <ArrowLeftIcon size={24} />
          </IconButton>
          <Text variant="h6SemiBold">Booking Details</Text>
          <View style={styles.shareButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMediumRegular" color="textSecondary" style={styles.loadingText}>
            Loading booking details...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (isError || !booking) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <IconButton onPress={handleBack} style={styles.backButton}>
            <ArrowLeftIcon size={24} />
          </IconButton>
          <Text variant="h6SemiBold">Booking Details</Text>
          <View style={styles.shareButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text variant="bodyLargeSemiBold" textAlign="center">
            Unable to Load Booking
          </Text>
          <Text variant="bodyMediumRegular" color="textSecondary" textAlign="center" style={styles.errorMessage}>
            {error instanceof Error ? error.message : "Something went wrong. Please try again."}
          </Text>
          <Button variant="filled" size="medium" onPress={() => refetch()}>
            Try Again
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton onPress={handleBack} style={styles.backButton}>
          <ArrowLeftIcon size={24} />
        </IconButton>
        <Text variant="h6SemiBold">Booking Details</Text>
        <IconButton onPress={handleShare} style={styles.shareButton}>
          <Text variant="bodyMediumRegular">Share</Text>
        </IconButton>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status & Confirmation */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Badge variant={getStatusColor(booking.status)} size="medium">
              {getStatusLabel(booking.status)}
            </Badge>
          </View>
          <View style={styles.confirmationRow}>
            <Text variant="bodySmallRegular" color="textSecondary">
              Confirmation Code
            </Text>
            <Text variant="h6SemiBold">{booking.confirmationCode}</Text>
          </View>
        </View>

        {/* Property Card */}
        <View style={styles.propertyCard}>
          <Image source={{ uri: booking.property.images[0].url }} style={styles.propertyImage} resizeMode="cover" />
          <View style={styles.propertyInfo}>
            <Text variant="bodyLargeSemiBold" numberOfLines={2}>
              {booking.property.name}
            </Text>
            <LocationDisplay
              location={`${booking.property.address.street}, ${booking.property.address.country}`}
              style={styles.location}
            />
            <Text variant="bodySmallRegular" color="textSecondary">
              Host: {booking.host.firstName} {booking.host.lastName}
            </Text>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text variant="bodyLargeSemiBold" style={styles.sectionTitle}>
            Booking Information
          </Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <CalendarIcon size={ms(20)} />
              </View>
              <View style={styles.detailContent}>
                <Text variant="bodySmallRegular" color="textSecondary">
                  Check-in
                </Text>
                <Text variant="bodyMediumSemiBold">{formatDate(booking.checkIn)}</Text>
                {booking.estimatedArrivalTime && (
                  <Text variant="bodySmallRegular" color="textSecondary">
                    Estimated arrival: {booking.estimatedArrivalTime}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <CalendarIcon size={ms(20)} />
              </View>
              <View style={styles.detailContent}>
                <Text variant="bodySmallRegular" color="textSecondary">
                  Check-out
                </Text>
                <Text variant="bodyMediumSemiBold">{formatDate(booking.checkOut)}</Text>
                <Text variant="bodySmallRegular" color="textSecondary">
                  {booking.nights} {booking.nights === 1 ? "night" : "nights"}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <UsersIcon size={ms(20)} />
              </View>
              <View style={styles.detailContent}>
                <Text variant="bodySmallRegular" color="textSecondary">
                  Guests
                </Text>
                <Text variant="bodyMediumSemiBold">
                  {booking.guests.adults} {booking.guests.adults === 1 ? "Adult" : "Adults"}
                  {booking.guests.children ? `, ${booking.guests.children} Children` : ""}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Special Requests */}
        {booking.specialRequests && (
          <View style={styles.section}>
            <Text variant="bodyLargeSemiBold" style={styles.sectionTitle}>
              Special Requests
            </Text>
            <View style={styles.requestsBox}>
              <Text variant="bodyMediumRegular">{booking.specialRequests}</Text>
            </View>
          </View>
        )}

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text variant="bodyLargeSemiBold" style={styles.sectionTitle}>
            Price Details
          </Text>

          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text variant="bodyMediumRegular" color="textSecondary">
                ${(booking.pricing.baseAmount / booking.nights).toFixed(2)} × {booking.nights}{" "}
                {booking.nights === 1 ? "night" : "nights"}
              </Text>
              <Text variant="bodyMediumSemiBold">${booking.pricing.baseAmount.toFixed(2)}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text variant="bodyMediumRegular" color="textSecondary">
                Cleaning fee
              </Text>
              <Text variant="bodyMediumSemiBold">${booking.pricing.cleaningFee.toFixed(2)}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text variant="bodyMediumRegular" color="textSecondary">
                Service fee
              </Text>
              <Text variant="bodyMediumSemiBold">${booking.pricing.serviceFee.toFixed(2)}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text variant="bodyMediumRegular" color="textSecondary">
                Taxes
              </Text>
              <Text variant="bodyMediumSemiBold">${booking.pricing.occupancyTaxes.toFixed(2)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <Text variant="bodyLargeSemiBold">Total ({booking.pricing.currency})</Text>
              <Text variant="bodyLargeSemiBold">${booking.pricing.totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleMessageHost} activeOpacity={0.7}>
            <View style={styles.actionIconContainer}>
              <ChatCircleIcon size={ms(24)} />
            </View>
            <Text variant="bodyMediumSemiBold">Message Host</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleGetDirections} activeOpacity={0.7}>
            <View style={styles.actionIconContainer}>
              <MapPinIcon size={ms(24)} />
            </View>
            <Text variant="bodyMediumSemiBold">Get Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleCallHost} activeOpacity={0.7}>
            <View style={styles.actionIconContainer}>
              <PhoneIcon size={ms(24)} />
            </View>
            <Text variant="bodyMediumSemiBold">Call Host</Text>
          </TouchableOpacity>
        </View>

        {/* Cancel Button (only for confirmed bookings) */}
        {booking.status === "confirmed" && (
          <View style={styles.cancelContainer}>
            <Button variant="outlined" color="error" size="medium" onPress={handleCancel} fullWidth>
              Cancel Booking
            </Button>
          </View>
        )}

        {/* Write Review Button (only for completed bookings) */}
        {(booking.status === "completed" || booking.status === "checked_out") && (
          <View style={styles.reviewContainer}>
            <Button variant="filled" size="medium" onPress={handleWriteReview} fullWidth>
              <View style={styles.reviewButtonContent}>
                <StarIcon size={20} color="#fff" weight="fill" />
                <Text variant="bodyMediumSemiBold" style={styles.reviewButtonText}>
                  Write a Review
                </Text>
              </View>
            </Button>
          </View>
        )}

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
    borderBottomWidth: theme.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    paddingHorizontal: theme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.base,
    gap: theme.spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  confirmationRow: {
    gap: theme.spacing.xxs,
  },
  propertyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    overflow: "hidden",
  },
  propertyImage: {
    width: "100%",
    height: ms(200),
  },
  propertyInfo: {
    padding: theme.spacing.base,
    gap: theme.spacing.xs,
  },
  location: {
    marginTop: 0,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    marginBottom: theme.spacing.xs,
  },
  detailsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.base,
    gap: theme.spacing.base,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  detailIconContainer: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: theme.colors.primaryLight || theme.colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  detailContent: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  requestsBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  priceContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: theme.borderWidth.thin,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.base,
    alignItems: "center",
    gap: theme.spacing.xs,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  actionIconContainer: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    backgroundColor: theme.colors.primaryLight || theme.colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelContainer: {
    paddingTop: theme.spacing.md,
  },
  reviewContainer: {
    paddingTop: theme.spacing.md,
  },
  reviewButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },
  reviewButtonText: {
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: theme.spacing.lg,
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
  errorContainer: {
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
