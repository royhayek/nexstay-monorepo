'use client';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { ErrorState } from 'src/components/error-state';
import { LoadingState } from 'src/components/loading-state';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TaxJurisdictionNewEditForm } from '../tax-jurisdiction-new-edit-form';

// ----------------------------------------------------------------------

// Mock hook for getting jurisdiction data - replace with actual API call
function useTaxJurisdiction(id: string) {
  // This should be replaced with actual API call
  // const { data, isLoading, error } = useTaxAdminControllerGetTaxJurisdiction({ jurisdictionId: id });
  
  // Mock data for now
  return {
    data: {
      id,
      name: 'Sample Jurisdiction',
      code: 'SAMPLE',
      level: 'city',
      country: 'US',
      state: 'California',
      city: 'San Francisco',
      description: 'Sample jurisdiction for testing',
      effectiveFrom: '2024-01-01T00:00:00Z',
    },
    isLoading: false,
    error: null,
  };
}

export function TaxJurisdictionEditView() {
  const params = useParams();
  const { id } = params;

  const { data: jurisdiction, isLoading, error } = useTaxJurisdiction(id);

  if (isLoading) {
    return (
      <DashboardContent>
        <LoadingState title="Loading jurisdiction..." variant="card" size="large" fullHeight />
      </DashboardContent>
    );
  }

  if (error || !jurisdiction) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit Tax Jurisdiction"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Tax Administration', href: paths.dashboard.taxAdministration.root },
            { name: 'Jurisdictions', href: paths.dashboard.taxAdministration.jurisdictions.list },
            { name: 'Edit' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <ErrorState
          title="Failed to load jurisdiction"
          subtitle="The requested tax jurisdiction could not be found."
          variant="card"
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit Tax Jurisdiction"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Tax Administration', href: paths.dashboard.taxAdministration.root },
          { name: 'Jurisdictions', href: paths.dashboard.taxAdministration.jurisdictions.list },
          { name: jurisdiction.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TaxJurisdictionNewEditForm currentJurisdiction={jurisdiction} />
    </DashboardContent>
  );
}