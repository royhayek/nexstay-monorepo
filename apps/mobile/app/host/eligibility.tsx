import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, View, TouchableOpacity } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Button, Text } from "@/components/atoms";
import { ScreenTemplate } from "@/components/templates";
import { ms, mvs } from "@/utils/scaling";
import { useUsersAppControllerCheckHostEligibility } from "@/api/queries/protected/users/users";

import {
  ShieldTick,
  Profile2User,
  DocumentText,
  TickCircle,
  CloseCircle,
  InfoCircle,
} from "iconsax-react-native";

interface EligibilityRequirement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  met?: boolean;
}

export default function HostEligibilityScreen() {
  const { theme } = useUnistyles();
  const [hasManuallyChecked, setHasManuallyChecked] = useState(false);

  // Use the generated API hook
  const {
    data: eligibilityResponse,
    isLoading,
    refetch,
    error,
  } = useUsersAppControllerCheckHostEligibility({
    query: {
      enabled: hasManuallyChecked, // Only run when user clicks check
    },
  });

  const eligibilityData = eligibilityResponse?.data;
  const isEligible = eligibilityData?.eligible || false;
  const hasChecked = hasManuallyChecked && !isLoading;

  const checkEligibility = async () => {
    setHasManuallyChecked(true);
    await refetch();
  };

  const getRequirements = (): EligibilityRequirement[] => {
    if (!hasChecked) {
      return [
        {
          id: "account_age",
          title: "Account Age",
          description: "Your account must be at least 7 days old",
          icon: <Profile2User size={ms(24)} color={theme.colors.primary} variant="Bold" />,
        },
        {
          id: "verification",
          title: "Email & Phone Verified",
          description: "Both email and phone number must be verified",
          icon: <ShieldTick size={ms(24)} color={theme.colors.primary} variant="Bold" />,
        },
        {
          id: "profile",
          title: "Complete Profile",
          description: "Profile must include name, photo, bio, and birthdate",
          icon: <DocumentText size={ms(24)} color={theme.colors.primary} variant="Bold" />,
        },
      ];
    }

    // Map API response to UI requirements
    const requirements = eligibilityData?.requirements;

    return [
      {
        id: "account_age",
        title: "Account Age",
        description: requirements?.accountAge
          ? "Your account meets the minimum age requirement (7 days)"
          : "Your account must be at least 7 days old",
        icon: <Profile2User size={ms(24)} color={theme.colors.primary} variant="Bold" />,
        met: requirements?.accountAge,
      },
      {
        id: "verification",
        title: "Email & Phone Verified",
        description: requirements?.verified
          ? "Both email and phone are verified"
          : "Email and/or phone verification required",
        icon: <ShieldTick size={ms(24)} color={theme.colors.primary} variant="Bold" />,
        met: requirements?.verified,
      },
      {
        id: "profile",
        title: "Complete Profile",
        description: requirements?.completedProfile
          ? "Your profile is complete"
          : "Complete your profile with name, photo, bio, and birthdate",
        icon: <DocumentText size={ms(24)} color={theme.colors.primary} variant="Bold" />,
        met: requirements?.completedProfile,
      },
    ];
  };

  const handleContinue = () => {
    if (isEligible) {
      router.push("/host/application");
    }
  };

  const requirements = getRequirements();

  return (
    <ScreenTemplate title="Become a Host" showBackButton>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: mvs(120) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroIconContainer}>
            <ShieldTick size={ms(48)} color={theme.colors.primary} variant="Bold" />
          </View>
          <Text variant="h5SemiBold" color="neutral900" style={styles.heroTitle}>
            Host on Nexstay
          </Text>
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.heroDescription}>
            Share your space and earn extra income by becoming a host. Let's check if you meet the
            requirements.
          </Text>
        </View>

        {/* Requirements List */}
        <View style={styles.section}>
          <Text variant="bodyLargeSemiBold" color="neutral800" style={styles.sectionTitle}>
            Requirements
          </Text>

          <View style={styles.requirementsList}>
            {requirements.map((requirement, index) => (
              <View
                key={requirement.id}
                style={[
                  styles.requirementCard,
                  index < requirements.length - 1 && styles.requirementCardWithMargin,
                ]}
              >
                <View style={styles.requirementIconContainer}>{requirement.icon}</View>

                <View style={styles.requirementContent}>
                  <View style={styles.requirementHeader}>
                    <Text variant="bodyMediumSemiBold" color="neutral800">
                      {requirement.title}
                    </Text>
                    {hasChecked && (
                      <View>
                        {requirement.met ? (
                          <TickCircle size={ms(20)} color={theme.colors.success} variant="Bold" />
                        ) : (
                          <CloseCircle size={ms(20)} color={theme.colors.error} variant="Bold" />
                        )}
                      </View>
                    )}
                  </View>

                  <Text
                    variant="bodySmallRegular"
                    color={hasChecked && !requirement.met ? "error" : "neutral600"}
                    style={styles.requirementDescription}
                  >
                    {requirement.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Eligibility Result */}
        {hasChecked && (
          <View
            style={[
              styles.resultCard,
              isEligible ? styles.resultCardSuccess : styles.resultCardError,
            ]}
          >
            <View style={styles.resultIconContainer}>
              {isEligible ? (
                <TickCircle size={ms(24)} color={theme.colors.success} variant="Bold" />
              ) : (
                <InfoCircle size={ms(24)} color={theme.colors.error} variant="Bold" />
              )}
            </View>

            <View style={styles.resultContent}>
              <Text variant="bodyMediumSemiBold" color="neutral800">
                {isEligible ? "You're Eligible!" : "Not Eligible Yet"}
              </Text>
              <Text variant="bodySmallRegular" color="neutral600" style={styles.resultDescription}>
                {isEligible
                  ? "You meet all the requirements to become a host. Continue to submit your application."
                  : "Please complete the missing requirements above before applying to become a host."}
              </Text>
            </View>
          </View>
        )}

        {/* Info Note */}
        {!hasChecked && (
          <View style={styles.infoCard}>
            <InfoCircle size={ms(20)} color={theme.colors.info} variant="Bold" />
            <Text variant="bodySmallRegular" color="neutral700" style={styles.infoText}>
              Identity verification will be required after your application is reviewed by our team.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomContainer}>
        {!hasChecked ? (
          <Button
            variant="filled"
            color="primary"
            size="large"
            onPress={checkEligibility}
            loading={isLoading}
            disabled={isLoading}
          >
            <Text variant="bodyLargeSemiBold" color="neutral0">
              Check Eligibility
            </Text>
          </Button>
        ) : isEligible ? (
          <Button variant="filled" color="primary" size="large" onPress={handleContinue}>
            <Text variant="bodyLargeSemiBold" color="neutral0">
              Continue to Application
            </Text>
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="neutral"
            size="large"
            onPress={() => router.back()}
          >
            <Text variant="bodyLargeSemiBold" color="neutral800">
              Back to Profile
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
  hero: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxxl,
  },
  heroIconContainer: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(40),
    backgroundColor: `${theme.colors.primary}15`,
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
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.base,
  },
  requirementsList: {
    gap: theme.spacing.base,
  },
  requirementCard: {
    flexDirection: "row",
    padding: theme.spacing.base,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  requirementCardWithMargin: {
    marginBottom: theme.spacing.sm,
  },
  requirementIconContainer: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    backgroundColor: `${theme.colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.base,
  },
  requirementContent: {
    flex: 1,
  },
  requirementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  requirementDescription: {
    lineHeight: mvs(18),
  },
  resultCard: {
    flexDirection: "row",
    padding: theme.spacing.base,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.medium,
  },
  resultCardSuccess: {
    backgroundColor: `${theme.colors.success}08`,
    borderColor: theme.colors.success,
  },
  resultCardError: {
    backgroundColor: `${theme.colors.error}08`,
    borderColor: theme.colors.error,
  },
  resultIconContainer: {
    marginRight: theme.spacing.base,
    paddingTop: theme.spacing.xs,
  },
  resultContent: {
    flex: 1,
  },
  resultDescription: {
    marginTop: theme.spacing.xs,
    lineHeight: mvs(18),
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
