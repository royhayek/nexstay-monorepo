import React, { useState } from "react";
import { View, ScrollView, ActivityIndicator, Alert } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";

import { Button, Input, Text } from "@/components/atoms";
import { ScreenTemplate } from "@/components/templates";
import { mvs } from "@/utils/scaling";
import { useIdentityVerificationAppControllerSubmitVerification } from "@/api/queries/protected/identity-verification/identity-verification";

interface VerificationDetailsForm {
  documentNumber: string;
  issuingCountry: string;
  issuingState?: string;
  expirationDate: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  placeOfBirth?: string;
  nationality?: string;
  gender?: string;
  // Lebanon-specific
  qaidNumber?: string;
  municipalityCode?: string;
  residencyStatus?: string;
}

export default function VerificationDetailsScreen() {
  const { theme } = useUnistyles();
  const params = useLocalSearchParams<{
    documentType: string;
    documentFrontUri: string;
    documentBackUri?: string;
    selfieUri: string;
  }>();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: submitVerification } = useIdentityVerificationAppControllerSubmitVerification();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationDetailsForm>({
    defaultValues: {
      documentNumber: "",
      issuingCountry: "LB", // Default to Lebanon
      issuingState: "",
      expirationDate: "",
      firstName: "",
      lastName: "",
      middleName: "",
      dateOfBirth: "",
      placeOfBirth: "",
      nationality: "Lebanese",
      gender: "",
      qaidNumber: "",
      municipalityCode: "",
      residencyStatus: "citizen",
    },
  });

  const handleSubmitVerification = async (data: VerificationDetailsForm) => {
    try {
      setIsSubmitting(true);

      // Validate date formats
      if (!data.expirationDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        Alert.alert("Invalid Date", "Please enter expiration date in YYYY-MM-DD format");
        setIsSubmitting(false);
        return;
      }

      if (!data.dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
        Alert.alert("Invalid Date", "Please enter date of birth in YYYY-MM-DD format");
        setIsSubmitting(false);
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();

      // Add document type
      formData.append("documentType", params.documentType);

      // Add all form fields with proper formatting
      formData.append("documentNumber", data.documentNumber.trim());
      formData.append("issuingCountry", data.issuingCountry.trim().toUpperCase());
      if (data.issuingState) formData.append("issuingState", data.issuingState.trim());

      // Convert date strings to ISO format for the backend
      formData.append("expirationDate", new Date(data.expirationDate).toISOString());

      formData.append("firstName", data.firstName.trim());
      formData.append("lastName", data.lastName.trim());
      if (data.middleName) formData.append("middleName", data.middleName.trim());

      // Convert date of birth to ISO format
      formData.append("dateOfBirth", new Date(data.dateOfBirth).toISOString());

      if (data.placeOfBirth) formData.append("placeOfBirth", data.placeOfBirth.trim());
      if (data.nationality) formData.append("nationality", data.nationality.trim());
      if (data.gender) formData.append("gender", data.gender.trim());
      if (data.qaidNumber) formData.append("qaidNumber", data.qaidNumber.trim());
      if (data.municipalityCode) formData.append("municipalityCode", data.municipalityCode.trim());
      if (data.residencyStatus) formData.append("residencyStatus", data.residencyStatus.trim());

      // Add files
      if (params.documentFrontUri) {
        formData.append("documentFront", {
          uri: params.documentFrontUri,
          type: "image/jpeg",
          name: "document_front.jpg",
        } as any);
      }

      if (params.documentBackUri) {
        formData.append("documentBack", {
          uri: params.documentBackUri,
          type: "image/jpeg",
          name: "document_back.jpg",
        } as any);
      }

      // Add selfie (required)
      formData.append("selfie", {
        uri: params.selfieUri,
        type: "image/jpeg",
        name: "selfie.jpg",
      } as any);

      // Debug: Log form data
      console.log("Submitting verification with documentType:", params.documentType);
      console.log("Expiration date:", new Date(data.expirationDate).toISOString());
      console.log("Date of birth:", new Date(data.dateOfBirth).toISOString());
      console.log("Issuing country:", data.issuingCountry.trim().toUpperCase());

      // Submit verification
      await submitVerification({ data: formData as any });

      Alert.alert(
        "Success",
        "Your identity verification has been submitted successfully. We'll review it within 1-3 business days.",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate back to verification status
              router.replace("/identity-verification/status");
            },
          },
        ]
      );
    } catch (error: any) {
      console.error("Failed to submit verification:", error);
      Alert.alert(
        "Submission Failed",
        error?.response?.data?.message || "Failed to submit verification. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLebanonDocument = params.documentType === "national_id";

  return (
    <ScreenTemplate title="Verification Details" showBackButton>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.description}>
            Please fill in your document details exactly as they appear on your ID
          </Text>

          {/* Document Information */}
          <View style={styles.section}>
            <Text variant="bodyLargeSemiBold" color="neutral800" style={styles.sectionTitle}>
              Document Information
            </Text>

            <Controller
              control={control}
              name="documentNumber"
              rules={{ required: "Document number is required" }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Document Number"
                  placeholder="Enter document number"
                  value={value}
                  onChangeText={onChange}
                  error={errors.documentNumber?.message}
                  required
                />
              )}
            />

            <Controller
              control={control}
              name="issuingCountry"
              rules={{ required: "Issuing country is required" }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Issuing Country"
                  placeholder="LB"
                  value={value}
                  onChangeText={onChange}
                  error={errors.issuingCountry?.message}
                  required
                  autoCapitalize="characters"
                  maxLength={2}
                  helperText="2-letter country code (e.g., LB for Lebanon, US for USA)"
                />
              )}
            />

            <Controller
              control={control}
              name="expirationDate"
              rules={{ required: "Expiration date is required" }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Expiration Date"
                  placeholder="2030-12-31"
                  value={value}
                  onChangeText={onChange}
                  error={errors.expirationDate?.message}
                  required
                  helperText="Format: YYYY-MM-DD (e.g., 2030-12-31)"
                />
              )}
            />
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text variant="bodyLargeSemiBold" color="neutral800" style={styles.sectionTitle}>
              Personal Information
            </Text>

            <Controller
              control={control}
              name="firstName"
              rules={{ required: "First name is required" }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="First Name"
                  placeholder="Enter first name"
                  value={value}
                  onChangeText={onChange}
                  error={errors.firstName?.message}
                  required
                />
              )}
            />

            <Controller
              control={control}
              name="middleName"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Middle Name"
                  placeholder="Enter middle name (optional)"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            <Controller
              control={control}
              name="lastName"
              rules={{ required: "Last name is required" }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Last Name"
                  placeholder="Enter last name"
                  value={value}
                  onChangeText={onChange}
                  error={errors.lastName?.message}
                  required
                />
              )}
            />

            <Controller
              control={control}
              name="dateOfBirth"
              rules={{ required: "Date of birth is required" }}
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Date of Birth"
                  placeholder="1990-01-15"
                  value={value}
                  onChangeText={onChange}
                  error={errors.dateOfBirth?.message}
                  required
                  helperText="Format: YYYY-MM-DD (e.g., 1990-01-15)"
                />
              )}
            />

            <Controller
              control={control}
              name="gender"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Gender"
                  placeholder="M / F / Other"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="characters"
                  maxLength={10}
                />
              )}
            />

            <Controller
              control={control}
              name="nationality"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nationality"
                  placeholder="Enter nationality"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />

            <Controller
              control={control}
              name="placeOfBirth"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Place of Birth"
                  placeholder="Enter place of birth (optional)"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </View>

          {/* Lebanon-Specific Fields */}
          {isLebanonDocument && (
            <View style={styles.section}>
              <Text variant="bodyLargeSemiBold" color="neutral800" style={styles.sectionTitle}>
                Lebanese Identity Card Information
              </Text>
              <Text variant="bodySmallRegular" color="neutral600" style={styles.sectionNote}>
                These fields help speed up verification for Lebanese residents
              </Text>

              <Controller
                control={control}
                name="qaidNumber"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Qaid Number"
                    placeholder="e.g., 1990/123456 (optional)"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />

              <Controller
                control={control}
                name="municipalityCode"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Municipality Code"
                    placeholder="e.g., BEI001 (optional)"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />

              <Controller
                control={control}
                name="residencyStatus"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Residency Status"
                    placeholder="citizen / resident / temporary_visitor"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
          )}

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text variant="bodySmallSemiBold" color="neutral800">
              Important:
            </Text>
            <Text variant="bodySmallRegular" color="neutral600" style={styles.infoText}>
              • All information must match your document exactly{"\n"}
              • Use the format YYYY-MM-DD for dates{"\n"}
              • Double-check all details before submitting{"\n"}
              • Processing typically takes 1-3 business days
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            variant="filled"
            color="primary"
            onPress={handleSubmit(handleSubmitVerification)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={theme.colors.neutral0} />
            ) : (
              "Submit Verification"
            )}
          </Button>
        </View>
      </View>
    </ScreenTemplate>
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
  content: {
    padding: theme.spacing.lg,
    paddingBottom: mvs(100),
  },
  description: {
    marginBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  sectionNote: {
    marginBottom: theme.spacing.md,
  },
  infoBox: {
    backgroundColor: theme.colors.primaryLight || theme.colors.primary + "10",
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    marginTop: theme.spacing.md,
  },
  infoText: {
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
  footer: {
    padding: theme.spacing.lg,
    paddingBottom: mvs(40),
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral200,
    backgroundColor: theme.colors.background,
  },
}));
