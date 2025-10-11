import { PayoutDetailsView } from 'src/sections/payout/view';

// ----------------------------------------------------------------------

export interface PayoutDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function PayoutDetailsPage(props: PayoutDetailsPageProps) {
  const { id } = await props.params;

  return <PayoutDetailsView id={id} />;
}