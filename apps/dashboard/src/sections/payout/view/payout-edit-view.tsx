'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { usePayoutsAdminControllerGetPayoutDetails } from 'src/api/queries/admin/payouts-management/payouts-management';

import { ErrorState } from 'src/components/error-state';
import { LoadingState } from 'src/components/loading-state';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PayoutNewEditForm } from '../payout-new-edit-form';

// ----------------------------------------------------------------------

interface PayoutEditViewProps {
  id: string;
}

export function PayoutEditView({ id }: PayoutEditViewProps) {
  const { data: payout, isLoading, error, refetch } = usePayoutsAdminControllerGetPayoutDetails(id);

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit Payout"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Payouts', href: paths.dashboard.payouts.list },
            { name: 'Edit' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <LoadingState title="Loading payout details..." variant="card" size="large" fullHeight />
      </DashboardContent>
    );
  }

  if (error || !payout) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Edit Payout"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Payouts', href: paths.dashboard.payouts.list },
            { name: 'Edit' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <ErrorState title="Failed to load payout" onRetry={() => refetch()} variant="card" />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`Edit Payout: ${payout.data.reference}`}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Payouts', href: paths.dashboard.payouts.list },
          { name: payout.data.reference },
          { name: 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PayoutNewEditForm currentPayout={payout.data} />
    </DashboardContent>
  );
}
