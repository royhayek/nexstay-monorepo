import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, View, TouchableOpacity } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Button, Text, Input } from "@/components/atoms";
import { ScreenTemplate } from "@/components/templates";
import { ms, mvs } from "@/utils/scaling";
import { useUsersAppControllerApplyToBeHost } from "@/api/queries/protected/users/users";

import {
  DocumentText1,
  Edit2,
  TickSquare,
  Square,
  InfoCircle,
} from "iconsax-react-native";

interface FormData {
  motivation: string;
  hasExperience: boolean;
  experienceDescription: string;
  agreedToTerms: boolean;
  agreedToHostPolicy: boolean;
}

interface FormErrors {
  motivation?: string;
  experienceDescription?: string;
  terms?: string;
}

export default function HostApplicationScreen() {
  const { theme } = useUnistyles();
  const [formData, setFormData] = useState<FormData>({
    motivation: "",
    hasExperience: false,
    experienceDescription: "",
    agreedToTerms: false,
    agreedToHostPolicy: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Use the generated API mutation hook
  const { mutateAsync: applyToBeHost, isPending: isSubmitting } = useUsersAppControllerApplyToBeHost();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate motivation (minimum 50 characters as per DTO)
    if (!formData.motivation || formData.motivation.trim().length < 50) {
      newErrors.motivation = "Please provide at least 50 characters explaining your motivation";
    }

    // Validate experience description if has experience
    if (formData.hasExperience && (!formData.experienceDescription || formData.experienceDescription.trim().length < 20)) {
      newErrors.experienceDescription = "Please provide at least 20 characters describing your experience";
    }

    // Validate agreements
    if (!formData.agreedToTerms || !formData.agreedToHostPolicy) {
      newErrors.terms = "You must agree to all terms and policies to continue";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Call the real API
      await applyToBeHost({
        data: {
          motivation: formData.motivation.trim(),
          hasExperience: formData.hasExperience,
          experienceDescription: formData.hasExperience ? formData.experienceDescription.trim() : undefined,
          agreedToTerms: formData.agreedToTerms,
          agreedToHostPolicy: formData.agreedToHostPolicy,
        },
      });

      // Navigate to status screen on success
      router.replace("/host/status");
    } catch (error) {
      console.error("Error submitting application:", error);
      // TODO: Show error toast with error message
    }
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleCheckbox = (field: keyof FormData) => {
    updateFormData(field, !formData[field as keyof typeof formData]);
  };

  return (
    <ScreenTemplate title="Host Application" showBackButton>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: mvs(120) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <DocumentText1 size={ms(32)} color={theme.colors.primary} variant="Bold" />
          </View>
          <Text variant="h6SemiBold" color="neutral900" style={styles.headerTitle}>
            Tell us about yourself
          </Text>
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.headerDescription}>
            Help us understand why you want to become a host and your hosting experience.
          </Text>
        </View>

        {/* Motivation Section */}
        <View style={styles.section}>
          <Text variant="bodyLargeSemiBold" color="neutral800" style={styles.sectionTitle}>
            Why do you want to host? <Text color="error">*</Text>
          </Text>
          <Text variant="bodySmallRegular" color="neutral600" style={styles.sectionDescription}>
            Share your motivation for becoming a host (minimum 50 characters)
          </Text>

          <View style={styles.textAreaContainer}>
            <Input
              placeholder="I want to become a host because..."
              value={formData.motivation}
              onChangeText={(text) => updateFormData("motivation", text)}
              multiline
              numberOfLines={6}
              style={styles.textArea}
              error={errors.motivation}
            />
            <View style={styles.characterCount}>
              <Text
                variant="bodySmallRegular"
                color={formData.motivation.length < 50 ? "neutral500" : "success"}
              >
                {formData.motivation.length} / 50 minimum
              </Text>
            </View>
          </View>

          {errors.motivation && (
            <View style={styles.errorContainer}>
              <InfoCircle size={ms(16)} color={theme.colors.error} variant="Bold" />
              <Text variant="bodySmallRegular" color="error" style={styles.errorText}>
                {errors.motivation}
              </Text>
            </View>
          )}
        </View>

        {/* Experience Section */}
        <View style={styles.section}>
          <Text variant="bodyLargeSemiBold" color="neutral800" style={styles.sectionTitle}>
            Hosting Experience
          </Text>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => toggleCheckbox("hasExperience")}
            activeOpacity={0.7}
          >
            {formData.hasExperience ? (
              <TickSquare size={ms(24)} color={theme.colors.primary} variant="Bold" />
            ) : (
              <Square size={ms(24)} color={theme.colors.neutral400} variant="Outline" />
            )}
            <Text variant="bodyMediumRegular" color="neutral800" style={styles.checkboxLabel}>
              I have previous hosting experience
            </Text>
          </TouchableOpacity>

          {formData.hasExperience && (
            <View style={[styles.textAreaContainer, styles.experienceTextArea]}>
              <Input
                placeholder="Describe your previous hosting experience (e.g., platforms used, types of properties, duration)..."
                value={formData.experienceDescription}
                onChangeText={(text) => updateFormData("experienceDescription", text)}
                multiline
                numberOfLines={5}
                style={styles.textArea}
                error={errors.experienceDescription}
              />
              <View style={styles.characterCount}>
                <Text
                  variant="bodySmallRegular"
                  color={formData.experienceDescription.length < 20 ? "neutral500" : "success"}
                >
                  {formData.experienceDescription.length} / 20 minimum
                </Text>
              </View>
            </View>
          )}

          {errors.experienceDescription && (
            <View style={styles.errorContainer}>
              <InfoCircle size={ms(16)} color={theme.colors.error} variant="Bold" />
              <Text variant="bodySmallRegular" color="error" style={styles.errorText}>
                {errors.experienceDescription}
              </Text>
            </View>
          )}
        </View>

        {/* Terms and Agreements */}
        <View style={styles.section}>
          <Text variant="bodyLargeSemiBold" color="neutral800" style={styles.sectionTitle}>
            Terms and Policies <Text color="error">*</Text>
          </Text>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => toggleCheckbox("agreedToTerms")}
            activeOpacity={0.7}
          >
            {formData.agreedToTerms ? (
              <TickSquare size={ms(24)} color={theme.colors.primary} variant="Bold" />
            ) : (
              <Square size={ms(24)} color={theme.colors.neutral400} variant="Outline" />
            )}
            <Text variant="bodyMediumRegular" color="neutral800" style={styles.checkboxLabel}>
              I agree to the{" "}
              <Text variant="bodyMediumSemiBold" color="primary">
                Terms of Service
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.checkboxRow, styles.checkboxRowLast]}
            onPress={() => toggleCheckbox("agreedToHostPolicy")}
            activeOpacity={0.7}
          >
            {formData.agreedToHostPolicy ? (
              <TickSquare size={ms(24)} color={theme.colors.primary} variant="Bold" />
            ) : (
              <Square size={ms(24)} color={theme.colors.neutral400} variant="Outline" />
            )}
            <Text variant="bodyMediumRegular" color="neutral800" style={styles.checkboxLabel}>
              I agree to the{" "}
              <Text variant="bodyMediumSemiBold" color="primary">
                Host Policy and Guidelines
              </Text>
            </Text>
          </TouchableOpacity>

          {errors.terms && (
            <View style={styles.errorContainer}>
              <InfoCircle size={ms(16)} color={theme.colors.error} variant="Bold" />
              <Text variant="bodySmallRegular" color="error" style={styles.errorText}>
                {errors.terms}
              </Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <InfoCircle size={ms(20)} color={theme.colors.info} variant="Bold" />
          <View style={styles.infoContent}>
            <Text variant="bodySmallSemiBold" color="neutral800" style={styles.infoTitle}>
              What happens next?
            </Text>
            <Text variant="bodySmallRegular" color="neutral700" style={styles.infoText}>
              Your application will be reviewed by our team. You'll receive a notification within 24-48 hours.
              Identity verification will be required if your application is approved.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomContainer}>
        <Button
          variant="filled"
          color="primary"
          size="large"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          <Text variant="bodyLargeSemiBold" color="neutral0">
            Submit Application
          </Text>
        </Button>
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
  header: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  headerIconContainer: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(32),
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.base,
  },
  headerTitle: {
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  headerDescription: {
    textAlign: "center",
    lineHeight: mvs(22),
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.xs,
  },
  sectionDescription: {
    marginBottom: theme.spacing.base,
    lineHeight: mvs(18),
  },
  textAreaContainer: {
    marginTop: theme.spacing.base,
  },
  textArea: {
    minHeight: mvs(120),
    paddingTop: theme.spacing.base,
    textAlignVertical: "top",
  },
  experienceTextArea: {
    marginTop: theme.spacing.base,
  },
  characterCount: {
    alignItems: "flex-end",
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  checkboxRowLast: {
    marginTop: theme.spacing.sm,
  },
  checkboxLabel: {
    flex: 1,
    marginLeft: theme.spacing.base,
    lineHeight: mvs(20),
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  errorText: {
    flex: 1,
    marginLeft: theme.spacing.xs,
    lineHeight: mvs(16),
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: theme.spacing.base,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: `${theme.colors.info}10`,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.thin,
    borderColor: `${theme.colors.info}30`,
  },
  infoContent: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  infoTitle: {
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    lineHeight: mvs(18),
  },
  bottomContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: theme.borderWidth.thin,
    borderTopColor: theme.colors.border,
  },
}));
