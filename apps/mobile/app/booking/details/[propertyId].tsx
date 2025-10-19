import { Button } from "@/components/atoms/button";
import { IconButton } from "@/components/atoms/icon-button";
import { Input } from "@/components/atoms/input";
import { Text } from "@/components/atoms/text";
import { useBooking } from "@/contexts";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeftIcon, ClockIcon } from "phosphor-react-native";
import React, { useState } from "react";
import { Alert, Platform, ScrollView, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { ms } from "@/utils/scaling";

export default function BookingDetailsScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const insets = useSafeAreaInsets();
  const { bookingDraft, updateGuestInfo, updateArrivalTime, updateSpecialRequests } = useBooking();

  const [phone, setPhone] = useState(bookingDraft?.guestInfo.phone || "");
  const [email, setEmail] = useState(bookingDraft?.guestInfo.email || "");
  const [arrivalTime, setArrivalTime] = useState(bookingDraft?.arrivalTime || "");
  const [specialRequests, setSpecialRequests] = useState(bookingDraft?.specialRequests || "");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());

  const [errors, setErrors] = useState({
    phone: "",
    email: "",
  });

  const property = bookingDraft?.propertyDetails;

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
  };

  const formatTimeDisplay = (time: string) => {
    if (!time) return "Select time";
    return time;
  };

  const handleTimeChange = (_event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      const timeString = `${hours}:${minutes}`;
      setArrivalTime(timeString);
      setSelectedTime(selectedDate);
    }
  };

  const validateAndContinue = () => {
    const newErrors = {
      phone: "",
      email: "",
    };

    // Validate email if provided
    if (email && !validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate phone if provided
    if (phone && !validatePhone(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Validate special requests length
    if (specialRequests.length > 500) {
      Alert.alert("Special Requests Too Long", "Special requests must be 500 characters or less.");
      return;
    }

    setErrors(newErrors);

    // Check if there are any errors
    if (newErrors.email || newErrors.phone) {
      return;
    }

    // Update booking context
    updateGuestInfo({ phone, email });
    if (arrivalTime) {
      updateArrivalTime(arrivalTime);
    }
    if (specialRequests) {
      updateSpecialRequests(specialRequests);
    }

    // Navigate to review screen
    router.push(`/booking/review/${propertyId}`);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton onPress={handleBack} style={styles.backButton}>
          <ArrowLeftIcon size={24} />
        </IconButton>
        <Text variant="h6SemiBold">Booking Details</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Property Info */}
      {property && (
        <View style={styles.propertyInfo}>
          <Text variant="bodyLargeSemiBold" numberOfLines={2}>
            {property.name}
          </Text>
          {bookingDraft?.checkIn && bookingDraft?.checkOut && (
            <Text variant="bodySmallRegular" color="textSecondary">
              {new Date(bookingDraft.checkIn).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              -{" "}
              {new Date(bookingDraft.checkOut).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              · {bookingDraft.nights} {bookingDraft.nights === 1 ? "night" : "nights"}
            </Text>
          )}
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Contact Information Section */}
        <View style={styles.section}>
          <Text variant="bodyLargeSemiBold" style={styles.sectionTitle}>
            Contact Information
          </Text>
          <Text variant="bodySmallRegular" color="textSecondary" style={styles.sectionDescription}>
            Optional. We'll use this to send you booking confirmations and updates.
          </Text>

          <View style={styles.formContainer}>
            <Input
              variant="phone"
              label="Phone Number"
              placeholder="+1 234 567 8900"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              error={errors.phone}
              maxLength={20}
            />

            <Input
              label="Email Address"
              placeholder="your.email@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />
          </View>
        </View>

        {/* Arrival Time Section */}
        <View style={styles.section}>
          <Text variant="bodyLargeSemiBold" style={styles.sectionTitle}>
            Arrival Information
          </Text>
          <Text variant="bodySmallRegular" color="textSecondary" style={styles.sectionDescription}>
            Let your host know when you plan to arrive.
          </Text>

          <TouchableOpacity
            style={styles.timeSelector}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.timeSelectorContent}>
              <View style={styles.iconContainer}>
                <ClockIcon size={ms(20)} />
              </View>
              <View style={styles.timeSelectorTextContainer}>
                <Text variant="bodyXSmallRegular" color="textSecondary">
                  Estimated Arrival Time
                </Text>
                <Text variant="bodyMediumSemiBold" color={arrivalTime ? "text" : "neutral400"}>
                  {formatTimeDisplay(arrivalTime)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Special Requests Section */}
        <View style={styles.section}>
          <Text variant="bodyLargeSemiBold" style={styles.sectionTitle}>
            Special Requests
          </Text>
          <Text variant="bodySmallRegular" color="textSecondary" style={styles.sectionDescription}>
            Any special needs or preferences? Let your host know (optional, max 500 characters).
          </Text>

          <Input
            variant="multiline"
            placeholder="E.g., Early check-in, extra towels, accessibility needs..."
            value={specialRequests}
            onChangeText={setSpecialRequests}
            multiline
            numberOfLines={4}
            maxLength={500}
            helpText={`${specialRequests.length}/500 characters`}
          />
        </View>

        {/* Information Note */}
        <View style={styles.infoBox}>
          <Text variant="bodySmallRegular" color="textSecondary">
            📌 Your information helps the host prepare for your stay. All details are optional but recommended
            for a smooth check-in experience.
          </Text>
        </View>

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button variant="filled" size="large" onPress={validateAndContinue} fullWidth>
          Continue to Review
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
  propertyInfo: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
    gap: theme.spacing.xxs,
    borderBottomWidth: theme.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    marginBottom: theme.spacing.xxs,
  },
  sectionDescription: {
    lineHeight: 20,
  },
  formContainer: {
    gap: theme.spacing.md,
  },
  timeSelector: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    minHeight: ms(80),
  },
  timeSelectorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  iconContainer: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: theme.colors.primaryLight || theme.colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  timeSelectorTextContainer: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  infoBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
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
