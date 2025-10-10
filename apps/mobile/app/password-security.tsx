import { router } from "expo-router";
import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Input, Text } from "@/components/atoms";
import { ScreenTemplate } from "@/components/templates";
import { ms } from "@/utils/scaling";

import { Add, Eye, TickCircle } from "iconsax-react-native";

export default function PasswordSecurityScreen() {
  const [showPassword, setShowPassword] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleChangePassword = () => {
    router.push("/change-password");
  };

  const handleCreatePin = () => {
    router.push("/setup-pin");
  };

  const handleLinkGoogle = () => {
    console.log("Google already linked");
  };

  const handleLinkFacebook = () => {
    console.log("Link Facebook");
  };

  return (
    <ScreenTemplate title="Password and Security" onBackPress={handleBack}>
      {/* Password Section */}
      <View style={styles.section}>
        <Text variant="h6SemiBold" color="neutral800" style={styles.sectionTitle}>
          Password
        </Text>

        <View style={styles.passwordContainer}>
          <Input
            value="••••••••••"
            editable={false}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Eye size={ms(20)} color="#6B7280" variant="Outline" />
              </TouchableOpacity>
            }
          />
        </View>

        <TouchableOpacity onPress={handleChangePassword}>
          <Text variant="bodyMediumMedium" color="neutral800" style={styles.changePasswordText}>
            Change Password
          </Text>
        </TouchableOpacity>
      </View>

      {/* Linked Accounts Section */}
      <View style={styles.section}>
        <Text variant="h6SemiBold" color="neutral800" style={styles.sectionTitle}>
          Linked Accounts
        </Text>

        <View style={styles.linkedAccountsContainer}>
          {/* Google Account - Linked */}
          <TouchableOpacity style={styles.linkedAccountItem} onPress={handleLinkGoogle}>
            <Text variant="bodyMediumMedium" color="neutral800">
              Google
            </Text>
            <TickCircle size={ms(20)} color="#10B981" variant="Bold" />
          </TouchableOpacity>

          {/* Facebook Account - Not Linked */}
          <TouchableOpacity style={styles.linkedAccountItem} onPress={handleLinkFacebook}>
            <Text variant="bodyMediumMedium" color="neutral800">
              Facebook
            </Text>
            <Add size={ms(20)} color="#6B7280" variant="Outline" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Create PIN Section */}
      <View style={styles.section}>
        <Text variant="h6SemiBold" color="neutral800" style={styles.sectionTitle}>
          Create PIN
        </Text>

        <Text variant="bodyMediumRegular" color="neutral600" style={styles.pinDescription}>
          Keep your account safe by having a PIN to verify certain activities at Bookme Apps
        </Text>

        <TouchableOpacity onPress={handleCreatePin}>
          <Text variant="bodyMediumMedium" color="neutral800" style={styles.createPinText}>
            Create PIN
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.lg,
  },
  passwordContainer: {
    marginBottom: theme.spacing.base,
  },
  changePasswordText: {
    paddingVertical: theme.spacing.sm,
  },
  linkedAccountsContainer: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  linkedAccountItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: theme.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  pinDescription: {
    marginBottom: theme.spacing.lg,
    lineHeight: ms(22),
  },
  createPinText: {
    paddingVertical: theme.spacing.sm,
  },
}));
