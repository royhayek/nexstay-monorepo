'use client';

import type { DashboardContentProps } from 'src/layouts/dashboard';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

interface AccountLayoutProps extends DashboardContentProps {
  id: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// ----------------------------------------------------------------------

const TAB_ITEMS = [
  {
    value: 'general',
    label: 'General',
    icon: <Iconify width={24} icon="solar:user-id-bold" />,
  },
  {
    value: 'bookings',
    label: 'Bookings',
    icon: <Iconify width={24} icon="solar:calendar-mark-bold" />,
  },
  // {
  //   value: 'billing',
  //   label: 'Billing',
  //   icon: <Iconify width={24} icon="solar:bill-list-bold" />,
  // },
  {
    value: 'notifications',
    label: 'Notifications',
    icon: <Iconify width={24} icon="solar:bell-bing-bold" />,
  },
  // {
  //   value: 'socials',
  //   label: 'Social links',
  //   icon: <Iconify width={24} icon="solar:share-bold" />,
  // },
  // {
  //   value: 'security',
  //   label: 'Security',
  //   icon: <Iconify width={24} icon="ic:round-vpn-key" />,
  // },
];

// ----------------------------------------------------------------------

export function AccountLayout({
  id,
  activeTab,
  onTabChange,
  children,
  ...other
}: AccountLayoutProps) {
  return (
    <DashboardContent {...other}>
      <CustomBreadcrumbs
        heading="Account"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'User', href: paths.dashboard.user.root },
          { name: 'Account' },
        ]}
        sx={{ mb: 3 }}
      />
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => onTabChange(newValue)}
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        {TAB_ITEMS.map((tab) => (
          <Tab
            key={tab.value}
            label={tab.label}
            icon={tab.icon}
            value={tab.value}
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Tabs>
      {children}
    </DashboardContent>
  );
}
