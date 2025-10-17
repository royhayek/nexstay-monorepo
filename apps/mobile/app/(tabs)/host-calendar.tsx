import React from "react";
import { View, ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Text } from "@/components/atoms";
import { TabScreenTemplate } from "@/components/templates";
import { mvs } from "@/utils/scaling";

/**
 * Host Calendar Screen
 *
 * Displays a calendar view of all bookings, availability, and blocked dates.
 * Allows hosts to manage their property availability.
 */
export default function HostCalendarScreen() {
  return (
    <TabScreenTemplate title="Calendar">
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: mvs(120) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.placeholderContainer}>
          <Text variant="h5SemiBold" color="neutral800" style={styles.placeholderTitle}>
            Calendar Coming Soon
          </Text>
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.placeholderText}>
            Manage your booking calendar, availability, and blocked dates all in one place.
          </Text>
        </View>
      </ScrollView>
    </TabScreenTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxxl,
  },
  placeholderTitle: {
    marginBottom: theme.spacing.base,
    textAlign: "center",
  },
  placeholderText: {
    textAlign: "center",
    lineHeight: mvs(22),
  },
}));
