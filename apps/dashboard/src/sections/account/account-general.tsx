import type { AdminUpdateUserDto } from 'src/api/models/admin';

import { z as zod } from 'zod';
import { useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useEnumOptions } from 'src/hooks/use-enum-options';

import { fData } from 'src/utils/format-number';

import {
  useUsersAdminControllerUpdateUser,
  useUsersAdminControllerGetUserById,
  useUsersAdminControllerUploadAvatarForNewUser,
  useUsersAdminControllerToggleEmailVerification,
  useUsersAdminControllerTogglePhoneVerification,
} from 'src/api/queries/admin/users-management/users-management';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type UpdateUserSchemaType = zod.infer<typeof UpdateUserSchema>;

export const UpdateUserSchema = zod.object({
  avatarUrl: schemaHelper.file({ message: 'Avatar is required!' }),
  firstName: zod.string().min(1, { message: 'First name is required!' }),
  lastName: zod.string().min(1, { message: 'Last name is required!' }),
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  phone: schemaHelper.phoneNumber({ isValid: isValidPhoneNumber }),
  bio: zod.string().min(1, { message: 'Bio is required!' }),
  timezone: zod.string().min(1, { message: 'Time zone is required!' }),
  locale: zod.string().min(1, { message: 'Locale is required!' }),
  birthDate: schemaHelper.date({ message: { required: 'End date is required!' } }),
  roles: zod.array(zod.string().min(1, { message: 'Roles are required!' })),
  createdAt: schemaHelper.date().optional(),
  updatedAt: schemaHelper.date().optional(),
});

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function AccountGeneral({ id }: Props) {
  const userRoleOptions = useEnumOptions('UserRole');

  const router = useRouter();

  const { data: currentUserData } = useUsersAdminControllerGetUserById(id, {
    query: { enabled: !!id },
  });

  const currentUser = currentUserData?.data;

  const defaultValues: UpdateUserSchemaType = {
    avatarUrl: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    timezone: '',
    locale: '',
    birthDate: null,
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const methods = useForm<UpdateUserSchemaType>({
    mode: 'all',
    resolver: zodResolver(UpdateUserSchema),
    defaultValues,
    values: currentUser,
  });

  const {
    // watch,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // const values = watch();

  const { mutate: toggleEmailVerified } = useUsersAdminControllerToggleEmailVerification();
  const { mutate: togglePhoneVerified } = useUsersAdminControllerTogglePhoneVerification();
  const { mutateAsync: uploadAvatar } = useUsersAdminControllerUploadAvatarForNewUser();
  const { mutate: updateUser } = useUsersAdminControllerUpdateUser();

  const handleEmailVerifiedChange = useCallback(() => {
    if (currentUser) toggleEmailVerified({ id: currentUser?.id });
  }, [currentUser, toggleEmailVerified]);

  const handlePhoneVerifiedChange = useCallback(() => {
    if (currentUser) togglePhoneVerified({ id: currentUser?.id });
  }, [currentUser, togglePhoneVerified]);

  const handleDeleteUserPress = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Delete success!');
      router.push(paths.dashboard.user.list);
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      let avatarUrl: string | undefined = '';
      if (data.avatarUrl && typeof data.avatarUrl !== 'string') {
        const uploadResponse = await uploadAvatar({ data: { file: data.avatarUrl } });
        avatarUrl = uploadResponse.data?.url;
      }

      const payload: AdminUpdateUserDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        bio: data.bio,
        role: data.roles,
        ...(avatarUrl ? { avatarUrl } : {}),
      };

      updateUser(
        { id: currentUser?.id || '', data: payload },
        {
          onSuccess: (result) => {
            toast.success(result.message);
            router.push(paths.dashboard.user.list);
          },
        }
      );
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            {/* {currentUser && (
              <Label
                color={(values.isActive && 'success') || (!values.isActive && 'error') || 'warning'}
                sx={{ position: 'absolute', top: 24, right: 24 }}
              >
                {values.isActive ? 'Active' : 'Inactive'}
              </Label>
            )} */}

            <Box sx={{ mb: 5 }}>
              <Field.UploadAvatar
                name="avatarUrl"
                maxSize={3145728}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                    <br /> max size of {fData(5 * 1024 * 1024)}
                  </Typography>
                }
              />
            </Box>

            {currentUser && (
              <FormControlLabel
                labelPlacement="start"
                control={
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        {...field}
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                      />
                    )}
                  />
                }
                label={
                  <>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Active
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Disabling this will inactive the user account
                    </Typography>
                  </>
                }
                sx={{
                  mx: 0,
                  mb: 3,
                  width: 1,
                  justifyContent: 'space-between',
                }}
              />
            )}

            <Field.Switch
              name="isEmailVerified"
              labelPlacement="start"
              onClick={handleEmailVerifiedChange}
              label={
                <>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Email verified
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Disabling this will automatically send the user a verification email
                  </Typography>
                </>
              }
              sx={{ mx: 0, mb: 3, width: 1, justifyContent: 'space-between' }}
            />

            <Field.Switch
              name="isPhoneVerified"
              labelPlacement="start"
              onClick={handlePhoneVerifiedChange}
              label={
                <>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Phone verified
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Disabling this will automatically send the user a verification SMS
                  </Typography>
                </>
              }
              sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
            />

            {currentUser && (
              <Stack sx={{ mt: 3, alignItems: 'center', justifyContent: 'center' }}>
                <Button variant="soft" color="error" onClick={handleDeleteUserPress}>
                  Delete user
                </Button>
              </Stack>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3 }}>
            <Box
              sx={{
                rowGap: 3,
                columnGap: 2,
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Text name="firstName" label="First Name" />
              <Field.Text name="lastName" label="Last Name" />
              <Field.Text name="email" label="Email address" />
              <Field.Phone name="phone" label="Phone number" />
              <Field.DatePicker name="birthDate" label="Birth date" />
              <Field.Text name="locale" label="Locale" />
              <Field.Text name="timezone" label="Time zone" />
              <Field.MultiSelect checkbox options={userRoleOptions} name="roles" label="Roles" />
              {currentUser && (
                <>
                  <Field.Text name="createdAt" label="Joined At" disabled />
                  <Field.Text name="updatedAt" label="Updated At" disabled />
                </>
              )}
            </Box>

            <Stack spacing={3} sx={{ mt: 3, alignItems: 'flex-end' }}>
              <Field.Text name="bio" multiline rows={4} label="Bio" />

              <Button type="submit" variant="contained" loading={isSubmitting}>
                Save changes
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
