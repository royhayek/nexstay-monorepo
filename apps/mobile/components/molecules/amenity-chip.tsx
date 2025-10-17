import { ms, mvs } from "@/utils/scaling";
import React from "react";
import { TouchableOpacity, View, ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { TickSquare } from "iconsax-react-native";
import { Text } from "../atoms/text";

export interface AmenityChipProps {
  label: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const AmenityChip: React.FC<AmenityChipProps> = ({ label, icon, selected = false, onPress, style }) => {
  const { theme } = useUnistyles();

  // Build dynamic container style
  const containerStyle = [styles.container, selected ? styles.containerSelected : styles.containerUnselected, style];

  return (
    <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.7}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text variant="bodySmallMedium" color={selected ? "primary" : "neutral700"} style={styles.label}>
        {label}
      </Text>
      {selected && <TickSquare size={ms(16)} color={theme.colors.primary} variant="Bold" />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: theme.borderWidth.thin,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  containerSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}12`,
  },
  containerUnselected: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  iconContainer: {
    marginRight: theme.spacing.xs,
  },
  label: {
    lineHeight: mvs(18),
  },
}));
