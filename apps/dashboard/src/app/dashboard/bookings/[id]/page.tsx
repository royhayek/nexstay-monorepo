import { BookingDetailsView } from 'src/sections/booking/view/booking-details-view';

// ----------------------------------------------------------------------

export interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page(props: Props) {
  const params = await props.params;
  
  return <BookingDetailsView id={params.id} />;
}