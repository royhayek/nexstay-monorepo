import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Text } from "@/components/atoms";
import { ThemeColors, TypographyVariant } from "@/theme";
import { ms } from "@/utils/scaling";

export interface StatusHeaderProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  titleVariant?: TypographyVariant;
  titleColor?: keyof ThemeColors;
  descriptionVariant?: TypographyVariant;
  descriptionColor?: keyof ThemeColors;
  spacing?: "compact" | "default" | "spacious";
  alignment?: "center" | "left";
}

export const StatusHeader: React.FC<StatusHeaderProps> = ({
  icon,
  title,
  description,
  titleVariant = "h6SemiBold",
  titleColor = "neutral800",
  descriptionVariant = "bodyMediumRegular",
  descriptionColor = "neutral500",
  spacing = "default",
  alignment = "center",
}) => {
  // Apply variants to styles
  styles.useVariants({
    spacing: spacing === "default" ? undefined : spacing,
    alignment,
  });

  return (
    <View style={styles.container}>
      {/* Icon */}
      {icon && <View style={styles.iconContainer}>{icon}</View>}

      {/* Title */}
      {title && (
        <Text variant={titleVariant} color={titleColor} style={styles.title}>
          {title}
        </Text>
      )}

      {/* Description */}
      {description && (
        <Text variant={descriptionVariant} color={descriptionColor} style={styles.description}>
          {description}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    paddingHorizontal: theme.spacing.lg,
    variants: {
      alignment: {
        center: {
          alignItems: "center",
        },
        left: {
          alignItems: "flex-start",
        },
      },
    },
  },
  iconContainer: {
    width: ms(56),
    height: ms(56),
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.neutral800,
    justifyContent: "center",
    alignItems: "center",
    variants: {
      spacing: {
        compact: {
          marginBottom: theme.spacing.md,
        },
        default: {
          marginBottom: theme.spacing.xl,
        },
        spacious: {
          marginBottom: theme.spacing.xxl,
        },
      },
    },
  },
  title: {
    variants: {
      alignment: {
        center: {
          textAlign: "center",
        },
        left: {
          textAlign: "left",
        },
      },
      spacing: {
        compact: {
          marginBottom: theme.spacing.sm,
        },
        default: {
          marginBottom: theme.spacing.base,
        },
        spacious: {
          marginBottom: theme.spacing.lg,
        },
      },
    },
  },
  description: {
    variants: {
      alignment: {
        center: {
          textAlign: "center",
        },
        left: {
          textAlign: "left",
        },
      },
      spacing: {
        compact: {
          marginBottom: theme.spacing.base,
        },
        default: {
          marginBottom: theme.spacing.xl,
        },
        spacious: {
          marginBottom: theme.spacing.xxxl,
        },
      },
    },
  },
}));
