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
import { Calendar, Heart, Home2, Profile } from "iconsax-react-native";

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useUnistyles();
  const translateX = useSharedValue(0);

  useEffect(() => {
    // Use actual theme values for precise positioning
    const iconWidth = theme.spacing.huge; // 48px
    const margin = theme.spacing.xs; // 4px
    const tabSpacing = iconWidth + margin * 2; // 56px total per tab

    // Calculate position from center for each tab
    const numTabs = state.routes.length; // 4 tabs
    const totalWidth = numTabs * tabSpacing; // 224px
    const halfWidth = totalWidth / 2; // 112px

    // Position of each tab center relative to the overall center
    const tabCenterPosition = state.index * tabSpacing + tabSpacing / 2 - halfWidth;

    translateX.value = withSpring(tabCenterPosition, SPRING_CONFIG);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, theme]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // Create animated styles for each tab index
  const iconStyle0 = useAnimatedStyle(() => {
    const isActive = state.index === 0;
    return {
      transform: [{ scale: withSpring(isActive ? 1.1 : 1, SPRING_CONFIG) }],
      opacity: withSpring(isActive ? 1 : 0.7, SPRING_CONFIG),
    };
  });

  const iconStyle1 = useAnimatedStyle(() => {
    const isActive = state.index === 1;
    return {
      transform: [{ scale: withSpring(isActive ? 1.1 : 1, SPRING_CONFIG) }],
      opacity: withSpring(isActive ? 1 : 0.7, SPRING_CONFIG),
    };
  });

  const iconStyle2 = useAnimatedStyle(() => {
    const isActive = state.index === 2;
    return {
      transform: [{ scale: withSpring(isActive ? 1.1 : 1, SPRING_CONFIG) }],
      opacity: withSpring(isActive ? 1 : 0.7, SPRING_CONFIG),
    };
  });

  const iconStyle3 = useAnimatedStyle(() => {
    const isActive = state.index === 3;
    return {
      transform: [{ scale: withSpring(isActive ? 1.1 : 1, SPRING_CONFIG) }],
      opacity: withSpring(isActive ? 1 : 0.7, SPRING_CONFIG),
    };
  });

  const iconStyles = [iconStyle0, iconStyle1, iconStyle2, iconStyle3];

  const getIcon = (routeName: string) => {
    switch (routeName) {
      case "index":
        return Home2;
      case "favorites":
        return Heart;
      case "booking-history":
        return Calendar;
      case "profile":
        return Profile;
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

  return (
    <LinearGradient
      colors={["transparent", "rgba(0,0,0,0.1)", "rgba(0,0,0,0.2)"]}
      locations={[0, 0.7, 1]}
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const IconComponent = getIcon(route.name);
          const iconStyle = iconStyles[index];

          return (
            <IconButton
              key={route.key}
              style={styles.tab}
              onPress={() => handleTabPress(index, route)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={route.name}
            >
              <Animated.View style={[styles.iconContainer, iconStyle]} pointerEvents="none">
                <IconComponent
                  size={ms(24)}
                  color={isFocused ? theme.colors.neutral0 : theme.colors.neutral600}
                  variant={isFocused ? "Bold" : "Linear"}
                />
              </Animated.View>
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
