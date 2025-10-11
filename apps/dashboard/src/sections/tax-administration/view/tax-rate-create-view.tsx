'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TaxRateNewEditForm } from '../tax-rate-new-edit-form';

// ----------------------------------------------------------------------

export function TaxRateCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create Tax Rate"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Tax Administration', href: paths.dashboard.taxAdministration.root },
          { name: 'Tax Rates', href: paths.dashboard.taxAdministration.rates.list },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TaxRateNewEditForm />
    </DashboardContent>
  );
}