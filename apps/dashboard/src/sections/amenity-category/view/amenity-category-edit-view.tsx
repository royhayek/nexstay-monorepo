'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useAmenityCategoriesControllerFindByIdV1 } from 'src/api/queries/amenity-categories/amenity-categories';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AmenityCategoryNewEditForm } from '../amenity-category-new-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function AmenityCategoryEditView({ id }: Props) {
  const { data: currentCategory, isLoading } = useAmenityCategoriesControllerFindByIdV1(id);

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
