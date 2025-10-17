import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";

import { ModalHeader } from "../molecules";

export interface ScreenTemplateProps {
  title?: string;
  children: React.ReactNode;
  onBackPress?: () => void;
  showBackButton?: boolean;
  headerRightElement?: React.ReactNode;
  scrollable?: boolean;
  contentStyle?: any;
  backgroundColor?: string;
  bottomActions?: React.ReactNode;
}

export function ScreenTemplate({
  title,
  children,
  onBackPress,
  showBackButton = true,
  headerRightElement,
  scrollable = true,
  contentStyle,
  backgroundColor,
  bottomActions,
}: ScreenTemplateProps) {
  const insets = useSafeAreaInsets();

  const containerStyle = [styles.container, { paddingTop: insets.top }, backgroundColor && { backgroundColor }];

  const bottomActionsStyle = [styles.bottomActions, { paddingBottom: Math.max(insets.bottom, 16) }];

  if (scrollable) {
    return (
      <View style={containerStyle}>
        {title && (
          <ModalHeader
            title={title}
            onBackPress={onBackPress}
            showBackButton={showBackButton}
            rightElement={headerRightElement}
          />
        )}

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
      {title && (
        <ModalHeader
          title={title}
          onBackPress={onBackPress}
          showBackButton={showBackButton}
          rightElement={headerRightElement}
        />
      )}

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
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
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
