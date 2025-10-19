import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { CounterInput } from "../molecules/counter-input";
import { Text } from "../atoms/text";
import type { GuestInfo } from "@/contexts";

export interface GuestSelectorProps {
  guests: GuestInfo;
  maxCapacity?: number;
  onGuestsChange: (guests: GuestInfo) => void;
}

export const GuestSelector: React.FC<GuestSelectorProps> = ({ guests, maxCapacity = 16, onGuestsChange }) => {
  const handleAdultsChange = (value: number) => {
    const newGuests = {
      ...guests,
      adults: value,
      totalGuests: value + guests.children + guests.infants,
    };
    onGuestsChange(newGuests);
  };

  const handleChildrenChange = (value: number) => {
    const newGuests = {
      ...guests,
      children: value,
      totalGuests: guests.adults + value + guests.infants,
    };
    onGuestsChange(newGuests);
  };

  const handleInfantsChange = (value: number) => {
    const newGuests = {
      ...guests,
      infants: value,
      totalGuests: guests.adults + guests.children + value,
    };
    onGuestsChange(newGuests);
  };

  return (
    <View style={styles.container}>
      <Text variant="bodyLargeSemiBold" style={styles.title}>
        Guests
      </Text>

      <View style={styles.countersContainer}>
        <CounterInput
          label="Adults"
          description="Ages 13 or above"
          value={guests.adults}
          min={1}
          max={Math.min(maxCapacity, 16)}
          onIncrement={() => handleAdultsChange(guests.adults + 1)}
          onDecrement={() => handleAdultsChange(guests.adults - 1)}
        />

        <CounterInput
          label="Children"
          description="Ages 2-12"
          value={guests.children}
          min={0}
          max={Math.min(maxCapacity - guests.adults - guests.infants, 8)}
          onIncrement={() => handleChildrenChange(guests.children + 1)}
          onDecrement={() => handleChildrenChange(guests.children - 1)}
        />

        <CounterInput
          label="Infants"
          description="Under 2"
          value={guests.infants}
          min={0}
          max={Math.min(maxCapacity - guests.adults - guests.children, 5)}
          onIncrement={() => handleInfantsChange(guests.infants + 1)}
          onDecrement={() => handleInfantsChange(guests.infants - 1)}
          style={styles.lastCounter}
        />
      </View>

      {guests.totalGuests > maxCapacity && (
        <View style={styles.errorContainer}>
          <Text variant="bodySmallRegular" color="error">
            Maximum {maxCapacity} guests allowed for this property
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  title: {
    marginBottom: theme.spacing.md,
  },
  countersContainer: {
    gap: theme.spacing.xs,
  },
  lastCounter: {
    borderBottomWidth: 0,
  },
  errorContainer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.errorLight || "#FFEBEE",
    borderRadius: theme.borderRadius.sm,
  },
}));
