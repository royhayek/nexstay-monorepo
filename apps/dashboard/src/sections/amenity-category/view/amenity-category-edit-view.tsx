'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useAmenityCategoriesAdminControllerFindById } from 'src/api/queries/admin/amenity-categories-management/amenity-categories-management';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AmenityCategoryNewEditForm } from '../amenity-category-new-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function AmenityCategoryEditView({ id }: Props) {
  const { data: currentCategory, isLoading } = useAmenityCategoriesAdminControllerFindById(id);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit amenity category"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Amenity Categories', href: paths.dashboard.amenityCategories.list },
          { name: 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {!isLoading && <AmenityCategoryNewEditForm currentCategory={currentCategory?.data} />}
    </DashboardContent>
  );
}
