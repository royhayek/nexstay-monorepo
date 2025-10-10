import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Amenity Categories | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <div>Amenity Categories</div>;
}
