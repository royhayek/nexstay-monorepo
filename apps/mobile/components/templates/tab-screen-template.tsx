import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";

export interface TabScreenTemplateProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

export const TabScreenTemplate: React.FC<TabScreenTemplateProps> = ({ children, backgroundColor }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
        },
        backgroundColor && { backgroundColor },
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}));
