import { ms, mvs } from "@/utils/scaling";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { AuthTemplate, Button, Input, Text } from "@/components";
import { StatusHeader } from "@/components/molecules";
import { useAuth } from "@/hooks/use-auth";
import { PasswordCheck } from "iconsax-react-native";

interface ForgotPasswordForm {
  identifier: string;
}

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{
    identifier?: string;
    method?: "email" | "phone";
  }>();

  const resetMethod = params.method || "email";
  const [isLoading, setIsLoading] = useState(false);
  const { requestReset } = useAuth();

  const { control, handleSubmit } = useForm<ForgotPasswordForm>({
    defaultValues: {
      identifier: params.identifier || "",
    },
  });

  const handleClose = () => {
    router.back();
  };

  const handleRequestReset = async (data: ForgotPasswordForm) => {
    if (!data.identifier.trim()) {
      Alert.alert("Error", `Please enter your ${resetMethod === "email" ? "email address" : "phone number"}`);
      return;
    }

    // Basic validation
    if (resetMethod === "email" && !data.identifier.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (resetMethod === "phone" && data.identifier.length < 8) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setIsLoading(true);

    try {
      await requestReset(resetMethod, data.identifier.trim());

      setIsLoading(false);

      // Navigate to verification screen
      router.push({
        pathname: "/(auth)/verify",
        params: {
          identifier: data.identifier.trim(),
          method: resetMethod,
          flow: "reset-password",
        },
      });
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Failed to send reset code. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <AuthTemplate title="Forgot password?" onBackPress={handleClose}>
      <StatusHeader
        icon={<PasswordCheck size={24} color="#fff" variant="Bold" />}
        description={`Enter your ${resetMethod === "email" ? "email address" : "phone number"} to proceed`}
      />

      {/* Input Field */}
      <Controller
        control={control}
        name="identifier"
        render={({ field: { onChange, value } }) => (
          <>
            {resetMethod === "email" ? (
              <Input
                label="Email"
                placeholder="Email"
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

      {/* Continue Button */}
      <View style={styles.buttonSection}>
        <Button
          onPress={handleSubmit(handleRequestReset)}
          disabled={isLoading}
          loading={isLoading}
          fullWidth
          size="large"
          color="primary"
        >
          Continue
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

  description: {
    marginBottom: theme.spacing.xl,
  },

  buttonSection: {
    marginTop: theme.spacing.xxl,
  },
}));
