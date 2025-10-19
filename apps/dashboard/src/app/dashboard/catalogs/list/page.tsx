import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { CatalogListView } from 'src/sections/catalog/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Catalogs list | Dashboard - ${CONFIG.appName}`,
};

export default function Page() {
  return <CatalogListView />;
}
