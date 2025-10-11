'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useEnumDisplaysAdminControllerFindByKey } from 'src/api/queries/admin/enum-displays-management/enum-displays-management';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EnumDisplayDynamicForm } from '../enum-display-dynamic-form';

// ----------------------------------------------------------------------

type Props = {
  enumName: string;
  key: string;
};

export function EnumDisplayEditView({ enumName, key }: Props) {
  const { data: enumDisplayData, isLoading } = useEnumDisplaysAdminControllerFindByKey(
    enumName,
    key
  );

  const currentEnumDisplay = enumDisplayData?.data?.[0];

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
          { name: currentEnumDisplay?.key || 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <EnumDisplayDynamicForm currentEnumDisplay={currentEnumDisplay} />
    </DashboardContent>
  );
}
