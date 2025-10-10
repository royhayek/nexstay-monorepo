import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `Enum Displays | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  redirect(paths.dashboard.enumDisplays.list);
}
