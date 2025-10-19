import NetInfo, { NetInfoState, NetInfoStateType } from "@react-native-community/netinfo";
import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";

/**
 * Network state interface
 */
interface NetworkState {
  /**
   * Whether the device is currently connected to the internet
   */
  isOnline: boolean;

  /**
   * Whether the device is currently offline
   */
  isOffline: boolean;

  /**
   * The type of connection (wifi, cellular, none, etc.)
   */
  connectionType: NetInfoStateType;

  /**
   * Whether we're currently checking network status
   */
  isChecking: boolean;

  /**
   * Manually refresh the network state
   */
  refresh: () => Promise<void>;
}

const NetworkContext = createContext<NetworkState | undefined>(undefined);

/**
 * Network Provider Component
 * Monitors network connectivity and provides online/offline status
 */
export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true); // Default to online
  const [connectionType, setConnectionType] = useState<NetInfoStateType>(NetInfoStateType.unknown);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  // Track previous state to avoid duplicate logs
  const prevStateRef = useRef<{ connected: boolean; type: NetInfoStateType } | null>(null);

  /**
   * Check if device is connected based on NetInfo state
   */
  const isConnected = useCallback((state: NetInfoState): boolean => {
    // Check if we have internet reachability
    if (state.isInternetReachable !== null) {
      return state.isInternetReachable;
    }

    // Fallback to connection status
    return state.isConnected === true;
  }, []);

  /**
   * Handle network state change
   */
  const handleNetworkChange = useCallback((state: NetInfoState) => {
    const connected = isConnected(state);
    const currentState = { connected, type: state.type };

    // Check if state actually changed to avoid duplicate logs
    const hasStateChanged =
      !prevStateRef.current ||
      prevStateRef.current.connected !== currentState.connected ||
      prevStateRef.current.type !== currentState.type;

    setIsOnline(connected);
    setConnectionType(state.type);
    setIsChecking(false);

    // Only log if state actually changed
    if (__DEV__ && hasStateChanged) {
      console.log(`[Network] Status changed: ${connected ? "Online" : "Offline"} (${state.type})`);

      if (!connected) {
        console.warn("[Network] ⚠️ Device is offline - auth operations will be queued");
      } else {
        console.info("[Network] ✅ Device is online - processing queued operations");
      }
    }

    // Update previous state
    prevStateRef.current = currentState;
  }, [isConnected]);

  /**
   * Manually refresh network state
   */
  const refresh = useCallback(async (): Promise<void> => {
    try {
      setIsChecking(true);
      const state = await NetInfo.fetch();
      handleNetworkChange(state);
    } catch (error) {
      console.error("[Network] Error refreshing network state:", error);
      setIsChecking(false);
    }
  }, [handleNetworkChange]);

  /**
   * Subscribe to network status changes on mount
   */
  useEffect(() => {
    // Get initial network state
    NetInfo.fetch().then(handleNetworkChange);

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [handleNetworkChange]);

  const value: NetworkState = useMemo(
    () => ({
      isOnline,
      isOffline: !isOnline,
      connectionType,
      isChecking,
      refresh,
    }),
    [isOnline, connectionType, isChecking, refresh]
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

/**
 * Hook to access network state
 *
 * @returns Network state with online/offline status
 *
 * @example
 * ```tsx
 * const { isOnline, isOffline, connectionType } = useNetwork();
 *
 * if (isOffline) {
 *   // Show offline indicator
 * }
 * ```
 */
export function useNetwork(): NetworkState {
  const context = useContext(NetworkContext);

  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }

  return context;
}
