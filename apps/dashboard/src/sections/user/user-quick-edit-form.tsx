import type { UserDataDto } from 'src/api/models';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { USER_ROLE_OPTIONS } from 'src/_mock';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type UserQuickEditSchemaType = zod.infer<typeof UserQuickEditSchema>;

export const UserQuickEditSchema = zod.object({
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
  status: zod.string(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  currentUser?: UserDataDto;
};

export function UserQuickEditForm({ currentUser, open, onClose }: Props) {
  const defaultValues: UserQuickEditSchemaType = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    timezone: '',
    locale: '',
    birthDate: null,
    roles: [],
  };

  const methods = useForm<UserQuickEditSchemaType>({
    mode: 'all',
    resolver: zodResolver(UserQuickEditSchema),
    defaultValues,
    values: currentUser,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const promise = new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      reset();
      onClose();

      toast.promise(promise, {
        loading: 'Loading...',
        success: 'Update success!',
        error: 'Update error!',
      });

      await promise;

      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  const isUserVerified = currentUser?.isEmailVerified || currentUser?.isPhoneVerified;

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { maxWidth: 720 },
        },
      }}
    >
      <DialogTitle>Quick update</DialogTitle>

      <Form methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          {!isUserVerified && (
            <Alert variant="outlined" severity="info">
              Account is waiting for confirmation
            </Alert>
          )}

          <Box
            sx={{
              mt: 2,
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
            <Field.Text name="createdAt" label="Joined At" disabled />
            <Field.Text name="updatedAt" label="Updated At" disabled />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit" variant="contained" loading={isSubmitting}>
            Update
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
