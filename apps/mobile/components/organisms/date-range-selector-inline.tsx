import React, { useState } from "react";
import { Platform, TouchableOpacity, View, Modal } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar1 } from "iconsax-react-native";
import { Text } from "../atoms/text";
import { Button } from "../atoms/button";
import { ms } from "@/utils/scaling";

export interface DateRangeSelectorInlineProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onCheckInChange: (date: Date) => void;
  onCheckOutChange: (date: Date) => void;
  minimumDate?: Date;
}

export const DateRangeSelectorInline: React.FC<DateRangeSelectorInlineProps> = ({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  minimumDate = new Date(),
}) => {
  const { theme } = useUnistyles();
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [tempCheckInDate, setTempCheckInDate] = useState<Date | null>(null);
  const [tempCheckOutDate, setTempCheckOutDate] = useState<Date | null>(null);

  const formatDate = (date: Date | null) => {
    if (!date) return "Select date";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleCheckInPress = () => {
    setTempCheckInDate(checkIn || minimumDate);
    setShowCheckInPicker(true);
  };

  const handleCheckOutPress = () => {
    if (!checkIn) return;
    setTempCheckOutDate(checkOut || new Date(checkIn.getTime() + 24 * 60 * 60 * 1000));
    setShowCheckOutPicker(true);
  };

  const handleCheckInChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowCheckInPicker(false);
      if (selectedDate) {
        onCheckInChange(selectedDate);
        if (checkOut && selectedDate >= checkOut) {
          const newCheckOut = new Date(selectedDate);
          newCheckOut.setDate(newCheckOut.getDate() + 1);
          onCheckOutChange(newCheckOut);
        }
      }
    } else if (selectedDate) {
      setTempCheckInDate(selectedDate);
    }
  };

  const handleCheckOutChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowCheckOutPicker(false);
      if (selectedDate) {
        onCheckOutChange(selectedDate);
      }
    } else if (selectedDate) {
      setTempCheckOutDate(selectedDate);
    }
  };

  const confirmCheckIn = () => {
    if (tempCheckInDate) {
      onCheckInChange(tempCheckInDate);
      if (checkOut && tempCheckInDate >= checkOut) {
        const newCheckOut = new Date(tempCheckInDate);
        newCheckOut.setDate(newCheckOut.getDate() + 1);
        onCheckOutChange(newCheckOut);
      }
    }
    setShowCheckInPicker(false);
    setTempCheckInDate(null);
  };

  const confirmCheckOut = () => {
    if (tempCheckOutDate) {
      onCheckOutChange(tempCheckOutDate);
    }
    setShowCheckOutPicker(false);
    setTempCheckOutDate(null);
  };

  const cancelCheckIn = () => {
    setShowCheckInPicker(false);
    setTempCheckInDate(null);
  };

  const cancelCheckOut = () => {
    setShowCheckOutPicker(false);
    setTempCheckOutDate(null);
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nights = calculateNights();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="bodyLargeSemiBold">Dates</Text>
        {nights > 0 && (
          <Text variant="bodyMediumRegular" color="textSecondary">
            {nights} {nights === 1 ? "night" : "nights"}
          </Text>
        )}
      </View>

      <View style={styles.dateContainer}>
        {/* Check-in Date */}
        <TouchableOpacity style={styles.dateButton} onPress={handleCheckInPress} activeOpacity={0.7}>
          <View style={styles.dateButtonContent}>
            <View style={styles.iconContainer}>
              <Calendar1 size={ms(20)} variant="Linear" />
            </View>
            <View style={styles.dateTextContainer}>
              <Text variant="bodyXSmallRegular" color="textSecondary">
                Check-in
              </Text>
              <Text variant="bodyMediumSemiBold" color={checkIn ? "text" : "neutral500"}>
                {formatDate(checkIn)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Check-out Date */}
        <TouchableOpacity
          style={styles.dateButton}
          onPress={handleCheckOutPress}
          activeOpacity={0.7}
          disabled={!checkIn}
        >
          <View style={styles.dateButtonContent}>
            <View style={styles.iconContainer}>
              <Calendar1 size={ms(20)} variant="Linear" />
            </View>
            <View style={styles.dateTextContainer}>
              <Text variant="bodyXSmallRegular" color="textSecondary">
                Check-out
              </Text>
              <Text variant="bodyMediumSemiBold" color={checkOut ? "text" : "neutral500"}>
                {formatDate(checkOut)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* iOS Modal Date Pickers */}
      {Platform.OS === "ios" && (
        <>
          <Modal
            visible={showCheckInPicker}
            transparent
            animationType="slide"
            onRequestClose={cancelCheckIn}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text variant="bodyLargeSemiBold">Select Check-in Date</Text>
                </View>
                <DateTimePicker
                  value={tempCheckInDate || minimumDate}
                  mode="date"
                  display="spinner"
                  onChange={handleCheckInChange}
                  minimumDate={minimumDate}
                  textColor={theme.colors.text}
                  style={styles.picker}
                />
                <View style={styles.buttonContainer}>
                  <Button variant="outlined" size="medium" onPress={cancelCheckIn} style={styles.button}>
                    Cancel
                  </Button>
                  <Button variant="filled" size="medium" onPress={confirmCheckIn} style={styles.button}>
                    Confirm
                  </Button>
                </View>
              </View>
            </View>
          </Modal>

          <Modal
            visible={showCheckOutPicker}
            transparent
            animationType="slide"
            onRequestClose={cancelCheckOut}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text variant="bodyLargeSemiBold">Select Check-out Date</Text>
                </View>
                {checkIn && (
                  <DateTimePicker
                    value={tempCheckOutDate || new Date(checkIn.getTime() + 24 * 60 * 60 * 1000)}
                    mode="date"
                    display="spinner"
                    onChange={handleCheckOutChange}
                    minimumDate={new Date(checkIn.getTime() + 24 * 60 * 60 * 1000)}
                    textColor={theme.colors.text}
                    style={styles.picker}
                  />
                )}
                <View style={styles.buttonContainer}>
                  <Button variant="outlined" size="medium" onPress={cancelCheckOut} style={styles.button}>
                    Cancel
                  </Button>
                  <Button variant="filled" size="medium" onPress={confirmCheckOut} style={styles.button}>
                    Confirm
                  </Button>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}

      {/* Android Date Pickers */}
      {Platform.OS === "android" && (
        <>
          {showCheckInPicker && (
            <DateTimePicker
              value={tempCheckInDate || minimumDate}
              mode="date"
              display="default"
              onChange={handleCheckInChange}
              minimumDate={minimumDate}
            />
          )}

          {showCheckOutPicker && checkIn && (
            <DateTimePicker
              value={tempCheckOutDate || new Date(checkIn.getTime() + 24 * 60 * 60 * 1000)}
              mode="date"
              display="default"
              onChange={handleCheckOutChange}
              minimumDate={new Date(checkIn.getTime() + 24 * 60 * 60 * 1000)}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  dateContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  dateButton: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    minHeight: ms(80),
  },
  dateButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  iconContainer: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: theme.colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  dateTextContainer: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  picker: {
    width: "100%",
    height: ms(200),
  },
  buttonContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  button: {
    flex: 1,
  },
}));
