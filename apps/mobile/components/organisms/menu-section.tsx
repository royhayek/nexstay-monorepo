import React from "react";
import { View, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Text } from "@/components/atoms";

export interface MenuSectionProps {
  /** Section title */
  title?: string;
  /** Children (MenuItem components) */
  children: React.ReactNode;
  /** Custom style */
  style?: ViewStyle;
  /** Hide title */
  hideTitle?: boolean;
}

export const MenuSection: React.FC<MenuSectionProps> = ({ title, children, style, hideTitle = false }) => {
  return (
    <View style={[styles.container, style]}>
      {!hideTitle && title && (
        <Text variant="bodySmallMedium" color="neutral500" style={styles.title}>
          {title}
        </Text>
      )}
      <View style={styles.menuGroup}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    marginBottom: theme.spacing.md,
  },
  title: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  menuGroup: {
    backgroundColor: theme.colors.surface,
  },
}));
