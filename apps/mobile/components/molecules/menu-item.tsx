import { ms, mvs } from "@/utils/scaling";
import { ArrowRight2 } from "iconsax-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "../atoms/text";

interface MenuItemProps {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  textColor?: string;
}

export function MenuItem({ icon, label, value, onPress, showArrow = true, textColor }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <View style={styles.leftContent}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text variant="bodyMediumMedium" color={textColor || "neutral800"} style={styles.label}>
          {label}
        </Text>
      </View>

      <View style={styles.rightContent}>
        {value && (
          <Text variant="bodySmallRegular" color="neutral500" style={styles.value}>
            {value}
          </Text>
        )}
        {showArrow && <ArrowRight2 size={ms(20)} color="#9CA3AF" variant="Outline" />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    minHeight: mvs(29),
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: ms(24),
    height: ms(24),
    marginRight: theme.spacing.base,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  value: {
    marginRight: theme.spacing.sm,
  },
}));
