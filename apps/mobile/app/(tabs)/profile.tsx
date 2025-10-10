import { router } from "expo-router";
import React from "react";
import { Image, ScrollView, TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Input, Text } from "@/components/atoms";
import { MenuItem, ModalHeader } from "@/components/molecules";
import { TabScreenTemplate } from "@/components/templates";
import { useAuth } from "@/hooks/use-auth";
import { useBottomSheet } from "@/hooks/use-bottom-sheet";
import { ms, mvs } from "@/utils/scaling";

import {
  DollarCircle,
  Global,
  LanguageSquare,
  Lock1,
  Logout,
  LogoutCurve,
  MessageQuestion,
  Messages2,
  Notification,
  ProfileCircle,
  SearchNormal1,
  ShieldTick,
} from "iconsax-react-native";

export default function ProfileScreen() {
  const { theme } = useUnistyles();
  const { isAuthenticated, logout, user } = useAuth();
  const { showBottomSheet, hideBottomSheet } = useBottomSheet();

  const handleLogout = () => {
    showBottomSheet({
      variant: "confirmation",
      title: "Are you sure want to logout?",
      message: "You will need to login again to access your account",
      icon: <LogoutCurve size={ms(24)} color={theme.colors.background} variant="Bold" />,
      buttons: [
        {
          text: "Cancel",
          onPress: hideBottomSheet,
          variant: "outlined",
          color: "neutral",
        },
        {
          text: "Logout",
          onPress: confirmLogout,
          variant: "filled",
          color: "primary",
        },
      ],
    });
  };

  const confirmLogout = async () => {
    try {
      await logout();
      hideBottomSheet();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout failed:", error);
      hideBottomSheet();
    }
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
  };

  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  return (
    <TabScreenTemplate>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: mvs(120) }]}
      >
        {/* Header */}
        <ModalHeader title="My Profile" showBackButton={false} />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Input
            variant="search"
            placeholder="Search"
            leftIcon={<SearchNormal1 size={20} color={theme.colors.neutral600} variant="Outline" />}
          />
        </View>

        {isAuthenticated ? (
          <>
            {/* Profile Info Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileInfo}>
                <Image
                  source={user?.avatarUrl ? { uri: user.avatarUrl } : require("@/assets/images/avatar.png")}
                  style={styles.avatar}
                />
                <View style={styles.profileText}>
                  <Text variant="bodyLargeSemiBold" color="neutral800">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.firstName || user?.lastName || "Hasna Azlya"}
                  </Text>
                  <Text variant="bodySmallRegular" color="neutral600">
                    {user?.email || "hasnaazlya@gmail.com"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
                <Text variant="bodyMediumMedium" color="neutral800">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>

            {/* Privacy and Security Section */}
            <View style={styles.section}>
              <Text variant="bodySmallMedium" color="neutral500" style={styles.sectionTitle}>
                Privacy and Security
              </Text>
              <View style={styles.menuGroup}>
                <MenuItem
                  icon={<Lock1 size={ms(20)} color={theme.colors.neutral700} variant="Outline" />}
                  label="Password and Security"
                  onPress={() => router.push("/password-security")}
                />
                <MenuItem
                  icon={<ShieldTick size={ms(20)} color={theme.colors.neutral700} variant="Outline" />}
                  label="Privacy Profile"
                  onPress={() => console.log("Privacy Profile")}
                />
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Preferences Section */}
            <View style={styles.section}>
              <Text variant="bodySmallMedium" color="neutral500" style={styles.sectionTitle}>
                Preference
              </Text>
              <View style={styles.menuGroup}>
                <MenuItem
                  icon={<Global size={ms(20)} color={theme.colors.neutral700} variant="Outline" />}
                  label="Country"
                  value="USA"
                  onPress={() => console.log("Country")}
                />
                <MenuItem
                  icon={<DollarCircle size={ms(20)} color={theme.colors.neutral700} variant="Outline" />}
                  label="Currency"
                  value="Dollar"
                  onPress={() => console.log("Currency")}
                />
                <MenuItem
                  icon={<LanguageSquare size={ms(20)} color={theme.colors.neutral700} variant="Outline" />}
                  label="Language"
                  value="English"
                  onPress={() => console.log("Language")}
                />
                <MenuItem
                  icon={<Notification size={ms(20)} color={theme.colors.neutral700} variant="Outline" />}
                  label="Notification Push"
                  onPress={() => console.log("Notifications")}
                />
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Help Center Section */}
            <View style={styles.section}>
              <Text variant="bodySmallMedium" color="neutral500" style={styles.sectionTitle}>
                Help Center
              </Text>
              <View style={styles.menuGroup}>
                <MenuItem
                  icon={<MessageQuestion size={ms(20)} color={theme.colors.neutral700} variant="Outline" />}
                  label="FAQ"
                  onPress={() => console.log("FAQ")}
                />
                <MenuItem
                  icon={<Messages2 size={ms(20)} color={theme.colors.neutral700} variant="Outline" />}
                  label="Customer Service"
                  onPress={() => console.log("Customer Service")}
                />
                <MenuItem
                  icon={<ShieldTick size={ms(20)} color={theme.colors.neutral700} variant="Outline" />}
                  label="Legal and Policies"
                  onPress={() => console.log("Legal")}
                />
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Logout Button */}
            <View style={styles.section}>
              <MenuItem
                icon={<Logout size={ms(20)} color={theme.colors.error} variant="Outline" />}
                label="Logout Account"
                textColor="error"
                showArrow={false}
                onPress={handleLogout}
              />
            </View>
          </>
        ) : (
          <View style={styles.loginPromptContainer}>
            <ProfileCircle size={ms(80)} color={theme.colors.neutral400} variant="Bulk" />
            <Text variant="h6SemiBold" color="neutral800" style={styles.loginTitle}>
              Sign in to your account
            </Text>
            <Text variant="bodyMediumRegular" color="neutral600" style={styles.loginDescription}>
              Access your bookings, favorites, and personalized settings
            </Text>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text variant="bodyMediumSemiBold" color="neutral0">
                Login / Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </TabScreenTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  profileCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.neutral200,
  },
  profileText: {
    flex: 1,
  },
  editButton: {
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
  },
  sectionTitle: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  menuGroup: {
    backgroundColor: theme.colors.surface,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
  },
  loginPromptContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxxl,
  },
  loginTitle: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  loginDescription: {
    textAlign: "center",
    marginBottom: theme.spacing.xl,
    lineHeight: mvs(22),
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.base,
    borderRadius: theme.borderRadius.full,
    minWidth: ms(160),
    alignItems: "center",
  },
}));
