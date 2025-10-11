'use client';

import { AccountBooking } from '../account-booking';

// ----------------------------------------------------------------------

interface Props {
  id: string;
}

export function AccountBookingsView({ id }: Props) {
  return <AccountBooking id={id} />;
}
