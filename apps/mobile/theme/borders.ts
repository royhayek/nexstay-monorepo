export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  base: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  round: 32,
  pill: 100,
  full: 9999,
} as const;

export const borderWidth = {
  none: 0,
  hairline: 0.5,
  thin: 1,
  base: 1.5,
  medium: 2,
  thick: 3,
  bold: 4,
} as const;

// Component-specific border radius presets
export const componentRadius = {
  // Buttons
  buttonSm: borderRadius.sm,
  buttonMd: borderRadius.md,
  buttonLg: borderRadius.base,
  buttonRound: borderRadius.full,

  // Cards
  card: borderRadius.lg,
  cardSm: borderRadius.md,
  cardLg: borderRadius.xl,

  // Inputs
  input: borderRadius.md,
  inputSm: borderRadius.sm,
  inputLg: borderRadius.base,

  // Modals & Sheets
  modal: borderRadius.xl,
  bottomSheet: borderRadius.xxl,
  dropdown: borderRadius.base,

  // Chips & Tags
  chip: borderRadius.pill,
  tag: borderRadius.sm,
  badge: borderRadius.full,

  // Images & Avatars
  avatar: borderRadius.full,
  avatarSm: borderRadius.full,
  avatarLg: borderRadius.full,
  thumbnail: borderRadius.md,
  image: borderRadius.base,

  // Navigation
  navbar: 0,
  tabBar: 0,
  segmentedControl: borderRadius.base,

  // Tooltips & Popovers
  tooltip: borderRadius.sm,
  popover: borderRadius.base,

  // Progress indicators
  progressBar: borderRadius.pill,
  progressCircle: borderRadius.full,

  // Switches & Toggles
  switch: borderRadius.pill,
  checkbox: borderRadius.xs,
  radio: borderRadius.full,
} as const;

// Border styles for different states
export const borderStyles = {
  solid: "solid" as const,
  dashed: "dashed" as const,
  dotted: "dotted" as const,
} as const;

// Utility functions
export const borderUtils = {
  // Create uniform border
  all: (width: number, color: string, style = "solid" as const) => ({
    borderWidth: width,
    borderColor: color,
    borderStyle: style,
  }),

  // Create top border only
  top: (width: number, color: string, style = "solid" as const) => ({
    borderTopWidth: width,
    borderTopColor: color,
    borderStyle: style,
  }),

  // Create bottom border only
  bottom: (width: number, color: string, style = "solid" as const) => ({
    borderBottomWidth: width,
    borderBottomColor: color,
    borderStyle: style,
  }),

  // Create left border only
  left: (width: number, color: string, style = "solid" as const) => ({
    borderLeftWidth: width,
    borderLeftColor: color,
    borderStyle: style,
  }),

  // Create right border only
  right: (width: number, color: string, style = "solid" as const) => ({
    borderRightWidth: width,
    borderRightColor: color,
    borderStyle: style,
  }),

  // Create horizontal borders
  horizontal: (width: number, color: string, style = "solid" as const) => ({
    borderLeftWidth: width,
    borderRightWidth: width,
    borderLeftColor: color,
    borderRightColor: color,
    borderStyle: style,
  }),

  // Create vertical borders
  vertical: (width: number, color: string, style = "solid" as const) => ({
    borderTopWidth: width,
    borderBottomWidth: width,
    borderTopColor: color,
    borderBottomColor: color,
    borderStyle: style,
  }),

  // Create rounded corners selectively
  roundedTop: (radius: number) => ({
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
  }),

  roundedBottom: (radius: number) => ({
    borderBottomLeftRadius: radius,
    borderBottomRightRadius: radius,
  }),

  roundedLeft: (radius: number) => ({
    borderTopLeftRadius: radius,
    borderBottomLeftRadius: radius,
  }),

  roundedRight: (radius: number) => ({
    borderTopRightRadius: radius,
    borderBottomRightRadius: radius,
  }),
} as const;

export type BorderRadius = typeof borderRadius;
export type BorderRadiusKey = keyof BorderRadius;
export type BorderWidth = typeof borderWidth;
export type BorderWidthKey = keyof BorderWidth;
