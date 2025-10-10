import { router } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";

import { ModalHeader } from "../molecules";

export interface AuthTemplateProps {
  title: string;
  children: React.ReactNode;
  onBackPress?: () => void;
  showBackButton?: boolean;
}

export const AuthTemplate: React.FC<AuthTemplateProps> = ({ title, children, onBackPress, showBackButton = true }) => {
  const insets = useSafeAreaInsets();

  const handleClose = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ModalHeader title={title} onBackPress={handleClose} showBackButton={showBackButton} />

      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    marginTop: "auto",
    maxHeight: "95%",
  },

  content: {
    flex: 1,
  },

  scrollContainer: {
    flexGrow: 1,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
}));
