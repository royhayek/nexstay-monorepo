import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  params: icon('ic-params'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  subpaths: icon('ic-subpaths'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
};

// ----------------------------------------------------------------------

export const navData: NavSectionProps['data'] = [
  /**
   * Overview - Guest Dashboard
   * Accessible to: guest role (basic users)
   */
  {
    subheader: 'Overview',
    items: [
      { title: 'Dashboard', path: paths.dashboard.root, icon: ICONS.dashboard },
    ],
  },
  /**
   * Guest Features
   * Guest users can view properties, manage their bookings, and communicate
   */
  {
    subheader: 'My Account',
    items: [
      // Guests can browse properties
      { title: 'Browse Properties', path: paths.dashboard.properties.list, icon: ICONS.booking },
      // Guests can view their own bookings
      { title: 'My Bookings', path: paths.dashboard.bookings.list, icon: ICONS.booking },
      // Guests can view their reviews
      { title: 'My Reviews', path: paths.dashboard.reviews.list, icon: ICONS.label },
      // Guests can view their invoices
      { title: 'My Invoices', path: paths.dashboard.invoices.root, icon: ICONS.invoice },
    ],
  },
  /**
   * Communication
   */
  {
    subheader: 'Communication',
    items: [{ title: 'Messages', path: paths.dashboard.chat, icon: ICONS.chat }],
  },
];
