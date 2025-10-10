import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";

import { ModalHeader } from "../molecules";

interface FormScreenTemplateProps {
  title: string;
  children: React.ReactNode;
  bottomActions?: React.ReactNode;
  onBackPress?: () => void;
  showBackButton?: boolean;
  scrollable?: boolean;
  contentStyle?: any;
}

export function FormScreenTemplate({
  title,
  children,
  bottomActions,
  onBackPress,
  showBackButton = true,
  scrollable = true,
  contentStyle,
}: FormScreenTemplateProps) {
  const insets = useSafeAreaInsets();

  const containerStyle = [styles.container, { paddingTop: insets.top }];

  const bottomActionsStyle = [styles.bottomActions, { paddingBottom: Math.max(insets.bottom, 16) }];

  if (scrollable) {
    return (
      <View style={containerStyle}>
        <ModalHeader title={title} onBackPress={onBackPress} showBackButton={showBackButton} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {bottomActions && <View style={bottomActionsStyle}>{bottomActions}</View>}
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <ModalHeader title={title} onBackPress={onBackPress} showBackButton={showBackButton} />

      <View style={[styles.content, contentStyle]}>{children}</View>

      {bottomActions && <View style={bottomActionsStyle}>{bottomActions}</View>}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: theme.borderWidth.thin,
    borderTopColor: theme.colors.border,
  },
}));
