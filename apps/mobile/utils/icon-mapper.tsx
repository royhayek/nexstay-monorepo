import React from "react";
import * as IconsaxIcons from "iconsax-react-native";

/**
 * Icon Mapper Utility
 *
 * This utility dynamically maps icon componentName strings (from backend) to Iconsax React Native components.
 * The backend sends the exact Iconsax componentName (e.g., "Wifi", "Car", "Monitor") which matches
 * the iconsax-react-native package exports, so we can access them directly without manual mapping.
 *
 * Usage:
 * ```tsx
 * import { getIconComponent } from '@/utils/icon-mapper';
 *
 * const WifiIcon = getIconComponent('Wifi:Linear');
 * <WifiIcon size={24} color="#000" variant="Linear" />
 * ```
 */

// Type for Iconsax icon component
type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  variant?: "Bold" | "Broken" | "Bulk" | "Linear" | "Outline" | "TwoTone";
}>;

/**
 * Get an icon component by componentName
 *
 * @param iconName - The icon componentName from the backend (e.g., 'Wifi', 'Car', 'Wifi:Linear')
 * @returns The Iconsax icon component, or a fallback info icon if not found
 *
 * @example
 * ```tsx
 * // Backend sends: "Wifi:Linear"
 * const WifiIcon = getIconComponent('Wifi:Linear');
 * <WifiIcon size={24} color="#000" variant="Linear" />
 *
 * // Backend sends: "Car:Bold"
 * const CarIcon = getIconComponent('Car:Bold');
 * <CarIcon size={24} color="#000" variant="Bold" />
 * ```
 */
export const getIconComponent = (iconName?: string | null): IconComponent => {
  if (!iconName) {
    return IconsaxIcons.InfoCircle; // Fallback for null/undefined
  }

  // Extract componentName, removing variant suffix if present (e.g., "Wifi:Linear" -> "Wifi")
  const componentName = iconName.split(':')[0].trim();

  // Access the icon component dynamically from iconsax-react-native
  // componentName matches exactly with the package exports (e.g., "Wifi", "Car", "Monitor")
  const IconComponent = (IconsaxIcons as any)[componentName];

  // Return the component or fallback to InfoCircle
  return IconComponent || IconsaxIcons.InfoCircle;
};

/**
 * Render an icon by name
 *
 * @param iconName - The icon name from the backend
 * @param props - Icon props (size, color, variant)
 * @returns React element with the icon
 *
 * @example
 * ```tsx
 * {renderIcon('wifi', { size: 24, color: '#000', variant: 'Outline' })}
 * ```
 */
export const renderIcon = (
  iconName?: string | null,
  props?: {
    size?: number;
    color?: string;
    variant?: "Bold" | "Broken" | "Bulk" | "Linear" | "Outline" | "TwoTone";
  }
) => {
  const IconComponent = getIconComponent(iconName);
  return <IconComponent {...props} />;
};

/**
 * Check if an icon exists in iconsax-react-native
 *
 * @param iconName - The icon componentName to check (with or without variant)
 * @returns true if icon exists, false otherwise
 *
 * @example
 * ```tsx
 * hasIcon('Wifi')        // true
 * hasIcon('Wifi:Linear') // true
 * hasIcon('InvalidIcon') // false
 * ```
 */
export const hasIcon = (iconName?: string | null): boolean => {
  if (!iconName) return false;
  const componentName = iconName.split(':')[0].trim();
  return componentName in IconsaxIcons;
};

/**
 * Get all available icon componentNames from iconsax-react-native
 *
 * @returns Array of all available icon componentNames
 */
export const getAvailableIcons = (): string[] => {
  return Object.keys(IconsaxIcons);
};
