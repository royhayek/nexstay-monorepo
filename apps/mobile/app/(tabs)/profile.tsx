import { router } from "expo-router";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Text } from "@/components/atoms";
import { MenuItem, ProfileInfoCard, RoleSwitcher } from "@/components/molecules";
import { MenuSection } from "@/components/organisms";
import { TabScreenTemplate } from "@/components/templates";
import { useRoleContext } from "@/contexts";
import { useAuth } from "@/hooks/use-auth";
import { useBottomSheet } from "@/hooks/use-bottom-sheet";
import { ms, mvs } from "@/utils/scaling";
import { useUsersAppControllerApplyToBeHost } from "@/api/queries/protected/users/users";

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
  ShieldTick,
  Home2,
  Add,
} from "iconsax-react-native";

export default function ProfileScreen() {
  const { theme } = useUnistyles();
  const { isAuthenticated, logout, user, updateUser } = useAuth();
  const { showBottomSheet, hideBottomSheet } = useBottomSheet();
  const { canBeHost, isDualRole, switchRole } = useRoleContext();

  const { mutateAsync: becomeHost, isPending: isBecomingHost } = useUsersAppControllerApplyToBeHost();

  const handleBecomeHost = async () => {
    try {
      // Call backend to grant host role (no data required)
      await becomeHost({
        data: {},
      });

      // Update local user data to include host role
      await updateUser({ roles: [...(user?.roles || []), "host"] as any });

      // Switch to host mode
      await switchRole("host");

      hideBottomSheet();
    } catch (error) {
      console.error("Failed to become host:", error);
      hideBottomSheet();
    }
  };

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
    <TabScreenTemplate title="My Profile">
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: mvs(120) }]}
      >
        {isAuthenticated ? (
          <>
            {/* Profile Info Card */}
            <ProfileInfoCard
              avatarSource={user?.avatarUrl}
              name={
                user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.firstName || user?.lastName || "Hasna Azlya"
              }
              subtitle={user?.email || "hasnaazlya@gmail.com"}
              onEditPress={handleEditProfile}
              style={styles.profileCard}
            />

            {/* Role Switcher - Only show for dual-role users */}
            {isDualRole && (
              <View style={styles.roleSwitcherContainer}>
                <RoleSwitcher />
              </View>
            )}

            {/* Privacy and Security Section */}
            <MenuSection title="Privacy and Security">
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
            </MenuSection>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Preferences Section */}
            <MenuSection title="Preference">
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
            </MenuSection>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Hosting Section - Only show for non-hosts */}
            {!canBeHost && (
              <>
                <MenuSection title="Hosting">
                  <MenuItem
                    icon={<Add size={ms(20)} color={theme.colors.primary} variant="Bold" />}
                    label="Become a Host"
                    subtitle="Share your space and earn extra income"
                    onPress={() => {
                      showBottomSheet({
                        variant: "confirmation",
                        title: "Become a Host",
                        message:
                          "Start earning by sharing your space with guests. You'll automatically be switched to host mode.",
                        icon: <Home2 size={ms(24)} color={theme.colors.background} variant="Bold" />,
                        buttons: [
                          {
                            text: "Cancel",
                            onPress: hideBottomSheet,
                            variant: "outlined",
                            color: "neutral",
                          },
                          {
                            text: isBecomingHost ? "Processing..." : "Become a Host",
                            onPress: handleBecomeHost,
                            variant: "filled",
                            color: "primary",
                            disabled: isBecomingHost,
                          },
                        ],
                      });
                    }}
                  />
                </MenuSection>

                {/* Divider */}
                <View style={styles.divider} />
              </>
            )}

            {/* Help Center Section */}
            <MenuSection title="Help Center">
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
            </MenuSection>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Logout Button */}
            <MenuSection hideTitle>
              <MenuItem
                icon={<Logout size={ms(20)} color={theme.colors.error} variant="Outline" />}
                label="Logout Account"
                textColor="error"
                showArrow={false}
                onPress={handleLogout}
              />
            </MenuSection>
          </>
        ) : (
          <View style={styles.loginPromptContainer}>
            <ProfileCircle size={ms(80)} color={theme.colors.neutral300} variant="Bulk" />
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
    paddingTop: theme.spacing.lg,
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
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  roleSwitcherContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
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
