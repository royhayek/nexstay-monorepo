'use client';

import type {
  EnumDisplayDataDto,
  CreateEnumDisplayDto,
  UpdateEnumDisplayDto,
} from 'src/api/models';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import ButtonGroup from '@mui/material/ButtonGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CreateEnumDisplayDtoEnumName } from 'src/api/models';
// import { useSupportedLanguages } from 'src/contexts/app/use-app-context';
import {
  useEnumDisplaysControllerCreateV1,
  useEnumDisplaysControllerUpdateV1,
} from 'src/api/queries/enum-displays/enum-displays';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const createEnumDisplaySchema = (supportedLanguages: string[]) => {
  const languageFields = supportedLanguages.reduce(
    (acc, lang) => {
      acc[lang] =
        lang === 'en' ? zod.string().min(1, 'English label is required') : zod.string().optional();
      return acc;
    },
    {} as Record<string, any>
  );

  return zod.object({
    enumName: zod.enum([
      'BookingStatus',
      'PaymentStatus',
      'PaymentTransactionStatus',
      'InvoiceStatus',
      'ReviewType',
      'NotificationStatus',
      'NotificationPriority',
      'DevicePlatform',
      'NotificationChannel',
      'PaymentMethodType',
    ] as const),
    key: zod.string().min(1, 'Key is required'),
    label: zod.object(languageFields),
    sortOrder: zod.number().min(0, 'Sort order must be positive'),
    isVisible: zod.boolean(),
  });
};

export type NewEnumDisplaySchemaType = zod.infer<ReturnType<typeof createEnumDisplaySchema>>;

// ----------------------------------------------------------------------

const ENUM_NAME_OPTIONS = Object.values(CreateEnumDisplayDtoEnumName).map((value) => ({
  value,
  label: value,
}));

// ----------------------------------------------------------------------

type Props = {
  currentEnumDisplay?: EnumDisplayDataDto;
  enumName?: string;
  enumKey?: string;
};

export function EnumDisplayNewEditForm({ currentEnumDisplay, enumName, enumKey }: Props) {
  const router = useRouter();

  // const supportedLanguagesData = useSupportedLanguages();
  const supportedLanguages = useMemo(() => ['en', 'fr', 'ar'], []); // Default supported languages

  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  const { mutateAsync: createEnumDisplay, isPending: isCreating } =
    useEnumDisplaysControllerCreateV1();
  const { mutateAsync: updateEnumDisplay, isPending: isUpdating } =
    useEnumDisplaysControllerUpdateV1();

  const schema = useMemo(() => createEnumDisplaySchema(supportedLanguages), [supportedLanguages]);

  const defaultValues = useMemo(() => {
    const labelDefaults = supportedLanguages.reduce(
      (acc, lang) => {
        if (typeof currentEnumDisplay?.label === 'object' && currentEnumDisplay?.label) {
          acc[lang] = (currentEnumDisplay.label as Record<string, string>)[lang] || '';
        } else if (lang === 'en') {
          acc[lang] = String(currentEnumDisplay?.label) || '';
        } else {
          acc[lang] = '';
        }
        return acc;
      },
      {} as Record<string, string>
    );

    return {
      enumName: (enumName || currentEnumDisplay?.enumName || 'BookingStatus') as any,
      key: enumKey || currentEnumDisplay?.key || '',
      label: labelDefaults,
      sortOrder: currentEnumDisplay?.sortOrder ?? 0,
      isVisible: currentEnumDisplay?.isVisible ?? true,
    };
  }, [currentEnumDisplay, supportedLanguages, enumName, enumKey]);

  const methods = useForm<NewEnumDisplaySchemaType>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    reset,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    reset(defaultValues);
  }, [reset, currentEnumDisplay, supportedLanguages.length, defaultValues]);

  const hasLanguageContent = (lang: string) => {
    const label = (values.label as Record<string, string>)?.[lang];
    return label && label.trim();
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const hasLabels =
        data.label && Object.values(data.label).some((label) => label && label.trim());

      if (currentEnumDisplay) {
        const updateData: UpdateEnumDisplayDto = {
          label: hasLabels ? data.label : undefined,
          sortOrder: Number(data.sortOrder),
          isVisible: Boolean(data.isVisible),
        };

        await updateEnumDisplay({
          enumName: currentEnumDisplay.enumName,
          key: currentEnumDisplay.key,
          data: updateData,
        });
        toast.success('Enum display updated successfully!');
        router.push(paths.dashboard.enumDisplays.list);
      } else {
        const createData: CreateEnumDisplayDto = {
          enumName: data.enumName,
          key: data.key,
          label: hasLabels ? data.label : undefined,
          sortOrder: Number(data.sortOrder),
          isVisible: Boolean(data.isVisible),
        };

        await createEnumDisplay({ data: createData });
        toast.success('Enum display created successfully!');
        reset();
        router.push(paths.dashboard.enumDisplays.list);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        currentEnumDisplay ? 'Failed to update enum display' : 'Failed to create enum display'
      );
    }
  });

  const getLanguageDisplayName = (lang: string) => {
    const languageNames: Record<string, string> = {
      en: 'English',
      fr: 'French',
      ar: 'Arabic',
      es: 'Spanish',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      ja: 'Japanese',
      ko: 'Korean',
      zh: 'Chinese',
      vi: 'Vietnamese',
    };
    return languageNames[lang] || lang.toUpperCase();
  };

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        <Card>
          <CardHeader
            title="Enum Display Configuration"
            subheader={
              currentEnumDisplay
                ? 'Update existing enum display configuration'
                : 'Create new enum display configuration'
            }
          />

          <Stack spacing={3} sx={{ p: 3 }}>
            {/* Basic Information */}
            <Box
              sx={{
                display: 'grid',
                columnGap: 2,
                rowGap: 3,
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Select
                name="enumName"
                label="Enum Name"
                placeholder="Select enum name"
                helperText="System enum name"
                disabled={!!currentEnumDisplay}
              >
                {ENUM_NAME_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Text
                name="key"
                label="Key"
                placeholder="ENUM_KEY"
                helperText="Unique key in UPPER_SNAKE_CASE format"
                disabled={!!currentEnumDisplay}
              />
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Language Labels */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Localized Labels
              </Typography>

              <ButtonGroup size="small" sx={{ mb: 3 }}>
                {supportedLanguages.map((lang) => (
                  <Button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    variant={selectedLanguage === lang ? 'contained' : 'outlined'}
                    sx={{
                      minWidth: 60,
                      position: 'relative',
                      fontWeight: selectedLanguage === lang ? 600 : 400,
                    }}
                  >
                    {lang.toUpperCase()}
                    {hasLanguageContent(lang) && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: 'success.main',
                          position: 'absolute',
                          top: 4,
                          right: 4,
                        }}
                      />
                    )}
                  </Button>
                ))}
              </ButtonGroup>

              <Stack spacing={3}>
                <Typography variant="caption" color="text.secondary" sx={{ mt: -2 }}>
                  Currently editing in: <strong>{getLanguageDisplayName(selectedLanguage)}</strong>
                  {selectedLanguage === 'en' ? ' (Required)' : ' (Optional)'}
                </Typography>
                <Field.Text
                  name={`label.${selectedLanguage}`}
                  label={`Label${selectedLanguage === 'en' ? ' *' : ''}`}
                  placeholder="Display label"
                  helperText={`Enter the display label in ${getLanguageDisplayName(selectedLanguage)}`}
                  fullWidth
                  sx={
                    selectedLanguage === 'ar'
                      ? {
                          '& .MuiInputBase-input': {
                            direction: 'rtl',
                            textAlign: 'right',
                          },
                        }
                      : undefined
                  }
                />
              </Stack>
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Additional Settings */}
            <Box
              sx={{
                display: 'grid',
                columnGap: 2,
                rowGap: 3,
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Text
                name="sortOrder"
                label="Sort Order"
                type="number"
                helperText="Lower numbers appear first"
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={values.isVisible}
                      onChange={(event) => methods.setValue('isVisible', event.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2">Visible</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Display value will be visible in UI
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Box>
          </Stack>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader title="Preview" />
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              How this enum display will appear:
            </Typography>
            <Box
              sx={{
                p: 2,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.neutral',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {(values.label as Record<string, string>)?.[selectedLanguage] ||
                    (values.label as Record<string, string>)?.en ||
                    values.key ||
                    'No label'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Enum: {values.enumName} | Key: {values.key || 'NO_KEY'} | Order:{' '}
                  {values.sortOrder} | Status: {values.isVisible ? 'Visible' : 'Hidden'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>

        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={() => router.back()}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting || isCreating || isUpdating}
            startIcon={
              <Iconify icon={currentEnumDisplay ? 'solar:pen-bold' : 'mingcute:add-line'} />
            }
          >
            {currentEnumDisplay ? 'Update Enum Display' : 'Create Enum Display'}
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}
