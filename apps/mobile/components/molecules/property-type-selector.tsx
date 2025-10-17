import { ms } from "@/utils/scaling";
import React from "react";
import { View, ViewStyle, ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Home, House, Building, DocumentText } from "iconsax-react-native";
import { SelectionCard } from "./selection-card";
import { Text } from "../atoms/text";

export interface PropertyTypeSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
}

const PROPERTY_TYPES = [
  {
    value: "apartment",
    label: "Apartment",
    description: "A place within a building",
    icon: Building,
  },
  {
    value: "house",
    label: "House",
    description: "A standalone property",
    icon: House,
  },
  {
    value: "villa",
    label: "Villa",
    description: "Luxury residential home",
    icon: Home,
  },
  {
    value: "condo",
    label: "Condominium",
    description: "Owned apartment unit",
    icon: Building,
  },
  {
    value: "studio",
    label: "Studio",
    description: "Open-plan living space",
    icon: DocumentText,
  },
];

export const PropertyTypeSelector: React.FC<PropertyTypeSelectorProps> = ({
  value,
  onChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {PROPERTY_TYPES.map((type) => {
        const IconComponent = type.icon;
        return (
          <SelectionCard
            key={type.value}
            title={type.label}
            description={type.description}
            icon={
              <IconComponent
                size={ms(24)}
                color={value === type.value ? styles.iconSelected.color : styles.icon.color}
                variant={value === type.value ? "Bold" : "Outline"}
              />
            }
            selected={value === type.value}
            onPress={() => onChange(type.value)}
          />
        );
      })}
    </View>
  );
};

export interface RoomTypeSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
}

const ROOM_TYPES = [
  {
    value: "entire_place",
    label: "Entire place",
    description: "Guests have the whole place to themselves",
  },
  {
    value: "private_room",
    label: "Private room",
    description: "Guests have their own room in a shared space",
  },
  {
    value: "shared_room",
    label: "Shared room",
    description: "Guests sleep in a room with others",
  },
];

export const RoomTypeSelector: React.FC<RoomTypeSelectorProps> = ({
  value,
  onChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {ROOM_TYPES.map((type) => (
        <SelectionCard
          key={type.value}
          title={type.label}
          description={type.description}
          selected={value === type.value}
          onPress={() => onChange(type.value)}
        />
      ))}
    </View>
  );
};

export interface BedTypeSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
}

const BED_TYPES = [
  { value: "king", label: "King", description: "76 x 80 inches" },
  { value: "queen", label: "Queen", description: "60 x 80 inches" },
  { value: "double", label: "Double", description: "54 x 75 inches" },
  { value: "single", label: "Single", description: "39 x 75 inches" },
  { value: "sofa_bed", label: "Sofa bed", description: "Convertible furniture" },
  { value: "bunk_bed", label: "Bunk bed", description: "Stacked beds" },
];

export const BedTypeSelector: React.FC<BedTypeSelectorProps> = ({
  value,
  onChange,
  style,
}) => {
  return (
    <ScrollView
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {BED_TYPES.map((type) => (
        <SelectionCard
          key={type.value}
          title={type.label}
          description={type.description}
          selected={value === type.value}
          onPress={() => onChange(type.value)}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    // Container styles
  },
  icon: {
    color: theme.colors.neutral600,
  },
  iconSelected: {
    color: theme.colors.primary,
  },
}));
