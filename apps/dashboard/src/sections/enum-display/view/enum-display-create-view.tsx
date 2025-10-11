'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EnumDisplayDynamicForm } from '../enum-display-dynamic-form';

// ----------------------------------------------------------------------

export function EnumDisplayCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create Enum Display"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'System', href: paths.dashboard.enumDisplays.root },
          { name: 'Enum Displays', href: paths.dashboard.enumDisplays.list },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <EnumDisplayDynamicForm />
    </DashboardContent>
  );
}
