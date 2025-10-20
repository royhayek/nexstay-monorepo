import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { HostApplicationsListView } from 'src/sections/host-applications/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Host Applications - ${CONFIG.appName}`,
};

export default function Page() {
  return <HostApplicationsListView />;
}
