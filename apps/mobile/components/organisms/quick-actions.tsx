import React from "react";
import { View, TouchableOpacity } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Text } from "@/components/atoms";
import { ms } from "@/utils/scaling";

export interface QuickAction {
  /**
   * Unique identifier for the action
   */
  id: string;

  /**
   * Icon component to display
   */
  icon: React.ReactNode;

  /**
   * Label for the action
   */
  label: string;

  /**
   * Callback when action is pressed
   */
  onPress: () => void;
}

export interface QuickActionsProps {
  /**
   * Title for the quick actions section
   */
  title?: string;

  /**
   * List of quick actions to display
   */
  actions: QuickAction[];

  /**
   * Optional custom style
   */
  style?: any;
}

/**
 * QuickActions - Organism Component
 *
 * Displays a list of quick action buttons with icons and labels.
 * Commonly used in dashboard screens for quick navigation.
 *
 * @example
 * ```tsx
 * <QuickActions
 *   title="Quick Actions"
 *   actions={[
 *     {
 *       id: "bookings",
 *       icon: <Calendar size={20} color={theme.colors.neutral700} variant="Outline" />,
 *       label: "View Bookings",
 *       onPress: () => router.push("/bookings"),
 *     },
 *     {
 *       id: "listings",
 *       icon: <Home2 size={20} color={theme.colors.neutral700} variant="Outline" />,
 *       label: "Manage Listings",
 *       onPress: () => router.push("/listings"),
 *     },
 *   ]}
 * />
 * ```
 */
export function QuickActions({ title = "Quick Actions", actions, style }: QuickActionsProps) {
  const { theme } = useUnistyles();

  return (
    <View style={[styles.container, style]}>
      {title && (
        <Text variant="bodyLargeSemiBold" color="neutral800" style={styles.title}>
          {title}
        </Text>
      )}

      <View style={styles.actionsContainer}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionButton,
              index === actions.length - 1 && styles.actionButtonLast,
            ]}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            {action.icon}
            <Text variant="bodySmallSemiBold" color="neutral800" style={styles.actionText}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  title: {
    marginBottom: theme.spacing.base,
  },
  actionsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.base,
    borderBottomWidth: theme.borderWidth.thin,
    borderBottomColor: theme.colors.divider,
  },
  actionButtonLast: {
    borderBottomWidth: 0,
  },
  actionText: {
    marginLeft: theme.spacing.base,
  },
}));
