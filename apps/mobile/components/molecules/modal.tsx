import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Logout } from "iconsax-react-native";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Modal as RNModal, Text, TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export type ModalVariant = "success" | "warning" | "error" | "info" | "confirmation";

interface ModalButton {
  text: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
}

interface ModalProps {
  visible: boolean;
  onClose?: () => void;
  variant?: ModalVariant;
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  buttons?: ModalButton[];
  children?: React.ReactNode;
  closeOnBackdrop?: boolean;
  animationType?: "fade" | "slide" | "spring";
}

const { height: screenHeight } = Dimensions.get("window");

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  variant = "info",
  title,
  message,
  icon,
  buttons,
  children,
  closeOnBackdrop = true,
  animationType = "spring",
}) => {
  const { theme } = useUnistyles();

  const scaleValue = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const animations = [];

      if (animationType === "spring") {
        animations.push(
          Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
          })
        );
      } else if (animationType === "slide") {
        animations.push(
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          })
        );
      }

      animations.push(
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      );

      Animated.parallel(animations).start();
    } else {
      const animations = [];

      if (animationType === "spring") {
        animations.push(
          Animated.timing(scaleValue, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          })
        );
      } else if (animationType === "slide") {
        animations.push(
          Animated.timing(translateY, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          })
        );
      }

      animations.push(
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      );

      Animated.parallel(animations).start();
    }
  }, [visible, animationType, scaleValue, translateY, fadeValue]);

  const getDefaultIcon = () => {
    switch (variant) {
      case "success":
        return (
          <View style={[styles.iconContainer, styles.successIcon]}>
            <Ionicons name="checkmark" size={40} color={theme.colors.background} />
          </View>
        );
      case "warning":
        return (
          <View style={[styles.iconContainer, styles.warningIcon]}>
            <MaterialIcons name="warning" size={40} color={theme.colors.background} />
          </View>
        );
      case "error":
        return (
          <View style={[styles.iconContainer, styles.errorIcon]}>
            <Ionicons name="close" size={40} color={theme.colors.background} />
          </View>
        );
      case "info":
        return (
          <View style={[styles.iconContainer, styles.infoIcon]}>
            <Ionicons name="information" size={40} color={theme.colors.background} />
          </View>
        );
      case "confirmation":
        return (
          <View style={[styles.iconContainer, styles.confirmationIcon]}>
            <Logout size={40} color={theme.colors.background} variant="Outline" />
          </View>
        );
      default:
        return null;
    }
  };

  const getModalTransform = () => {
    if (animationType === "spring") {
      return { transform: [{ scale: scaleValue }] };
    } else if (animationType === "slide") {
      return { transform: [{ translateY }] };
    }
    return {};
  };

  const handleBackdropPress = () => {
    if (closeOnBackdrop && onClose) {
      onClose();
    }
  };

  const getButtonStyle = (buttonVariant?: string) => {
    switch (buttonVariant) {
      case "primary":
        return styles.primaryButton;
      case "secondary":
        return styles.secondaryButton;
      case "danger":
        return styles.dangerButton;
      default:
        return styles.primaryButton;
    }
  };

  const getButtonTextStyle = (buttonVariant?: string) => {
    switch (buttonVariant) {
      case "secondary":
        return styles.secondaryButtonText;
      default:
        return styles.primaryButtonText;
    }
  };

  return (
    <RNModal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: fadeValue }]}>
        <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={handleBackdropPress}>
          <Animated.View style={[styles.modalContainer, getModalTransform()]}>
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              {(icon || variant) && <View style={styles.iconWrapper}>{icon || getDefaultIcon()}</View>}

              {title && <Text style={styles.title}>{title}</Text>}

              {message && <Text style={styles.message}>{message}</Text>}

              {children}

              {buttons && buttons.length > 0 && (
                <View style={styles.buttonsContainer}>
                  {buttons.map((button, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        getButtonStyle(button.variant),
                        buttons.length > 1 && index === 0 && styles.firstButton,
                      ]}
                      onPress={button.onPress}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.buttonText, getButtonTextStyle(button.variant)]}>{button.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </RNModal>
  );
};

const styles = StyleSheet.create((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  backdropTouchable: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: "center",
    ...theme.shadows.md,
  },
  iconWrapper: {
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  successIcon: {
    backgroundColor: theme.colors.success,
  },
  warningIcon: {
    backgroundColor: theme.colors.warning,
  },
  errorIcon: {
    backgroundColor: theme.colors.error,
  },
  infoIcon: {
    backgroundColor: theme.colors.primary,
  },
  confirmationIcon: {
    backgroundColor: theme.colors.text,
  },
  title: {
    fontSize: theme.fontSizes.lg,
    fontFamily: theme.fontFamilies.semibold,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  message: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fontFamilies.regular,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  buttonsContainer: {
    width: "100%",
    gap: theme.spacing.md,
  },
  button: {
    width: "100%",
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  firstButton: {
    marginBottom: 0,
  },
  primaryButton: {
    backgroundColor: theme.colors.text,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
  },
  buttonText: {
    fontSize: theme.fontSizes.md,
    fontFamily: theme.fontFamilies.semibold,
  },
  primaryButtonText: {
    color: theme.colors.background,
  },
  secondaryButtonText: {
    color: theme.colors.text,
  },
}));
