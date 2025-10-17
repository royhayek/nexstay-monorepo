import { ms, mvs } from "@/utils/scaling";
import React from "react";
import { ActivityIndicator, Pressable, TextStyle, View, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "./text";

export interface ButtonProps {
  variant?: "filled" | "outlined" | "text" | "ghost";
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info" | "neutral";
  size?: "small" | "medium" | "large";
  shape?: "rectangular" | "rounded" | "circular";
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "filled",
  color = "primary",
  size = "medium",
  shape = "rounded",
  disabled = false,
  loading = false,
  onPress,
  children,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  // Apply variants to the styles
  styles.useVariants({
    variant,
    color,
    size,
    shape,
    disabled: isDisabled,
    fullWidth,
  });

  const handlePress = () => {
    if (!isDisabled && onPress) {
      onPress();
    }
  };

  const getLoadingColor = () => {
    if (variant === "filled") {
      switch (color) {
        case "primary":
        case "secondary":
          return "#FFFFFF";
        case "warning":
          return "#000000";
        default:
          return "#FFFFFF";
      }
    }
    // For outlined, text, and ghost variants, use the theme color
    return "#000000";
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.contentContainer}>
          <ActivityIndicator size="small" color={getLoadingColor()} />
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        {typeof children === "string" ? (
          <Text
            variant={size === "small" ? "bodySmallSemiBold" : size === "large" ? "bodyLargeMedium" : "bodyMediumMedium"}
            color={
              variant === "filled"
                ? color === "warning"
                  ? "text"
                  : color === "primary"
                  ? "onPrimary"
                  : color === "secondary"
                  ? "onSecondary"
                  : "background"
                : variant === "ghost"
                ? "textSecondary"
                : color === "primary"
                ? "primary"
                : color === "secondary"
                ? "secondary"
                : color === "success"
                ? "success"
                : color === "warning"
                ? "warning"
                : color === "error"
                ? "error"
                : color === "neutral"
                ? "neutral800"
                : "info"
            }
            textAlign="center"
            style={textStyle}
          >
            {children}
          </Text>
        ) : React.isValidElement(children) ? (
          children
        ) : (
          // If children is not a string or valid element, wrap it in Text
          <Text
            variant={size === "small" ? "bodySmallSemiBold" : size === "large" ? "bodyLargeMedium" : "bodyMediumMedium"}
            color={
              variant === "filled"
                ? color === "warning"
                  ? "text"
                  : color === "primary"
                  ? "onPrimary"
                  : color === "secondary"
                  ? "onSecondary"
                  : "background"
                : variant === "ghost"
                ? "textSecondary"
                : color === "primary"
                ? "primary"
                : color === "secondary"
                ? "secondary"
                : color === "success"
                ? "success"
                : color === "warning"
                ? "warning"
                : color === "error"
                ? "error"
                : color === "neutral"
                ? "neutral800"
                : "info"
            }
            textAlign="center"
            style={textStyle}
          >
            {String(children)}
          </Text>
        )}
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {renderContent()}
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  button: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    variants: {
      size: {
        small: {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          minHeight: mvs(36),
        },
        medium: {
          paddingHorizontal: theme.spacing.base,
          paddingVertical: theme.spacing.md,
          minHeight: mvs(44),
        },
        large: {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.base,
          minHeight: mvs(52),
        },
      },
      shape: {
        rectangular: {
          borderRadius: ms(0),
        },
        rounded: {
          borderRadius: theme.borderRadius.base,
        },
        circular: {},
      },
      variant: {
        filled: {},
        outlined: {
          backgroundColor: "transparent",
          borderWidth: theme.borderWidth.thin,
        },
        text: {
          backgroundColor: "transparent",
          borderWidth: theme.borderWidth.none,
          paddingHorizontal: 0,
          paddingVertical: 0,
          minHeight: 0,
        },
        ghost: {
          backgroundColor: "transparent",
          borderWidth: theme.borderWidth.thin,
          borderColor: theme.colors.border,
        },
      },
      color: {
        primary: {},
        secondary: {},
        success: {},
        warning: {},
        error: {},
        info: {},
        neutral: {},
      },
      disabled: {
        true: {
          opacity: 0.5,
        },
        false: {},
      },
      fullWidth: {
        true: {
          alignSelf: "stretch",
        },
        false: {
          alignSelf: "flex-start",
        },
      },
    },
    compoundVariants: [
      // Circular shape size combinations
      {
        shape: "circular",
        size: "small",
        styles: {
          borderRadius: theme.borderRadius.lg,
          width: ms(theme.spacing.xxxl - theme.spacing.xs),
          height: mvs(theme.spacing.xxxl - theme.spacing.xs),
          paddingHorizontal: 0,
          paddingVertical: 0,
        },
      },
      {
        shape: "circular",
        size: "medium",
        styles: {
          borderRadius: theme.borderRadius.xl,
          width: ms(theme.spacing.xxxl + theme.spacing.xs),
          height: mvs(theme.spacing.xxxl + theme.spacing.xs),
          paddingHorizontal: 0,
          paddingVertical: 0,
        },
      },
      {
        shape: "circular",
        size: "large",
        styles: {
          borderRadius: theme.borderRadius.xxl,
          width: ms(theme.spacing.xxxl + theme.spacing.md),
          height: mvs(theme.spacing.xxxl + theme.spacing.md),
          paddingHorizontal: 0,
          paddingVertical: 0,
        },
      },
      // Filled variant colors
      {
        variant: "filled",
        color: "primary",
        styles: {
          backgroundColor: theme.colors.primary,
        },
      },
      {
        variant: "filled",
        color: "secondary",
        styles: {
          backgroundColor: theme.colors.secondary,
        },
      },
      {
        variant: "filled",
        color: "success",
        styles: {
          backgroundColor: theme.colors.success,
        },
      },
      {
        variant: "filled",
        color: "warning",
        styles: {
          backgroundColor: theme.colors.warning,
        },
      },
      {
        variant: "filled",
        color: "error",
        styles: {
          backgroundColor: theme.colors.error,
        },
      },
      {
        variant: "filled",
        color: "info",
        styles: {
          backgroundColor: theme.colors.info,
        },
      },
      {
        variant: "filled",
        color: "neutral",
        styles: {
          backgroundColor: theme.colors.neutral200,
        },
      },
      // Outlined variant colors
      {
        variant: "outlined",
        color: "primary",
        styles: {
          borderColor: theme.colors.primary,
        },
      },
      {
        variant: "outlined",
        color: "secondary",
        styles: {
          borderColor: theme.colors.secondary,
        },
      },
      {
        variant: "outlined",
        color: "success",
        styles: {
          borderColor: theme.colors.success,
        },
      },
      {
        variant: "outlined",
        color: "warning",
        styles: {
          borderColor: theme.colors.warning,
        },
      },
      {
        variant: "outlined",
        color: "error",
        styles: {
          borderColor: theme.colors.error,
        },
      },
      {
        variant: "outlined",
        color: "info",
        styles: {
          borderColor: theme.colors.info,
        },
      },
      {
        variant: "outlined",
        color: "neutral",
        styles: {
          borderColor: theme.colors.border,
        },
      },
    ],
  },

  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  leftIcon: {
    marginRight: theme.spacing.sm,
  },

  rightIcon: {
    marginLeft: theme.spacing.sm,
  },
}));
