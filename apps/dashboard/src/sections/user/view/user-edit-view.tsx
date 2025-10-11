'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useUsersAdminControllerGetUserById } from 'src/api/queries/admin/users-management/users-management';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserNewEditForm } from '../user-new-edit-form';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function UserEditView({ id }: Props) {
  const { data: usersData } = useUsersAdminControllerGetUserById(id);
  const currentUser = usersData?.data;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit"
        backHref={paths.dashboard.user.list}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'User', href: paths.dashboard.user.root },
          { name: `${currentUser?.firstName} ${currentUser?.lastName}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <UserNewEditForm currentUser={currentUser} />
    </DashboardContent>
  );
}
