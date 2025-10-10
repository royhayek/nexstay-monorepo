'use client';

import { AccountGeneral } from '../account-general';

// ----------------------------------------------------------------------

interface Props {
  id: string;
}

export function AccountGeneralView({ id }: Props) {
  return <AccountGeneral id={id} />;
}
