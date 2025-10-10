import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { EnumDisplayCreateView } from 'src/sections/enum-display/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Create a new enum display | Dashboard - ${CONFIG.appName}`,
};

export default function Page() {
  return <EnumDisplayCreateView />;
}
