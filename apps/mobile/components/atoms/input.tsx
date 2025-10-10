import { ms, mvs } from "@/utils/scaling";
import { Eye, EyeSlash } from "iconsax-react-native";
import React, { useState } from "react";
import { TextInput, TextInputProps, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { IconButton } from "./icon-button";
import { Text } from "./text";

export interface InputProps {
  variant?: "phone" | "password" | "multiline" | "error" | "search";
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoComplete?: TextInputProps["autoComplete"];
  editable?: boolean;
  maxLength?: number;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  countryCode?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
}

export const Input: React.FC<InputProps> = ({
  variant,
  label,
  placeholder,
  value,
  onChangeText,
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  autoComplete,
  editable = true,
  maxLength,
  error,
  helpText,
  disabled = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  countryCode,
  onFocus,
  onBlur,
  autoFocus = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isDisabled = disabled || !editable;
  const hasError = Boolean(error);
  const isPassword = variant === "password" || secureTextEntry;
  const isPhone = variant === "phone";
  const isMultiline = variant === "multiline" || multiline;

  // Apply variants to the styles
  styles.useVariants({
    variant: variant || "phone",
    focused: isFocused,
    error: hasError,
    disabled: isDisabled,
    multiline: isMultiline,
  });

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const renderPasswordToggle = () => {
    if (!isPassword) return null;

    return (
      <IconButton style={styles.iconButton} onPress={togglePasswordVisibility}>
        {showPassword ? (
          <EyeSlash size={ms(20)} color={styles.passwordToggle.color} />
        ) : (
          <Eye size={ms(20)} color={styles.passwordToggle.color} />
        )}
      </IconButton>
    );
  };

  const renderCountryCode = () => {
    if (!isPhone || !countryCode) return null;

    return (
      <View style={styles.countryCodeContainer}>
        <Text variant="bodyMediumRegular" color="text" style={styles.countryCodeText}>
          {countryCode}
        </Text>
        <View style={styles.countryCodeSeparator} />
      </View>
    );
  };

  const renderLeftIcon = () => {
    if (isPhone && countryCode) {
      return renderCountryCode();
    }

    if (!leftIcon) return null;

    return <View style={styles.leftIconContainer}>{leftIcon}</View>;
  };

  const renderRightIcon = () => {
    if (isPassword) {
      return renderPasswordToggle();
    }

    if (!rightIcon) return null;

    return (
      <IconButton
        style={styles.iconButton}
        onPress={onRightIconPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        disabled={!onRightIconPress}
      >
        {rightIcon}
      </IconButton>
    );
  };

  return (
    <View>
      {label && (
        <Text variant="bodyMedium" color={isDisabled ? "textDisabled" : "text"} style={styles.label}>
          {label}
        </Text>
      )}

      <View style={styles.inputContainer}>
        {renderLeftIcon()}

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          multiline={isMultiline}
          numberOfLines={isMultiline ? numberOfLines : 1}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          editable={!isDisabled}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          placeholderTextColor={styles.placeholder.color}
        />

        {renderRightIcon()}
      </View>

      {(error || helpText) && (
        <Text variant="bodySmall" color={hasError ? "error" : "textSecondary"} style={styles.helpText}>
          {error || helpText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  label: {
    marginBottom: theme.spacing.sm,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: theme.borderWidth.thin,
    borderRadius: theme.borderRadius.base,
    backgroundColor: theme.colors.surface,
    variants: {
      variant: {
        default: {
          minHeight: mvs(56),
        },
        phone: {
          minHeight: mvs(56),
        },
        password: {
          minHeight: mvs(56),
        },
        multiline: {
          minHeight: mvs(120),
          alignItems: "flex-start",
          paddingTop: theme.spacing.md,
        },
        error: {
          minHeight: mvs(56),
        },
        search: {
          minHeight: mvs(56),
          borderRadius: theme.borderRadius.base,
          backgroundColor: theme.colors.surface,
        },
      },
      focused: {
        true: {
          borderColor: theme.colors.primary,
          borderWidth: theme.borderWidth.medium,
        },
        false: {
          borderColor: theme.colors.border,
        },
      },
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

  input: {
    flex: 1,
    fontSize: theme.typography.bodyMediumRegular.fontSize,
    fontWeight: theme.typography.bodyMediumRegular.fontWeight,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    variants: {
      multiline: {
        true: {
          textAlignVertical: "top",
          minHeight: mvs(80),
        },
        false: {
          textAlignVertical: "center",
        },
      },
      disabled: {
        true: {
          color: theme.colors.textDisabled,
        },
        false: {},
      },
    },
  },

  placeholder: {
    color: theme.colors.neutral600,
  },

  leftIconContainer: {
    paddingLeft: theme.spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },

  iconButton: {
    paddingHorizontal: theme.spacing.md,
    justifyContent: "center",
    alignItems: "center",
    minHeight: mvs(44),
  },

  passwordToggle: {
    fontSize: ms(20),
    color: theme.colors.textSecondary,
  },

  countryCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: theme.spacing.md,
  },

  countryCodeText: {
    marginRight: theme.spacing.sm,
  },

  countryCodeSeparator: {
    width: ms(1),
    height: mvs(24),
    backgroundColor: theme.colors.border,
    marginRight: theme.spacing.sm,
  },

  helpText: {
    marginTop: theme.spacing.xs,
  },
}));
