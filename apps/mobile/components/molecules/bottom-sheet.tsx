import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import type { BottomSheetModal as BottomSheetModalType } from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback } from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { Button } from "@/components/atoms";
import { StatusHeader } from "./status-header";
import { ms, mvs } from "@/utils/scaling";

export type BottomSheetVariant = "success" | "warning" | "error" | "info" | "confirmation";

interface BottomSheetButton {
  text: string;
  variant?: "filled" | "outlined" | "text" | "ghost";
  color?: "primary" | "secondary" | "success" | "warning" | "error" | "info" | "neutral";
  size?: "small" | "medium" | "large";
  shape?: "rectangular" | "rounded" | "circular";
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

interface CustomBottomSheetProps {
  variant?: BottomSheetVariant;
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  buttons?: BottomSheetButton[];
  children?: React.ReactNode;
  snapPoints?: string[];
  enablePanDownToClose?: boolean;
  backdropOpacity?: number;
  enableDynamicSizing?: boolean;
}

export const CustomBottomSheet = forwardRef<BottomSheetModalType, CustomBottomSheetProps>(
  (
    {
      variant,
      title,
      message,
      icon,
      buttons,
      children,
      snapPoints,
      enablePanDownToClose = true,
      backdropOpacity = 0.5,
      enableDynamicSizing,
    },
    ref
  ) => {
    const { theme } = useUnistyles();
    const insets = useSafeAreaInsets();

    // Determine if we should use dynamic sizing
    const shouldUseDynamicSizing = enableDynamicSizing ?? !snapPoints;
    // When using dynamic sizing, we don't need snap points
    const finalSnapPoints = shouldUseDynamicSizing ? undefined : snapPoints || ["40%"];

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={backdropOpacity} />
      ),
      [backdropOpacity]
    );

    const getDefaultIcon = () => {
      switch (variant) {
        case "success":
          return (
            <View style={[styles.iconContainer, styles.successIcon]}>
              <Ionicons name="checkmark" size={32} color={theme.colors.background} />
            </View>
          );
        case "warning":
          return (
            <View style={[styles.iconContainer, styles.warningIcon]}>
              <MaterialIcons name="warning" size={32} color={theme.colors.background} />
            </View>
          );
        case "error":
          return (
            <View style={[styles.iconContainer, styles.errorIcon]}>
              <Ionicons name="close" size={32} color={theme.colors.background} />
            </View>
          );
        case "info":
          return (
            <View style={[styles.iconContainer, styles.infoIcon]}>
              <Ionicons name="information" size={32} color={theme.colors.background} />
            </View>
          );
        case "confirmation":
          return (
            <View style={[styles.iconContainer, styles.confirmationIcon]}>
              <MaterialIcons name="help-outline" size={32} color={theme.colors.background} />
            </View>
          );
        default:
          return null;
      }
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={finalSnapPoints}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.bottomSheetBackground}
        enableDynamicSizing={shouldUseDynamicSizing}
      >
        <BottomSheetView style={styles.contentContainer}>
          <View style={styles.innerContainer}>
            {/* Status Header */}
            {(icon || title || message || variant) && (
              <StatusHeader
                title={title}
                spacing="compact"
                description={message}
                titleVariant="bodyLargeSemiBold"
                icon={
                  icon ? (
                    <View style={[styles.iconContainer, variant === "confirmation" && styles.confirmationIcon]}>
                      {icon}
                    </View>
                  ) : variant ? (
                    getDefaultIcon()
                  ) : undefined
                }
              />
            )}

            {/* Custom Children */}
            {children}

            {/* Buttons */}
            {buttons && buttons.length > 0 && (
              <View style={[styles.buttonsContainer, buttons.length === 2 && styles.horizontalButtons]}>
                {buttons.map((button, index) => {
                  const {
                    text,
                    variant = "filled",
                    color = "primary",
                    size = "medium",
                    shape = "rounded",
                    disabled = false,
                    loading = false,
                    onPress,
                    leftIcon,
                    rightIcon,
                  } = button;

                  return (
                    <Button
                      key={index}
                      variant={variant}
                      color={color}
                      size={size}
                      shape={shape}
                      disabled={disabled}
                      loading={loading}
                      onPress={onPress}
                      leftIcon={leftIcon}
                      rightIcon={rightIcon}
                      fullWidth={buttons.length === 1}
                      style={buttons.length === 2 ? { ...styles.button, ...styles.halfWidthButton } : styles.button}
                    >
                      {text}
                    </Button>
                  );
                })}
              </View>
            )}
          </View>
          {/* Safe area spacer */}
          <View style={{ height: insets.bottom + (Platform.OS === "android" ? theme.spacing.xl : theme.spacing.md) }} />
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

CustomBottomSheet.displayName = "CustomBottomSheet";

const styles = StyleSheet.create((theme) => ({
  bottomSheetBackground: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
  },
  handleIndicator: {
    width: ms(40),
    height: mvs(4),
    backgroundColor: theme.colors.border,
  },
  contentContainer: {
    backgroundColor: theme.colors.background,
  },
  innerContainer: {
    minHeight: 200,
    alignItems: "center",
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  iconContainer: {
    width: ms(56),
    height: ms(56),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.full,
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
  buttonsContainer: {
    width: "100%",
    gap: theme.spacing.md,
    marginTop: "auto",
  },
  horizontalButtons: {
    flexDirection: "row",
  },
  button: {
    width: "100%",
  },
  halfWidthButton: {
    flex: 1,
  },
}));
