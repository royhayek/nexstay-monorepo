'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CatalogNewEditForm } from '../catalog-new-edit-form';

// ----------------------------------------------------------------------

export function CatalogCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create New Catalog Item"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Catalogs', href: paths.dashboard.catalogs.list },
          { name: 'New' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CatalogNewEditForm />
    </DashboardContent>
  );
}
