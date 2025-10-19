import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useMemo } from "react";
import { View, TouchableOpacity, FlatList, ActivityIndicator, Alert, Dimensions } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { ArrowLeft2, ArrowRight2, Add } from "iconsax-react-native";
import { useQueryClient } from "@tanstack/react-query";

import { Button, Text } from "@/components/atoms";
import { ScreenTemplate } from "@/components/templates";
import { ms } from "@/utils/scaling";
import {
  usePropertiesAppControllerGetCalendar,
  usePropertiesAppControllerBlockDates,
  usePropertiesAppControllerUnblockDates,
  getPropertiesAppControllerGetCalendarQueryKey,
} from "@/api/queries/protected/properties/properties";

/**
 * Calendar Management Screen
 *
 * Allows hosts to:
 * - View bookings on a calendar
 * - View blocked dates
 * - Block new date ranges
 * - Unblock existing blocked dates
 */
export default function ListingCalendarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useUnistyles();
  const queryClient = useQueryClient();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectionMode, setSelectionMode] = useState<"block" | null>(null);

  // Calculate cell size for calendar grid to ensure consistent layout
  const cellSize = useMemo(() => {
    const screenWidth = Dimensions.get("window").width;
    const horizontalPadding = theme.spacing.lg * 2; // Padding from calendarGrid
    const cellMargin = 4; // margin: 2 on each side = 4 total per cell
    const numColumns = 7;

    // Total margin space taken by all cells
    const totalMargins = cellMargin * numColumns;

    // Available width for cell content
    const availableWidth = screenWidth - horizontalPadding - totalMargins;

    return availableWidth / numColumns;
  }, [theme.spacing.lg]);

  // Calculate start and end dates for the current month view
  const { startDate, endDate } = useMemo(() => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, [currentMonth]);

  // Fetch calendar data
  const { data, isLoading, error, refetch } = usePropertiesAppControllerGetCalendar(id!, {
    startDate,
    endDate,
  });

  // Block dates mutation
  const { mutateAsync: blockDates, isPending: isBlocking } = usePropertiesAppControllerBlockDates({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getPropertiesAppControllerGetCalendarQueryKey(id!, { startDate, endDate }),
        });
      },
    },
  });

  // Unblock dates mutation
  const { mutateAsync: unblockDates, isPending: isUnblocking } = usePropertiesAppControllerUnblockDates({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getPropertiesAppControllerGetCalendarQueryKey(id!, { startDate, endDate }),
        });
      },
    },
  });

  const calendarData = data?.data;
  const bookings = calendarData?.bookings || [];
  const blockedDates = calendarData?.blockedDates || [];

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: { date: Date | null; day: number | null }[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, day: null });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        day,
      });
    }

    return days;
  }, [currentMonth]);

  // Check if date is booked
  const isDateBooked = (date: Date) => {
    return bookings.some((booking) => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      return date >= checkIn && date < checkOut;
    });
  };

  // Check if date is blocked
  const isDateBlocked = (date: Date) => {
    return blockedDates.some((blocked) => {
      const start = new Date(blocked.startDate);
      const end = new Date(blocked.endDate);
      return date >= start && date <= end;
    });
  };

  // Check if date is selected
  const isDateSelected = (date: Date) => {
    return selectedDates.some(
      (selected) =>
        selected.getFullYear() === date.getFullYear() &&
        selected.getMonth() === date.getMonth() &&
        selected.getDate() === date.getDate()
    );
  };

  // Handle date press
  const handleDatePress = (date: Date) => {
    if (isDateBooked(date)) {
      // Show booking details
      const booking = bookings.find((b) => {
        const checkIn = new Date(b.checkIn);
        const checkOut = new Date(b.checkOut);
        return date >= checkIn && date < checkOut;
      });

      if (booking) {
        Alert.alert(
          "Booking Details",
          `Guest: ${booking.guestName}\nCheck-in: ${new Date(
            booking.checkIn
          ).toLocaleDateString()}\nCheck-out: ${new Date(booking.checkOut).toLocaleDateString()}\nGuests: ${
            booking.totalGuests
          }\nStatus: ${booking.status}`
        );
      }
      return;
    }

    if (selectionMode === "block") {
      // Toggle date selection
      if (isDateSelected(date)) {
        setSelectedDates(selectedDates.filter((d) => !isSameDay(d, date)));
      } else {
        setSelectedDates([...selectedDates, date]);
      }
    }
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Navigate month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Format date to YYYY-MM-DD format (ISO 8601 date-only format)
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Handle block dates - Step 1: Prompt for reason
  const handleBlockDates = () => {
    if (selectedDates.length === 0) {
      Alert.alert("Select Dates", "Please select at least one date to block.");
      return;
    }

    // Sort dates and get range
    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    const start = sortedDates[0];
    const end = sortedDates[sortedDates.length - 1];

    // Prompt for reason
    Alert.prompt(
      "Block Dates",
      `Block dates from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}?\n\nPlease provide a reason:`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            // User cancelled, keep selection
          },
        },
        {
          text: "Block",
          onPress: async (reason?: string) => {
            if (!reason || reason.trim().length === 0) {
              Alert.alert("Required", "Please provide a reason for blocking.");
              return;
            }

            const startDateStr = formatDateForAPI(start);
            const endDateStr = formatDateForAPI(end);

            // Debug logging
            console.log("=== Block Dates Debug ===");
            console.log("Start Date Object:", start);
            console.log("End Date Object:", end);
            console.log("Formatted Start Date:", startDateStr);
            console.log("Formatted End Date:", endDateStr);
            console.log("Reason:", reason.trim());
            console.log("Property ID:", id);

            const requestData = {
              startDate: startDateStr,
              endDate: endDateStr,
              reason: reason.trim(),
            };

            console.log("Request payload:", JSON.stringify(requestData, null, 2));

            try {
              await blockDates({
                id: id!,
                data: requestData,
              });

              setSelectedDates([]);
              setSelectionMode(null);
              Alert.alert("Success", "Dates blocked successfully");
            } catch (error: any) {
              console.error("=== Block Dates Error ===");
              console.error("Full error:", error);
              console.error("Error response:", error?.response);
              console.error("Error data:", error?.response?.data);
              console.error("Error status:", error?.response?.status);

              const errorMsg = Array.isArray(error?.response?.data?.message)
                ? error?.response?.data?.message.join(", ")
                : error?.response?.data?.message || "Failed to block dates";

              Alert.alert("Error", errorMsg);
            }
          },
        },
      ],
      "plain-text",
      "",
      "default"
    );
  };

  // Handle unblock dates
  const handleUnblockDate = (date: Date) => {
    const blocked = blockedDates.find((b) => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      return date >= start && date <= end;
    });

    if (!blocked) return;

    Alert.alert(
      "Unblock Dates",
      `Unblock dates from ${new Date(blocked.startDate).toLocaleDateString()} to ${new Date(
        blocked.endDate
      ).toLocaleDateString()}?\n\nReason: ${blocked.reason}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          style: "destructive",
          onPress: async () => {
            try {
              await unblockDates({
                id: id!,
                data: {
                  blockedDateIds: [blocked.id],
                },
              });
              Alert.alert("Success", "Dates unblocked successfully");
            } catch (error: any) {
              Alert.alert("Error", error?.response?.data?.message || "Failed to unblock dates");
            }
          },
        },
      ]
    );
  };

  // Render calendar day
  const renderDay = ({ item }: { item: { date: Date | null; day: number | null } }) => {
    if (!item.date || !item.day) {
      return <View style={[styles.dayCell, { width: cellSize, height: cellSize }]} />;
    }

    const isBooked = isDateBooked(item.date);
    const isBlocked = isDateBlocked(item.date);
    const isSelected = isDateSelected(item.date);
    const isPast = item.date < new Date(new Date().setHours(0, 0, 0, 0));

    let backgroundColor: string = theme.colors.surface;
    let textColor: "neutral800" | "neutral0" | "success" | "error" | "neutral600" = "neutral800";

    if (isSelected) {
      backgroundColor = theme.colors.primary;
      textColor = "neutral0";
    } else if (isBooked) {
      backgroundColor = theme.colors.success + "20";
      textColor = "success";
    } else if (isBlocked) {
      backgroundColor = theme.colors.error + "20";
      textColor = "error";
    } else if (isPast) {
      backgroundColor = theme.colors.neutral100;
      textColor = "neutral600";
    }

    return (
      <TouchableOpacity
        style={[styles.dayCell, { backgroundColor, width: cellSize, height: cellSize }]}
        onPress={() => handleDatePress(item.date!)}
        onLongPress={() => {
          if (isBlocked) {
            handleUnblockDate(item.date!);
          }
        }}
        disabled={isPast && !isBlocked}
      >
        <Text variant="bodySmallSemiBold" color={textColor}>
          {item.day}
        </Text>
        {isBooked && <View style={[styles.indicator, { backgroundColor: theme.colors.success }]} />}
        {isBlocked && <View style={[styles.indicator, { backgroundColor: theme.colors.error }]} />}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <ScreenTemplate title="Calendar" onBackPress={() => router.back()}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.loadingText}>
            Loading calendar...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  if (error) {
    return (
      <ScreenTemplate title="Calendar" onBackPress={() => router.back()}>
        <View style={styles.errorContainer}>
          <Text variant="bodyMediumRegular" color="error" style={styles.errorText}>
            Failed to load calendar
          </Text>
          <Button variant="outlined" onPress={() => refetch()}>
            Try Again
          </Button>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate
      title="Calendar"
      onBackPress={() => router.back()}
      scrollable={false}
      bottomActions={
        selectionMode === "block" && selectedDates.length > 0 ? (
          <>
            <Button
              variant="outlined"
              onPress={() => {
                setSelectedDates([]);
                setSelectionMode(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="filled" onPress={handleBlockDates} style={{ flex: 1 }}>
              Block {selectedDates.length} {selectedDates.length === 1 ? "Date" : "Dates"}
            </Button>
          </>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Button variant="filled" onPress={() => setSelectionMode("block")} style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.xs }}>
                <Add size={ms(20)} color={theme.colors.neutral0} variant="Bold" />
                <Text variant="bodyMediumSemiBold" color="neutral0">
                  Block Dates
                </Text>
              </View>
            </Button>
          </View>
        )
      }
    >
      <View style={styles.container}>
        {/* Month Navigation */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
            <ArrowLeft2 size={ms(24)} color={theme.colors.neutral800} variant="Outline" />
          </TouchableOpacity>
          <Text variant="h6SemiBold" color="neutral800">
            {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
            <ArrowRight2 size={ms(24)} color={theme.colors.neutral800} variant="Outline" />
          </TouchableOpacity>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
            <Text variant="bodySmallRegular" color="neutral600">
              Booked
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
            <Text variant="bodySmallRegular" color="neutral600">
              Blocked
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
            <Text variant="bodySmallRegular" color="neutral600">
              Selected
            </Text>
          </View>
        </View>

        {/* Week Days Header */}
        <View style={styles.weekHeader}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <View key={day} style={[styles.weekDayCell, { width: cellSize + 4 }]}>
              <Text variant="bodySmallSemiBold" color="neutral600">
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <FlatList
          data={calendarDays}
          keyExtractor={(item, index) => `day-${index}`}
          numColumns={7}
          renderItem={renderDay}
          scrollEnabled={false}
        />

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text variant="bodySmallRegular" color="neutral600" style={{ textAlign: "center" }}>
            {selectionMode === "block"
              ? "Tap dates to select them for blocking"
              : "Tap a date to view details • Long press a blocked date to unblock"}
          </Text>
        </View>
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  errorText: {
    marginBottom: theme.spacing.md,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.base,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.base,
  },
  monthButton: {
    padding: theme.spacing.sm,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
    marginTop: theme.spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  legendDot: {
    width: ms(12),
    height: ms(12),
    borderRadius: ms(6),
  },
  weekHeader: {
    flexDirection: "row",
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  weekDayCell: {
    alignItems: "center",
  },
  dayCell: {
    justifyContent: "center",
    alignItems: "center",
    margin: 2,
    borderRadius: theme.borderRadius.sm,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    bottom: 4,
    width: ms(4),
    height: ms(4),
    borderRadius: ms(2),
  },
  instructions: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
}));
