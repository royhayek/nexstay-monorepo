import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { EnumDisplayEditView } from 'src/sections/enum-display/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Edit enum display | Dashboard - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ enumName: string; key: string }>;
};

export default async function Page({ params }: Props) {
  const { enumName, key } = await params;

  return <EnumDisplayEditView enumName={enumName} key={key} />;
}
