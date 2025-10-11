import type { CardProps } from '@mui/material/Card';
import type { OtpMethodAvailabilityDto } from 'src/api/models/admin';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import ListItemText from '@mui/material/ListItemText';
import FormControlLabel from '@mui/material/FormControlLabel';

import { OtpMethodAvailabilityDtoMethod } from 'src/api/models/admin';
import {
  useUsersAdminControllerGetUserPreferences,
  useUsersAdminControllerUpdateUserPreferences,
} from 'src/api/queries/admin/users-management/users-management';

import { toast } from 'src/components/snackbar';
import { Form } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const NOTIFICATIONS = [
  {
    subheader: 'One-Time Password',
    caption: 'OTP methods for account security',
    items: Object.values(OtpMethodAvailabilityDtoMethod).map((method) => ({
      id: method,
      label: method.charAt(0).toUpperCase() + method.slice(1),
    })),
  },
  // {
  //   subheader: 'Application',
  //   caption: 'Donec mi odio, faucibus at, scelerisque quis',
  //   items: [
  //     { id: 'application_news', label: 'News and announcements' },
  //     { id: 'application_product', label: 'Weekly product updates' },
  //     { id: 'application_blog', label: 'Weekly blog digest' },
  //   ],
  // },
];

// ----------------------------------------------------------------------

export function AccountNotifications({ id, sx, ...other }: CardProps) {
  const { data: preferencesData } = useUsersAdminControllerGetUserPreferences(id!, {
    query: { enabled: !!id },
  });
  const { mutate: updatePreferences } = useUsersAdminControllerUpdateUserPreferences();

  const availableMethodsData = preferencesData?.data?.availableMethods || [];

  const selectedOtpMethod = preferencesData?.data?.otpNotificationMethod;

  const isMethodAvailable = (method: string) =>
    availableMethodsData.some(
      (item: OtpMethodAvailabilityDto) => item.method === method && item.enabled
    );

  const methods = useForm({
    defaultValues: { selected: selectedOtpMethod ? [selectedOtpMethod] : [] },
  });

  const {
    setValue,
    watch,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (selectedOtpMethod) {
      setValue('selected', [selectedOtpMethod], { shouldValidate: true });
    } else {
      setValue('selected', [], { shouldValidate: true });
    }
  }, [selectedOtpMethod, setValue]);

  const onSubmit = handleSubmit(async (payload) => {
    try {
      console.log('payload', payload);

      if (!payload.selected || payload.selected.length === 0) {
        toast.error('Please select at least one OTP method');
        return;
      }

      updatePreferences(
        {
          id: id!,
          data: {
            language: preferencesData?.data.language,
            otpNotificationMethod: payload.selected[0],
            timezone: preferencesData?.data.timezone,
          },
        },
        {
          onSuccess: (data) => {
            toast.success(data.message);
          },
        }
      );
    } catch (error) {
      console.error(error);
    }
  });

  const getSelected = (selectedItems: string[], item: string) =>
    selectedItems.includes(item)
      ? selectedItems.filter((value) => value !== item)
      : [...selectedItems, item];

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card
        sx={[
          {
            p: 3,
            gap: 3,
            display: 'flex',
            flexDirection: 'column',
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        {NOTIFICATIONS.map((notification) => (
          <Grid key={notification.subheader} container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <ListItemText
                primary={notification.subheader}
                secondary={notification.caption}
                slotProps={{
                  primary: { sx: { typography: 'h6' } },
                  secondary: { sx: { mt: 0.5 } },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Box
                sx={{
                  p: 3,
                  gap: 1,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'background.neutral',
                }}
              >
                <Controller
                  name="selected"
                  control={control}
                  render={({ field }) => (
                    <>
                      {notification.items.map((item) => (
                        <FormControlLabel
                          key={item.id}
                          label={item.label}
                          labelPlacement="start"
                          control={
                            <Switch
                              checked={field.value.includes(item.id)}
                              disabled={!isMethodAvailable(item.id)}
                              onChange={() => field.onChange(getSelected(values.selected, item.id))}
                              slotProps={{
                                input: {
                                  id: `${item.label}-switch`,
                                  'aria-label': `${item.label} switch`,
                                },
                              }}
                            />
                          }
                          sx={{ m: 0, width: 1, justifyContent: 'space-between' }}
                        />
                      ))}
                    </>
                  )}
                />
              </Box>
            </Grid>
          </Grid>
        ))}

        <Button type="submit" variant="contained" loading={isSubmitting} sx={{ ml: 'auto' }}>
          Save changes
        </Button>
      </Card>
    </Form>
  );
}
