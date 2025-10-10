import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AccountGeneralView } from 'src/sections/account/view';

// ----------------------------------------------------------------------

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: `Account general settings | Dashboard - ${CONFIG.appName}`,
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <AccountGeneralView id={id} />;
}
