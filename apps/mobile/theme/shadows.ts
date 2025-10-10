import { Platform } from "react-native";

const createShadow = (
  elevation: number,
  shadowColor: string = "#000000",
  opacity: number = 0.2
) => {
  if (Platform.OS === "android") {
    return {
      elevation,
      shadowColor,
    };
  }

  // iOS shadow calculation based on elevation
  const shadowOffset = {
    width: 0,
    height: elevation * 0.5,
  };
  const shadowRadius = elevation * 0.8;
  const shadowOpacity = Math.min(opacity, 1);

  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation,
  };
};

export const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  xs: createShadow(1, "#000000", 0.05),
  sm: createShadow(2, "#000000", 0.08),
  md: createShadow(4, "#000000", 0.10),
  lg: createShadow(8, "#000000", 0.12),
  xl: createShadow(12, "#000000", 0.14),
  xxl: createShadow(16, "#000000", 0.16),
  xxxl: createShadow(24, "#000000", 0.18),

  // Specific use cases
  card: createShadow(4, "#000000", 0.10),
  button: createShadow(2, "#000000", 0.08),
  buttonPressed: createShadow(1, "#000000", 0.05),
  modal: createShadow(24, "#000000", 0.25),
  dropdown: createShadow(8, "#000000", 0.15),
  navbar: createShadow(4, "#000000", 0.10),
  fab: createShadow(12, "#000000", 0.20),

  // Colored shadows
  primary: createShadow(8, "#007AFF", 0.25),
  success: createShadow(8, "#34C759", 0.25),
  error: createShadow(8, "#FF3B30", 0.25),
  warning: createShadow(8, "#FF9500", 0.25),

  // Inset shadows (for depth effect)
  insetSm: Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: -1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    },
    android: {
      elevation: -2,
    },
    default: {},
  }),

  insetMd: Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    android: {
      elevation: -4,
    },
    default: {},
  }),
} as const;

// Light theme shadows
export const lightShadows = {
  ...shadows,
  // Override specific shadows for light theme if needed
} as const;

// Dark theme shadows (typically more subtle)
export const darkShadows = {
  none: shadows.none,
  xs: createShadow(1, "#000000", 0.15),
  sm: createShadow(2, "#000000", 0.20),
  md: createShadow(4, "#000000", 0.25),
  lg: createShadow(8, "#000000", 0.30),
  xl: createShadow(12, "#000000", 0.35),
  xxl: createShadow(16, "#000000", 0.40),
  xxxl: createShadow(24, "#000000", 0.45),

  card: createShadow(4, "#000000", 0.25),
  button: createShadow(2, "#000000", 0.20),
  buttonPressed: createShadow(1, "#000000", 0.15),
  modal: createShadow(24, "#000000", 0.50),
  dropdown: createShadow(8, "#000000", 0.35),
  navbar: createShadow(4, "#000000", 0.25),
  fab: createShadow(12, "#000000", 0.40),

  // Colored shadows for dark theme
  primary: createShadow(8, "#0A84FF", 0.35),
  success: createShadow(8, "#32D74B", 0.35),
  error: createShadow(8, "#FF453A", 0.35),
  warning: createShadow(8, "#FF9F0A", 0.35),

  insetSm: shadows.insetSm,
  insetMd: shadows.insetMd,
} as const;

// Shadow utilities
export const shadowUtils = {
  // Combine multiple shadows (iOS only)
  combine: (...shadowStyles: any[]) => {
    if (Platform.OS !== "ios") {
      // Android doesn't support multiple shadows, return the last one
      return shadowStyles[shadowStyles.length - 1];
    }

    // For iOS, we can layer shadows
    return shadowStyles.reduce((acc, shadow) => ({
      ...acc,
      ...shadow,
    }), {});
  },

  // Create custom shadow
  custom: createShadow,

  // Get shadow by elevation level
  byElevation: (elevation: number) => createShadow(elevation),
} as const;

export type Shadows = typeof shadows;
export type ShadowKey = keyof Shadows;