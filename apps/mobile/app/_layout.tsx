import {
  PlusJakartaSans_200ExtraLight,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OfflineIndicator } from "@/components/OfflineIndicator";
import { AuthProvider } from "@/hooks/use-auth";
import { BottomSheetProvider } from "@/hooks/use-bottom-sheet";
import { NetworkProvider } from "@/hooks/use-network";
import { SharedTransitionProvider } from "@/hooks/use-shared-transition";
import { ThemePreferenceProvider, useThemePreference } from "@/hooks/use-theme-preference";
import "@/unistyles";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function RootLayoutNav() {
  const { effectiveTheme } = useThemePreference();

  return (
    <ThemeProvider value={effectiveTheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="(auth)/login"
          options={{
            presentation: "modal",
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="(auth)/password"
          options={{
            presentation: "modal",
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="(auth)/register"
          options={{
            presentation: "modal",
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="(auth)/verify"
          options={{
            presentation: "modal",
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="(auth)/forgot-password"
          options={{
            presentation: "modal",
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="property/[id]"
          options={{
            presentation: "transparentModal",
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: "vertical",
            animation: "none",
            animationDuration: 0,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
      </Stack>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_200ExtraLight,
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemePreferenceProvider>
            <NetworkProvider>
              <AuthProvider>
                <BottomSheetProvider>
                  <SharedTransitionProvider>
                    <RootLayoutNav />
                    <OfflineIndicator />
                  </SharedTransitionProvider>
                </BottomSheetProvider>
              </AuthProvider>
            </NetworkProvider>
          </ThemePreferenceProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
