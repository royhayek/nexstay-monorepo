import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { IconButton } from "@/components/atoms";
import { ms } from "@/utils/scaling";
import { Calendar, Heart, Home2, Profile, Category, Messages2, HambergerMenu } from "iconsax-react-native";
import { useRoleContext } from "@/contexts";

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const translateX = useSharedValue(0);
  const { activeRole, canBeHost, isDualRole } = useRoleContext();

  // Determine which tabs should be shown based on roles
  const showHostStack = isDualRole ? activeRole === "host" : canBeHost;

  // Define which routes belong to which stack
  const guestRoutes = ["index", "favorites", "booking-history", "profile"];
  const hostRoutes = ["host-dashboard", "host-listings", "host-calendar", "host-messages", "host-menu"];

  // Filter and sort routes based on active stack
  const visibleRoutes = state.routes
    .filter((route) => {
      const { options } = descriptors[route.key];

      // First check if route is explicitly hidden
      if (options.href === null) {
        return false;
      }

      // Then check if route belongs to the current stack
      if (showHostStack) {
        return hostRoutes.includes(route.name);
      } else {
        return guestRoutes.includes(route.name);
      }
    })
    .sort((a, b) => {
      // Sort by the order defined in hostRoutes or guestRoutes
      const routeList = showHostStack ? hostRoutes : guestRoutes;
      return routeList.indexOf(a.name) - routeList.indexOf(b.name);
    });

  // Find the visible index (position among visible tabs)
  const visibleIndex = visibleRoutes.findIndex((route) => route.key === state.routes[state.index].key);

  useEffect(() => {
    // Don't animate if current route is not in visible routes
    if (visibleIndex === -1) {
      return;
    }

    // Use actual theme values for precise positioning
    const iconWidth = theme.spacing.huge; // 48px
    const margin = theme.spacing.xs; // 4px
    const tabSpacing = iconWidth + margin * 2; // 56px total per tab

    // Calculate position from center for each tab
    const numTabs = visibleRoutes.length;
    const totalWidth = numTabs * tabSpacing;
    const halfWidth = totalWidth / 2;

    // Position of each tab center relative to the overall center
    const tabCenterPosition = visibleIndex * tabSpacing + tabSpacing / 2 - halfWidth;

    translateX.value = withSpring(tabCenterPosition, SPRING_CONFIG);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIndex, theme, visibleRoutes.length]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const getIcon = (routeName: string) => {
    switch (routeName) {
      // Guest tabs
      case "index":
        return Home2;
      case "favorites":
        return Heart;
      case "booking-history":
        return Calendar;
      case "profile":
        return Profile;
      // Host tabs
      case "host-dashboard":
        return Home2;
      case "host-calendar":
        return Calendar;
      case "host-listings":
        return Category;
      case "host-messages":
        return Messages2;
      case "host-menu":
        return HambergerMenu;
      default:
        return Home2;
    }
  };

  const handleTabPress = (index: number, route: any) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  // Don't render if no visible routes
  if (visibleRoutes.length === 0) {
    return null;
  }

  return (
    <LinearGradient
      colors={["transparent", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.2)"]}
      locations={[0, 0.7, 1]}
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      <View style={styles.tabBar}>
        {visibleRoutes.map((route) => {
          // Get the original index in state.routes
          const originalIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === originalIndex;
          const IconComponent = getIcon(route.name);

          return (
            <IconButton
              key={route.key}
              style={styles.tab}
              onPress={() => handleTabPress(originalIndex, route)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={route.name}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: isFocused ? 1.1 : 1 }],
                    opacity: isFocused ? 1 : 0.7,
                  },
                ]}
                pointerEvents="none"
              >
                <IconComponent
                  size={ms(24)}
                  color={isFocused ? theme.colors.neutral0 : theme.colors.neutral600}
                  variant={isFocused ? "Bold" : "Linear"}
                />
              </View>
            </IconButton>
          );
        })}

        <Animated.View style={[styles.dot, dotStyle]} pointerEvents="none" />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  tabBar: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.base,
    position: "relative",
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: theme.spacing.xs,
    minWidth: ms(44),
    minHeight: ms(44),
    borderRadius: ms(22),
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: theme.spacing.huge,
    height: theme.spacing.huge,
    backgroundColor: "transparent",
  },
  dot: {
    width: ms(5),
    height: ms(5),
    borderRadius: ms(2.5),
    backgroundColor: theme.colors.neutral0,
    position: "absolute",
    bottom: theme.spacing.sm,
    alignSelf: "center",
  },
}));
