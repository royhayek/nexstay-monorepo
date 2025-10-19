import React from "react";
import * as IconsaxIcons from "iconsax-react-native";

/**
 * Icon Mapper Utility
 *
 * This utility dynamically maps icon name strings (from backend) to Iconsax React Native components.
 * The backend controls which icons are used for amenities, categories, and other features.
 *
 * Usage:
 * ```tsx
 * import { getIconComponent } from '@/utils/icon-mapper';
 *
 * const WifiIcon = getIconComponent('wifi');
 * <WifiIcon size={24} color="#000" variant="Outline" />
 * ```
 */

// Type for Iconsax icon component
type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  variant?: "Bold" | "Broken" | "Bulk" | "Linear" | "Outline" | "TwoTone";
}>;

// Map of icon name strings to Iconsax components
// This should match the icon names used in the backend
const ICON_MAP: Record<string, IconComponent> = {
  // Connectivity & Tech
  wifi: IconsaxIcons.Wifi,
  bluetooth: IconsaxIcons.Bluetooth,
  wifi_square: IconsaxIcons.WifiSquare,

  // Transportation & Parking
  car: IconsaxIcons.Car,
  parking: IconsaxIcons.Car,
  bicycle: IconsaxIcons.Driving,

  // Entertainment & Activities
  activity: IconsaxIcons.Activity,
  pool: IconsaxIcons.Activity,
  game: IconsaxIcons.Game,
  music: IconsaxIcons.MusicSquare,
  video: IconsaxIcons.Video,
  tv: IconsaxIcons.Monitor,

  // Kitchen & Dining
  coffee: IconsaxIcons.Coffee,
  kitchen: IconsaxIcons.Coffee,
  cup: IconsaxIcons.Cup,

  // Climate Control
  wind: IconsaxIcons.Wind,
  air_conditioning: IconsaxIcons.Wind,
  ac: IconsaxIcons.Wind,
  heating: IconsaxIcons.Lamp,
  fan: IconsaxIcons.Wind,

  // Security & Safety
  security: IconsaxIcons.SecuritySafe,
  security_safe: IconsaxIcons.SecuritySafe,
  shield: IconsaxIcons.Shield,
  lock: IconsaxIcons.Lock,
  camera: IconsaxIcons.Camera,
  alarm: IconsaxIcons.Alarm,

  // Appliances & Amenities
  washer: IconsaxIcons.Airpods,
  dryer: IconsaxIcons.Airpods,
  iron: IconsaxIcons.Archive,

  // Work & Productivity
  monitor: IconsaxIcons.Monitor,
  workspace: IconsaxIcons.Monitor,
  laptop: IconsaxIcons.Monitor,
  printer: IconsaxIcons.Printer,

  // Pets & Family
  pet: IconsaxIcons.Pet,
  pets_allowed: IconsaxIcons.Pet,
  family_friendly: IconsaxIcons.People,
  baby: IconsaxIcons.Baby,

  // Accessibility
  accessible: IconsaxIcons.Airdrop,
  wheelchair: IconsaxIcons.Airdrop,
  elevator: IconsaxIcons.ArrowUp,

  // Outdoor & Nature
  tree: IconsaxIcons.Tree,
  garden: IconsaxIcons.Tree,
  terrace: IconsaxIcons.Home,
  balcony: IconsaxIcons.Home,

  // Bathroom
  bath: IconsaxIcons.Drop,
  shower: IconsaxIcons.Drop,
  towel: IconsaxIcons.Archive,

  // Bedroom
  bed: IconsaxIcons.Archive,
  pillow: IconsaxIcons.Archive,

  // General
  star: IconsaxIcons.Star,
  heart: IconsaxIcons.Heart,
  home: IconsaxIcons.Home,
  building: IconsaxIcons.Building,
  location: IconsaxIcons.Location,
  calendar: IconsaxIcons.Calendar,
  clock: IconsaxIcons.Clock,
  info: IconsaxIcons.InfoCircle,
  check: IconsaxIcons.TickCircle,
  close: IconsaxIcons.CloseCircle,

  // Add more mappings as needed when backend adds new amenities
};

/**
 * Get an icon component by name
 *
 * @param iconName - The icon name from the backend (e.g., 'wifi', 'parking')
 * @returns The Iconsax icon component, or a fallback info icon if not found
 *
 * @example
 * ```tsx
 * const WifiIcon = getIconComponent('wifi');
 * <WifiIcon size={24} color="#000" variant="Outline" />
 * ```
 */
export const getIconComponent = (iconName?: string | null): IconComponent => {
  if (!iconName) {
    return IconsaxIcons.InfoCircle; // Fallback for null/undefined
  }

  const normalizedName = iconName.toLowerCase().trim();
  return ICON_MAP[normalizedName] || IconsaxIcons.InfoCircle; // Fallback if not found
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
 * Check if an icon exists in the map
 *
 * @param iconName - The icon name to check
 * @returns true if icon exists, false otherwise
 */
export const hasIcon = (iconName?: string | null): boolean => {
  if (!iconName) return false;
  const normalizedName = iconName.toLowerCase().trim();
  return normalizedName in ICON_MAP;
};

/**
 * Get all available icon names
 *
 * @returns Array of all available icon names
 */
export const getAvailableIcons = (): string[] => {
  return Object.keys(ICON_MAP);
};
