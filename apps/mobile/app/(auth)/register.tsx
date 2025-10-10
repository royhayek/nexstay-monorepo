import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Linking, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import type { SignupCompleteProfileDto } from "@/api/models/public/signupCompleteProfileDto";
import { AuthTemplate, Button, Input, LinkText, Text } from "@/components";
import { useAuth } from "@/hooks/use-auth";

interface RegisterForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  password: string;
}

export default function RegisterScreen() {
  const params = useLocalSearchParams<{
    identifier: string;
    method: "email" | "phone";
    verified?: "true";
    sessionToken?: string;
  }>();

  console.log("Register screen params:", params);

  const { setShowLoginModal, completeProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit } = useForm<RegisterForm>({
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      password: "",
    },
  });

  const handleClose = () => {
    setShowLoginModal(false);
    router.back();
  };

  const handleRegister = async (data: RegisterForm) => {
    // Validation
    if (!data.firstName.trim()) {
      Alert.alert("Error", "Please enter your first name");
      return;
    }

    if (!data.lastName.trim()) {
      Alert.alert("Error", "Please enter your last name");
      return;
    }

    if (!data.dateOfBirth.trim()) {
      Alert.alert("Error", "Please enter your date of birth");
      return;
    }

    // Validate date of birth format and age (18+)
    const dobRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
    const dobMatch = data.dateOfBirth.match(dobRegex);

    if (!dobMatch) {
      Alert.alert("Error", "Please enter a valid date of birth (YYYY-MM-DD)");
      return;
    }

    const [, year, month, day] = dobMatch;
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    // Check if birthday hasn't occurred this year yet
    const actualAge =
      monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

    if (actualAge < 18) {
      Alert.alert("Age Requirement", "You must be at least 18 years old to create an account");
      return;
    }

    if (!data.password || data.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    // Check if we have a session token (new flow)
    if (!params.sessionToken || params.sessionToken === "") {
      console.log("Missing sessionToken:", params.sessionToken);
      Alert.alert("Error", "Session expired. Please start over.");
      router.back();
      return;
    }

    setIsLoading(true);

    try {
      const userData: SignupCompleteProfileDto = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        birthDate: data.dateOfBirth.trim(),
        password: data.password,
        sessionToken: params.sessionToken,
      };

      await completeProfile(userData);

      setIsLoading(false);

      // Navigate to add contact info screen (recommended but can skip)
      router.replace({
        pathname: "/(auth)/add-contact",
        params: {
          primaryMethod: params.method,
          primaryIdentifier: params.identifier,
        },
      });
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  const handleTermsPress = () => {
    Linking.openURL("https://www.airbnb.com/terms");
  };

  const handlePaymentsTermsPress = () => {
    Linking.openURL("https://www.airbnb.com/terms/payments_terms");
  };

  const handleNondiscriminationPolicyPress = () => {
    Linking.openURL("https://www.airbnb.com/nondiscrimination_policy");
  };

  const handlePrivacyPolicyPress = () => {
    Linking.openURL("https://www.airbnb.com/privacy");
  };

  return (
    <AuthTemplate title="Join us now!" onBackPress={handleClose}>
      {/* Description */}
      <Text variant="bodyMediumRegular" color="neutral500" style={styles.description}>
        Fill your information below to proceed
      </Text>

      {/* Form Fields */}
      <View style={styles.form}>
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="First Name"
              placeholder="First Name"
              value={value}
              onChangeText={onChange}
              autoCapitalize="words"
              editable={!isLoading}
            />
          )}
        />

        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Last Name"
              placeholder="Last Name"
              value={value}
              onChangeText={onChange}
              autoCapitalize="words"
              editable={!isLoading}
            />
          )}
        />

        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              value={value}
              onChangeText={(text) => {
                // Auto-format date as user types (YYYY-MM-DD)
                let formatted = text.replace(/\D/g, ""); // Remove non-digits
                if (formatted.length >= 4) {
                  formatted = formatted.substring(0, 4) + "-" + formatted.substring(4);
                }
                if (formatted.length >= 7) {
                  formatted = formatted.substring(0, 7) + "-" + formatted.substring(7, 9);
                }
                onChange(formatted);
              }}
              keyboardType="number-pad"
              maxLength={10}
              editable={!isLoading}
            />
          )}
        />

        <Input
          label={params.method === "email" ? "Email" : "Phone number"}
          placeholder={params.identifier}
          value={params.identifier}
          editable={false}
          keyboardType={params.method === "email" ? "email-address" : "phone-pad"}
          autoCapitalize="none"
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              variant="password"
              label="Password"
              placeholder="Password"
              value={value}
              onChangeText={onChange}
              autoComplete="password-new"
              editable={!isLoading}
            />
          )}
        />
      </View>

      {/* Terms and Conditions */}
      <View>
        <Text variant="bodySmallRegular" color="neutral600">
          By selecting Agree and Continue, I agree to Airbnb&apos;s{" "}
          <LinkText underlined onPress={handleTermsPress}>
            Terms of Service
          </LinkText>
          ,{" "}
          <LinkText underlined onPress={handlePaymentsTermsPress}>
            Payments Terms of Service
          </LinkText>{" "}
          and{" "}
          <LinkText underlined onPress={handleNondiscriminationPolicyPress}>
            Nondiscrimination Policy
          </LinkText>{" "}
          and acknowledge the{" "}
          <LinkText underlined onPress={handlePrivacyPolicyPress}>
            Privacy Policy
          </LinkText>
          .
        </Text>
      </View>

      {/* Continue Button */}
      <View style={styles.buttonSection}>
        <Button
          onPress={handleSubmit(handleRegister)}
          disabled={isLoading}
          loading={isLoading}
          fullWidth
          size="large"
          color="primary"
        >
          Agree and Continue
        </Button>
      </View>
    </AuthTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  description: {
    marginBottom: theme.spacing.xl,
  },

  form: {
    gap: theme.spacing.base,
    marginBottom: theme.spacing.base,
  },

  termsLink: {
    color: theme.colors.text,
    fontWeight: theme.typography.bodySmallMedium.fontWeight,
    textDecorationLine: "underline",
  },

  buttonSection: {
    marginTop: theme.spacing.md,
  },
}));
