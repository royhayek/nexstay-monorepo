import type { UserDataDto } from 'src/api/models';

import { z as zod } from 'zod';
import { useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
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

import { fData } from 'src/utils/format-number';

import { USER_ROLE_OPTIONS } from 'src/_mock';
import { useStorageControllerUploadProfileImageV1 } from 'src/api/queries/file-storage/file-storage';
import {
  useUsersControllerCreateV1,
  useUsersControllerAdminUpdateUserV1,
  useUsersControllerAdminToggleEmailVerifiedV1,
  useUsersControllerAdminTogglePhoneVerifiedV1,
} from 'src/api/queries/users/users';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type NewUserSchemaType = zod.infer<typeof NewUserSchema>;

export const NewUserSchema = zod.object({
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
  isActive: zod.boolean(),
  isEmailVerified: zod.boolean(),
  isPhoneVerified: zod.boolean(),
  createdAt: schemaHelper.date().optional(),
  updatedAt: schemaHelper.date().optional(),
});

// ----------------------------------------------------------------------

type Props = {
  currentUser?: UserDataDto;
};

export function UserNewEditForm({ currentUser }: Props) {
  const router = useRouter();

  const defaultValues: NewUserSchemaType = {
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
    isActive: true,
    isEmailVerified: false,
    isPhoneVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const methods = useForm<NewUserSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(NewUserSchema),
    defaultValues,
    values: currentUser,
  });

  const {
    reset,
    watch,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const { mutateAsync: uploadAvatar } = useStorageControllerUploadProfileImageV1();
  const { mutate: createUser } = useUsersControllerCreateV1();
  const { mutate: updateUser } = useUsersControllerAdminUpdateUserV1();
  const { mutate: toggleEmailVerified } = useUsersControllerAdminToggleEmailVerifiedV1();
  const { mutate: togglePhoneVerified } = useUsersControllerAdminTogglePhoneVerifiedV1();

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Upload avatar if provided
      let avatarUrl: string = '';
      if (typeof data.avatarUrl !== 'string') {
        const uploadResponse = await uploadAvatar({ data: { file: data.avatarUrl } });
        avatarUrl = uploadResponse.data.url;
      }

      if (currentUser) {
        // Update existing user
        const payload = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          bio: data.bio,
          avatarUrl,
        };

        updateUser({ id: currentUser.id, data: payload });
      } else {
        // Create new user
        const payload = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          bio: data.bio,
          timezone: data.timezone,
          locale: data.locale,
          birthDate: data.birthDate,
          roles: data.roles,
          avatarUrl,
        };

        createUser({ data: payload });
      }

      reset();
      toast.success(currentUser ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.user.list);
    } catch (error) {
      console.error(error);
    }
  });

  const handleDeleteUserPress = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      reset();
      toast.success('Delete success!');
      router.push(paths.dashboard.user.list);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEmailVerifiedChange = useCallback(() => {
    if (currentUser) toggleEmailVerified({ id: currentUser?.id });
  }, [currentUser, toggleEmailVerified]);

  const handlePhoneVerifiedChange = useCallback(() => {
    if (currentUser) togglePhoneVerified({ id: currentUser?.id });
  }, [currentUser, togglePhoneVerified]);

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            {currentUser && (
              <Label
                color={(values.isActive && 'success') || (!values.isActive && 'error') || 'warning'}
                sx={{ position: 'absolute', top: 24, right: 24 }}
              >
                {values.isActive ? 'Active' : 'Inactive'}
              </Label>
            )}

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
                    <br /> max size of {fData(3145728)}
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
              <Field.Text name="firstName" label="First name" />
              <Field.Text name="lastName" label="Last name" />
              <Field.Text name="email" label="Email address" />
              <Field.Phone name="phone" label="Phone number" defaultCountry="US" />
              <Field.Text name="bio" label="Bio" />
              <Field.DatePicker name="birthDate" label="Birth date" />
              <Field.Text name="locale" label="Locale" />
              <Field.Text name="timezone" label="Time zone" />
              <Field.MultiSelect checkbox options={USER_ROLE_OPTIONS} name="roles" label="Roles" />
              {currentUser && (
                <>
                  <Field.Text name="createdAt" label="Joined At" disabled />
                  <Field.Text name="updatedAt" label="Updated At" disabled />
                </>
              )}
            </Box>

            <Stack sx={{ mt: 3, alignItems: 'flex-end' }}>
              <Button type="submit" variant="contained" loading={isSubmitting}>
                {!currentUser ? 'Create user' : 'Save changes'}
              </Button>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
