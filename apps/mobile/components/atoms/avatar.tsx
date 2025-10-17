import React from "react";
import { Image, ImageSourcePropType, View, ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { ms } from "@/utils/scaling";
import { Text } from "./text";

export interface AvatarProps {
  /** Image source - URI string or require() */
  source?: string | ImageSourcePropType;
  /** Size variant */
  size?: "small" | "medium" | "large" | "xlarge";
  /** Fallback initials if no image */
  initials?: string;
  /** Custom style */
  style?: ViewStyle;
  /** Border color */
  borderColor?: string;
  /** Border width */
  borderWidth?: number;
}

const SIZE_MAP = {
  small: ms(32),
  medium: ms(56),
  large: ms(80),
  xlarge: ms(100),
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  size = "medium",
  initials,
  style,
  borderColor,
  borderWidth = 0,
}) => {
  const { theme } = useUnistyles();
  const avatarSize = SIZE_MAP[size];

  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    borderWidth,
    borderColor: borderColor || theme.colors.border,
  };

  const imageSource = typeof source === "string" ? { uri: source } : source;
  const hasValidSource = source && (typeof source === "string" ? source.trim() !== "" : true);

  return (
    <View style={[styles.container, containerStyle, style]}>
      {hasValidSource ? (
        <Image source={imageSource as ImageSourcePropType} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          {initials ? (
            <Text
              variant={size === "small" ? "bodySmallSemiBold" : size === "medium" ? "bodyMediumSemiBold" : "h6SemiBold"}
              color="neutral600"
            >
              {initials.slice(0, 2).toUpperCase()}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    overflow: "hidden",
    backgroundColor: theme.colors.neutral200,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.neutral200,
  },
}));
