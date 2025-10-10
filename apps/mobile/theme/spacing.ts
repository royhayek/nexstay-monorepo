import { ms, mvs } from "@/utils/scaling";

const BASE_SPACING = 4;

export const spacing = {
  none: 0,
  xxs: ms(BASE_SPACING * 0.5), // 2
  xs: ms(BASE_SPACING * 1), // 4
  sm: ms(BASE_SPACING * 2), // 8
  md: ms(BASE_SPACING * 3), // 12
  base: ms(BASE_SPACING * 4), // 16
  lg: ms(BASE_SPACING * 5), // 20
  xl: ms(BASE_SPACING * 6), // 24
  xxl: ms(BASE_SPACING * 8), // 32
  xxxl: ms(BASE_SPACING * 10), // 40
  huge: ms(BASE_SPACING * 12), // 48
  giant: ms(BASE_SPACING * 16), // 64
  mega: ms(BASE_SPACING * 20), // 80
  giga: ms(BASE_SPACING * 24), // 96
} as const;

export const insets = {
  none: 0,
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  base: spacing.base,
  lg: spacing.lg,
  xl: spacing.xl,
} as const;

export const gaps = {
  none: 0,
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  base: spacing.base,
  lg: spacing.lg,
  xl: spacing.xl,
  xxl: spacing.xxl,
} as const;

export const margins = {
  none: 0,
  auto: "auto" as const,
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  base: spacing.base,
  lg: spacing.lg,
  xl: spacing.xl,
  xxl: spacing.xxl,
  xxxl: spacing.xxxl,
} as const;

export const paddings = {
  none: 0,
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
  base: spacing.base,
  lg: spacing.lg,
  xl: spacing.xl,
  xxl: spacing.xxl,
  xxxl: spacing.xxxl,
} as const;

// Layout-specific spacing
export const layout = {
  // Container padding
  containerPaddingHorizontal: spacing.base,
  containerPaddingVertical: mvs(spacing.lg),

  // Card spacing
  cardPadding: spacing.base,
  cardGap: spacing.md,

  // List spacing
  listItemPadding: spacing.md,
  listItemGap: mvs(spacing.sm),
  listSectionGap: mvs(spacing.xl),

  // Form spacing
  formFieldGap: mvs(spacing.base),
  formGroupGap: mvs(spacing.xl),
  formLabelGap: mvs(spacing.xs),

  // Modal spacing
  modalPadding: spacing.lg,
  modalHeaderPadding: mvs(spacing.base),
  modalContentPadding: spacing.base,
  modalFooterPadding: mvs(spacing.base),

  // Navigation
  headerHeight: mvs(44),
} as const;

// Helper functions
export const spacingUtils = {
  // Multiply base spacing
  multiply: (multiplier: number) => BASE_SPACING * multiplier,

  // Create consistent padding/margin object
  symmetric: (horizontal: number, vertical: number) => ({
    paddingHorizontal: horizontal,
    paddingVertical: vertical,
  }),

  // Create inset object
  inset: (value: number) => ({
    top: value,
    right: value,
    bottom: value,
    left: value,
  }),

  // Create directional inset
  directional: (top: number, right: number, bottom: number, left: number) => ({
    top,
    right,
    bottom,
    left,
  }),
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof Spacing;
