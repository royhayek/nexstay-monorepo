import { ms, mvs } from "@/utils/scaling";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "../atoms/text";

export interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: React.ReactNode | ((isSelected: boolean) => React.ReactNode);
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  variant?: "default" | "filled";
  fullWidth?: boolean;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedValue,
  onValueChange,
  disabled = false,
  size = "medium",
  variant = "default",
  fullWidth = true,
}) => {
  // Apply variants to the styles
  styles.useVariants({
    size,
    variant: variant === "filled" ? "filled" : undefined,
    disabled,
    fullWidth,
  });

  const handleOptionPress = (value: string) => {
    if (!disabled && value !== selectedValue) {
      onValueChange(value);
    }
  };

  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isSelected = option.value === selectedValue;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              isSelected && styles.optionSelected,
              isFirst && styles.optionFirst,
              isLast && styles.optionLast,
              disabled && styles.optionDisabled,
            ]}
            onPress={() => handleOptionPress(option.value)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              {option.icon && (
                <View style={styles.iconContainer}>
                  {typeof option.icon === "function" ? option.icon(isSelected) : option.icon}
                </View>
              )}
              <Text
                variant={
                  isSelected
                    ? size === "small"
                      ? "bodySmallSemiBold"
                      : size === "large"
                      ? "bodyLargeSemiBold"
                      : "bodyMediumSemiBold"
                    : size === "small"
                    ? "bodySmallRegular"
                    : size === "large"
                    ? "bodyLargeRegular"
                    : "bodyMediumRegular"
                }
                color={
                  disabled
                    ? "textDisabled"
                    : isSelected
                    ? variant === "filled"
                      ? "onPrimary"
                      : "text"
                    : "textSecondary"
                }
                textAlign="center"
              >
                {option.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
    variants: {
      fullWidth: {
        true: {
          alignSelf: "stretch",
        },
        false: {
          alignSelf: "flex-start",
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

  option: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.md,
    backgroundColor: "transparent",
    variants: {
      size: {
        small: {
          paddingVertical: theme.spacing.sm,
          minHeight: mvs(36),
        },
        medium: {
          paddingVertical: theme.spacing.md,
          minHeight: mvs(44),
        },
        large: {
          paddingVertical: theme.spacing.base,
          minHeight: mvs(52),
        },
      },
    },
  },

  optionFirst: {
    marginRight: theme.spacing.xs / 2,
  },

  optionLast: {
    marginLeft: theme.spacing.xs / 2,
  },

  optionSelected: {
    backgroundColor: theme.colors.background,
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: ms(0),
      height: mvs(1),
    },
    shadowOpacity: 0.1,
    shadowRadius: mvs(2),
    elevation: mvs(2),
    variants: {
      variant: {
        default: {
          backgroundColor: theme.colors.background,
        },
        filled: {
          backgroundColor: theme.colors.primary,
        },
      },
    },
  },

  optionDisabled: {
    opacity: 0.5,
  },

  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  iconContainer: {
    marginRight: theme.spacing.xs,
  },
}));
