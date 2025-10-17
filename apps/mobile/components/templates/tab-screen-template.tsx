import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { ModalHeader } from "../molecules";

export interface TabScreenTemplateProps {
  children: React.ReactNode;
  backgroundColor?: string;
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  headerRightElement?: React.ReactNode;
}

export const TabScreenTemplate: React.FC<TabScreenTemplateProps> = ({
  children,
  backgroundColor,
  title,
  showBackButton = false,
  onBackPress,
  headerRightElement,
}) => {
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
      {title && (
        <ModalHeader
          title={title}
          showBackButton={showBackButton}
          onBackPress={onBackPress}
          rightElement={headerRightElement}
        />
      )}
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
