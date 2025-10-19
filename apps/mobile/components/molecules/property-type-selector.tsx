import { ms } from "@/utils/scaling";
import React from "react";
import { View, ViewStyle, ScrollView } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Home, House, Building, DocumentText } from "iconsax-react-native";
import { SelectionCard } from "./selection-card";
import { Text } from "../atoms/text";
import { useCatalogOptions } from "@/contexts";

export interface PropertyTypeSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
}

// Icon mapping for property types
const PROPERTY_TYPE_ICONS: Record<string, any> = {
  building: Building,
  home: Home,
  house: House,
  document: DocumentText,
};

export const PropertyTypeSelector: React.FC<PropertyTypeSelectorProps> = ({
  value,
  onChange,
  style,
}) => {
  const propertyTypes = useCatalogOptions('PropertyType');

  return (
    <View style={[styles.container, style]}>
      {propertyTypes.map((type) => {
        const IconComponent = type.icon ? PROPERTY_TYPE_ICONS[type.icon] : null;

        return (
          <SelectionCard
            key={type.value}
            title={type.label}
            description={type.description}
            icon={
              IconComponent ? (
                <IconComponent
                  size={ms(24)}
                  color={value === type.value ? styles.iconSelected.color : styles.icon.color}
                  variant={value === type.value ? "Bold" : "Outline"}
                />
              ) : undefined
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

export const RoomTypeSelector: React.FC<RoomTypeSelectorProps> = ({
  value,
  onChange,
  style,
}) => {
  const roomTypes = useCatalogOptions('RoomType');

  return (
    <View style={[styles.container, style]}>
      {roomTypes.map((type) => (
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

export const BedTypeSelector: React.FC<BedTypeSelectorProps> = ({
  value,
  onChange,
  style,
}) => {
  const bedTypes = useCatalogOptions('BedType');

  return (
    <ScrollView
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {bedTypes.map((type) => (
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
