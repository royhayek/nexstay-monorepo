import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { CatalogCreateView } from 'src/sections/catalog/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Create new catalog item | Dashboard - ${CONFIG.appName}`,
};

export default function Page() {
  return <CatalogCreateView />;
}
