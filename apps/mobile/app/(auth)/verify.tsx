import { ms, mvs } from "@/utils/scaling";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { AuthTemplate, Button, OTPInput, Text } from "@/components";
import { StatusHeader } from "@/components/molecules";
import { useAuth } from "@/hooks/use-auth";
import { Message, Sms } from "iconsax-react-native";

interface VerifyForm {
  otp: string;
}

export default function VerifyScreen() {
  const params = useLocalSearchParams<{
    identifier: string;
    method: "email" | "phone";
    flow: "register" | "reset-password" | "add-contact" | "signup" | "signin" | "device-verification";
    sessionToken?: string;
    codeDeliveryMethod?: "sms" | "email";
  }>();

  const { login, signinVerifyDevice, verify, verifyReset, requestVerify } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const { control, handleSubmit } = useForm<VerifyForm>({
    defaultValues: {
      otp: "",
    },
  });

  const handleClose = () => {
    router.back();
  };

  const sendOTP = useCallback(async () => {
    try {
      // For new signin flows, we can't resend from here - user needs to go back
      if (params.flow === "signin" || params.flow === "device-verification") {
        Alert.alert("Resend Code", "To request a new code, please go back and use 'Request SMS Code' again.", [
          { text: "Go Back", onPress: () => router.back() },
          { text: "Cancel", style: "cancel" },
        ]);
        return;
      }

      await requestVerify(params.method, params.identifier);
      setCountdown(60);
      setCanResend(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send verification code";
      Alert.alert("Error", errorMessage);
    }
  }, [params.identifier, params.method, params.flow, requestVerify]);

  // Note: For signup flow, OTP is automatically sent when user signs up
  // We only need to call sendOTP() when user presses "Resend Code"

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async (data: VerifyForm) => {
    if (!data.otp.trim() || data.otp.length < 4) {
      Alert.alert("Error", "Please enter a valid verification code");
      return;
    }

    setIsLoading(true);

    try {
      if (params.flow === "register") {
        // For register flow, use the regular verify endpoint
        const verifyResponse = await verify(params.method, params.identifier, data.otp.trim());

        // For register flow, user is now registered and verified
        // The verify endpoint returns tokens directly
        if (verifyResponse.data.accessToken && verifyResponse.data.refreshToken) {
          await login(
            {
              accessToken: verifyResponse.data.accessToken,
              refreshToken: verifyResponse.data.refreshToken,
            },
            undefined // User data not provided in verify response
          );
        }

        setIsLoading(false);

        // Navigate to add contact info screen (recommended but can skip)
        router.replace({
          pathname: "/(auth)/add-contact",
          params: {
            primaryMethod: params.method,
            primaryIdentifier: params.identifier,
          },
        });
      } else if (params.flow === "reset-password") {
        // For password reset flow, use the verify-reset endpoint only
        const verifyResetResponse = await verifyReset(params.method, params.identifier, data.otp.trim());
        setIsLoading(false);

        // Navigate to password reset page with reset token
        router.replace({
          pathname: "/(auth)/password",
          params: {
            identifier: params.identifier,
            method: params.method,
            resetFlow: "true",
            resetToken: verifyResetResponse.data.resetToken,
          },
        });
      } else if (params.flow === "add-contact") {
        // For add-contact flow, just verify and show success
        await verify(params.method, params.identifier, data.otp.trim());
        setIsLoading(false);

        Alert.alert(
          "Verification Successful",
          `Your ${params.method === "email" ? "email address" : "phone number"} has been added to your account.`,
          [
            {
              text: "Continue",
              onPress: () => {
                // Navigate to home page after verifying additional contact
                router.dismissAll();
                router.replace("/(tabs)");
              },
            },
          ]
        );
      } else if (params.flow === "signup") {
        // For signup flow, verify ownership and then go to personal details (register screen)
        const verifyResponse = await verify(params.method, params.identifier, data.otp.trim());
        setIsLoading(false);

        // Check the response type
        const verifyResponseData = verifyResponse.data;
        console.log("Verify response data:", verifyResponseData);

        if (verifyResponseData.ownershipVerified === true) {
          const sessionToken = verifyResponseData.signupSessionToken || params.sessionToken || "";
          console.log("Session token for register:", sessionToken);

          // Ownership verified for new user - proceed to registration with session token
          router.replace({
            pathname: "/(auth)/register",
            params: {
              identifier: params.identifier,
              method: params.method,
              verified: "true",
              sessionToken,
            },
          });
        } else {
          // Existing user verification (shouldn't happen in signup flow, but handle gracefully)
          if (verifyResponse.data.accessToken && verifyResponse.data.refreshToken) {
            await login(
              {
                accessToken: verifyResponse.data.accessToken,
                refreshToken: verifyResponse.data.refreshToken,
              },
              undefined
            );
          }
          router.dismissAll();
        }
      } else if (params.flow === "signin" || params.flow === "device-verification") {
        // For signin flow with SMS verification or device verification after password
        if (!params.sessionToken) {
          Alert.alert("Error", "Session expired. Please try again.");
          router.back();
          return;
        }

        await signinVerifyDevice(params.sessionToken, data.otp.trim());
        setIsLoading(false);

        // Navigate back to tabs - login already handled in signinVerifyDevice
        router.dismissAll();
      }
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Verification failed. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  const handleResendOTP = async () => {
    if (canResend) {
      await sendOTP();
    }
  };

  return (
    <AuthTemplate
      title={
        params.flow === "signup"
          ? `Verify your ${params.method === "email" ? "email" : "phone"}`
          : params.flow === "device-verification"
          ? "Device verification"
          : params.flow === "signin"
          ? "Enter verification code"
          : `Verify your ${params.method === "email" ? "email" : "phone"}`
      }
      onBackPress={handleClose}
    >
      <StatusHeader
        icon={
          params.method === "email" ? (
            <Message size={24} color="#fff" variant="Bold" />
          ) : (
            <Sms size={24} color="#fff" variant="Bold" />
          )
        }
        description={
          params.flow === "signup"
            ? `We sent a verification code by ${params.method === "email" ? "email" : "SMS"} to${"\n"}${
                params.identifier
              }`
            : params.flow === "device-verification"
            ? `For your security, please enter the verification code we sent by ${
                params.codeDeliveryMethod === "email" ? "email" : "SMS"
              } to${"\n"}${params.identifier}`
            : params.flow === "signin"
            ? `Enter the verification code we sent by ${
                params.codeDeliveryMethod === "email" ? "email" : "SMS"
              } to${"\n"}${params.identifier}`
            : `Enter the 6 digit code we sent by ${params.method === "email" ? "email" : "SMS"} to${"\n"}${
                params.identifier
              }`
        }
      />

      {/* OTP Input */}
      <View style={styles.otpContainer}>
        <Controller
          control={control}
          name="otp"
          render={({ field: { onChange, value } }) => (
            <OTPInput value={value} onTextChange={onChange} numberOfDigits={6} autoFocus disabled={isLoading} />
          )}
        />
      </View>

      {/* Resend Code */}
      <View style={styles.resendContainer}>
        <Text variant="bodyMediumRegular">Didn&apos;t receive the code? </Text>
        <Button
          variant="text"
          onPress={handleResendOTP}
          disabled={!canResend}
          textStyle={styles.resendButtonText}
          size="small"
        >
          {canResend ? "Resend Code" : `Resend Code`}
        </Button>
      </View>

      {/* Verify Button */}
      <View style={styles.buttonSection}>
        <Button
          onPress={handleSubmit(handleVerify)}
          disabled={isLoading}
          loading={isLoading}
          fullWidth
          size="large"
          color="primary"
        >
          Verify
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

  otpContainer: {
    marginBottom: theme.spacing.xl,
  },

  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xl,
  },

  resendButtonText: {
    ...theme.typography.bodyMediumSemiBold,
  },

  buttonSection: {
    marginTop: theme.spacing.lg,
  },
}));
