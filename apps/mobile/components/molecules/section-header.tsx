import React from "react";
import { TouchableOpacity, View, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Text } from "@/components/atoms";

export interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Action button text */
  actionText?: string;
  /** Action button callback */
  onActionPress?: () => void;
  /** Custom style */
  style?: ViewStyle;
  /** Hide action button */
  hideAction?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionText = "See All",
  onActionPress,
  style,
  hideAction = false,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text variant="bodyLargeSemiBold" color="neutral800">
        {title}
      </Text>
      {!hideAction && onActionPress && (
        <TouchableOpacity onPress={onActionPress} activeOpacity={0.7}>
          <Text variant="bodySmallSemiBold" color="primary">
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create(() => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
}));
