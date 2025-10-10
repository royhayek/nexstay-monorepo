import React from "react";
import { TextProps as RNTextProps } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "./text";

export interface LinkTextProps extends Omit<RNTextProps, "style"> {
  children: React.ReactNode;
  onPress?: () => void;
  color?: string;
  underlined?: boolean;
  disabled?: boolean;
}

export const LinkText: React.FC<LinkTextProps> = ({
  children,
  onPress,
  color,
  underlined = false,
  disabled = false,
  ...textProps
}) => {
  // Apply variants to the styles
  styles.useVariants({
    underlined,
    disabled,
    interactive: !!onPress,
  });

  return (
    <Text
      {...textProps}
      variant="bodySmallSemiBold"
      style={[styles.linkText, color && { color }]}
      onPress={!disabled ? onPress : undefined}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create((theme) => ({
  linkText: {
    variants: {
      interactive: {
        true: {
          color: theme.colors.primary,
        },
        false: {
          color: theme.colors.text,
        },
      },
      underlined: {
        true: {
          textDecorationLine: "underline",
        },
        false: {
          textDecorationLine: "none",
        },
      },
      disabled: {
        true: {
          color: theme.colors.textDisabled,
          opacity: 0.6,
        },
        false: {},
      },
    },
  },
}));
