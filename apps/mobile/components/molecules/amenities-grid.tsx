import { ms } from "@/utils/scaling";
import React from "react";
import { View, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
  Wifi,
  Car,
  Activity,
  Coffee,
  Airpods,
  Wind,
  Alarm,
  SecuritySafe,
  Video,
  Monitor,
  Pet,
  Archive,
  Airdrop,
} from "iconsax-react-native";
import { AmenityChip } from "./amenity-chip";

export interface AmenitiesGridProps {
  selectedAmenities: string[];
  onChange: (amenities: string[]) => void;
  style?: ViewStyle;
}

const AMENITIES = [
  { value: "wifi", label: "WiFi", icon: Wifi },
  { value: "parking", label: "Free parking", icon: Car },
  { value: "pool", label: "Pool", icon: Activity },
  { value: "kitchen", label: "Kitchen", icon: Coffee },
  { value: "washer", label: "Washer", icon: Airpods },
  { value: "air_conditioning", label: "Air conditioning", icon: Wind },
  { value: "heating", label: "Heating", icon: Alarm },
  { value: "security", label: "Security cameras", icon: SecuritySafe },
  { value: "tv", label: "TV", icon: Video },
  { value: "workspace", label: "Workspace", icon: Monitor },
  { value: "pets_allowed", label: "Pets allowed", icon: Pet },
  { value: "family_friendly", label: "Family friendly", icon: Archive },
  { value: "accessible", label: "Wheelchair accessible", icon: Airdrop },
];

export const AmenitiesGrid: React.FC<AmenitiesGridProps> = ({ selectedAmenities, onChange, style }) => {
  const toggleAmenity = (amenityValue: string) => {
    if (selectedAmenities.includes(amenityValue)) {
      onChange(selectedAmenities.filter((a) => a !== amenityValue));
    } else {
      onChange([...selectedAmenities, amenityValue]);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.grid}>
        {AMENITIES.map((amenity) => {
          const IconComponent = amenity.icon;
          const isSelected = selectedAmenities.includes(amenity.value);

          return (
            <AmenityChip
              key={amenity.value}
              label={amenity.label}
              icon={
                <IconComponent
                  size={ms(16)}
                  color={isSelected ? styles.iconSelected.color : styles.icon.color}
                  variant={isSelected ? "Bold" : "Outline"}
                />
              }
              selected={isSelected}
              onPress={() => toggleAmenity(amenity.value)}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    // Container styles
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  icon: {
    color: theme.colors.neutral600,
  },
  iconSelected: {
    color: theme.colors.primary,
  },
}));
