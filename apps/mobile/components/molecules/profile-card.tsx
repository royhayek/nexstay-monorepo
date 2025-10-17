import React from "react";
import { Image, ImageSourcePropType, TouchableOpacity, View, ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Badge, Text } from "@/components/atoms";
import { ms } from "@/utils/scaling";

export interface ProfileCardProps {
  /**
   * User avatar URL
   */
  avatarUrl?: string;

  /**
   * Fallback avatar image if avatarUrl is not provided
   */
  fallbackAvatar: ImageSourcePropType;

  /**
   * User's name
   */
  name: string;

  /**
   * Subtitle text (email, status, or other info)
   */
  subtitle: string;

  /**
   * Color for the subtitle text
   */
  subtitleColor?: string;

  /**
   * Type of right action to display
   */
  rightAction?: "edit" | "badge" | "none";

  /**
   * Text for the right action (button text or badge text)
   */
  rightActionText?: string;

  /**
   * Callback when right action is pressed (for edit button)
   */
  onRightActionPress?: () => void;

  /**
   * Badge color when rightAction is "badge"
   */
  badgeColor?: "primary" | "success" | "warning" | "error" | "info";

  /**
   * Custom style for the card
   */
  style?: ViewStyle;
}

/**
 * ProfileCard - Molecule Component
 *
 * Displays user profile information with avatar, name, subtitle, and optional action button or badge.
 * Used in profile screens, menu screens, and anywhere user info needs to be displayed.
 *
 * @example
 * ```tsx
 * // Profile with edit button
 * <ProfileCard
 *   avatarUrl={user?.avatarUrl}
 *   fallbackAvatar={require("@/assets/images/avatar.png")}
 *   name="John Doe"
 *   subtitle="john@example.com"
 *   rightAction="edit"
 *   rightActionText="Edit"
 *   onRightActionPress={() => router.push("/edit-profile")}
 * />
 *
 * // Profile with badge
 * <ProfileCard
 *   avatarUrl={user?.avatarUrl}
 *   fallbackAvatar={require("@/assets/images/avatar.png")}
 *   name="Jane Smith"
 *   subtitle="Host Since 2023"
 *   rightAction="badge"
 *   rightActionText="Host Mode"
 *   badgeColor="success"
 * />
 *
 * // Simple profile without action
 * <ProfileCard
 *   avatarUrl={user?.avatarUrl}
 *   fallbackAvatar={require("@/assets/images/avatar.png")}
 *   name="Mike Johnson"
 *   subtitle="mike@example.com"
 *   rightAction="none"
 * />
 * ```
 */
export function ProfileCard({
  avatarUrl,
  fallbackAvatar,
  name,
  subtitle,
  subtitleColor = "neutral600",
  rightAction = "none",
  rightActionText,
  onRightActionPress,
  badgeColor = "primary",
  style,
}: ProfileCardProps) {
  const { theme } = useUnistyles();

  const renderRightAction = () => {
    if (rightAction === "edit" && rightActionText) {
      return (
        <TouchableOpacity onPress={onRightActionPress} style={styles.editButton}>
          <Text variant="bodyMediumMedium" color="neutral800">
            {rightActionText}
          </Text>
        </TouchableOpacity>
      );
    }

    if (rightAction === "badge" && rightActionText) {
      return <Badge text={rightActionText} color={badgeColor} />;
    }

    return null;
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.profileInfo}>
        <Image
          source={avatarUrl ? { uri: avatarUrl } : fallbackAvatar}
          style={styles.avatar}
        />
        <View style={styles.profileText}>
          <Text variant="bodyLargeSemiBold" color="neutral800">
            {name}
          </Text>
          <Text variant="bodySmallRegular" color={subtitleColor}>
            {subtitle}
          </Text>
        </View>
      </View>
      {renderRightAction()}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
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
}));
