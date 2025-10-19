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
import { CheckFatIcon } from "phosphor-react-native";

interface PasswordForm {
  password: string;
  confirmPassword?: string;
}

export default function PasswordScreen() {
  const params = useLocalSearchParams<{
    identifier: string;
    method: "email" | "phone";
    resetFlow?: "true";
    resetToken?: string;
    sessionToken?: string;
  }>();

  const { signinPassword, resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isResetFlow = params.resetFlow === "true";

  const { control, handleSubmit } = useForm<PasswordForm>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const handleClose = () => {
    router.back();
  };

  const handlePasswordSubmit = async (data: PasswordForm) => {
    if (isResetFlow) {
      // Password reset flow
      if (!data.password.trim()) {
        Alert.alert("Error", "Please enter your new password");
        return;
      }

      if (data.password.length < 8) {
        Alert.alert("Error", "Password must be at least 8 characters long");
        return;
      }

      if (data.password !== data.confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return;
      }

      setIsLoading(true);

      try {
        await resetPassword(params.resetToken || "", data.password.trim());

        setIsLoading(false);
        setShowSuccess(true);
      } catch (error) {
        setIsLoading(false);
        const errorMessage = error instanceof Error ? error.message : "Failed to reset password. Please try again.";
        Alert.alert("Error", errorMessage);
      }
    } else {
      // Signin flow using new API
      if (!data.password.trim()) {
        Alert.alert("Error", "Please enter your password");
        return;
      }

      if (!params.sessionToken) {
        Alert.alert("Error", "Session expired. Please try again.");
        router.back();
        return;
      }

      setIsLoading(true);

      try {
        const result = await signinPassword(params.sessionToken, data.password.trim());

        if (result.data.requiresDeviceVerification) {
          setIsLoading(false);
          // Navigate to device verification screen
          router.push({
            pathname: "/(auth)/verify",
            params: {
              identifier: params.identifier,
              method: params.method,
              flow: "device-verification",
              sessionToken: result.data.sessionToken!,
              codeDeliveryMethod: result.data.codeDeliveryMethod || "sms",
            },
          });
        } else if (result.data.accessToken) {
          setIsLoading(false);
          // Navigate back to tabs - login already handled in signinPassword
          router.dismissAll();
          router.replace("/(tabs)");
        } else {
          setIsLoading(false);
          Alert.alert("Error", "Unexpected response. Please try again.");
        }
      } catch (error) {
        setIsLoading(false);
        const errorMessage = error instanceof Error ? error.message : "Login failed. Please try again.";
        Alert.alert("Error", errorMessage);
      }
    }
  };

  const handleForgotPassword = () => {
    router.push({
      pathname: "/(auth)/forgot-password",
      params: {
        identifier: params.identifier,
        method: params.method,
      },
    });
  };

  const handleRequestSmsCode = async () => {
    if (!params.sessionToken) {
      Alert.alert("Error", "Session expired. Please try again.");
      router.back();
      return;
    }

    setIsLoading(true);

    try {
      const result = await signinPassword(params.sessionToken, "", true); // Request SMS code

      setIsLoading(false);

      if (result.data.requiresDeviceVerification) {
        // Navigate to verification screen
        router.push({
          pathname: "/(auth)/verify",
          params: {
            identifier: params.identifier,
            method: params.method,
            flow: "device-verification",
            sessionToken: result.data.sessionToken!,
            codeDeliveryMethod: result.data.codeDeliveryMethod || "sms",
          },
        });
      } else {
        Alert.alert("Error", "Failed to send SMS code. Please try again.");
      }
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Failed to send SMS code. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <AuthTemplate title={isResetFlow ? "Reset password" : "Welcome to Airbnb"} onBackPress={handleClose}>
      {showSuccess ? (
        <>
          {/* Success State */}
          <StatusHeader
            icon={<CheckFatIcon size={24} color="#fff" weight="fill" />}
            title="Congratulation!"
            description="Your password successfully updated!"
            titleVariant="h5SemiBold"
            titleColor="text"
            descriptionColor="textSecondary"
          />

          <View style={styles.buttonSection}>
            <Button
              onPress={() => {
                router.dismissAll();
                // Navigate to login
                router.push("/(auth)/login");
              }}
              fullWidth
              size="large"
              color="primary"
            >
              Back to Login
            </Button>
          </View>
        </>
      ) : (
        <>
          <StatusHeader
            icon={<PasswordCheck size={24} color="#fff" variant="Bold" />}
            description={isResetFlow ? "Enter your new password" : "Enter your password to proceed"}
          />

          {/* Password Input */}
          <View style={styles.inputSection}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  variant="password"
                  label="Password"
                  placeholder={isResetFlow ? "Enter your new password" : "Password"}
                  value={value}
                  onChangeText={onChange}
                  autoComplete={isResetFlow ? "new-password" : "password"}
                  autoFocus
                  editable={!isLoading}
                />
              )}
            />
          </View>

          {isResetFlow && (
            /* Confirm Password Input */
            <View style={styles.inputSection}>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <Input
                    variant="password"
                    label="Confirmation New Password"
                    placeholder="Confirm your new password"
                    value={value || ""}
                    onChangeText={onChange}
                    autoComplete="new-password"
                    editable={!isLoading}
                  />
                )}
              />
            </View>
          )}

          {/* Forgot Password and SMS Code - only show in login flow */}
          {!isResetFlow && (
            <View style={styles.actionContainer}>
              <Button variant="text" size="small" onPress={handleForgotPassword}>
                Forgot Password ?
              </Button>
              {params.method === "phone" && (
                <Button variant="text" size="small" onPress={handleRequestSmsCode} disabled={isLoading}>
                  Request SMS Code
                </Button>
              )}
            </View>
          )}

          {/* Submit Button */}
          <View style={styles.buttonSection}>
            <Button
              onPress={handleSubmit(handlePasswordSubmit)}
              disabled={isLoading}
              loading={isLoading}
              fullWidth
              size="large"
              color="primary"
            >
              {isResetFlow ? "Submit" : "Continue"}
            </Button>
          </View>
        </>
      )}
    </AuthTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  iconContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },

  iconBackground: {
    width: ms(56),
    height: mvs(56),
    borderRadius: ms(30),
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  successIconBackground: {
    width: ms(56),
    height: mvs(56),
    borderRadius: ms(40),
    backgroundColor: "#000",
  },

  description: {
    marginBottom: theme.spacing.xl,
  },

  successTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },

  successDescription: {
    marginBottom: theme.spacing.xxxl,
  },

  inputSection: {
    marginBottom: theme.spacing.base,
  },

  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "flex-end",
  },

  buttonSection: {
    marginTop: theme.spacing.xxl,
  },
}));
