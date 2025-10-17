import { ms, mvs } from "@/utils/scaling";
import React from "react";
import { TouchableOpacity, View, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { TickCircle } from "iconsax-react-native";
import { Text } from "../atoms/text";

export interface SelectionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  title,
  description,
  icon,
  selected = false,
  onPress,
  style,
  disabled = false,
}) => {
  styles.useVariants({
    selected,
    disabled,
  });

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* Icon Section */}
      {icon && <View style={styles.iconContainer}>{icon}</View>}

      {/* Content Section */}
      <View style={styles.content}>
        <Text
          variant="bodyMediumSemiBold"
          color={selected ? "primary" : "neutral800"}
          style={styles.title}
        >
          {title}
        </Text>
        {description && (
          <Text variant="bodySmallRegular" color="neutral600" style={styles.description}>
            {description}
          </Text>
        )}
      </View>

      {/* Selection Indicator */}
      <View style={styles.checkContainer}>
        {selected && (
          <TickCircle size={ms(24)} color={styles.checkIcon.color} variant="Bold" />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.md,
    borderWidth: theme.borderWidth.medium,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    variants: {
      selected: {
        true: {
          borderColor: theme.colors.primary,
          backgroundColor: `${theme.colors.primary}08`,
        },
        false: {
          borderColor: theme.colors.border,
        },
      },
      disabled: {
        true: {
          opacity: 0.5,
        },
        false: {},
      },
    },
  },
  iconContainer: {
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: theme.spacing.xxs,
  },
  description: {
    lineHeight: mvs(18),
  },
  checkContainer: {
    width: ms(24),
    height: ms(24),
    marginLeft: theme.spacing.sm,
  },
  checkIcon: {
    color: theme.colors.primary,
  },
}));
