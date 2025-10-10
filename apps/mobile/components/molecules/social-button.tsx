import { AppleLogoIcon, FacebookLogoIcon, GoogleLogoIcon } from "phosphor-react-native";
import React from "react";

import { ms } from "@/utils/scaling";
import { StyleSheet } from "react-native-unistyles";
import { Button, ButtonProps } from "../atoms";

export interface SocialButtonProps extends Omit<ButtonProps, "leftIcon" | "children"> {
  provider: "apple" | "google" | "facebook";
  onPress: () => void;
}

export const SocialButton: React.FC<SocialButtonProps> = ({ provider, onPress, ...buttonProps }) => {
  const getSocialConfig = () => {
    switch (provider) {
      case "apple":
        return {
          icon: <AppleLogoIcon size={ms(20)} color="#000" weight="regular" />,
          text: "Continue with Apple",
        };
      case "google":
        return {
          icon: <GoogleLogoIcon size={ms(20)} color="#4285F4" weight="regular" />,
          text: "Continue with Google",
        };
      case "facebook":
        return {
          icon: <FacebookLogoIcon size={ms(20)} color="#1877F2" weight="regular" />,
          text: "Continue with Facebook",
        };
      default:
        return {
          icon: null,
          text: "Continue",
        };
    }
  };

  const config = getSocialConfig();

  return (
    <Button
      fullWidth
      size="medium"
      variant="filled"
      onPress={onPress}
      style={styles.button}
      leftIcon={config.icon}
      textStyle={styles.buttonText}
      {...buttonProps}
    >
      {config.text}
    </Button>
  );
};

const styles = StyleSheet.create((theme) => ({
  button: {
    backgroundColor: theme.colors.neutral50,
  },
  buttonText: {
    color: theme.colors.textPrimary,
  },
}));
