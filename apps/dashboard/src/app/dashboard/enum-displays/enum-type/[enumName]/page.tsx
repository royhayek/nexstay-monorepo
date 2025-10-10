import type { Metadata } from 'next';

import { EnumTypeDetailsView } from 'src/sections/enum-display/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: 'Enum Type Details | Dashboard' };

export default function Page() {
  return <EnumTypeDetailsView />;
}
