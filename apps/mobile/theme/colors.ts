export const palette = {
  // Primary Colors
  primary50: "#F5F5F5",
  primary100: "#E0E0E0",
  primary500: "#0B0B0B",
  primary900: "#000000",

  // Neutral Colors
  neutral0: "#FFFFFF",
  neutral50: "#F5F5F5",
  neutral100: "#E0E0E0",
  neutral200: "#D6D6D6",
  neutral300: "#C2C2C2",
  neutral500: "#606060",
  neutral600: "#878787",
  neutral700: "#3B3B3B",
  neutral800: "#101010",
  neutral950: "#050505",

  // Warning Colors
  warning50: "#FFF6D8",
  warning100: "#FFF0D8",
  warning200: "#FFEEBE",
  warning500: "#FFD53C",
  warning700: "#D9A012",
  warning900: "#9D6A1E",

  // Success Colors
  success50: "#DCF5E7",
  success100: "#F3FFF8",
  success200: "#C9E6D8",
  success500: "#50CD89",
  success700: "#469377",
  success900: "#356236",

  // Error Colors
  error50: "#FCD0D9",
  error100: "#FFF5F2",
  error200: "#F4C0C0",
  error500: "#F53641",
  error700: "#D9343A",
  error900: "#901A2A",

  // Info Colors
  info50: "#D2F5FF",
  info100: "#D4E4FF",
  info200: "#B7D0FF",
  info500: "#1C79FF",
  info700: "#3D7FD4",
  info900: "#1F4C80",

  // Dark Mode Colors
  dark50: "#F0F0FD",
  dark100: "#F2F4F7",
  dark200: "#EAEFD5",
  dark400: "#667085",
  dark500: "#475467",
  dark600: "#44454B",
  dark700: "#182230",
  dark800: "#101828",
  dark900: "#0C111D",

  // Base
  transparent: "transparent",
} as const;

export const lightColors = {
  // Primary
  primary: palette.primary500,
  primaryLight: palette.primary100,
  primaryDark: palette.primary900,
  onPrimary: palette.neutral0,

  // Secondary
  secondary: palette.neutral950,
  secondaryLight: palette.neutral600,
  secondaryDark: palette.neutral800,
  onSecondary: palette.neutral0,

  // Background
  background: palette.neutral0,
  backgroundAlt: palette.neutral50,
  surface: palette.neutral0,
  surfaceVariant: palette.primary50,

  // Text
  text: palette.neutral950,
  textPrimary: palette.neutral950,
  textSecondary: palette.neutral600,
  textDisabled: palette.neutral500,
  textHint: palette.neutral300,

  // Borders
  border: palette.neutral100,
  borderLight: palette.neutral200,
  borderFocus: palette.primary500,

  // Status Colors
  error: palette.error500,
  error50: palette.error50,
  error100: palette.error100,
  error200: palette.error200,
  error700: palette.error700,
  error900: palette.error900,

  success: palette.success500,
  success50: palette.success50,
  success100: palette.success100,
  success200: palette.success200,
  success700: palette.success700,
  success900: palette.success900,

  neutral0: palette.neutral0,
  neutral50: palette.neutral50,
  neutral100: palette.neutral100,
  neutral200: palette.neutral200,
  neutral300: palette.neutral300,
  neutral500: palette.neutral500,
  neutral600: palette.neutral600,
  neutral700: palette.neutral700,
  neutral800: palette.neutral800,
  neutral950: palette.neutral950,

  warning: palette.warning500,
  warning50: palette.warning50,
  warning100: palette.warning100,
  warning200: palette.warning200,
  warning700: palette.warning700,
  warning900: palette.warning900,

  info: palette.info500,
  info50: palette.info50,
  info100: palette.info100,
  info200: palette.info200,
  info700: palette.info700,
  info900: palette.info900,

  // Other
  divider: palette.neutral100,
  overlay: "rgba(0, 0, 0, 0.5)",
  scrim: "rgba(0, 0, 0, 0.32)",
} as const;

export const darkColors = {
  // Primary
  primary: palette.primary100,
  primaryLight: palette.primary500,
  primaryDark: palette.primary900,
  onPrimary: palette.dark900,

  // Secondary
  secondary: palette.dark50,
  secondaryLight: palette.dark100,
  secondaryDark: palette.dark200,
  onSecondary: palette.dark900,

  // Background
  background: palette.dark900,
  backgroundAlt: palette.dark800,
  surface: palette.dark700,
  surfaceVariant: palette.dark600,

  // Text
  text: palette.neutral0,
  textPrimary: palette.neutral0,
  textSecondary: palette.dark400,
  textDisabled: palette.dark500,
  textHint: palette.dark400,

  // Borders
  border: palette.dark600,
  borderLight: palette.dark700,
  borderFocus: palette.primary100,

  // Status Colors
  error: palette.error500,
  error50: palette.error50,
  error100: palette.error100,
  error200: palette.error200,
  error700: palette.error700,
  error900: palette.error900,

  success: palette.success500,
  success50: palette.success50,
  success100: palette.success100,
  success200: palette.success200,
  success700: palette.success700,
  success900: palette.success900,

  neutral0: palette.neutral0,
  neutral50: palette.neutral50,
  neutral100: palette.neutral100,
  neutral200: palette.neutral200,
  neutral300: palette.neutral300,
  neutral500: palette.neutral500,
  neutral600: palette.neutral600,
  neutral700: palette.neutral700,
  neutral800: palette.neutral800,
  neutral950: palette.neutral950,

  warning: palette.warning500,
  warning50: palette.warning50,
  warning100: palette.warning100,
  warning200: palette.warning200,
  warning700: palette.warning700,
  warning900: palette.warning900,

  info: palette.info500,
  info50: palette.info50,
  info100: palette.info100,
  info200: palette.info200,
  info700: palette.info700,
  info900: palette.info900,

  // Other
  divider: palette.dark600,
  overlay: "rgba(0, 0, 0, 0.7)",
  scrim: "rgba(0, 0, 0, 0.5)",
} as const;

export type ColorScheme = typeof lightColors;
