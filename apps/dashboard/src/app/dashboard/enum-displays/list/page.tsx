import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { EnumDisplayListView } from 'src/sections/enum-display/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Enum Displays list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <EnumDisplayListView />;
}
