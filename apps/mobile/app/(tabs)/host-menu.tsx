import { router } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Avatar, Input, Text } from "@/components/atoms";
import { MenuItem, RoleSwitcher } from "@/components/molecules";
import { MenuSection } from "@/components/organisms";
import { TabScreenTemplate } from "@/components/templates";
import { useRoleContext } from "@/contexts";
import { useAuth } from "@/hooks/use-auth";
import { useBottomSheet } from "@/hooks/use-bottom-sheet";
import { ms, mvs } from "@/utils/scaling";

import {
  DollarCircle,
  Home2,
  Chart,
  Setting2,
  InfoCircle,
  Logout,
  LogoutCurve,
  SearchNormal1,
} from "iconsax-react-native";

/**
 * Host Menu Screen
 *
 * Host-specific menu with settings, analytics, and account management.
 */
export default function HostMenuScreen() {
  const { theme } = useUnistyles();
  const { logout, user } = useAuth();
  const { showBottomSheet, hideBottomSheet } = useBottomSheet();
  const { isDualRole } = useRoleContext();

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

  return (
    <TabScreenTemplate title="Menu">
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: mvs(120) }]}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Input
            variant="search"
            placeholder="Search"
            leftIcon={<SearchNormal1 size={20} color={theme.colors.neutral600} variant="Outline" />}
          />
        </View>

        {/* Profile Info Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <Avatar
              source={user?.avatarUrl || require("@/assets/images/avatar.png")}
              size="medium"
              initials={user?.firstName ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ""}` : "H"}
            />
            <View style={styles.profileText}>
              <Text variant="bodyLargeSemiBold" color="neutral800">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.firstName || user?.lastName || "Host"}
              </Text>
              <Text variant="bodySmallRegular" color="success">
                Host Mode
              </Text>
            </View>
          </View>
        </View>

        {/* Role Switcher - Only show for dual-role users */}
        {isDualRole && (
          <View style={styles.roleSwitcherContainer}>
            <RoleSwitcher />
          </View>
        )}

        {/* Host Management Section */}
        <MenuSection title="Host Management">
          <MenuItem
            icon={<Home2 size={ms(20)} color={theme.colors.neutral700} variant="Outline" />}
            label="My Listings"
            onPress={() => console.log("My Listings - Phase 4")}
          />
          <MenuItem
            icon={<DollarCircle size={ms(20)} color={theme.colors.neutral700} variant="Outline" />}
            label="Earnings & Payouts"
            onPress={() => console.log("Earnings - Phase 4")}
          />
          <MenuItem
            icon={<Chart size={ms(20)} color={theme.colors.neutral700} variant="Outline" />}
            label="Performance"
            onPress={() => console.log("Performance - Phase 4")}
          />
        </MenuSection>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Settings Section */}
        <MenuSection title="Settings">
          <MenuItem
            icon={<Setting2 size={ms(20)} color={theme.colors.neutral700} variant="Outline" />}
            label="Account Settings"
            onPress={() => router.push("/edit-profile")}
          />
          <MenuItem
            icon={<InfoCircle size={ms(20)} color={theme.colors.neutral700} variant="Outline" />}
            label="Help & Support"
            onPress={() => console.log("Help & Support")}
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
    gap: theme.spacing.md,
  },
  profileText: {
    flex: 1,
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
}));
