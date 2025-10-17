import { ms, mvs } from "@/utils/scaling";
import { ArrowRight2 } from "iconsax-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "../atoms/text";

interface MenuItemProps {
  icon?: React.ReactNode;
  label: string;
  subtitle?: string;
  value?: string;
  badge?: string;
  badgeColor?: "primary" | "success" | "warning" | "error" | "info";
  onPress?: () => void;
  showArrow?: boolean;
  textColor?: string;
}

export function MenuItem({
  icon,
  label,
  subtitle,
  value,
  badge,
  badgeColor = "primary",
  onPress,
  showArrow = true,
  textColor,
}: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, subtitle && styles.containerWithSubtitle]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.leftContent}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View style={styles.textContainer}>
          <Text variant="bodyMediumMedium" color={textColor || "neutral800"} style={styles.label}>
            {label}
          </Text>
          {subtitle && (
            <Text variant="bodySmallRegular" color="neutral600" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightContent}>
        {badge && (
          <View style={[styles.badge, styles[`badge${badgeColor.charAt(0).toUpperCase() + badgeColor.slice(1)}` as keyof typeof styles]]}>
            <Text variant="bodyXSmallSemiBold" color="neutral0" style={styles.badgeText}>
              {badge}
            </Text>
          </View>
        )}
        {value && (
          <Text variant="bodySmallRegular" color="neutral500" style={styles.value}>
            {value}
          </Text>
        )}
        {showArrow && <ArrowRight2 size={ms(20)} color="#9CA3AF" variant="Outline" />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    minHeight: mvs(29),
  },
  containerWithSubtitle: {
    paddingVertical: theme.spacing.base,
    minHeight: mvs(48),
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: ms(24),
    height: ms(24),
    marginRight: theme.spacing.base,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  label: {
    flex: 1,
  },
  subtitle: {
    marginTop: mvs(2),
    lineHeight: mvs(16),
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  value: {
    marginRight: theme.spacing.sm,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: mvs(4),
    borderRadius: theme.borderRadius.sm,
  },
  badgePrimary: {
    backgroundColor: theme.colors.primary,
  },
  badgeSuccess: {
    backgroundColor: theme.colors.success,
  },
  badgeWarning: {
    backgroundColor: theme.colors.warning,
  },
  badgeError: {
    backgroundColor: theme.colors.error,
  },
  badgeInfo: {
    backgroundColor: theme.colors.info,
  },
  badgeText: {
    lineHeight: mvs(14),
  },
}));
