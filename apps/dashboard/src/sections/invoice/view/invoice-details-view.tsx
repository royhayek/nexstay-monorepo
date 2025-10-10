'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useInvoicesControllerGetInvoiceV1 } from 'src/api/queries/invoices/invoices';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InvoiceDetails } from '../invoice-details';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function InvoiceDetailsView({ id }: Props) {
  const { data: invoiceData } = useInvoicesControllerGetInvoiceV1(id, {
    query: { enabled: !!id },
  });

  const invoice = invoiceData?.data;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={invoice?.invoiceNumber}
        backHref={paths.dashboard.invoices.root}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Invoice', href: paths.dashboard.invoices.root },
          { name: invoice?.invoiceNumber },
        ]}
        sx={{ mb: 3 }}
      />

      <InvoiceDetails invoice={invoice} />
    </DashboardContent>
  );
}
