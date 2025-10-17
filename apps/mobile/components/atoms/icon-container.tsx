import React from "react";
import { View, ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { ms } from "@/utils/scaling";

export interface IconContainerProps {
  /** Icon element to render */
  icon: React.ReactNode;
  /** Size variant */
  size?: "small" | "medium" | "large";
  /** Background color */
  backgroundColor?: string;
  /** Custom style */
  style?: ViewStyle;
  /** Whether to use circular shape */
  circular?: boolean;
}

const SIZE_MAP = {
  small: ms(32),
  medium: ms(40),
  large: ms(48),
};

export const IconContainer: React.FC<IconContainerProps> = ({
  icon,
  size = "medium",
  backgroundColor,
  style,
  circular = true,
}) => {
  const { theme } = useUnistyles();
  const containerSize = SIZE_MAP[size];

  const containerStyle: ViewStyle = {
    width: containerSize,
    height: containerSize,
    borderRadius: circular ? containerSize / 2 : theme.borderRadius.md,
    backgroundColor: backgroundColor || `${theme.colors.primary}15`,
  };

  return <View style={[styles.container, containerStyle, style]}>{icon}</View>;
};

const styles = StyleSheet.create(() => ({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
}));
