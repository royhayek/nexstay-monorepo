'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useEnumDisplaysControllerFindByKeyV1 } from 'src/api/queries/enum-displays/enum-displays';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EnumDisplayNewEditForm } from '../enum-display-new-edit-form';

// ----------------------------------------------------------------------

type Props = {
  enumName: string;
  key: string;
};

export function EnumDisplayEditView({ enumName, key }: Props) {
  const { data: enumDisplayData, isLoading } = useEnumDisplaysControllerFindByKeyV1(
    enumName,
    key,
    undefined
  );

  const currentEnumDisplay = enumDisplayData?.data?.data?.[0];

  if (isLoading) {
    return (
      <DashboardContent>
        <div>Loading...</div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit Enum Display"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'System', href: paths.dashboard.enumDisplays.root },
          { name: 'Enum Displays', href: paths.dashboard.enumDisplays.list },
          { name: currentEnumDisplay?.key || key },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <EnumDisplayNewEditForm
        currentEnumDisplay={currentEnumDisplay}
        enumName={enumName}
        enumKey={key}
      />
    </DashboardContent>
  );
}
