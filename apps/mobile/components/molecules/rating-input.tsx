import React from "react";
import { View, TouchableOpacity, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Star } from "phosphor-react-native";

import { Text } from "@/components/atoms";
import { ms } from "@/utils/scaling";

export interface RatingInputProps {
  /** Current rating value (0-5) */
  value: number;
  /** Callback when rating changes */
  onChange: (rating: number) => void;
  /** Label text */
  label?: string;
  /** Star size */
  starSize?: number;
  /** Custom style */
  style?: ViewStyle;
  /** Disabled state */
  disabled?: boolean;
  /** Show half-star increments */
  allowHalf?: boolean;
}

export const RatingInput: React.FC<RatingInputProps> = ({
  value,
  onChange,
  label,
  starSize = 32,
  style,
  disabled = false,
  allowHalf = false,
}) => {
  const handlePress = (index: number) => {
    if (disabled) return;

    if (allowHalf) {
      // If tapping the same star, toggle between full and half
      if (Math.floor(value) === index && value % 1 === 0) {
        onChange(index - 0.5);
      } else {
        onChange(index);
      }
    } else {
      onChange(index);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((index) => {
      const filled = index <= Math.floor(value);
      const half = index === Math.ceil(value) && value % 1 !== 0;

      return (
        <TouchableOpacity
          key={index}
          onPress={() => handlePress(index)}
          disabled={disabled}
          activeOpacity={0.7}
          style={styles.starTouchable}
        >
          <Star
            size={starSize}
            color={filled || half ? "#FFB800" : "#D1D5DB"}
            weight={filled || half ? "fill" : "regular"}
          />
        </TouchableOpacity>
      );
    });
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text variant="bodyMediumSemiBold" color="neutral800" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={styles.starContainer}>{renderStars()}</View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.spacing.sm,
  },
  label: {
    marginBottom: theme.spacing.xxs,
  },
  starContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
  },
  starTouchable: {
    padding: ms(4),
  },
}));
