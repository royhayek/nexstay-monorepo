import React from "react";
import { View, TouchableOpacity, Animated } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { router } from "expo-router";

import { Text } from "../atoms";
import { useRoleContext } from "@/contexts";
import { ms, mvs } from "@/utils/scaling";

import { Home2, Location } from "iconsax-react-native";

/**
 * RoleSwitcher - Component for switching between guest and host roles
 *
 * Displays a toggle UI that allows dual-role users to switch between
 * guest and host modes. Only visible for users with both roles.
 *
 * @example
 * ```tsx
 * // In profile or header
 * <RoleSwitcher />
 * ```
 */
export function RoleSwitcher() {
  const { theme } = useUnistyles();
  const { activeRole, switchRole, canBeHost, canBeGuest, isDualRole } = useRoleContext();

  // Don't show if user doesn't have both roles
  if (!isDualRole) {
    return null;
  }

  const handleSwitchToGuest = async () => {
    try {
      await switchRole("guest");
      // Navigate to main guest screen (home)
      router.replace("/(tabs)/");
    } catch (error) {
      console.error("Failed to switch to guest role:", error);
    }
  };

  const handleSwitchToHost = async () => {
    try {
      await switchRole("host");
      // Navigate to host dashboard
      router.replace("/(tabs)/host-dashboard");
    } catch (error) {
      console.error("Failed to switch to host role:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Guest Button */}
      <TouchableOpacity
        style={[
          styles.roleButton,
          activeRole === "guest" && styles.roleButtonActive,
        ]}
        onPress={handleSwitchToGuest}
        activeOpacity={0.7}
        disabled={activeRole === "guest"}
      >
        <View
          style={[
            styles.iconContainer,
            activeRole === "guest" && styles.iconContainerActive,
          ]}
        >
          <Location
            size={ms(20)}
            color={activeRole === "guest" ? theme.colors.primary : theme.colors.neutral600}
            variant={activeRole === "guest" ? "Bold" : "Outline"}
          />
        </View>
        <Text
          variant="bodySmallSemiBold"
          color={activeRole === "guest" ? "primary" : "neutral600"}
          style={styles.roleText}
        >
          Guest
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Host Button */}
      <TouchableOpacity
        style={[
          styles.roleButton,
          activeRole === "host" && styles.roleButtonActive,
        ]}
        onPress={handleSwitchToHost}
        activeOpacity={0.7}
        disabled={activeRole === "host"}
      >
        <View
          style={[
            styles.iconContainer,
            activeRole === "host" && styles.iconContainerActive,
          ]}
        >
          <Home2
            size={ms(20)}
            color={activeRole === "host" ? theme.colors.primary : theme.colors.neutral600}
            variant={activeRole === "host" ? "Bold" : "Outline"}
          />
        </View>
        <Text
          variant="bodySmallSemiBold"
          color={activeRole === "host" ? "primary" : "neutral600"}
          style={styles.roleText}
        >
          Host
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * RoleSwitcherCompact - Compact version for use in headers or navigation
 */
export function RoleSwitcherCompact() {
  const { theme } = useUnistyles();
  const { activeRole, switchRole, isDualRole } = useRoleContext();

  if (!isDualRole) {
    return null;
  }

  const handleToggle = async () => {
    try {
      const newRole = activeRole === "guest" ? "host" : "guest";
      await switchRole(newRole);

      // Navigate appropriately
      if (newRole === "guest") {
        router.replace("/(tabs)/");
      } else {
        router.replace("/(tabs)/host-dashboard");
      }
    } catch (error) {
      console.error("Failed to switch role:", error);
    }
  };

  return (
    <TouchableOpacity
      style={stylesCompact.container}
      onPress={handleToggle}
      activeOpacity={0.7}
    >
      <View style={stylesCompact.iconContainer}>
        {activeRole === "guest" ? (
          <Location size={ms(18)} color={theme.colors.primary} variant="Bold" />
        ) : (
          <Home2 size={ms(18)} color={theme.colors.primary} variant="Bold" />
        )}
      </View>
      <Text variant="bodySmallSemiBold" color="primary" style={stylesCompact.text}>
        {activeRole === "guest" ? "Guest" : "Host"}
      </Text>
      <View style={stylesCompact.badge}>
        <Text variant="bodyXSmallSemiBold" color="neutral0" style={stylesCompact.badgeText}>
          Switch
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * RoleBadge - Simple badge showing current role
 */
export function RoleBadge() {
  const { theme } = useUnistyles();
  const { activeRole, isDualRole } = useRoleContext();

  if (!isDualRole) {
    return null;
  }

  return (
    <View
      style={[
        stylesBadge.container,
        activeRole === "host" && { backgroundColor: `${theme.colors.success}15` },
      ]}
    >
      {activeRole === "guest" ? (
        <Location size={ms(14)} color={theme.colors.primary} variant="Bold" />
      ) : (
        <Home2 size={ms(14)} color={theme.colors.success} variant="Bold" />
      )}
      <Text
        variant="bodyXSmallSemiBold"
        color={activeRole === "host" ? "success" : "primary"}
        style={stylesBadge.text}
      >
        {activeRole === "guest" ? "Guest Mode" : "Host Mode"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.xs,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  roleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.base,
    borderRadius: theme.borderRadius.full,
    flex: 1,
    justifyContent: "center",
  },
  roleButtonActive: {
    backgroundColor: `${theme.colors.primary}10`,
  },
  iconContainer: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: theme.colors.neutral200,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.xs,
  },
  iconContainerActive: {
    backgroundColor: `${theme.colors.primary}20`,
  },
  roleText: {
    lineHeight: mvs(16),
  },
  divider: {
    width: 1,
    height: ms(32),
    backgroundColor: theme.colors.divider,
    marginHorizontal: theme.spacing.xs,
  },
}));

const stylesCompact = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: theme.borderWidth.thin,
    borderColor: `${theme.colors.primary}30`,
  },
  iconContainer: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    backgroundColor: `${theme.colors.primary}20`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.xs,
  },
  text: {
    marginRight: theme.spacing.xs,
    lineHeight: mvs(14),
  },
  badge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: mvs(2),
  },
  badgeText: {
    lineHeight: mvs(12),
  },
}));

const stylesBadge = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${theme.colors.primary}10`,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: mvs(4),
    paddingHorizontal: theme.spacing.sm,
    borderWidth: theme.borderWidth.thin,
    borderColor: `${theme.colors.primary}30`,
  },
  text: {
    marginLeft: theme.spacing.xs,
    lineHeight: mvs(12),
  },
}));
