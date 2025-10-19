import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { CatalogEditView } from 'src/sections/catalog/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Edit catalog item | Dashboard - ${CONFIG.appName}`,
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <CatalogEditView id={id} />;
}
