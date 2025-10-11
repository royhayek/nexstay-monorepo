import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { tokenManager, userManager } from "../utils/auth";

/**
 * Hook to validate authentication state when app resumes from background
 *
 * This hook monitors app state changes and automatically validates tokens
 * when the app returns to the foreground, improving security by ensuring
 * expired tokens are caught immediately rather than on the next API call.
 *
 * Features:
 * - Validates access token on app resume
 * - Clears auth state if token is expired
 * - Only validates if enough time has passed since last check (prevents spam)
 * - Configurable validation interval
 *
 * @param options - Configuration options
 * @param options.minIntervalMs - Minimum time between validations (default: 30 seconds)
 * @param options.onTokenExpired - Callback when token is found to be expired
 */
interface UseAppStateAuthOptions {
  /**
   * Minimum time (in milliseconds) between token validations
   * Prevents excessive validation when user quickly switches apps
   * Default: 30000 (30 seconds)
   */
  minIntervalMs?: number;

  /**
   * Callback invoked when token is found to be expired
   * Use this to navigate to login screen or show a message
   */
  onTokenExpired?: () => void;
}

export const useAppStateAuth = (options: UseAppStateAuthOptions = {}) => {
  const { minIntervalMs = 30000, onTokenExpired } = options;

  const appState = useRef(AppState.currentState);
  const lastCheckTime = useRef<number>(0);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // Check if app is moving from background/inactive to active
      const isComingToForeground =
        appState.current.match(/inactive|background/) && nextAppState === "active";

      if (isComingToForeground) {
        const now = Date.now();
        const timeSinceLastCheck = now - lastCheckTime.current;

        // Only validate if enough time has passed since last check
        if (timeSinceLastCheck >= minIntervalMs) {
          lastCheckTime.current = now;

          try {
            // Get current access token
            const accessToken = await tokenManager.getAccessToken();

            if (accessToken) {
              // Check if token is expired
              const isExpired = tokenManager.isTokenExpired(accessToken);

              if (isExpired) {
                console.info("[Auth] Token expired on app resume, clearing auth state");

                // Clear tokens and user data
                await tokenManager.clearTokens();
                await userManager.clearUserData();

                // Notify caller that token expired
                onTokenExpired?.();
              } else {
                console.log("[Auth] Token still valid on app resume");
              }
            }
          } catch (error) {
            console.error("[Auth] Error validating token on app resume:", error);
          }
        }
      }

      appState.current = nextAppState;
    };

    // Subscribe to app state changes
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    // Cleanup subscription on unmount
    return () => {
      subscription.remove();
    };
  }, [minIntervalMs, onTokenExpired]);
};
