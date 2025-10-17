import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  chat: icon('ic-chat'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  label: icon('ic-label'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  product: icon('ic-product'),
};

// ----------------------------------------------------------------------

/**
 * Navigation configuration for HOST role
 * Hosts can manage their properties, bookings, payouts, and view analytics
 */
export const navDataHost: NavSectionProps['data'] = [
  /**
   * Overview - Host Dashboard
   */
  {
    subheader: 'Overview',
    items: [
      {
        title: 'Dashboard',
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
      },
    ],
  },
  /**
   * Host Management
   */
  {
    subheader: 'My Business',
    items: [
      {
        title: 'My Properties',
        path: paths.dashboard.properties.list,
        icon: ICONS.product,
      },
      {
        title: 'Bookings',
        path: paths.dashboard.bookings.list,
        icon: ICONS.booking,
      },
      {
        title: 'Reviews',
        path: paths.dashboard.reviews.list,
        icon: ICONS.label,
      },
      {
        title: 'Payouts',
        path: paths.dashboard.payouts.list,
        icon: ICONS.banking,
      },
      {
        title: 'Invoices',
        path: paths.dashboard.invoices.root,
        icon: ICONS.invoice,
      },
    ],
  },
  /**
   * Communication
   */
  {
    subheader: 'Communication',
    items: [
      {
        title: 'Messages',
        path: paths.dashboard.chat,
        icon: ICONS.chat,
      },
    ],
  },
];
