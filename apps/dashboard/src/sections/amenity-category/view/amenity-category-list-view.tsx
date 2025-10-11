'use client';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AmenityCategoryList } from '../amenity-category-list';

// ----------------------------------------------------------------------

export function AmenityCategoryListView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Amenity Categories"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Amenity Categories', href: paths.dashboard.amenityCategories.list },
          { name: 'List' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.amenityCategories.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            New Category
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AmenityCategoryList />
    </DashboardContent>
  );
}
