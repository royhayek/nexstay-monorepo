import React from "react";
import { View, ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Location } from "iconsax-react-native";

import { Text } from "@/components/atoms";

export interface LocationDisplayProps {
  /** Location text */
  location: string;
  /** Icon size */
  iconSize?: number;
  /** Text variant */
  textVariant?: "bodySmallRegular" | "bodyMediumRegular" | "bodyLargeRegular";
  /** Custom style */
  style?: ViewStyle;
  /** Maximum number of lines */
  numberOfLines?: number;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({
  location,
  iconSize = 16,
  textVariant = "bodyMediumRegular",
  style,
  numberOfLines,
}) => {
  const { theme } = useUnistyles();

  return (
    <View style={[styles.container, style]}>
      <Location size={iconSize} color={theme.colors.neutral500} variant="Outline" />
      <Text variant={textVariant} color="neutral500" style={styles.text} numberOfLines={numberOfLines}>
        {location}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    flex: 1,
    marginLeft: theme.spacing.xs,
  },
}));
