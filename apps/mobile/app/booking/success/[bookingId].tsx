import { Button } from "@/components/atoms/button";
import { Text } from "@/components/atoms/text";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircleIcon, CalendarIcon, MapPinIcon } from "phosphor-react-native";
import React from "react";
import { ScrollView, View } from "react-native";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { ms } from "@/utils/scaling";

export default function BookingSuccessScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const insets = useSafeAreaInsets();

  // Mock confirmation code (in real app, this would come from the booking response)
  const confirmationCode = "NK-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleViewDetails = () => {
    router.replace(`/booking/${bookingId}`);
  };

  const handleGoHome = () => {
    router.replace("/(tabs)");
  };

  const handleViewBookings = () => {
    router.replace("/(tabs)/booking-history");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <Animated.View entering={ZoomIn.duration(400).delay(100)} style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <CheckCircleIcon size={ms(64)} color="#fff" weight="fill" />
          </View>
        </Animated.View>

        {/* Success Message */}
        <Animated.View entering={FadeInUp.duration(400).delay(300)} style={styles.messageContainer}>
          <Text variant="h5SemiBold" textAlign="center">
            Booking Confirmed!
          </Text>
          <Text variant="bodyMediumRegular" color="textSecondary" textAlign="center" style={styles.subtitle}>
            Your reservation has been successfully created. Check your email for confirmation details.
          </Text>
        </Animated.View>

        {/* Confirmation Code */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.confirmationCard}>
          <Text variant="bodySmallRegular" color="textSecondary" textAlign="center">
            Confirmation Code
          </Text>
          <Text variant="h4SemiBold" textAlign="center" style={styles.confirmationCode}>
            {confirmationCode}
          </Text>
          <Text variant="bodyXSmallRegular" color="textSecondary" textAlign="center">
            Save this code for your records
          </Text>
        </Animated.View>

        {/* Quick Info Cards */}
        <Animated.View entering={FadeInUp.duration(400).delay(500)} style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <CalendarIcon size={ms(24)} />
            </View>
            <Text variant="bodySmallRegular" color="textSecondary">
              Check-in
            </Text>
            <Text variant="bodyMediumSemiBold">Today, 3:00 PM</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <MapPinIcon size={ms(24)} />
            </View>
            <Text variant="bodySmallRegular" color="textSecondary">
              Location
            </Text>
            <Text variant="bodyMediumSemiBold" numberOfLines={2} textAlign="center">
              View on map
            </Text>
          </View>
        </Animated.View>

        {/* What's Next Section */}
        <Animated.View entering={FadeInUp.duration(400).delay(600)} style={styles.nextStepsContainer}>
          <Text variant="bodyLargeSemiBold" style={styles.nextStepsTitle}>
            What's Next?
          </Text>

          <View style={styles.stepsList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text variant="bodySmallSemiBold" color="onPrimary">
                  1
                </Text>
              </View>
              <View style={styles.stepContent}>
                <Text variant="bodyMediumSemiBold">Check Your Email</Text>
                <Text variant="bodySmallRegular" color="textSecondary">
                  We've sent booking confirmation and host contact details
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text variant="bodySmallSemiBold" color="onPrimary">
                  2
                </Text>
              </View>
              <View style={styles.stepContent}>
                <Text variant="bodyMediumSemiBold">Message Your Host</Text>
                <Text variant="bodySmallRegular" color="textSecondary">
                  Introduce yourself and confirm arrival time
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text variant="bodySmallSemiBold" color="onPrimary">
                  3
                </Text>
              </View>
              <View style={styles.stepContent}>
                <Text variant="bodyMediumSemiBold">Prepare for Check-in</Text>
                <Text variant="bodySmallRegular" color="textSecondary">
                  Review house rules and check-in instructions
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInUp.duration(400).delay(700)} style={styles.actionsContainer}>
          <Button variant="filled" size="large" onPress={handleViewDetails} fullWidth>
            View Booking Details
          </Button>

          <View style={styles.secondaryButtons}>
            <Button variant="outlined" size="medium" onPress={handleViewBookings} style={styles.secondaryButton}>
              My Bookings
            </Button>
            <Button variant="ghost" size="medium" onPress={handleGoHome} style={styles.secondaryButton}>
              Back to Home
            </Button>
          </View>
        </Animated.View>

        {/* Help Section */}
        <Animated.View entering={FadeInUp.duration(400).delay(800)} style={styles.helpContainer}>
          <Text variant="bodySmallRegular" color="textSecondary" textAlign="center">
            Need help? Contact our support team 24/7
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.xl,
    gap: theme.spacing.xl,
    alignItems: "center",
  },
  iconContainer: {
    marginTop: theme.spacing.xxl,
    alignItems: "center",
  },
  successIcon: {
    width: ms(120),
    height: ms(120),
    borderRadius: ms(60),
    backgroundColor: theme.colors.success,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.lg,
  },
  messageContainer: {
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  subtitle: {
    lineHeight: 22,
  },
  confirmationCard: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  confirmationCode: {
    letterSpacing: 2,
    color: theme.colors.primary,
  },
  infoContainer: {
    width: "100%",
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  infoCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.base,
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  infoIconContainer: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    backgroundColor: theme.colors.primaryLight || theme.colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  nextStepsContainer: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.base,
  },
  nextStepsTitle: {
    marginBottom: theme.spacing.xs,
  },
  stepsList: {
    gap: theme.spacing.base,
  },
  stepItem: {
    flexDirection: "row",
    gap: theme.spacing.md,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  stepContent: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  actionsContainer: {
    width: "100%",
    gap: theme.spacing.md,
  },
  secondaryButtons: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  secondaryButton: {
    flex: 1,
  },
  helpContainer: {
    paddingTop: theme.spacing.base,
  },
}));
