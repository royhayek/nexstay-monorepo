'use client';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CatalogList } from '../catalog-list';

// ----------------------------------------------------------------------

export function CatalogListView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Catalog Items"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Catalogs', href: paths.dashboard.catalogs.list },
          { name: 'List' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.catalogs.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            New Catalog Item
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CatalogList />
    </DashboardContent>
  );
}
