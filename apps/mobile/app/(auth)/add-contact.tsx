import { ms, mvs } from "@/utils/scaling";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { AuthTemplate, Button, Input, Text } from "@/components";
import { StatusHeader } from "@/components/molecules";
import { useAuth } from "@/hooks/use-auth";
import { EnvelopeSimpleIcon, PhoneIcon } from "phosphor-react-native";

interface AddContactForm {
  identifier: string;
}

export default function AddContactScreen() {
  const params = useLocalSearchParams<{
    primaryMethod: "email" | "phone";
    primaryIdentifier: string;
  }>();

  const missingMethod = params.primaryMethod === "email" ? "phone" : "email";
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit } = useForm<AddContactForm>({
    defaultValues: {
      identifier: "",
    },
  });

  const { addSecondaryContact } = useAuth();

  const handleClose = () => {
    // Skip this step and go to main app
    router.dismissAll();
    router.replace("/(tabs)");
  };

  const handleSkip = () => {
    // Skip this step and go to main app
    router.dismissAll();
    router.replace("/(tabs)");
  };

  const handleAddContact = async (data: AddContactForm) => {
    if (!data.identifier.trim()) {
      Alert.alert("Error", `Please enter your ${missingMethod === "email" ? "email address" : "phone number"}`);
      return;
    }

    // Basic validation
    if (missingMethod === "email" && !data.identifier.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (missingMethod === "phone" && data.identifier.length < 8) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setIsLoading(true);

    try {
      // For phone numbers, include the country code
      const fullIdentifier = missingMethod === "phone" ? `+961${data.identifier.trim()}` : data.identifier.trim();

      const result = await addSecondaryContact(missingMethod, fullIdentifier);

      setIsLoading(false);

      // Check if verification is required
      if (!result.data.verificationRequired) {
        // Contact added successfully without verification
        Alert.alert(
          "Contact Added",
          `Your ${missingMethod === "email" ? "email address" : "phone number"} has been added successfully!`,
          [
            {
              text: "Continue",
              onPress: () => {
                router.dismissAll();
                router.replace("/(tabs)");
              },
            },
          ]
        );
      } else {
        // Navigate to verification screen - OTP has already been sent
        router.push({
          pathname: "/(auth)/verify",
          params: {
            identifier: fullIdentifier,
            method: missingMethod,
            flow: "add-contact",
          },
        });
      }
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Failed to send verification code";
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <AuthTemplate title="Add contact info" onBackPress={handleClose}>
      <StatusHeader
        icon={
          missingMethod === "email" ? (
            <EnvelopeSimpleIcon size={24} color="#fff" weight="regular" />
          ) : (
            <PhoneIcon size={24} color="#fff" weight="regular" />
          )
        }
        title={`Add your ${missingMethod === "email" ? "email address" : "phone number"}`}
        titleVariant="h6SemiBold"
        titleColor="text"
        description={
          missingMethod === "email"
            ? "Adding your email helps secure your account and lets us send you trip confirmations."
            : "Adding your phone number helps secure your account and lets us send you important updates about your trips."
        }
      />

      {/* Input Field */}
      <View style={styles.inputSection}>
        <Controller
          control={control}
          name="identifier"
          render={({ field: { onChange, value } }) => (
            <>
              {missingMethod === "email" ? (
                <Input
                  label="Email address"
                  placeholder="Enter your email address"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                />
              ) : (
                <Input
                  label="Phone number"
                  variant="phone"
                  placeholder="Phone number"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  countryCode="+961"
                  editable={!isLoading}
                />
              )}
            </>
          )}
        />
      </View>

      {/* Continue Button */}
      <View style={styles.buttonSection}>
        <Button
          onPress={handleSubmit(handleAddContact)}
          disabled={isLoading}
          loading={isLoading}
          fullWidth
          size="large"
          color="primary"
        >
          Continue
        </Button>
      </View>

      {/* Skip Button */}
      <View>
        <Button variant="text" size="small" onPress={handleSkip} disabled={isLoading}>
          Skip for now
        </Button>
      </View>
    </AuthTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  iconContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },

  iconBackground: {
    width: ms(60),
    height: mvs(60),
    borderRadius: ms(30),
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    marginBottom: theme.spacing.md,
  },

  description: {
    marginBottom: theme.spacing.xl,
  },

  inputSection: {
    marginBottom: theme.spacing.xl,
  },

  buttonSection: {
    marginBottom: theme.spacing.lg,
  },
}));
