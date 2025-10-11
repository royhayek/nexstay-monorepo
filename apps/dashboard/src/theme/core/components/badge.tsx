import type { Theme, Components, ComponentsVariants } from '@mui/material/styles';

// ----------------------------------------------------------------------

/**
 * TypeScript extension for MUI theme augmentation.
 * @to {@link file://./../../extend-theme-types.d.ts}
 */

export type BadgeExtendVariant = {
  available: true;
  busy: true;
  away: true;
  offline: true;
};

/* **********************************************************************
 * 🗳️ Variants
 * **********************************************************************/
const statusVariants = [
  {
    props: (props) => ['available', 'busy', 'away', 'offline'].includes(props.variant as string),
    style: ({ theme }) => ({
      width: 10,
      height: 10,
      padding: 0,
      top: 'auto',
      right: '14%',
      bottom: '14%',
      minWidth: 'auto',
      transform: 'scale(1) translate(50%, 50%)',
      '&::before, &::after': {
        content: "''",
        borderRadius: 1,
        backgroundColor: theme.vars.palette.common.white,
      },
    }),
  },
  {
    props: (props) => props.variant === 'available',
    style: ({ theme }) => ({
      backgroundColor: theme.vars.palette.success.main,
    }),
  },
  {
    props: (props) => props.variant === 'busy',
    style: ({ theme }) => ({
      backgroundColor: theme.vars.palette.error.main,
      '&::before': { width: 6, height: 2 },
    }),
  },
  {
    props: (props) => props.variant === 'offline',
    style: ({ theme }) => ({
      backgroundColor: theme.vars.palette.text.disabled,
      '&::before': { width: 6, height: 6, borderRadius: '50%' },
    }),
  },
  {
    props: (props) => props.variant === 'away',
    style: {
      display: 'none',
    },
  },
] satisfies ComponentsVariants<Theme>['MuiBadge'];

/* **********************************************************************
 * 🧩 Components
 * **********************************************************************/
const MuiBadge: Components<Theme>['MuiBadge'] = {
  // ▼▼▼▼▼▼▼▼ 🎨 STYLE ▼▼▼▼▼▼▼▼
  styleOverrides: {
    dot: { borderRadius: '50%' },
    badge: {
      variants: [...statusVariants],
    },
  },
};

/* **********************************************************************
 * 🚀 Export
 * **********************************************************************/
export const badge: Components<Theme> = {
  MuiBadge,
};
