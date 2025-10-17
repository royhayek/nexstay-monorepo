import { router } from "expo-router";
import React from "react";
import { ScrollView, View, RefreshControl } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Button, Text } from "@/components/atoms";
import { ScreenTemplate } from "@/components/templates";
import { ms, mvs } from "@/utils/scaling";
import { useUsersAppControllerGetHostApplicationStatus } from "@/api/queries/protected/users/users";

import {
  Clock,
  TickCircle,
  CloseCircle,
  DocumentText1,
  Calendar,
  InfoCircle,
} from "iconsax-react-native";

type ApplicationStatus = "pending" | "approved" | "rejected";

interface ApplicationData {
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  nextSteps?: string[];
}

export default function HostApplicationStatusScreen() {
  const { theme } = useUnistyles();

  // Use the generated API hook
  const {
    data: statusResponse,
    isLoading,
    refetch,
    isRefetching,
  } = useUsersAppControllerGetHostApplicationStatus();

  const applicationData = statusResponse?.data;

  // Map API status to UI status
  const mapStatus = (apiStatus?: string): ApplicationStatus | undefined => {
    if (!apiStatus) return undefined;
    // API returns "pending" | "review" | "approved" | "rejected"
    // We use "pending" for both "pending" and "review"
    if (apiStatus === "pending" || apiStatus === "review") return "pending";
    if (apiStatus === "approved") return "approved";
    if (apiStatus === "rejected") return "rejected";
    return "pending";
  };

  const uiStatus = mapStatus(applicationData?.status);

  // Build UI-friendly application data
  const uiApplicationData: ApplicationData | null = applicationData
    ? {
        status: uiStatus || "pending",
        submittedAt: new Date().toISOString(), // Backend doesn't return this, use current time for now
        reviewedAt: applicationData.status === "approved" || applicationData.status === "rejected"
          ? new Date().toISOString() // Backend doesn't return this either
          : undefined,
        reviewNotes: undefined, // Backend doesn't return this
        rejectionReason: applicationData.rejectionReason,
        nextSteps: applicationData.nextSteps,
      }
    : null;

  const getStatusConfig = (status: ApplicationStatus) => {
    switch (status) {
      case "pending":
        return {
          icon: <Clock size={ms(48)} color={theme.colors.warning} variant="Bold" />,
          iconBg: `${theme.colors.warning}15`,
          title: "Application Pending",
          description: "Your host application is being reviewed by our team.",
          color: theme.colors.warning,
        };
      case "approved":
        return {
          icon: <TickCircle size={ms(48)} color={theme.colors.success} variant="Bold" />,
          iconBg: `${theme.colors.success}15`,
          title: "Application Approved!",
          description: "Congratulations! Your host application has been approved.",
          color: theme.colors.success,
        };
      case "rejected":
        return {
          icon: <CloseCircle size={ms(48)} color={theme.colors.error} variant="Bold" />,
          iconBg: `${theme.colors.error}15`,
          title: "Application Declined",
          description: "Unfortunately, your host application was not approved at this time.",
          color: theme.colors.error,
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleContinue = () => {
    if (uiApplicationData?.status === "approved") {
      // TODO: Navigate to create first listing or host onboarding
      router.replace("/(tabs)/profile");
    } else if (uiApplicationData?.status === "rejected") {
      // TODO: Navigate to FAQ or support
      router.replace("/(tabs)/profile");
    }
  };

  if (isLoading || !uiApplicationData) {
    return (
      <ScreenTemplate title="Application Status" showBackButton>
        <View style={styles.loadingContainer}>
          <Clock size={ms(48)} color={theme.colors.neutral400} variant="Bold" />
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.loadingText}>
            Loading application status...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  const statusConfig = getStatusConfig(uiApplicationData.status);

  return (
    <ScreenTemplate title="Application Status" showBackButton={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: mvs(120) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
        }
      >
        {/* Status Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIconContainer, { backgroundColor: statusConfig.iconBg }]}>
            {statusConfig.icon}
          </View>
          <Text variant="h5SemiBold" color="neutral900" style={styles.heroTitle}>
            {statusConfig.title}
          </Text>
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.heroDescription}>
            {statusConfig.description}
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconContainer}>
              <DocumentText1 size={ms(20)} color={theme.colors.primary} variant="Bold" />
            </View>
            <View style={styles.timelineContent}>
              <Text variant="bodyMediumSemiBold" color="neutral800">
                Application Submitted
              </Text>
              <Text variant="bodySmallRegular" color="neutral600">
                {formatDate(uiApplicationData.submittedAt)}
              </Text>
            </View>
          </View>

          {uiApplicationData.reviewedAt && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineIconContainer, { backgroundColor: `${statusConfig.color}15` }]}>
                {uiApplicationData.status === "approved" ? (
                  <TickCircle size={ms(20)} color={statusConfig.color} variant="Bold" />
                ) : (
                  <CloseCircle size={ms(20)} color={statusConfig.color} variant="Bold" />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text variant="bodyMediumSemiBold" color="neutral800">
                  Application {uiApplicationData.status === "approved" ? "Approved" : "Declined"}
                </Text>
                <Text variant="bodySmallRegular" color="neutral600">
                  {formatDate(uiApplicationData.reviewedAt)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Review Notes (if approved) */}
        {uiApplicationData.status === "approved" && uiApplicationData.reviewNotes && (
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <InfoCircle size={ms(20)} color={theme.colors.success} variant="Bold" />
              <Text variant="bodyMediumSemiBold" color="neutral800" style={styles.notesTitle}>
                Review Notes
              </Text>
            </View>
            <Text variant="bodySmallRegular" color="neutral700" style={styles.notesText}>
              {uiApplicationData.reviewNotes}
            </Text>
          </View>
        )}

        {/* Rejection Reason (if rejected) */}
        {uiApplicationData.status === "rejected" && uiApplicationData.rejectionReason && (
          <View style={[styles.notesCard, styles.rejectionCard]}>
            <View style={styles.notesHeader}>
              <InfoCircle size={ms(20)} color={theme.colors.error} variant="Bold" />
              <Text variant="bodyMediumSemiBold" color="neutral800" style={styles.notesTitle}>
                Reason
              </Text>
            </View>
            <Text variant="bodySmallRegular" color="neutral700" style={styles.notesText}>
              {uiApplicationData.rejectionReason}
            </Text>
          </View>
        )}

        {/* Next Steps */}
        {uiApplicationData.nextSteps && uiApplicationData.nextSteps.length > 0 && (
          <View style={styles.section}>
            <Text variant="bodyLargeSemiBold" color="neutral800" style={styles.sectionTitle}>
              {uiApplicationData.status === "pending" ? "What's Next?" : "Next Steps"}
            </Text>

            <View style={styles.stepsList}>
              {uiApplicationData.nextSteps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text variant="bodySmallSemiBold" color="primary">
                      {index + 1}
                    </Text>
                  </View>
                  <Text variant="bodySmallRegular" color="neutral700" style={styles.stepText}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info Card for Pending */}
        {uiApplicationData.status === "pending" && (
          <View style={styles.infoCard}>
            <InfoCircle size={ms(20)} color={theme.colors.info} variant="Bold" />
            <Text variant="bodySmallRegular" color="neutral700" style={styles.infoText}>
              Pull down to refresh and check for updates on your application status.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomContainer}>
        {uiApplicationData.status === "pending" ? (
          <Button
            variant="outlined"
            color="neutral"
            size="large"
            onPress={() => router.replace("/(tabs)/profile")}
          >
            <Text variant="bodyLargeSemiBold" color="neutral800">
              Back to Profile
            </Text>
          </Button>
        ) : (
          <Button
            variant="filled"
            color="primary"
            size="large"
            onPress={handleContinue}
          >
            <Text variant="bodyLargeSemiBold" color="neutral0">
              {uiApplicationData.status === "approved" ? "Continue" : "Learn More"}
            </Text>
          </Button>
        )}
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.base,
  },
  hero: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxxl,
  },
  heroIconContainer: {
    width: ms(96),
    height: ms(96),
    borderRadius: ms(48),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  heroDescription: {
    textAlign: "center",
    lineHeight: mvs(22),
  },
  timeline: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: theme.spacing.base,
  },
  timelineIconContainer: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.base,
  },
  timelineContent: {
    flex: 1,
    paddingTop: theme.spacing.xs,
  },
  notesCard: {
    padding: theme.spacing.base,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    backgroundColor: `${theme.colors.success}08`,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.thin,
    borderColor: `${theme.colors.success}30`,
  },
  rejectionCard: {
    backgroundColor: `${theme.colors.error}08`,
    borderColor: `${theme.colors.error}30`,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  notesTitle: {
    marginLeft: theme.spacing.xs,
  },
  notesText: {
    lineHeight: mvs(18),
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.base,
  },
  stepsList: {
    gap: theme.spacing.base,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.base,
    marginTop: mvs(2),
  },
  stepText: {
    flex: 1,
    lineHeight: mvs(20),
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: theme.spacing.base,
    marginHorizontal: theme.spacing.lg,
    backgroundColor: `${theme.colors.info}10`,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: `${theme.colors.info}30`,
  },
  infoText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    lineHeight: mvs(18),
  },
  bottomContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: theme.borderWidth.thin,
    borderTopColor: theme.colors.border,
  },
}));
