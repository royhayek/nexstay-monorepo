import React from "react";
import { View, ScrollView, ActivityIndicator, Alert } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { router } from "expo-router";
import { ShieldTick, DocumentText, CloseCircle, Clock, TickCircle } from "iconsax-react-native";

import { Button, Text } from "@/components/atoms";
import { EmptyState, StatusHeader } from "@/components/molecules";
import { ScreenTemplate } from "@/components/templates";
import { ms, mvs } from "@/utils/scaling";
import { useQuery } from "@tanstack/react-query";
import {
  identityVerificationAppControllerGetMyVerification,
  useIdentityVerificationAppControllerCancelMyVerification,
} from "@/api/queries/protected/identity-verification/identity-verification";

export default function IdentityVerificationStatusScreen() {
  const { theme } = useUnistyles();

  // Fetch verification status
  const {
    data: verificationResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/v1/app/identity-verification/me"],
    queryFn: () => identityVerificationAppControllerGetMyVerification(),
    retry: (failureCount, error: any) => {
      // Don't retry if it's a 404 (no verification found) - this is expected
      if (error?.response?.status === 404) {
        return false;
      }
      // Retry other errors up to 3 times
      return failureCount < 3;
    },
  });

  const verification = verificationResponse?.data;
  const status = verification?.status;

  // Cancel verification mutation
  const { mutateAsync: cancelVerification, isPending: isCancelling } =
    useIdentityVerificationAppControllerCancelMyVerification();

  const handleStartVerification = () => {
    router.push("/identity-verification/document-types");
  };

  const handleResubmit = () => {
    router.push("/identity-verification/document-types");
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Verification",
      "Are you sure you want to cancel your verification request? You'll need to start over if you want to verify later.",
      [
        {
          text: "No, Keep It",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: confirmCancel,
        },
      ]
    );
  };

  const confirmCancel = async () => {
    try {
      await cancelVerification({
        data: {
          reason: "User requested cancellation",
        },
      });

      Alert.alert("Success", "Your verification request has been cancelled.", [
        {
          text: "OK",
          onPress: () => refetch(),
        },
      ]);
    } catch (error: any) {
      console.error("Failed to cancel verification:", error);
      Alert.alert(
        "Cancellation Failed",
        error?.response?.data?.message || "Failed to cancel verification. Please try again."
      );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <ScreenTemplate title="Identity Verification" showBackButton>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMediumRegular" color="textSecondary" style={styles.loadingText}>
            Loading verification status...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  // No verification found - show start verification
  if (error || !verification) {
    return (
      <ScreenTemplate title="Identity Verification" showBackButton>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyStateContainer}>
            <EmptyState
              icon={<ShieldTick size={ms(80)} color={theme.colors.neutral400} variant="Bulk" />}
              title="Verify Your Identity"
              description="Complete identity verification to unlock additional features and increase trust"
              primaryAction={{
                text: "Start Verification",
                onPress: handleStartVerification,
                variant: "filled",
                color: "primary",
              }}
            />

            <View style={styles.benefitsCard}>
              <Text variant="bodyMediumSemiBold" color="neutral800" style={styles.benefitsTitle}>
                Why verify your identity?
              </Text>
              <View style={styles.benefitsList}>
                <BenefitItem
                  icon={<TickCircle size={ms(20)} color={theme.colors.success} variant="Bold" />}
                  text="Increase trust with other users"
                />
                <BenefitItem
                  icon={<TickCircle size={ms(20)} color={theme.colors.success} variant="Bold" />}
                  text="Unlock priority support"
                />
                <BenefitItem
                  icon={<TickCircle size={ms(20)} color={theme.colors.success} variant="Bold" />}
                  text="Access exclusive features"
                />
                <BenefitItem
                  icon={<TickCircle size={ms(20)} color={theme.colors.success} variant="Bold" />}
                  text="Secure your account"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </ScreenTemplate>
    );
  }

  // Render status-specific content
  const renderStatusContent = () => {
    switch (status) {
      case "pending":
        return (
          <View style={styles.statusContainer}>
            <StatusHeader
              icon={<Clock size={ms(80)} color={theme.colors.warning} variant="Bulk" />}
              title="Verification Pending"
              description="Your identity verification request is waiting to be processed by our team"
              titleVariant="headingH3SemiBold"
              spacing="spacious"
              alignment="center"
            />

            <View style={styles.infoCard}>
              <Text variant="bodyMediumRegular" color="neutral700">
                Your document photos and live selfie have been submitted and are in the queue for review. This
                usually takes 1-3 business days.
              </Text>
            </View>

            <View style={styles.actionsContainer}>
              <Button variant="outlined" color="error" onPress={handleCancel} disabled={isCancelling}>
                {isCancelling ? "Cancelling..." : "Cancel Verification"}
              </Button>
            </View>
          </View>
        );

      case "under_review":
        return (
          <View style={styles.statusContainer}>
            <StatusHeader
              icon={<DocumentText size={ms(80)} color={theme.colors.primary} variant="Bulk" />}
              title="Under Review"
              description="Our team is currently reviewing your documents"
              titleVariant="headingH3SemiBold"
              spacing="spacious"
              alignment="center"
            />

            <View style={styles.infoCard}>
              <Text variant="bodyMediumRegular" color="neutral700">
                Your identity verification documents and live selfie are being carefully reviewed by our
                compliance team. We'll notify you once the review is complete.
              </Text>
            </View>

            {verification.submittedAt && (
              <View style={styles.detailRow}>
                <Text variant="bodySmallRegular" color="neutral600">
                  Submitted:
                </Text>
                <Text variant="bodySmallSemiBold" color="neutral800">
                  {new Date(verification.submittedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        );

      case "approved":
        return (
          <View style={styles.statusContainer}>
            <StatusHeader
              icon={<TickCircle size={ms(80)} color={theme.colors.success} variant="Bold" />}
              title="Verified"
              description="Your identity has been successfully verified"
              titleVariant="headingH3SemiBold"
              spacing="spacious"
              alignment="center"
            />

            <View style={[styles.infoCard, styles.successCard]}>
              <Text variant="bodyMediumSemiBold" color="success">
                Congratulations!
              </Text>
              <Text variant="bodyMediumRegular" color="neutral700" style={styles.marginTop}>
                Your account is now verified. This gives you access to exclusive features and increases
                trust with other users.
              </Text>
            </View>

            {verification.verifiedAt && (
              <View style={styles.detailRow}>
                <Text variant="bodySmallRegular" color="neutral600">
                  Verified on:
                </Text>
                <Text variant="bodySmallSemiBold" color="neutral800">
                  {new Date(verification.verifiedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        );

      case "rejected":
        return (
          <View style={styles.statusContainer}>
            <StatusHeader
              icon={<CloseCircle size={ms(80)} color={theme.colors.error} variant="Bold" />}
              title="Verification Rejected"
              description="Unfortunately, we couldn't verify your identity"
              titleVariant="headingH3SemiBold"
              spacing="spacious"
              alignment="center"
            />

            <View style={[styles.infoCard, styles.errorCard]}>
              <Text variant="bodyMediumSemiBold" color="error">
                Rejection Reason:
              </Text>
              <Text variant="bodyMediumRegular" color="neutral700" style={styles.marginTop}>
                {verification.rejectionReason || "Please review your documents and try again"}
              </Text>

              {verification.adminNote && (
                <>
                  <Text variant="bodyMediumSemiBold" color="neutral800" style={styles.marginTopLarge}>
                    Additional Notes:
                  </Text>
                  <Text variant="bodySmallRegular" color="neutral600" style={styles.marginTop}>
                    {verification.adminNote}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.actionsContainer}>
              <Button variant="filled" color="primary" onPress={handleResubmit}>
                Submit Again
              </Button>
            </View>
          </View>
        );

      case "expired":
        return (
          <View style={styles.statusContainer}>
            <StatusHeader
              icon={<Clock size={ms(80)} color={theme.colors.warning} variant="Bulk" />}
              title="Verification Expired"
              description="Your identity verification has expired and needs to be renewed"
              titleVariant="headingH3SemiBold"
              spacing="spacious"
              alignment="center"
            />

            <View style={styles.infoCard}>
              <Text variant="bodyMediumRegular" color="neutral700">
                For security reasons, identity verifications need to be renewed periodically. Please submit new
                document photos and a live selfie to continue.
              </Text>
            </View>

            <View style={styles.actionsContainer}>
              <Button variant="filled" color="primary" onPress={handleResubmit}>
                Renew Verification
              </Button>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScreenTemplate title="Identity Verification" showBackButton>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderStatusContent()}
      </ScrollView>
    </ScreenTemplate>
  );
}

// Helper component for benefits list
function BenefitItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={benefitStyles.container}>
      {icon}
      <Text variant="bodySmallRegular" color="neutral700" style={benefitStyles.text}>
        {text}
      </Text>
    </View>
  );
}

const benefitStyles = StyleSheet.create(() => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: mvs(12),
  },
  text: {
    marginLeft: ms(12),
    flex: 1,
  },
}));

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: mvs(40),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  emptyStateContainer: {
    flex: 1,
    paddingTop: mvs(60),
  },
  statusContainer: {
    paddingTop: mvs(40),
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.xl,
  },
  successCard: {
    backgroundColor: theme.colors.successLight || theme.colors.success + "10",
  },
  errorCard: {
    backgroundColor: theme.colors.errorLight || theme.colors.error + "10",
  },
  benefitsCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.xl,
  },
  benefitsTitle: {
    marginBottom: theme.spacing.md,
  },
  benefitsList: {
    marginTop: theme.spacing.sm,
  },
  actionsContainer: {
    marginTop: theme.spacing.xl,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral200,
  },
  marginTop: {
    marginTop: theme.spacing.sm,
  },
  marginTopLarge: {
    marginTop: theme.spacing.md,
  },
}));
