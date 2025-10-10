'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AmenityCategoryNewEditForm } from '../amenity-category-new-edit-form';

// ----------------------------------------------------------------------

export function AmenityCategoryCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new amenity category"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Amenity Categories', href: paths.dashboard.amenityCategories.list },
          { name: 'New category' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AmenityCategoryNewEditForm />
    </DashboardContent>
  );
}
