import { PayoutEditView } from 'src/sections/payout/view';

// ----------------------------------------------------------------------

export interface PayoutEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function PayoutEditPage(props: PayoutEditPageProps) {
  const { id } = await props.params;

  return <PayoutEditView id={id} />;
}