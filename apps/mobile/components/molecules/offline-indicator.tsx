import { useNetwork } from "@/hooks/use-network";
import { offlineQueue } from "@/utils/offline-queue";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

import { Text } from "../atoms";

/**
 * Offline Indicator Component
 * Shows a banner when the device is offline
 */
export function OfflineIndicator() {
  const { isOffline } = useNetwork();
  const [queueSize, setQueueSize] = useState(0);

  // Update queue size when offline status changes
  useEffect(() => {
    const updateQueueSize = async () => {
      const size = await offlineQueue.getQueueSize();
      setQueueSize(size);
    };

    if (isOffline) {
      updateQueueSize();

      // Poll queue size while offline (every 2 seconds)
      const interval = setInterval(updateQueueSize, 2000);

      return () => clearInterval(interval);
    }
  }, [isOffline]);

  if (!isOffline) {
    return null;
  }

  return (
    <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOutDown.duration(300)} style={styles.container}>
      <View style={styles.content}>
        <Text variant="bodyMediumSemiBold" style={styles.icon}>
          ⚠️
        </Text>

        <View style={styles.textContainer}>
          <Text variant="bodyMediumSemiBold" style={styles.title}>
            No Internet Connection
          </Text>

          {queueSize > 0 && (
            <Text variant="bodySmallRegular" style={styles.subtitle}>
              {queueSize} {queueSize === 1 ? "operation" : "operations"} queued
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFA500",
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.base,
    paddingHorizontal: theme.spacing.lg,
  },
  icon: {
    fontSize: 20,
    marginRight: theme.spacing.base,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#FFFFFF",
    marginBottom: 2,
  },
  subtitle: {
    color: "#FFFFFF",
    opacity: 0.9,
  },
}));
