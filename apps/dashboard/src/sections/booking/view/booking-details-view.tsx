'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { BookingDetails } from '../booking-details';

// ----------------------------------------------------------------------

interface Props {
  id: string;
}

export function BookingDetailsView({ id }: Props) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Booking Details"
        backHref={paths.dashboard.bookings.list}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Bookings', href: paths.dashboard.bookings.list },
          { name: 'Details' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <BookingDetails bookingId={id} />
    </DashboardContent>
  );
}
