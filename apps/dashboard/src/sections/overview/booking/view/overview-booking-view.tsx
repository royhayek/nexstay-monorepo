'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import { DashboardContent } from 'src/layouts/dashboard';
import { useAdminControllerGetBookingOverview } from 'src/api/queries/admin/admin-dashboard/admin-dashboard';
import {
  BookingIllustration,
  CheckInIllustration,
  CheckoutIllustration,
} from 'src/assets/illustrations';
import {
  useAnalyticsAdminControllerGetBookingDetails,
  useAnalyticsAdminControllerGetBookingOverview,
} from 'src/api/queries/admin/analytics-management/analytics-management';

import { BookingBooked } from '../booking-booked';
import { BookingNewest } from '../booking-newest';
import { BookingDetails } from '../booking-details';
import { BookingAvailable } from '../booking-available';
import { BookingStatistics } from '../booking-statistics';
import { BookingTotalIncomes } from '../booking-total-incomes';
import { BookingSystemHealth } from '../booking-system-health';
import { BookingWidgetSummary } from '../booking-widget-summary';
import { BookingCheckInWidgets } from '../booking-check-in-widgets';
import { BookingCustomerReviews } from '../booking-customer-reviews';

// ----------------------------------------------------------------------

export function OverviewBookingView() {
  // Admin dashboard queries
  const { data: adminBookingData, isLoading: adminLoading } =
    useAdminControllerGetBookingOverview();

  // Analytics queries
  const { data: analyticsBookingData, isLoading: analyticsLoading } =
    useAnalyticsAdminControllerGetBookingOverview();

  const { data: bookingDetails } = useAnalyticsAdminControllerGetBookingDetails({
    page: 1,
    limit: 10,
  });

  // Use admin data as primary source, fallback to analytics
  const bookingOverview = adminBookingData?.data || analyticsBookingData?.data;
  const isLoading = adminLoading || analyticsLoading;

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <BookingWidgetSummary
            title="Total booking"
            percent={0}
            total={bookingOverview?.totalBookings || 0}
            icon={<BookingIllustration />}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <BookingWidgetSummary
            title="Completed"
            percent={0}
            total={bookingOverview?.completedBookings || 0}
            icon={<CheckInIllustration />}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <BookingWidgetSummary
            title="Canceled"
            percent={0}
            total={bookingOverview?.cancelledBookings || 0}
            icon={<CheckoutIllustration />}
          />
        </Grid>

        <Grid container size={12}>
          <Grid size={{ xs: 12, md: 7, lg: 8 }}>
            <Box
              sx={{
                mb: 3,
                p: { md: 1 },
                display: 'flex',
                gap: { xs: 3, md: 1 },
                borderRadius: { md: 2 },
                flexDirection: 'column',
                bgcolor: { md: 'background.neutral' },
              }}
            >
              <Box
                sx={{
                  p: { md: 1 },
                  display: 'grid',
                  gap: { xs: 3, md: 0 },
                  borderRadius: { md: 2 },
                  bgcolor: { md: 'background.paper' },
                  gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
                }}
              >
                <BookingTotalIncomes
                  title="Total incomes"
                  total={
                    bookingOverview?.yearlyStatistics?.reduce(
                      (sum, stat) => sum + (stat.totalRevenue || 0),
                      0
                    ) || 0
                  }
                  percent={0}
                  chart={{
                    categories: bookingOverview?.yearlyStatistics?.map(
                      (stat) => stat.month || ''
                    ) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                    series: [
                      {
                        data: bookingOverview?.yearlyStatistics?.map(
                          (stat) => stat.totalRevenue || 0
                        ) || [0, 0, 0, 0, 0, 0, 0, 0, 0],
                      },
                    ],
                  }}
                />

                <BookingBooked
                  title="Booked"
                  data={bookingOverview?.yearlyStatistics || []}
                  sx={{ boxShadow: { md: 'none' } }}
                />
              </Box>

              <BookingCheckInWidgets
                chart={{
                  series: [
                    {
                      label: 'Sold',
                      percent: bookingOverview?.totalBookings
                        ? (bookingOverview.soldBookings / bookingOverview.totalBookings) * 100
                        : 0,
                      total: bookingOverview?.soldBookings || 0,
                    },
                    {
                      label: 'Available',
                      percent: bookingOverview?.totalBookings
                        ? ((bookingOverview.totalBookings -
                            bookingOverview.soldBookings -
                            bookingOverview.canceledBookings) /
                            bookingOverview.totalBookings) *
                          100
                        : 0,
                      total:
                        (bookingOverview?.totalBookings || 0) -
                        (bookingOverview?.soldBookings || 0) -
                        (bookingOverview?.canceledBookings || 0),
                    },
                  ],
                }}
                sx={{ boxShadow: { md: 'none' } }}
              />
            </Box>

            <BookingStatistics
              title="Statistics"
              chart={{
                series: [
                  {
                    name: 'Monthly',
                    categories: bookingOverview?.yearlyStatistics?.map(
                      (stat) => stat.month || ''
                    ) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
                    data: [
                      {
                        name: 'Sold',
                        data: bookingOverview?.yearlyStatistics?.map(
                          (stat) => stat.soldBookings || 0
                        ) || [0, 0, 0, 0, 0, 0, 0, 0, 0],
                      },
                      {
                        name: 'Canceled',
                        data: bookingOverview?.yearlyStatistics?.map(
                          (stat) => stat.canceledBookings || 0
                        ) || [0, 0, 0, 0, 0, 0, 0, 0, 0],
                      },
                    ],
                  },
                ],
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 5, lg: 4 }}>
            <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
              <BookingAvailable
                title="Tours available"
                chart={{
                  series: [
                    { label: 'Sold out', value: bookingOverview?.soldOutTours || 0 },
                    { label: 'Available', value: bookingOverview?.availableTours || 0 },
                  ],
                }}
              />

              <BookingCustomerReviews
                title="Customer reviews"
                subheader={`${bookingOverview?.customerReviews?.length || 0} Reviews`}
                list={bookingOverview?.customerReviews || []}
              />
            </Box>
          </Grid>
        </Grid>

        <Grid size={12}>
          <BookingNewest
            title="Newest booking"
            subheader={`${bookingOverview?.newestBookings?.length || 0} bookings`}
            list={bookingOverview?.newestBookings || []}
          />
        </Grid>

        <Grid size={12}>
          <BookingDetails
            title="Booking details"
            tableData={bookingDetails?.data?.bookings || []}
            headCells={[
              { id: 'destination', label: 'Destination' },
              { id: 'customer', label: 'Customer' },
              { id: 'checkIn', label: 'Check in' },
              { id: 'checkOut', label: 'Check out' },
              { id: 'status', label: 'Status' },
              { id: '' },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <BookingSystemHealth />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
