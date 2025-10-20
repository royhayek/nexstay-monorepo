import { Button } from "@/components/atoms/button";
import { Text } from "@/components/atoms/text";
import { DateRangeSelectorInline } from "@/components/organisms/date-range-selector-inline";
import { GuestSelector } from "@/components/organisms/guest-selector";
import { useBooking } from "@/contexts";
import { router, useLocalSearchParams } from "expo-router";
import { BedIcon, BathtubIcon, UsersIcon, StarIcon, MapPinIcon } from "phosphor-react-native";
import React, { useState, useEffect } from "react";
import { Alert, Image, ScrollView, View, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { ms } from "@/utils/scaling";
import { ModalHeader } from "@/components";
import { usePropertiesPublicControllerFindOne } from "@/api/queries/public/properties-public/properties-public";

export default function BookingInitiateScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const insets = useSafeAreaInsets();
  const { bookingDraft, updateDates, updateGuests, updateProperty } = useBooking();

  // Fetch property if booking draft doesn't exist
  const { data: propertyData, isLoading: isLoadingProperty } = usePropertiesPublicControllerFindOne(
    propertyId as string,
    {
      query: {
        enabled: !bookingDraft?.propertyDetails && !!propertyId,
      },
    }
  );

  // Initialize booking draft with property data if it's missing
  useEffect(() => {
    if (propertyData?.data && !bookingDraft?.propertyDetails) {
      updateProperty(propertyData.data);
    }
  }, [propertyData, bookingDraft, updateProperty]);

  const [checkIn, setCheckIn] = useState<Date | null>(bookingDraft?.checkIn || null);
  const [checkOut, setCheckOut] = useState<Date | null>(bookingDraft?.checkOut || null);
  const [guests, setGuests] = useState(
    bookingDraft?.guests || {
      adults: 1,
      children: 0,
      infants: 0,
      totalGuests: 1,
    }
  );

  const property = bookingDraft?.propertyDetails;
  const maxCapacity = property?.accommodates || 16;

  const handleCheckInChange = (date: Date) => {
    setCheckIn(date);
  };

  const handleCheckOutChange = (date: Date) => {
    setCheckOut(date);
  };

  const handleGuestsChange = (newGuests: typeof guests) => {
    setGuests(newGuests);
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const validateAndContinue = () => {
    // Check if booking draft exists
    if (!bookingDraft) {
      Alert.alert("Error", "Booking information is missing. Please try again.");
      router.back();
      return;
    }

    // Validation
    if (!checkIn || !checkOut) {
      Alert.alert("Invalid Dates", "Please select both check-in and check-out dates.");
      return;
    }

    const nights = calculateNights();
    if (nights < 1) {
      Alert.alert("Invalid Dates", "Check-out date must be at least 1 day after check-in date.");
      return;
    }

    if (guests.totalGuests > maxCapacity) {
      Alert.alert("Too Many Guests", `This property can accommodate a maximum of ${maxCapacity} guests.`);
      return;
    }

    if (guests.adults < 1) {
      Alert.alert("Invalid Guests", "At least 1 adult is required for booking.");
      return;
    }

    // Update booking context
    updateDates(checkIn, checkOut, nights);
    updateGuests(guests);

    // Navigate to next step
    router.push(`/booking/details/${propertyId}`);
  };

  const handleBack = () => {
    router.back();
  };

  const nights = calculateNights();
  const canContinue = checkIn && checkOut && nights > 0 && guests.totalGuests <= maxCapacity;

  // Show loading state while fetching property
  if (isLoadingProperty) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" />
        <Text variant="bodyLargeRegular" style={{ marginTop: 16 }}>
          Loading property details...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      {/* Header */}
      <ModalHeader title="Select Dates & Guests" onBackPress={handleBack} />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Property Details Card */}
        {property && (
          <View style={styles.propertyCard}>
            {/* Property Image */}
            {property.images && property.images.length > 0 && (
              <Image source={{ uri: property.images[0].url }} style={styles.propertyImage} resizeMode="cover" />
            )}

            <View style={styles.propertyDetails}>
              {/* Property Name & Location */}
              <View style={styles.propertyHeader}>
                <Text variant="h6SemiBold" numberOfLines={2}>
                  {property.name}
                </Text>
                {property.address && (
                  <View style={styles.locationRow}>
                    <MapPinIcon size={ms(14)} />
                    <Text variant="bodySmallRegular" color="textSecondary" numberOfLines={1}>
                      {property.address.street}, {property.address.country}
                    </Text>
                  </View>
                )}
              </View>

              {/* Property Type & Room Type */}
              {(property.propertyType || property.roomType) && (
                <View style={styles.typeRow}>
                  {property.propertyType && (
                    <Text variant="bodySmallRegular" color="textSecondary">
                      {property.propertyType.replace(/_/g, " ")}
                    </Text>
                  )}
                  {property.propertyType && property.roomType && (
                    <Text variant="bodySmallRegular" color="textSecondary">
                      {" • "}
                    </Text>
                  )}
                  {property.roomType && (
                    <Text variant="bodySmallRegular" color="textSecondary">
                      {property.roomType.replace(/_/g, " ")}
                    </Text>
                  )}
                </View>
              )}

              {/* Property Specs */}
              <View style={styles.specsRow}>
                {property.accommodates && (
                  <View style={styles.specItem}>
                    <UsersIcon size={ms(16)} />
                    <Text variant="bodySmallRegular">
                      {property.accommodates} {property.accommodates === 1 ? "guest" : "guests"}
                    </Text>
                  </View>
                )}
                {property.bedrooms && (
                  <View style={styles.specItem}>
                    <BedIcon size={ms(16)} />
                    <Text variant="bodySmallRegular">
                      {property.bedrooms} {property.bedrooms === 1 ? "bedroom" : "bedrooms"}
                    </Text>
                  </View>
                )}
                {property.bathrooms && (
                  <View style={styles.specItem}>
                    <BathtubIcon size={ms(16)} />
                    <Text variant="bodySmallRegular">
                      {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Reviews Rating */}
              {property.averageRating && property.numberOfReviews && (
                <View style={styles.ratingRow}>
                  <StarIcon size={ms(16)} weight="fill" />
                  <Text variant="bodyMediumSemiBold">{property.averageRating.toFixed(1)}</Text>
                  <Text variant="bodySmallRegular" color="textSecondary">
                    ({property.numberOfReviews} {property.numberOfReviews === 1 ? "review" : "reviews"})
                  </Text>
                </View>
              )}

              {/* Cancellation Policy */}
              {property.cancellationPolicy && (
                <View style={styles.policyBadge}>
                  <Text variant="bodyXSmallSemiBold" color="primary">
                    {property.cancellationPolicy.replace(/_/g, " ")} CANCELLATION
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Date Range Selector */}
        <DateRangeSelectorInline
          checkIn={checkIn}
          checkOut={checkOut}
          onCheckInChange={handleCheckInChange}
          onCheckOutChange={handleCheckOutChange}
        />

        {/* Guest Selector */}
        <GuestSelector guests={guests} maxCapacity={maxCapacity} onGuestsChange={handleGuestsChange} />

        {/* Pricing Summary (if dates selected) */}
        {nights > 0 && property && (
          <View style={styles.pricingSummary}>
            <Text variant="bodyLargeSemiBold" style={styles.pricingTitle}>
              Price Summary
            </Text>
            <View style={styles.pricingRow}>
              <Text variant="bodyMediumRegular" color="textSecondary">
                ${property.price?.pricePerNight || 0} × {nights} {nights === 1 ? "night" : "nights"}
              </Text>
              <Text variant="bodyMediumSemiBold">${((property.price?.pricePerNight || 0) * nights).toFixed(2)}</Text>
            </View>
            {property.cleaningFee && property.cleaningFee > 0 && (
              <View style={styles.pricingRow}>
                <Text variant="bodyMediumRegular" color="textSecondary">
                  Cleaning fee
                </Text>
                <Text variant="bodyMediumSemiBold">${property.cleaningFee.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.pricingRow}>
              <Text variant="bodyLargeSemiBold">Estimated Total</Text>
              <Text variant="bodyLargeSemiBold">
                ${((property.price?.pricePerNight || 0) * nights + (property.cleaningFee || 0)).toFixed(2)}
              </Text>
            </View>
            <Text variant="bodyXSmallRegular" color="textSecondary" style={styles.priceNote}>
              Final price includes service fees and taxes
            </Text>
          </View>
        )}

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button variant="filled" size="large" onPress={validateAndContinue} disabled={!canContinue} fullWidth>
          Continue
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
  centerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  propertyCard: {
    width: "100%",
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    position: "relative",
    ...theme.shadows.sm,
  },
  propertyImage: {
    width: "100%",
    height: ms(200),
    borderRadius: theme.borderRadius.lg,
  },
  propertyDetails: {
    paddingVertical: theme.spacing.base,
    gap: theme.spacing.sm,
  },
  propertyHeader: {
    gap: theme.spacing.xxs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
    marginTop: theme.spacing.xxs,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  specsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.base,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  amenitiesPreview: {
    gap: theme.spacing.xxs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: theme.borderWidth.thin,
    borderTopColor: theme.colors.border,
  },
  policyBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    backgroundColor: theme.colors.primaryLight || theme.colors.primary + "20",
    borderRadius: theme.borderRadius.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  pricingSummary: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  pricingTitle: {
    marginBottom: theme.spacing.xs,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: theme.borderWidth.thin,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  priceNote: {
    marginTop: theme.spacing.xs,
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
