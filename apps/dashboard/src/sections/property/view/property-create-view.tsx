'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PropertyNewEditForm } from '../property-new-edit-form';

// ----------------------------------------------------------------------

export function PropertyCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new property"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Properties', href: paths.dashboard.properties.list },
          { name: 'New property' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PropertyNewEditForm />
    </DashboardContent>
  );
}
