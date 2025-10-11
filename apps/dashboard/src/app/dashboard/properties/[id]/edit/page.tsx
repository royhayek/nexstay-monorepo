import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { PropertyEditView } from 'src/sections/property/view/property-edit-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit Property | Dashboard - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <PropertyEditView id={id} />;
}
