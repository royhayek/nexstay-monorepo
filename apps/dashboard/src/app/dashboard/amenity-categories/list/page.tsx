import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AmenityCategoryListView } from 'src/sections/amenity-category/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Amenity Categories list | Dashboard - ${CONFIG.appName}`,
};

export default function Page() {
  return <AmenityCategoryListView />;
}
