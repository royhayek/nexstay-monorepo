'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PayoutNewEditForm } from '../payout-new-edit-form';

// ----------------------------------------------------------------------

export function PayoutCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create New Payout"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Payouts', href: paths.dashboard.payouts.list },
          { name: 'Create' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PayoutNewEditForm />
    </DashboardContent>
  );
}