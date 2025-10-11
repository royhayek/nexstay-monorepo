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
   * Overview
   */
  {
    subheader: 'Overview',
    items: [
      { title: 'App', path: paths.dashboard.root, icon: ICONS.dashboard },
      { title: 'Overview', path: paths.dashboard.general.overview, icon: ICONS.booking },
    ],
  },
  /**
   * Management
   */
  {
    subheader: 'Management',
    items: [
      { title: 'Users', path: paths.dashboard.user.list, icon: ICONS.user },
      { title: 'Properties', path: paths.dashboard.properties.list, icon: ICONS.banking },
      { title: 'Bookings', path: paths.dashboard.bookings.list, icon: ICONS.booking },
      { title: 'Invoice', path: paths.dashboard.invoices.root, icon: ICONS.invoice },
      { title: 'Reviews', path: paths.dashboard.reviews.list, icon: ICONS.label },
      { title: 'Payouts', path: paths.dashboard.payouts.list, icon: ICONS.banking },
      {
        title: 'Identity Verification',
        path: paths.dashboard.identityVerification.root,
        icon: ICONS.lock,
        children: [
          { title: 'Verifications', path: paths.dashboard.identityVerification.list },
          { title: 'Document Types', path: paths.dashboard.identityVerification.documentTypes },
          { title: 'Statistics', path: paths.dashboard.identityVerification.stats },
        ],
      },
      {
        title: 'Amenity Categories',
        path: paths.dashboard.amenityCategories.list,
        icon: ICONS.folder,
      },
      { title: 'Enum Displays', path: paths.dashboard.enumDisplays.list, icon: ICONS.menuItem },
      {
        title: 'Tax Administration',
        path: paths.dashboard.taxAdministration.root,
        icon: ICONS.banking,
        children: [
          { title: 'Analytics', path: paths.dashboard.taxAdministration.analytics },
          { title: 'Jurisdictions', path: paths.dashboard.taxAdministration.jurisdictions.list },
          { title: 'Rates', path: paths.dashboard.taxAdministration.rates.list },
          { title: 'Reports', path: paths.dashboard.taxAdministration.reports.list },
        ],
      },
      { title: 'Chat', path: paths.dashboard.chat, icon: ICONS.chat },
      { title: 'Settings', path: paths.dashboard.settings.configuration, icon: ICONS.params },
    ],
  },
];
