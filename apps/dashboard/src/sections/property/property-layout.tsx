'use client';

import type { DashboardContentProps } from 'src/layouts/dashboard';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

interface PropertyLayoutProps extends DashboardContentProps {
  propertyId?: string;
  isNew?: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// ----------------------------------------------------------------------

const TAB_ITEMS = [
  {
    value: 'general',
    label: 'General',
    icon: <Iconify width={24} icon="solar:home-bold" />,
  },
  {
    value: 'details',
    label: 'Details',
    icon: <Iconify width={24} icon="solar:info-circle-bold" />,
  },
  {
    value: 'pricing',
    label: 'Pricing',
    icon: <Iconify width={24} icon="solar:tag-price-bold" />,
  },
  {
    value: 'location',
    label: 'Location',
    icon: <Iconify width={24} icon="solar:map-point-bold" />,
  },
  {
    value: 'amenities',
    label: 'Amenities',
    icon: <Iconify width={24} icon="solar:star-bold" />,
  },
  {
    value: 'settings',
    label: 'Settings',
    icon: <Iconify width={24} icon="solar:settings-bold" />,
  },
];

// ----------------------------------------------------------------------

export function PropertyLayout({
  propertyId,
  isNew = false,
  activeTab,
  onTabChange,
  children,
  ...other
}: PropertyLayoutProps) {
  return (
    <DashboardContent {...other}>
      <CustomBreadcrumbs
        heading={isNew ? 'Create Property' : 'Edit Property'}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Properties', href: paths.dashboard.properties.list },
          { name: isNew ? 'New Property' : 'Edit' },
        ]}
        sx={{ mb: 3 }}
      />
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => onTabChange(newValue)}
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        {TAB_ITEMS.map((tab) => (
          <Tab key={tab.value} label={tab.label} icon={tab.icon} value={tab.value} />
        ))}
      </Tabs>
      {children}
    </DashboardContent>
  );
}
