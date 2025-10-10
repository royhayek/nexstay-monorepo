'use client';

import type { DashboardContentProps } from 'src/layouts/dashboard';

import { removeLastSlash } from 'minimal-shared/utils';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

interface AccountLayoutProps extends DashboardContentProps {
  id: string;
}

// ----------------------------------------------------------------------

const NAV_ITEMS = [
  {
    label: 'General',
    icon: <Iconify width={24} icon="solar:user-id-bold" />,
    href: (id: string) => paths.dashboard.user.account(id),
  },
  {
    label: 'Billing',
    icon: <Iconify width={24} icon="solar:bill-list-bold" />,
    href: (id: string) => `${paths.dashboard.user.account(id)}/billing`,
  },
  {
    label: 'Notifications',
    icon: <Iconify width={24} icon="solar:bell-bing-bold" />,
    href: (id: string) => `${paths.dashboard.user.account(id)}/notifications`,
  },
  {
    label: 'Social links',
    icon: <Iconify width={24} icon="solar:share-bold" />,
    href: (id: string) => `${paths.dashboard.user.account(id)}/socials`,
  },
  {
    label: 'Security',
    icon: <Iconify width={24} icon="ic:round-vpn-key" />,
    href: (id: string) => `${paths.dashboard.user.account(id)}/change-password`,
  },
];

// ----------------------------------------------------------------------

export function AccountLayout({ id, children, ...other }: AccountLayoutProps) {
  const pathname = usePathname();

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
      <Tabs value={removeLastSlash(pathname)} sx={{ mb: { xs: 3, md: 5 } }}>
        {NAV_ITEMS.map((tab) => (
          <Tab
            component={RouterLink}
            key={tab.href(id)}
            label={tab.label}
            icon={tab.icon}
            value={tab.href(id)}
            href={tab.href(id)}
          />
        ))}
      </Tabs>
      {children}
    </DashboardContent>
  );
}
