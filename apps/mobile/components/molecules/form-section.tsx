import { ms } from "@/utils/scaling";
import React from "react";
import { View, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "../atoms/text";

export interface FormSectionProps {
  title: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  required = false,
  children,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text variant="bodyLargeSemiBold" color="neutral900">
          {title}
          {required && (
            <Text variant="bodyLargeSemiBold" color="error">
              {" "}
              *
            </Text>
          )}
        </Text>
        {description && (
          <Text variant="bodySmallRegular" color="neutral600" style={styles.description}>
            {description}
          </Text>
        )}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    marginBottom: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.base,
  },
  description: {
    marginTop: theme.spacing.xs,
    lineHeight: ms(18),
  },
  content: {
    // Content styles
  },
}));
