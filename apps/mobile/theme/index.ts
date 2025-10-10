import { borderRadius, borderUtils, borderWidth, componentRadius } from "./borders";
import { darkColors, lightColors } from "./colors";
import { darkShadows, lightShadows } from "./shadows";
import { gaps, insets, layout, margins, paddings, spacing, spacingUtils } from "./spacing";
import { fontFamilies, fontSizes, fontWeights, letterSpacing, lineHeights, typography } from "./typography";

// Light theme composition
export const lightTheme = {
  colors: lightColors,
  typography,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  spacing,
  insets,
  gaps,
  margins,
  paddings,
  layout,
  shadows: lightShadows,
  borderRadius,
  borderWidth,
  componentRadius,
  // Utility functions
  utils: {
    spacing: spacingUtils,
    border: borderUtils,
  },
} as const;

// Dark theme composition
export const darkTheme = {
  ...lightTheme,
  colors: darkColors,
  shadows: darkShadows,
} as const;

// Export theme type
export type Theme = typeof lightTheme;
export type ThemeColors = typeof lightColors;
export type ThemeTypography = typeof typography;
export type ThemeSpacing = typeof spacing;
export type ThemeShadows = typeof lightShadows;
export type ThemeBorders = typeof borderRadius;

// Export all theme-related types
export * from "./borders";
export * from "./colors";
export * from "./shadows";
export * from "./spacing";
export * from "./typography";
