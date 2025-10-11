'use client';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { ErrorState } from 'src/components/error-state';
import { LoadingState } from 'src/components/loading-state';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TaxRateNewEditForm } from '../tax-rate-new-edit-form';

// ----------------------------------------------------------------------

// Mock hook for getting tax rate data - replace with actual API call
function useTaxRate(id: string) {
  // This should be replaced with actual API call
  // const { data, isLoading, error } = useTaxAdminControllerGetTaxRate({ taxRateId: id });
  
  // Mock data for now
  return {
    data: {
      id,
      name: 'Sample Occupancy Tax',
      type: 'occupancy_tax',
      jurisdictionId: 'jurisdiction-1',
      calculationMethod: 'percentage',
      rate: 12.5,
      applicability: 'guest',
      description: 'Sample occupancy tax for testing',
      priority: 1,
      effectiveFrom: '2024-01-01T00:00:00Z',
    },
    isLoading: false,
    error: null,
  };
}

export function TaxRateEditView() {
  const params = useParams();
  const { id } = params;

  const { data: taxRate, isLoading, error } = useTaxRate(id);

  if (isLoading) {
    return (
      <DashboardContent>
        <LoadingState title="Loading tax rate..." variant="card" size="large" fullHeight />
      </DashboardContent>
    );
  }

  if (error || !taxRate) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit Tax Rate"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Tax Administration', href: paths.dashboard.taxAdministration.root },
            { name: 'Tax Rates', href: paths.dashboard.taxAdministration.rates.list },
            { name: 'Edit' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <ErrorState
          title="Failed to load tax rate"
          subtitle="The requested tax rate could not be found."
          variant="card"
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit Tax Rate"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Tax Administration', href: paths.dashboard.taxAdministration.root },
          { name: 'Tax Rates', href: paths.dashboard.taxAdministration.rates.list },
          { name: taxRate.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TaxRateNewEditForm currentTaxRate={taxRate} />
    </DashboardContent>
  );
}