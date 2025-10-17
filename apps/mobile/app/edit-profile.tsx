import { router } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Avatar, Button, Input, Text } from "@/components/atoms";
import { ScreenTemplate } from "@/components/templates";
import { useAuth } from "@/hooks/use-auth";
import { useBottomSheet } from "@/hooks/use-bottom-sheet";
import { ms } from "@/utils/scaling";

interface EditProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  bio: string;
}

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { showBottomSheet, hideBottomSheet } = useBottomSheet();

  const { control, handleSubmit, reset } = useForm<EditProfileForm>({
    defaultValues: {
      firstName: user?.firstName || "Hasna",
      lastName: user?.lastName || "Azlya",
      email: user?.email || "hasnaazlya@gmail.com",
      phone: user?.phone || "234 567 89",
      birthDate: user?.birthDate || "16 September 2002",
      bio: user?.bio || "",
    },
  });

  const handleBack = () => {
    if (hasUnsavedChanges) {
      showExitConfirmation();
    } else {
      router.back();
    }
  };

  const handleChangePhoto = () => {
    Alert.alert("Change Photo", "Select photo source", [
      { text: "Camera", onPress: () => console.log("Camera selected") },
      { text: "Gallery", onPress: () => console.log("Gallery selected") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      showExitConfirmation();
    } else {
      reset();
      router.back();
    }
  };

  const showExitConfirmation = () => {
    showBottomSheet({
      variant: "warning",
      title: "Are you sure want to exit without saving your profile?",
      message: "If you exit now, any changes you haven't saved will be lost.",
      buttons: [
        {
          text: "Cancel",
          onPress: hideBottomSheet,
          variant: "outlined",
          color: "primary",
        },
        {
          text: "Yes",
          onPress: confirmExit,
          variant: "filled",
          color: "primary",
        },
      ],
    });
  };

  const confirmExit = () => {
    hideBottomSheet();
    router.back();
  };

  const handleSave = async (data: EditProfileForm) => {
    setIsLoading(true);
    try {
      // TODO: Implement API call to save profile data
      console.log("Saving profile data:", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setHasUnsavedChanges(false);
      showSuccessMessage();
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccessMessage = () => {
    showBottomSheet({
      variant: "success",
      title: "Profile Update Successfully",
      message: "Congratulations! Your changes have been saved. Your profile is now up-to-date",
      snapPoints: ["40%"],
      buttons: [
        {
          text: "Back to Profile",
          onPress: handleSuccessClose,
          variant: "filled",
          color: "primary",
        },
      ],
    });
  };

  const handleSuccessClose = () => {
    hideBottomSheet();
    router.back();
  };

  // Track form changes
  const handleFormChange = () => {
    setHasUnsavedChanges(true);
  };

  const bottomActions = (
    <>
      <Button variant="outlined" onPress={handleCancel} style={styles.cancelButton} disabled={isLoading}>
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
    <ScreenTemplate title="Edit Profile" onBackPress={handleBack} bottomActions={bottomActions}>
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <Avatar
          source={user?.avatarUrl || require("@/assets/images/avatar.png")}
          size="xlarge"
          initials={user?.firstName ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ""}` : "HA"}
        />
        <TouchableOpacity onPress={handleChangePhoto} style={styles.changePhotoButton}>
          <Text variant="bodyMediumMedium" color="neutral800">
            Change Photo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form Fields */}
      <View style={styles.formSection}>
        {/* First Name */}
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="First Name"
              value={value}
              onChangeText={(text) => {
                onChange(text);
                handleFormChange();
              }}
              placeholder="Enter your first name"
              editable={!isLoading}
            />
          )}
        />

        {/* Last Name */}
        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Last Name"
              value={value}
              onChangeText={onChange}
              placeholder="Enter your last name"
              editable={!isLoading}
            />
          )}
        />

        {/* Email */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email"
              value={value}
              onChangeText={onChange}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          )}
        />

        {/* Phone Number */}
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Phone Number"
              value={value}
              onChangeText={onChange}
              placeholder="Phone number"
              variant="phone"
              countryCode="+961"
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          )}
        />

        {/* Date of Birth */}
        <Controller
          control={control}
          name="birthDate"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Date of Birth"
              value={value}
              onChangeText={onChange}
              placeholder="Select date"
              editable={!isLoading}
            />
          )}
        />

        {/* Bio */}
        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Bio"
              value={value}
              onChangeText={onChange}
              placeholder="Tell us about yourself"
              variant="multiline"
              numberOfLines={3}
              editable={!isLoading}
            />
          )}
        />
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  avatarSection: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.base,
  },
  changePhotoButton: {
    paddingVertical: theme.spacing.sm,
  },
  formSection: {
    gap: theme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
}));
