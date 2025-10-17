import React from "react";
import { View, TouchableOpacity, ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Text } from "@/components/atoms";
import { ms } from "@/utils/scaling";

export interface StatCardProps {
  /**
   * The icon component to display
   */
  icon: React.ReactNode;

  /**
   * The main stat value/number to display
   */
  value: string | number;

  /**
   * Label describing the stat
   */
  label: string;

  /**
   * Optional background color for the icon
   */
  iconBackgroundColor?: string;

  /**
   * Optional callback when card is pressed
   */
  onPress?: () => void;

  /**
   * Custom style for the card
   */
  style?: ViewStyle;
}

/**
 * StatCard - Molecule Component
 *
 * Displays a statistic with an icon, value, and label.
 * Used for displaying metrics like check-ins, check-outs, totals, etc.
 *
 * @example
 * ```tsx
 * <StatCard
 *   icon={<Login size={24} color={theme.colors.success} variant="Bold" />}
 *   value={5}
 *   label="Check-ins"
 *   iconBackgroundColor={`${theme.colors.success}15`}
 *   onPress={() => console.log("View check-ins")}
 * />
 * ```
 */
export function StatCard({
  icon,
  value,
  label,
  iconBackgroundColor,
  onPress,
  style,
}: StatCardProps) {
  const { theme } = useUnistyles();

  const content = (
    <>
      <View style={[styles.iconContainer, iconBackgroundColor && { backgroundColor: iconBackgroundColor }]}>
        {icon}
      </View>
      <Text variant="h4SemiBold" color="neutral900" style={styles.value}>
        {value}
      </Text>
      <Text variant="bodySmallRegular" color="neutral600">
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, style]}>{content}</View>;
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  iconContainer: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  value: {
    marginBottom: theme.spacing.xs,
  },
}));
