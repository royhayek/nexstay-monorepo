import { Text } from "./text";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

interface BadgeProps {
  count?: number;
  showDot?: boolean;
  maxCount?: number;
  size?: "small" | "medium";
  children: React.ReactNode;
}

export function Badge({ count = 0, showDot = false, maxCount = 99, size = "medium", children }: BadgeProps) {
  const shouldShowBadge = showDot || count > 0;
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <View style={styles.container}>
      {children}
      {shouldShowBadge && (
        <View
          style={[styles.badge, size === "small" ? styles.badgeSmall : styles.badgeMedium, showDot && styles.dotBadge]}
        >
          {!showDot && count > 0 && (
            <Text
              color="textPrimary"
              style={styles.badgeText}
              variant={size === "small" ? "bodySmallMedium" : "bodySmallSemiBold"}
            >
              {displayCount}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderColor: theme.colors.neutral800,
    borderWidth: theme.borderWidth.thin,
  },
  badgeSmall: {
    minWidth: 16,
    height: 16,
    top: -6,
    right: -6,
    paddingHorizontal: 4,
  },
  badgeMedium: {
    minWidth: 20,
    height: 20,
    top: -8,
    right: -8,
    paddingHorizontal: 6,
  },
  dotBadge: {
    width: 8,
    height: 8,
    minWidth: 8,
    top: 0,
    right: 1,
    paddingHorizontal: 0,
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
  },
}));
