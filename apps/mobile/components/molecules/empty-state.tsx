import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { StatusHeader } from "./status-header";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon}

      <StatusHeader
        title={title}
        description={description}
        titleVariant="bodyLargeSemiBold"
        spacing="spacious"
        alignment="center"
      />

      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  actionContainer: {
    marginTop: theme.spacing.lg,
  },
}));
