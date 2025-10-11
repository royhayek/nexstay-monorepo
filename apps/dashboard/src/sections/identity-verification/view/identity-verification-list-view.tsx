'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { IdentityVerificationList } from '../identity-verification-list';

// ----------------------------------------------------------------------

export function IdentityVerificationListView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Identity Verification"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Identity Verification' },
          { name: 'List' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <IdentityVerificationList />
    </DashboardContent>
  );
}