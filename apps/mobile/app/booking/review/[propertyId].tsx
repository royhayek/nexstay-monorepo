import { Button } from "@/components/atoms/button";
import { IconButton } from "@/components/atoms/icon-button";
import { Text } from "@/components/atoms/text";
import { LocationDisplay } from "@/components/molecules";
import { useBooking } from "@/contexts";
import { useAuth } from "@/hooks/use-auth";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeftIcon, CalendarIcon, UsersIcon, ClockIcon, NoteIcon } from "phosphor-react-native";
import React from "react";
import { Alert, Image, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { ms } from "@/utils/scaling";
import type { CreateBookingDto } from "@/api/models/protected/createBookingDto";
import { useBookingsAppControllerCreate } from "@/api/queries/protected/bookings/bookings";

export default function BookingReviewScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const insets = useSafeAreaInsets();
  const { bookingDraft, clearBooking } = useBooking();
  const { user } = useAuth();

  const property = bookingDraft?.propertyDetails;
  const checkIn = bookingDraft?.checkIn;
  const checkOut = bookingDraft?.checkOut;
  const nights = bookingDraft?.nights || 0;
  const guests = bookingDraft?.guests;

  // Create booking mutation with real API
  const createBookingMutation = useBookingsAppControllerCreate({
    mutation: {
      onSuccess: (response) => {
        // Clear booking draft
        clearBooking();
        // Navigate to success screen
        router.replace(`/booking/success/${response.data._id}`);
      },
      onError: (error: any) => {
        Alert.alert(
          "Booking Failed",
          error?.response?.data?.message || error?.message || "Unable to create booking. Please try again.",
          [{ text: "OK" }]
        );
      },
    },
  });

  const handleConfirmBooking = () => {
    if (!checkIn || !checkOut || !guests || !property) {
      Alert.alert("Missing Information", "Please complete all booking steps.");
      return;
    }

    // Prepare booking data
    const bookingData: CreateBookingDto = {
      propertyId: property._id,
      checkIn: checkIn.toISOString().split("T")[0], // Format: YYYY-MM-DD
      checkOut: checkOut.toISOString().split("T")[0],
      nights,
      guests: {
        adults: guests.adults,
        children: guests.children,
        infants: guests.infants,
        totalGuests: guests.totalGuests,
      },
      ...(bookingDraft.guestInfo.phone && { guestPhone: bookingDraft.guestInfo.phone }),
      ...(bookingDraft.guestInfo.email && { guestEmail: bookingDraft.guestInfo.email }),
      ...(bookingDraft.arrivalTime && { estimatedArrivalTime: bookingDraft.arrivalTime }),
      ...(bookingDraft.specialRequests && { specialRequests: bookingDraft.specialRequests }),
    };

    // Create booking with real API
    createBookingMutation.mutate({ data: bookingData });
  };

  const handleBack = () => {
    router.back();
  };

  const handleEditDates = () => {
    router.back();
    router.back(); // Go back twice to reach date selection
  };

  const handleEditGuestInfo = () => {
    router.back();
  };

  // Calculate pricing
  const basePrice = (property?.price?.pricePerNight || property?.pricePerNight || 0) * nights;
  const cleaningFee = property?.cleaningFee || 0;
  const serviceFee = basePrice * 0.12; // 12% service fee (example)
  const taxes = basePrice * 0.08; // 8% taxes (example)
  const total = basePrice + cleaningFee + serviceFee + taxes;

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const propertyImage = property?.images?.[0]?.url || property?.pictureUrl;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton onPress={handleBack} style={styles.backButton}>
          <ArrowLeftIcon size={24} />
        </IconButton>
        <Text variant="h6SemiBold">Review Booking</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Property Card */}
        {property && (
          <View style={styles.propertyCard}>
            {propertyImage && (
              <Image source={{ uri: propertyImage }} style={styles.propertyImage} resizeMode="cover" />
            )}
            <View style={styles.propertyDetails}>
              <Text variant="bodyLargeSemiBold" numberOfLines={2}>
                {property.name}
              </Text>
              {property.address && (
                <LocationDisplay
                  location={`${property.address.city}, ${property.address.country}`}
                  style={styles.location}
                />
              )}
            </View>
          </View>
        )}

        {/* Booking Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="bodyLargeSemiBold">Booking Details</Text>
            <Button variant="text" size="small" onPress={handleEditDates}>
              Edit
            </Button>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <CalendarIcon size={ms(20)} />
              </View>
              <View style={styles.detailContent}>
                <Text variant="bodySmallRegular" color="textSecondary">
                  Check-in
                </Text>
                <Text variant="bodyMediumSemiBold">{formatDate(checkIn)}</Text>
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
                <Text variant="bodyMediumSemiBold">{formatDate(checkOut)}</Text>
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
                  {guests?.adults} {guests?.adults === 1 ? "Adult" : "Adults"}
                  {guests?.children ? `, ${guests.children} ${guests.children === 1 ? "Child" : "Children"}` : ""}
                  {guests?.infants ? `, ${guests.infants} ${guests.infants === 1 ? "Infant" : "Infants"}` : ""}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Guest Information Section */}
        {(bookingDraft?.guestInfo.phone ||
          bookingDraft?.guestInfo.email ||
          bookingDraft?.arrivalTime ||
          bookingDraft?.specialRequests) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="bodyLargeSemiBold">Guest Information</Text>
              <Button variant="text" size="small" onPress={handleEditGuestInfo}>
                Edit
              </Button>
            </View>

            <View style={styles.detailsContainer}>
              {bookingDraft?.arrivalTime && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIconContainer}>
                    <ClockIcon size={ms(20)} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text variant="bodySmallRegular" color="textSecondary">
                      Estimated Arrival
                    </Text>
                    <Text variant="bodyMediumSemiBold">{bookingDraft.arrivalTime}</Text>
                  </View>
                </View>
              )}

              {bookingDraft?.specialRequests && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIconContainer}>
                    <NoteIcon size={ms(20)} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text variant="bodySmallRegular" color="textSecondary">
                      Special Requests
                    </Text>
                    <Text variant="bodyMediumRegular" numberOfLines={3}>
                      {bookingDraft.specialRequests}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Price Breakdown Section */}
        <View style={styles.section}>
          <Text variant="bodyLargeSemiBold" style={styles.sectionTitle}>
            Price Breakdown
          </Text>

          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text variant="bodyMediumRegular" color="textSecondary">
                ${property?.price?.pricePerNight || property?.pricePerNight || 0} × {nights}{" "}
                {nights === 1 ? "night" : "nights"}
              </Text>
              <Text variant="bodyMediumSemiBold">${basePrice.toFixed(2)}</Text>
            </View>

            {cleaningFee > 0 && (
              <View style={styles.priceRow}>
                <Text variant="bodyMediumRegular" color="textSecondary">
                  Cleaning fee
                </Text>
                <Text variant="bodyMediumSemiBold">${cleaningFee.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.priceRow}>
              <Text variant="bodyMediumRegular" color="textSecondary">
                Service fee
              </Text>
              <Text variant="bodyMediumSemiBold">${serviceFee.toFixed(2)}</Text>
            </View>

            <View style={styles.priceRow}>
              <Text variant="bodyMediumRegular" color="textSecondary">
                Taxes
              </Text>
              <Text variant="bodyMediumSemiBold">${taxes.toFixed(2)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <Text variant="h6SemiBold">Total</Text>
              <Text variant="h6SemiBold">${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Cancellation Policy */}
        {property?.cancellationPolicy && (
          <View style={styles.policyBox}>
            <Text variant="bodyMediumSemiBold" style={styles.policyTitle}>
              Cancellation Policy
            </Text>
            <Text variant="bodySmallRegular" color="textSecondary">
              {property.cancellationPolicy === "FLEXIBLE"
                ? "Free cancellation up to 24 hours before check-in. After that, cancel up to 7 days before check-in and get a 50% refund."
                : property.cancellationPolicy === "MODERATE"
                ? "Free cancellation up to 5 days before check-in. After that, the first night is non-refundable."
                : property.cancellationPolicy === "STRICT"
                ? "Free cancellation up to 14 days before check-in. After that, the reservation is non-refundable."
                : "Please check with the host for cancellation details."}
            </Text>
          </View>
        )}

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          variant="filled"
          size="large"
          onPress={handleConfirmBooking}
          loading={createBookingMutation.isPending}
          disabled={createBookingMutation.isPending}
          fullWidth
        >
          {createBookingMutation.isPending ? "Processing..." : "Confirm & Pay"}
        </Button>
      </View>
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
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
  propertyDetails: {
    padding: theme.spacing.base,
    gap: theme.spacing.xs,
  },
  location: {
    marginTop: 0,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  policyBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
    gap: theme.spacing.sm,
  },
  policyTitle: {
    marginBottom: theme.spacing.xxs,
  },
  bottomSpacer: {
    height: theme.spacing.mega,
  },
  bottomBar: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.base,
    backgroundColor: theme.colors.background,
    borderTopWidth: theme.borderWidth.thin,
    borderTopColor: theme.colors.border,
    ...theme.shadows.sm,
  },
}));
