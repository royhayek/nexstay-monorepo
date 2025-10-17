import { ms, mvs } from "@/utils/scaling";
import React from "react";
import { TouchableOpacity, View, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Add, Minus } from "iconsax-react-native";
import { Text } from "../atoms/text";

export interface CounterInputProps {
  label: string;
  description?: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  style?: ViewStyle;
}

export const CounterInput: React.FC<CounterInputProps> = ({
  label,
  description,
  value,
  onIncrement,
  onDecrement,
  min = 0,
  max = 100,
  style,
}) => {
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        <Text variant="bodyMediumSemiBold" color="neutral800">
          {label}
        </Text>
        {description && (
          <Text variant="bodySmallRegular" color="neutral600" style={styles.description}>
            {description}
          </Text>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, !canDecrement && styles.buttonDisabled]}
          onPress={onDecrement}
          disabled={!canDecrement}
          activeOpacity={0.7}
        >
          <Minus
            size={ms(20)}
            color={canDecrement ? styles.buttonIcon.color : styles.buttonIconDisabled.color}
            variant="Linear"
          />
        </TouchableOpacity>

        <View style={styles.valueContainer}>
          <Text variant="bodyLargeSemiBold" color="neutral900">
            {value}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, !canIncrement && styles.buttonDisabled]}
          onPress={onIncrement}
          disabled={!canIncrement}
          activeOpacity={0.7}
        >
          <Add
            size={ms(20)}
            color={canIncrement ? styles.buttonIcon.color : styles.buttonIconDisabled.color}
            variant="Linear"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.base,
    borderBottomWidth: theme.borderWidth.thin,
    borderBottomColor: theme.colors.border,
  },
  labelContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  description: {
    marginTop: theme.spacing.xxs,
    lineHeight: mvs(16),
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
  },
  button: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonIcon: {
    color: theme.colors.neutral800,
  },
  buttonIconDisabled: {
    color: theme.colors.neutral400,
  },
  valueContainer: {
    minWidth: ms(48),
    alignItems: "center",
    justifyContent: "center",
  },
}));
