import { IdentityVerificationDetailsView } from 'src/sections/identity-verification/view/identity-verification-details-view';

// ----------------------------------------------------------------------

export const metadata = { title: 'Identity Verification: Details' };

interface Props {
  params: { id: string };
}

export default function Page({ params }: Props) {
  return <IdentityVerificationDetailsView id={params.id} />;
}