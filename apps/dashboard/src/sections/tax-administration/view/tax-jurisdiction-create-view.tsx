'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TaxJurisdictionNewEditForm } from '../tax-jurisdiction-new-edit-form';

// ----------------------------------------------------------------------

export function TaxJurisdictionCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create Tax Jurisdiction"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Tax Administration', href: paths.dashboard.taxAdministration.root },
          { name: 'Jurisdictions', href: paths.dashboard.taxAdministration.jurisdictions.list },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TaxJurisdictionNewEditForm />
    </DashboardContent>
  );
}