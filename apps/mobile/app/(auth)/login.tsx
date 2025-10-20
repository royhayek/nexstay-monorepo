import { AuthTemplate, Button, Divider, Input, SegmentedControl, SocialButton } from "@/components";
import { useAuth } from "@/hooks/use-auth";
import { ms, mvs } from "@/utils/scaling";
import { router } from "expo-router";
import { EnvelopeSimpleIcon, PhoneIcon } from "phosphor-react-native";
import React, { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { oauthService } from "@/services/oauth.service";

type LoginMethod = "email" | "phone";

interface LoginForm {
  selectedMethod: LoginMethod;
  identifier: string;
}

export default function LoginScreen() {
  const styles = loginStyles;
  const [isLoading, setIsLoading] = useState(false);
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);

  const { control, handleSubmit, watch, setValue } = useForm<LoginForm>({
    defaultValues: {
      selectedMethod: "phone",
      identifier: "",
    },
  });

  const selectedMethod = watch("selectedMethod");

  const { checkIdentifier, signinInitiate, signupVerifyContact, signInWithGoogle, signInWithApple } = useAuth();

  // Check if Apple Sign-In is available (iOS 13+ with paid developer account)
  useEffect(() => {
    const checkAppleAvailability = async () => {
      const available = await oauthService.isAppleSignInAvailable();
      setIsAppleSignInAvailable(available);
    };
    checkAppleAvailability();
  }, []);

  const handleClose = () => {
    router.back();
  };

  const handleContinue = async (data: LoginForm) => {
    if (!data.identifier.trim()) {
      Alert.alert("Error", `Please enter your ${data.selectedMethod === "email" ? "email address" : "phone number"}`);
      return;
    }

    // Basic validation
    if (data.selectedMethod === "email" && !data.identifier.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (data.selectedMethod === "phone" && data.identifier.length < 8) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Check if identifier exists (following documentation)
      const checkResult = await checkIdentifier(data.identifier.trim());

      if (checkResult.data.exists) {
        // User exists - proceed with signin flow
        const signinResult = await signinInitiate(data.identifier.trim());

        setIsLoading(false);

        // Handle signin next step
        switch (signinResult.data.nextStep) {
          case "password":
            // Navigate to password screen
            router.push({
              pathname: "/(auth)/password",
              params: {
                identifier: data.identifier.trim(),
                method: data.selectedMethod,
                sessionToken: signinResult.data.sessionToken,
              },
            });
            break;

          case "sms_code":
            // Navigate to SMS verification screen for existing user
            router.push({
              pathname: "/(auth)/verify",
              params: {
                identifier: data.identifier.trim(),
                method: data.selectedMethod,
                flow: "signin_sms",
                sessionToken: signinResult.data.sessionToken,
                codeDeliveryMethod: signinResult.data.codeDeliveryMethod || "sms",
              },
            });
            break;

          default:
            // Fallback to password screen
            router.push({
              pathname: "/(auth)/password",
              params: {
                identifier: data.identifier.trim(),
                method: data.selectedMethod,
                sessionToken: signinResult.data.sessionToken,
              },
            });
            break;
        }
      } else {
        // User doesn't exist - proceed with signup flow
        const signupResult = await signupVerifyContact(data.identifier.trim());

        setIsLoading(false);

        // Navigate to verification for new user signup
        router.push({
          pathname: "/(auth)/verify",
          params: {
            identifier: data.identifier.trim(),
            method: data.selectedMethod,
            flow: "signup",
            codeDeliveryMethod:
              signupResult.data.codeDeliveryMethod || (data.selectedMethod === "email" ? "email" : "sms"),
          },
        });
      }
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : "Failed to process request. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      setIsLoading(true);

      if (provider === "Google") {
        await signInWithGoogle();
        // Navigate to main app after successful login
        router.replace("/(tabs)");
      } else if (provider === "Apple") {
        await signInWithApple();
        // Navigate to main app after successful login
        router.replace("/(tabs)");
      } else {
        Alert.alert("Coming Soon", `${provider} login will be available soon!`);
      }
    } catch (error: any) {
      console.error(`${provider} login failed:`, error);

      // Don't show error if user cancelled
      if (!error?.message?.includes("cancelled")) {
        Alert.alert(
          "Sign-In Failed",
          error?.message || `Failed to sign in with ${provider}. Please try again.`,
          [{ text: "OK" }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthTemplate title="Let's get you in" onBackPress={handleClose}>
      {/* Method Selection */}
      <View style={styles.methodContainer}>
        <Controller
          control={control}
          name="selectedMethod"
          render={({ field: { onChange, value } }) => (
            <SegmentedControl
              options={[
                {
                  value: "phone",
                  label: "Phone",
                  icon: (isSelected: boolean) => (
                    <PhoneIcon size={20} color={isSelected ? "#000" : "#6B7280"} weight="regular" />
                  ),
                },
                {
                  value: "email",
                  label: "Email",
                  icon: (isSelected: boolean) => (
                    <EnvelopeSimpleIcon size={20} color={isSelected ? "#000" : "#6B7280"} weight="regular" />
                  ),
                },
              ]}
              selectedValue={value}
              onValueChange={(newValue) => {
                onChange(newValue as LoginMethod);
                setValue("identifier", ""); // Clear identifier when method changes
              }}
              disabled={isLoading}
              size="medium"
            />
          )}
        />
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <Controller
          control={control}
          name="identifier"
          render={({ field: { onChange, value } }) => (
            <Input
              label={selectedMethod === "phone" ? "Phone number" : "Email address"}
              value={value}
              editable={!isLoading}
              autoCapitalize="none"
              onChangeText={onChange}
              variant={selectedMethod === "phone" ? "phone" : undefined}
              autoComplete={selectedMethod === "email" ? "email" : "tel"}
              countryCode={selectedMethod === "phone" ? "+961" : undefined}
              placeholder={selectedMethod === "email" ? "Enter your email address" : "Phone number"}
              keyboardType={selectedMethod === "email" ? "email-address" : "phone-pad"}
            />
          )}
        />
      </View>

      {/* Continue Button */}
      <View style={styles.buttonSection}>
        <Button
          onPress={handleSubmit(handleContinue)}
          disabled={isLoading}
          loading={isLoading}
          fullWidth
          size="large"
          color="primary"
        >
          Continue
        </Button>
      </View>

      <Divider />

      {/* Social Login Buttons */}
      <View style={styles.socialSection}>
        {isAppleSignInAvailable && (
          <SocialButton provider="apple" onPress={() => handleSocialLogin("Apple")} />
        )}
        <SocialButton provider="facebook" onPress={() => handleSocialLogin("Facebook")} />
        <SocialButton provider="google" onPress={() => handleSocialLogin("Google")} />
      </View>
    </AuthTemplate>
  );
}

export const loginStyles = StyleSheet.create((theme) => ({
  methodContainer: {
    marginBottom: theme.spacing.xl,
  },
  inputSection: {
    marginBottom: theme.spacing.xl,
  },
  buttonSection: {
    marginBottom: theme.spacing.xl,
  },
  socialSection: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xxxl,
  },
  bottomIndicator: {
    width: ms(134),
    height: mvs(5),
    backgroundColor: theme.colors.text,
    borderRadius: theme.borderRadius.full,
    alignSelf: "center",
    marginBottom: theme.spacing.lg,
  },
}));
