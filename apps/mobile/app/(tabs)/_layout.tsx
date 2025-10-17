import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";

import { AuthModalHandler, CustomTabBar, IconSymbol } from "@/components";
import { useRoleContext } from "@/contexts";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { activeRole, canBeHost, canBeGuest, isDualRole, isLoading } = useRoleContext();
  const previousRoleRef = useRef(activeRole);

  // Determine which stack to show:
  // - If user has both roles: show stack based on activeRole (allows switching)
  // - If user has only host role: show host stack
  // - If user has only guest role: show guest stack
  const showHostStack = isDualRole ? activeRole === "host" : canBeHost;

  // Navigate to the first tab of the new stack when role changes
  useEffect(() => {
    // Skip on initial mount
    if (previousRoleRef.current === activeRole) {
      return;
    }

    // Role has changed, navigate to the first tab of the new stack
    const previousRole = previousRoleRef.current;
    previousRoleRef.current = activeRole;

    // Define first tab for each stack
    const firstGuestTab = "/(tabs)/";  // index
    const firstHostTab = "/(tabs)/host-dashboard";

    // Determine which stack we're switching to
    const switchingToHost = activeRole === "host" && previousRole === "guest";
    const switchingToGuest = activeRole === "guest" && previousRole === "host";

    if (switchingToHost && canBeHost) {
      router.replace(firstHostTab);
    } else if (switchingToGuest && canBeGuest) {
      router.replace(firstGuestTab);
    }
  }, [activeRole, canBeHost, canBeGuest, router]);

  // Wait for role context to load before rendering tabs
  if (isLoading) {
    return null;
  }

  return (
    <>
      <AuthModalHandler />
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
        }}
      >
        {showHostStack ? (
          // Host Tab Layout - 5 tabs for hosts (Dashboard, Listings, Calendar, Messages, Menu)
          <>
            <Tabs.Screen
              name="host-dashboard"
              options={{
                title: "Dashboard",
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
              }}
            />
            <Tabs.Screen
              name="host-listings"
              options={{
                title: "Listings",
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
              }}
            />
            <Tabs.Screen
              name="host-calendar"
              options={{
                title: "Calendar",
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
              }}
            />
            <Tabs.Screen
              name="host-messages"
              options={{
                title: "Messages",
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
              }}
            />
            <Tabs.Screen
              name="host-menu"
              options={{
                title: "Menu",
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="line.3.horizontal" color={color} />,
              }}
            />
          </>
        ) : (
          // Guest Tab Layout - Only render guest tabs
          <>
            <Tabs.Screen
              name="index"
              options={{
                title: "Home",
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
              }}
            />
            <Tabs.Screen
              name="favorites"
              options={{
                title: "Favorites",
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="heart.fill" color={color} />,
              }}
            />
            <Tabs.Screen
              name="booking-history"
              options={{
                title: "Bookings",
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: "Profile",
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
              }}
            />
          </>
        )}
      </Tabs>
    </>
  );
}
