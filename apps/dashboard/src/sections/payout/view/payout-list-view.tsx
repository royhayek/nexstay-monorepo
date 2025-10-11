'use client';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PayoutList } from '../payout-list';

// ----------------------------------------------------------------------

export function PayoutListView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Payouts"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Payouts' },
          { name: 'List' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.payouts.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            New Payout
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PayoutList />
    </DashboardContent>
  );
}