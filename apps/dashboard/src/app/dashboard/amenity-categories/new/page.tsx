import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AmenityCategoryCreateView } from 'src/sections/amenity-category/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Create a new amenity category | Dashboard - ${CONFIG.appName}`,
};

export default function Page() {
  return <AmenityCategoryCreateView />;
}
