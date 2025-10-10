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
  scrollable?: boolean;
  contentStyle?: any;
  backgroundColor?: string;
}

export function ScreenTemplate({
  title,
  children,
  onBackPress,
  showBackButton = true,
  scrollable = true,
  contentStyle,
  backgroundColor,
}: ScreenTemplateProps) {
  const insets = useSafeAreaInsets();

  const containerStyle = [styles.container, { paddingTop: insets.top }, backgroundColor && { backgroundColor }];

  if (scrollable) {
    return (
      <View style={containerStyle}>
        {title && <ModalHeader title={title} onBackPress={onBackPress} showBackButton={showBackButton} />}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {title && <ModalHeader title={title} onBackPress={onBackPress} showBackButton={showBackButton} />}

      <View style={[styles.content, contentStyle]}>{children}</View>
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
}));
