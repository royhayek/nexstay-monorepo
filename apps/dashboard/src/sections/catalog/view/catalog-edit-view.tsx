'use client';

import { paths } from 'src/routes/paths';

import { useCatalogAdminControllerFindOne } from 'src/api/queries/admin/catalogs-admin/catalogs-admin';

import { DashboardContent } from 'src/layouts/dashboard';

import { LoadingState } from 'src/components/loading-state';
import { ErrorState } from 'src/components/error-state';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CatalogNewEditForm } from '../catalog-new-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function CatalogEditView({ id }: Props) {
  const { data, isLoading, error, refetch } = useCatalogAdminControllerFindOne(id);

  if (isLoading) {
    return (
      <DashboardContent>
        <LoadingState title="Loading catalog item..." variant="card" size="large" fullHeight />
      </DashboardContent>
    );
  }

  if (error || !data?.data) {
    return (
      <DashboardContent>
        <ErrorState
          title="Failed to load catalog item"
          description={error?.message || 'The catalog item could not be found'}
          onRetry={() => refetch()}
          variant="card"
        />
      </DashboardContent>
    );
  }

  const catalogItem = data.data;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit Catalog Item"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Catalogs', href: paths.dashboard.catalogs.list },
          { name: 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CatalogNewEditForm currentCatalogItem={catalogItem} />
    </DashboardContent>
  );
}
