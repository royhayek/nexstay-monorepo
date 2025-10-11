'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { BookingList } from '../booking-list';

// ----------------------------------------------------------------------

export function BookingListView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Bookings"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Bookings' },
          { name: 'List' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <BookingList />
    </DashboardContent>
  );
}
