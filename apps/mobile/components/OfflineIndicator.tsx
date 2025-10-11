import { useNetwork } from "@/hooks/use-network";
import { offlineQueue } from "@/utils/offline-queue";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

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
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutDown.duration(300)}
      style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>

        <View style={styles.textContainer}>
          <Text style={styles.title}>No Internet Connection</Text>

          {queueSize > 0 && (
            <Text style={styles.subtitle}>
              {queueSize} {queueSize === 1 ? "operation" : "operations"} queued
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFA500",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    padding: 12,
    paddingHorizontal: 16,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 12,
    opacity: 0.9,
  },
});
