import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet } from "react-native-unistyles";

import { Button, Input, Text } from "@/components/atoms";
import { ScreenTemplate } from "@/components/templates";
import { ms } from "@/utils/scaling";

import { Eye, EyeSlash } from "iconsax-react-native";

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { control, handleSubmit, watch, reset } = useForm<ChangePasswordForm>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  const handleBack = () => {
    router.back();
  };

  const handleCancel = () => {
    reset();
    router.back();
  };

  const handleSave = async (data: ChangePasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (data.newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement API call to change password
      console.log("Changing password:", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert("Success", "Password changed successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert("Error", "Failed to change password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const bottomActions = (
    <>
      <Button
        variant="outlined"
        onPress={handleCancel}
        style={styles.cancelButton}
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button
        variant="filled"
        onPress={handleSubmit(handleSave)}
        style={styles.saveButton}
        loading={isLoading}
        disabled={isLoading}
      >
        Save
      </Button>
    </>
  );

  return (
    <ScreenTemplate
      title="Change Password"
      onBackPress={handleBack}
      bottomActions={bottomActions}
    >
      <View style={styles.formSection}>
        {/* Current Password */}
        <View style={styles.fieldContainer}>
          <Text variant="bodyMediumMedium" color="neutral800" style={styles.fieldLabel}>
            Current Password
          </Text>
          <Controller
            control={control}
            name="currentPassword"
            rules={{ required: "Current password is required" }}
            render={({ field: { onChange, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                placeholder="Enter your current password"
                secureTextEntry={!showCurrentPassword}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    {showCurrentPassword ? (
                      <EyeSlash size={ms(20)} color="#6B7280" variant="Outline" />
                    ) : (
                      <Eye size={ms(20)} color="#6B7280" variant="Outline" />
                    )}
                  </TouchableOpacity>
                }
                editable={!isLoading}
              />
            )}
          />
        </View>

        {/* New Password */}
        <View style={styles.fieldContainer}>
          <Text variant="bodyMediumMedium" color="neutral800" style={styles.fieldLabel}>
            New Password
          </Text>
          <Controller
            control={control}
            name="newPassword"
            rules={{
              required: "New password is required",
              minLength: { value: 8, message: "Password must be at least 8 characters" }
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                placeholder="Enter your new password"
                secureTextEntry={!showNewPassword}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? (
                      <EyeSlash size={ms(20)} color="#6B7280" variant="Outline" />
                    ) : (
                      <Eye size={ms(20)} color="#6B7280" variant="Outline" />
                    )}
                  </TouchableOpacity>
                }
                editable={!isLoading}
              />
            )}
          />
        </View>

        {/* Confirmation New Password */}
        <View style={styles.fieldContainer}>
          <Text variant="bodyMediumMedium" color="neutral800" style={styles.fieldLabel}>
            Confirmation New Password
          </Text>
          <Controller
            control={control}
            name="confirmPassword"
            rules={{
              required: "Password confirmation is required",
              validate: (value) => value === newPassword || "Passwords do not match"
            }}
            render={({ field: { onChange, value } }) => (
              <Input
                value={value}
                onChangeText={onChange}
                placeholder="Confirmation your new password"
                secureTextEntry={!showConfirmPassword}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <EyeSlash size={ms(20)} color="#6B7280" variant="Outline" />
                    ) : (
                      <Eye size={ms(20)} color="#6B7280" variant="Outline" />
                    )}
                  </TouchableOpacity>
                }
                editable={!isLoading}
              />
            )}
          />
        </View>
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  formSection: {
    gap: theme.spacing.xl,
  },
  fieldContainer: {
    gap: theme.spacing.sm,
  },
  fieldLabel: {
    marginBottom: theme.spacing.xs,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
}));