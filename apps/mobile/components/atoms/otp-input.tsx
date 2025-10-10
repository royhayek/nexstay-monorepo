import { ms, mvs } from "@/utils/scaling";
import React from "react";
import { Keyboard, View } from "react-native";
import { OtpInput } from "react-native-otp-entry";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "./text";

export interface OtpInputProps {
  value?: string;
  onTextChange?: (text: string) => void;
  onFilled?: (text: string) => void;
  numberOfDigits?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
}

export const OTPInput: React.FC<OtpInputProps> = ({
  value = "",
  onTextChange,
  onFilled,
  numberOfDigits = 6,
  autoFocus = false,
  disabled = false,
  error,
  label,
}) => {
  const hasError = Boolean(error);

  styles.useVariants({
    error: hasError,
    disabled,
  });

  const handleTextChange = (text: string) => {
    onTextChange?.(text);
    if (text.length === numberOfDigits) {
      onFilled?.(text);
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="bodyMedium" color="text" style={styles.label}>
          {label}
        </Text>
      )}

      <OtpInput
        numberOfDigits={numberOfDigits}
        onTextChange={handleTextChange}
        autoFocus={autoFocus}
        disabled={disabled}
        theme={{
          containerStyle: styles.otpContainer,
          pinCodeContainerStyle: styles.pinCodeContainer,
          pinCodeTextStyle: styles.pinCodeText,
          focusStickStyle: styles.focusStick,
          focusedPinCodeContainerStyle: styles.focusedPinCodeContainer,
          filledPinCodeContainerStyle: styles.filledPinCodeContainer,
          disabledPinCodeContainerStyle: styles.disabledPinCodeContainer,
        }}
        {...(value && { defaultValue: value })}
      />

      {error && (
        <Text variant="bodySmall" color="error" style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    marginBottom: theme.spacing.md,
  },

  label: {
    marginBottom: theme.spacing.xs,
  },

  otpContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ms(8),
  },

  pinCodeContainer: {
    width: ms(52),
    height: mvs(52),
    borderWidth: theme.borderWidth.thin,
    borderRadius: theme.borderRadius.base,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
    variants: {
      error: {
        true: {
          borderColor: theme.colors.error,
          borderWidth: theme.borderWidth.medium,
        },
        false: {},
      },
      disabled: {
        true: {
          backgroundColor: theme.colors.surfaceVariant,
          borderColor: theme.colors.textDisabled,
        },
        false: {},
      },
    },
  },

  focusedPinCodeContainer: {
    borderColor: theme.colors.primary,
    borderWidth: theme.borderWidth.medium,
    variants: {
      error: {
        true: {
          borderColor: theme.colors.error,
        },
        false: {},
      },
    },
  },

  filledPinCodeContainer: {
    backgroundColor: theme.colors.surface,
    variants: {
      error: {
        true: {
          borderColor: theme.colors.error,
        },
        false: {},
      },
    },
  },

  disabledPinCodeContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    borderColor: theme.colors.textDisabled,
  },

  pinCodeText: {
    fontSize: theme.typography.h5Medium.fontSize,
    fontWeight: theme.typography.h5Medium.fontWeight,
    color: theme.colors.text,
    variants: {
      disabled: {
        true: {
          color: theme.colors.textDisabled,
        },
        false: {},
      },
    },
  },

  focusStick: {
    width: ms(2),
    height: mvs(24),
    backgroundColor: theme.colors.primary,
    variants: {
      error: {
        true: {
          backgroundColor: theme.colors.error,
        },
        false: {},
      },
    },
  },

  errorText: {
    marginTop: theme.spacing.xs,
  },
}));
