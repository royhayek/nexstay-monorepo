import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  user: icon('ic-user'),
  lock: icon('ic-lock'),
  folder: icon('ic-folder'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  params: icon('ic-params'),
  chat: icon('ic-chat'),
  label: icon('ic-label'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  menuItem: icon('ic-menu-item'),
  product: icon('ic-product'),
};

// ----------------------------------------------------------------------

/**
 * Navigation configuration for ADMIN roles
 * Includes: admin, system_admin, moderator, compliance, support
 */
export const navDataAdmin: NavSectionProps['data'] = [
  /**
   * Overview - Admin Dashboard
   */
  {
    subheader: 'Overview',
    items: [
      {
        title: 'Dashboard',
        path: paths.dashboard.root,
        icon: ICONS.dashboard,
      },
      {
        title: 'Analytics',
        path: paths.dashboard.general.overview,
        icon: ICONS.analytics,
      },
    ],
  },
  /**
   * User & Content Management
   * Admin, System Admin, Moderator have access
   */
  {
    subheader: 'Management',
    items: [
      {
        title: 'Users',
        path: paths.dashboard.user.list,
        icon: ICONS.user,
        allowedRoles: ['admin', 'system_admin', 'moderator'],
      },
      {
        title: 'Host Applications',
        path: paths.dashboard.hostApplications.list,
        icon: ICONS.user,
        allowedRoles: ['admin', 'system_admin', 'moderator'],
      },
      {
        title: 'Properties',
        path: paths.dashboard.properties.list,
        icon: ICONS.product,
        allowedRoles: ['admin', 'system_admin', 'moderator'],
      },
      {
        title: 'Bookings',
        path: paths.dashboard.bookings.list,
        icon: ICONS.booking,
        allowedRoles: ['admin', 'system_admin', 'moderator', 'support'],
      },
      {
        title: 'Reviews',
        path: paths.dashboard.reviews.list,
        icon: ICONS.label,
        allowedRoles: ['admin', 'system_admin', 'moderator'],
      },
      {
        title: 'Invoices',
        path: paths.dashboard.invoices.root,
        icon: ICONS.invoice,
        allowedRoles: ['admin', 'system_admin'],
      },
      {
        title: 'Payouts',
        path: paths.dashboard.payouts.list,
        icon: ICONS.banking,
        allowedRoles: ['admin', 'system_admin'],
      },
    ],
  },
  /**
   * Compliance & Verification
   * Admin, System Admin, Compliance, Moderator have access
   */
  {
    subheader: 'Compliance',
    items: [
      {
        title: 'Identity Verification',
        path: paths.dashboard.identityVerification.root,
        icon: ICONS.lock,
        allowedRoles: ['admin', 'system_admin', 'compliance', 'moderator'],
        children: [
          {
            title: 'Verifications',
            path: paths.dashboard.identityVerification.list,
          },
          {
            title: 'Document Types',
            path: paths.dashboard.identityVerification.documentTypes,
          },
          {
            title: 'Statistics',
            path: paths.dashboard.identityVerification.stats,
          },
        ],
      },
      {
        title: 'Tax Administration',
        path: paths.dashboard.taxAdministration.root,
        icon: ICONS.banking,
        allowedRoles: ['admin', 'system_admin', 'compliance'],
        children: [
          {
            title: 'Analytics',
            path: paths.dashboard.taxAdministration.analytics,
          },
          {
            title: 'Jurisdictions',
            path: paths.dashboard.taxAdministration.jurisdictions.list,
          },
          {
            title: 'Rates',
            path: paths.dashboard.taxAdministration.rates.list,
          },
          {
            title: 'Reports',
            path: paths.dashboard.taxAdministration.reports.list,
          },
        ],
      },
    ],
  },
  /**
   * System Configuration
   * Admin and System Admin only
   */
  {
    subheader: 'System',
    items: [
      {
        title: 'Catalogs',
        path: paths.dashboard.catalogs.list,
        icon: ICONS.folder,
        allowedRoles: ['admin', 'system_admin'],
      },
      {
        title: 'Settings',
        path: paths.dashboard.settings.configuration,
        icon: ICONS.params,
        allowedRoles: ['admin', 'system_admin'],
      },
    ],
  },
  /**
   * Communication
   * All admin roles have access
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
