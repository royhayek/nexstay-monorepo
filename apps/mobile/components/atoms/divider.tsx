import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { mvs } from "@/utils/scaling";
import { Text } from "./text";

export interface DividerProps {
  text?: string;
  color?: string;
  thickness?: number;
  textColor?: string;
  spacing?: number;
}

export const Divider: React.FC<DividerProps> = ({ text = "Or", color, thickness = 1, textColor, spacing }) => {
  // Apply variants to the styles
  styles.useVariants({
    hasText: !!text,
  });

  return (
    <View style={styles.container}>
      <View style={[styles.line, color && { backgroundColor: color }, { height: thickness }]} />
      {text && (
        <Text
          variant="bodyMedium"
          color="textSecondary"
          style={[styles.text, textColor && { color: textColor }, spacing ? { marginHorizontal: spacing } : undefined]}
        >
          {text}
        </Text>
      )}
      <View style={[styles.line, color && { backgroundColor: color }, { height: thickness }]} />
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    variants: {
      hasText: {
        true: {
          marginVertical: theme.spacing.xl,
        },
        false: {
          marginVertical: theme.spacing.md,
        },
      },
    },
  },

  line: {
    flex: 1,
    height: mvs(1),
    backgroundColor: theme.colors.border,
  },

  text: {
    marginHorizontal: theme.spacing.lg,
  },
}));
