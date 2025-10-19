import { ms } from "@/utils/scaling";
import { getIconComponent } from "@/utils/icon-mapper";
import React from "react";
import { View, ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { AmenityChip } from "./amenity-chip";

// Support both old amenity format and new catalog format
export interface Amenity {
  /** Amenity ID (old format) */
  _id?: string;
  /** Amenity key/value (e.g., 'wifi', 'parking') */
  key?: string;
  /** Display name (localized) - object with language keys (old format) */
  name?: string | { en: string; fr: string; ar: string };
  /** Icon name from backend */
  icon?: string;
  /** Catalog format: label */
  label?: string;
  /** Catalog format: value */
  value?: string;
  /** Catalog format: description (localized) */
  description?: string;
}

export interface AmenitiesGridProps {
  /** List of available amenities from API (supports both old and catalog formats) */
  amenities: Amenity[];
  /** Selected amenity IDs or keys */
  selectedAmenities: string[];
  /** Callback when selection changes */
  onChange: (amenities: string[]) => void;
  /** Optional custom styling */
  style?: ViewStyle;
}

/**
 * Helper function to extract localized name from amenity
 * Supports both old format (name) and new catalog format (label)
 * @param amenity - Amenity object with name or label
 * @returns Localized string (defaults to English)
 */
const getLocalizedName = (amenity: Amenity): string => {
  // New catalog format: use label directly
  if (amenity.label) {
    return amenity.label;
  }

  // Old format: use name
  if (!amenity.name) {
    return "";
  }

  // If it's already a string, return it
  if (typeof amenity.name === "string") {
    return amenity.name;
  }
  // If it's an i18n object, return English for now
  // TODO: Use user's locale preference from context
  return amenity.name.en || amenity.name.fr || amenity.name.ar || "";
};

/**
 * AmenitiesGrid Component
 *
 * Displays a grid of amenity chips with icons from the backend.
 * Icons are dynamically mapped using the icon-mapper utility.
 * Supports both old amenity format and new catalog format.
 */
export const AmenitiesGrid: React.FC<AmenitiesGridProps> = ({ amenities, selectedAmenities, onChange, style }) => {
  const { theme } = useUnistyles();

  const toggleAmenity = (amenityId: string) => {
    if (selectedAmenities.includes(amenityId)) {
      onChange(selectedAmenities.filter((a) => a !== amenityId));
    } else {
      onChange([...selectedAmenities, amenityId]);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.grid}>
        {amenities?.map((amenity) => {
          // Support both old format (_id, key) and new catalog format (value)
          const amenityId = amenity.value || amenity._id || amenity.key || "";
          const isSelected = selectedAmenities.includes(amenityId);
          const IconComponent = getIconComponent(amenity.icon);
          const displayName = getLocalizedName(amenity);

          return (
            <AmenityChip
              key={amenityId}
              label={displayName}
              icon={
                <IconComponent
                  size={ms(16)}
                  color={isSelected ? theme.colors.primary : theme.colors.neutral600}
                  variant={isSelected ? "Bold" : "Outline"}
                />
              }
              selected={isSelected}
              onPress={() => toggleAmenity(amenityId)}
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
}));
