import React from "react";
import { View, ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Text } from "@/components/atoms";

export interface FacilityItemProps {
  /** Icon element */
  icon: React.ReactNode;
  /** Facility label */
  label: string;
  /** Custom style */
  style?: ViewStyle;
}

export const FacilityItem: React.FC<FacilityItemProps> = ({ icon, label, style }) => {
  const { theme } = useUnistyles();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconWrapper, { backgroundColor: theme.colors.neutral50 }]}>{icon}</View>
      <Text variant="bodySmallRegular" color="neutral500" style={styles.label}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: "center",
    flex: 1,
  },
  iconWrapper: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    textAlign: "center",
  },
}));
