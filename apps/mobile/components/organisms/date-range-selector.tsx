import React, { useRef, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar1 } from "iconsax-react-native";
import { Text } from "../atoms/text";
import { ms } from "@/utils/scaling";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { CustomBottomSheet } from "../molecules/bottom-sheet";

export interface DateRangeSelectorProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onCheckInChange: (date: Date) => void;
  onCheckOutChange: (date: Date) => void;
  minimumDate?: Date;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  minimumDate = new Date(),
}) => {
  const { theme } = useUnistyles();
  const checkInBottomSheetRef = useRef<BottomSheetModal>(null);
  const checkOutBottomSheetRef = useRef<BottomSheetModal>(null);
  const [tempCheckInDate, setTempCheckInDate] = useState<Date | null>(null);
  const [tempCheckOutDate, setTempCheckOutDate] = useState<Date | null>(null);

  const formatDate = (date: Date | null) => {
    if (!date) return "Select date";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleCheckInChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempCheckInDate(selectedDate);
    }
  };

  const handleCheckOutChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempCheckOutDate(selectedDate);
    }
  };

  const confirmCheckIn = () => {
    if (tempCheckInDate) {
      onCheckInChange(tempCheckInDate);
      // If check-out is before new check-in, reset it
      if (checkOut && tempCheckInDate >= checkOut) {
        const newCheckOut = new Date(tempCheckInDate);
        newCheckOut.setDate(newCheckOut.getDate() + 1);
        onCheckOutChange(newCheckOut);
      }
    }
    checkInBottomSheetRef.current?.dismiss();
    setTempCheckInDate(null);
  };

  const confirmCheckOut = () => {
    if (tempCheckOutDate) {
      onCheckOutChange(tempCheckOutDate);
    }
    checkOutBottomSheetRef.current?.dismiss();
    setTempCheckOutDate(null);
  };

  const cancelCheckIn = () => {
    checkInBottomSheetRef.current?.dismiss();
    setTempCheckInDate(null);
  };

  const cancelCheckOut = () => {
    checkOutBottomSheetRef.current?.dismiss();
    setTempCheckOutDate(null);
  };

  const openCheckInPicker = () => {
    setTempCheckInDate(checkIn || minimumDate);
    checkInBottomSheetRef.current?.present();
  };

  const openCheckOutPicker = () => {
    setTempCheckOutDate(checkOut || new Date((checkIn || minimumDate).getTime() + 24 * 60 * 60 * 1000));
    checkOutBottomSheetRef.current?.present();
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
        <TouchableOpacity style={styles.dateButton} onPress={openCheckInPicker} activeOpacity={0.7}>
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
          onPress={openCheckOutPicker}
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

      {/* Bottom Sheets */}
      <CustomBottomSheet ref={checkInBottomSheetRef} enableDynamicSizing>
        <View style={styles.bottomSheetContent}>
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
            <TouchableOpacity style={styles.cancelButton} onPress={cancelCheckIn}>
              <Text variant="bodyMediumSemiBold" color="textSecondary">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={confirmCheckIn}>
              <Text variant="bodyMediumSemiBold" color="background">
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomBottomSheet>

      <CustomBottomSheet ref={checkOutBottomSheetRef} enableDynamicSizing>
        <View style={styles.bottomSheetContent}>
          {checkIn && (
            <DateTimePicker
              value={tempCheckOutDate || new Date(checkIn.getTime() + 24 * 60 * 60 * 1000)}
              mode="date"
              display="spinner"
              style={styles.picker}
              textColor={theme.colors.text}
              onChange={handleCheckOutChange}
              minimumDate={new Date(checkIn.getTime() + 24 * 60 * 60 * 1000)}
            />
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelCheckOut}>
              <Text variant="bodyMediumSemiBold" color="textSecondary">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={confirmCheckOut}>
              <Text variant="bodyMediumSemiBold" color="background">
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </CustomBottomSheet>
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
  bottomSheetContent: {
    width: "100%",
    paddingBottom: theme.spacing.md,
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
  cancelButton: {
    flex: 1,
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.border,
  },
  confirmButton: {
    flex: 1,
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
}));
