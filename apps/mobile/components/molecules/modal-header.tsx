import { ms } from "@/utils/scaling";
import { CaretLeftIcon } from "phosphor-react-native";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { IconButton } from "../atoms/icon-button";
import { Text } from "../atoms/text";

export interface ModalHeaderProps {
  title: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
  rightElement?: React.ReactNode;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onBackPress,
  showBackButton = true,
  rightElement,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftContainer}>
          {showBackButton && (
            <IconButton style={styles.backButton} onPress={onBackPress}>
              <CaretLeftIcon size={ms(24)} color="#000" weight="regular" />
            </IconButton>
          )}
        </View>

        <View style={styles.titleContainer}>
          <Text variant="bodyLargeSemiBold" color="text" textAlign="center" style={styles.title}>
            {title}
          </Text>
        </View>

        <View style={styles.rightContainer}>{rightElement}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    // borderBottomWidth: 1,
    // borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    overflow: "hidden",
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
  },

  leftContainer: {
    width: ms(44),
    alignItems: "flex-start",
  },

  backButton: {
    justifyContent: "center",
    alignItems: "center",
  },

  titleContainer: {
    flex: 1,
    alignItems: "center",
  },

  title: {},

  rightContainer: {
    width: ms(44),
    alignItems: "flex-end",
  },
}));
