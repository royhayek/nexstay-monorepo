import { RFValue } from "@/utils/scaling";
import { Platform } from "react-native";

export const fontFamilies = {
  extraLight: "PlusJakartaSans_200ExtraLight",
  light: "PlusJakartaSans_300Light",
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extraBold: "PlusJakartaSans_800ExtraBold",
  mono: Platform.select({
    ios: "Courier New",
    android: "monospace",
    default: "monospace",
  }),
} as const;

export const fontSizes = {
  xxs: RFValue(10),
  xs: RFValue(12),
  sm: RFValue(14),
  base: RFValue(16),
  md: RFValue(18),
  lg: RFValue(24),
  xl: RFValue(32),
  xxl: RFValue(40),
  xxxl: RFValue(48),
  display1: RFValue(64),
  display2: RFValue(72),
  display3: RFValue(96),
} as const;

export const fontWeights = {
  thin: "100" as const,
  extraLight: "200" as const,
  light: "300" as const,
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extraBold: "800" as const,
  black: "900" as const,
} as const;

export const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
} as const;

export const letterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
  widest: 1,
} as const;

export const typography = {
  // Heading styles (matching Figma design)
  h1: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.display1,
    fontWeight: fontWeights.bold,
    lineHeight: Math.round(fontSizes.display1 * 1.15),
  },
  h1SemiBold: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.display1,
    fontWeight: fontWeights.semibold,
    lineHeight: Math.round(fontSizes.display1 * 1.15),
  },
  h1Medium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.display1,
    fontWeight: fontWeights.medium,
    lineHeight: Math.round(fontSizes.display1 * 1.15),
  },
  h1Regular: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.display1,
    fontWeight: fontWeights.regular,
    lineHeight: Math.round(fontSizes.display1 * 1.15),
  },

  h2: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.bold,
    lineHeight: Math.round(fontSizes.xxxl * 1.2),
  },
  h2SemiBold: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.semibold,
    lineHeight: Math.round(fontSizes.xxxl * 1.2),
  },
  h2Medium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.medium,
    lineHeight: Math.round(fontSizes.xxxl * 1.2),
  },
  h2Regular: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.regular,
    lineHeight: Math.round(fontSizes.xxxl * 1.2),
  },

  h3: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    lineHeight: Math.round(fontSizes.xxl * 1.25),
  },
  h3SemiBold: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.semibold,
    lineHeight: Math.round(fontSizes.xxl * 1.25),
  },
  h3Medium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.medium,
    lineHeight: Math.round(fontSizes.xxl * 1.25),
  },
  h3Regular: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.regular,
    lineHeight: Math.round(fontSizes.xxl * 1.25),
  },

  h4: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    lineHeight: Math.round(fontSizes.xl * 1.3),
  },
  h4SemiBold: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: Math.round(fontSizes.xl * 1.3),
  },
  h4Medium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.medium,
    lineHeight: Math.round(fontSizes.xl * 1.3),
  },
  h4Regular: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.regular,
    lineHeight: Math.round(fontSizes.xl * 1.3),
  },

  h5: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    lineHeight: Math.round(fontSizes.lg * 1.35),
  },
  h5SemiBold: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: Math.round(fontSizes.lg * 1.35),
  },
  h5Medium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: Math.round(fontSizes.lg * 1.35),
  },
  h5Regular: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.regular,
    lineHeight: Math.round(fontSizes.lg * 1.35),
  },

  h6: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    lineHeight: Math.round(fontSizes.md * 1.4),
  },
  h6SemiBold: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    lineHeight: Math.round(fontSizes.md * 1.4),
  },
  h6Medium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: Math.round(fontSizes.md * 1.4),
  },
  h6Regular: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    lineHeight: Math.round(fontSizes.md * 1.4),
  },

  // Body styles (matching Figma design)
  bodyLarge: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    lineHeight: Math.round(fontSizes.base * 1.5),
  },
  bodyLargeSemiBold: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    lineHeight: Math.round(fontSizes.base * 1.5),
  },
  bodyLargeMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: Math.round(fontSizes.base * 1.5),
  },
  bodyLargeRegular: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    lineHeight: Math.round(fontSizes.base * 1.5),
  },

  bodyMedium: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    lineHeight: Math.round(fontSizes.sm * 1.5),
  },
  bodyMediumSemiBold: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    lineHeight: Math.round(fontSizes.sm * 1.5),
  },
  bodyMediumMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: Math.round(fontSizes.sm * 1.5),
  },
  bodyMediumRegular: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: Math.round(fontSizes.sm * 1.5),
  },

  bodySmall: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    lineHeight: Math.round(fontSizes.xs * 1.5),
  },
  bodySmallSemiBold: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    lineHeight: Math.round(fontSizes.xs * 1.5),
  },
  bodySmallMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    lineHeight: Math.round(fontSizes.xs * 1.5),
  },
  bodySmallRegular: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: Math.round(fontSizes.xs * 1.5),
  },

  bodyXSmall: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xxs,
    fontWeight: fontWeights.bold,
    lineHeight: Math.round(fontSizes.xxs * 1.5),
  },
  bodyXSmallSemiBold: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.xxs,
    fontWeight: fontWeights.semibold,
    lineHeight: Math.round(fontSizes.xxs * 1.5),
  },
  bodyXSmallMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xxs,
    fontWeight: fontWeights.medium,
    lineHeight: Math.round(fontSizes.xxs * 1.5),
  },
  bodyXSmallRegular: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xxs,
    fontWeight: fontWeights.regular,
    lineHeight: Math.round(fontSizes.xxs * 1.5),
  },

  // Button text
  button: {
    fontFamily: fontFamilies.semibold,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    lineHeight: Math.round(fontSizes.base * 1.5),
  },

  // Caption
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: Math.round(fontSizes.xs * 1.5),
  },

  // Code
  code: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.regular,
    lineHeight: Math.round(fontSizes.sm * 1.5),
  },
} as const;

export type Typography = typeof typography;
export type TypographyVariant = keyof Typography;
