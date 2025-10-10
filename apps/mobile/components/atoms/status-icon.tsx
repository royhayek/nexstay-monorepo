import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ms, mvs } from "@/utils/scaling";

export interface StatusIconProps {
  icon: React.ReactNode;
  variant?: "default" | "success" | "error" | "warning" | "info";
  size?: "small" | "medium" | "large";
}

export const StatusIcon: React.FC<StatusIconProps> = ({ icon, variant = "default", size = "medium" }) => {
  // Apply variants to the styles
  styles.useVariants({
    variant: variant === "default" ? undefined : variant,
    size,
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconBackground}>{icon}</View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },

  iconBackground: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: theme.borderRadius.full,
    variants: {
      size: {
        small: {
          width: ms(48),
          height: mvs(48),
        },
        medium: {
          width: ms(60),
          height: mvs(60),
        },
        large: {
          width: ms(72),
          height: mvs(72),
        },
      },
      variant: {
        default: {
          backgroundColor: theme.colors.primary,
        },
        success: {
          backgroundColor: theme.colors.success,
        },
        error: {
          backgroundColor: theme.colors.error,
        },
        warning: {
          backgroundColor: theme.colors.warning,
        },
        info: {
          backgroundColor: theme.colors.info,
        },
      },
    },
  },
}));
