'use client';

import type { DynamicFormSection } from 'src/components/dynamic-form/types';
import type {
  EnumDisplayDataDto,
  CreateEnumDisplayDto,
  UpdateEnumDisplayDto,
} from 'src/api/models/admin';

import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import ButtonGroup from '@mui/material/ButtonGroup';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  useEnumDisplaysAdminControllerCreate,
  useEnumDisplaysAdminControllerUpdate,
} from 'src/api/queries/admin/enum-displays-management/enum-displays-management';

import { toast } from 'src/components/snackbar';
import { DynamicForm } from 'src/components/dynamic-form';

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

export function EnumDisplayDynamicForm({ currentEnumDisplay, enumName, enumKey }: Props) {
  const router = useRouter();

  console.log('currentEnumDisplay, enumName, enumKey', { currentEnumDisplay, enumName, enumKey });

  const supportedLanguages = useMemo(() => ['en', 'fr', 'ar'], []); // Default supported languages
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  const { mutateAsync: createEnumDisplay, isPending: isCreating } =
    useEnumDisplaysAdminControllerCreate();
  const { mutateAsync: updateEnumDisplay, isPending: isUpdating } =
    useEnumDisplaysAdminControllerUpdate();

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

  const onSubmit = async (data: NewEnumDisplaySchemaType) => {
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
  };

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

  // Dynamic form sections configuration
  const formSections: DynamicFormSection[] = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Configure the enum display basic settings',
      gridContainer: {
        spacing: 2,
      },
      fields: [
        {
          id: 'enum-name',
          name: 'enumName',
          type: 'select',
          label: 'Enum Name',
          required: true,
          disabled: !!currentEnumDisplay,
          helperText: 'System enum name',
          options: ENUM_NAME_OPTIONS,
          gridSize: { xs: 12, md: 6 },
        },
        {
          id: 'key',
          name: 'key',
          type: 'text',
          label: 'Key',
          required: true,
          disabled: !!currentEnumDisplay,
          placeholder: 'ENUM_KEY',
          helperText: 'Unique key in UPPER_SNAKE_CASE format',
          gridSize: { xs: 12, md: 6 },
        },
      ],
    },
    {
      id: 'localization',
      title: 'Localized Labels',
      description: 'Set display labels for different languages',
      gridContainer: {
        spacing: 2,
      },
      fields: supportedLanguages.map((lang) => ({
        id: `label-${lang}`,
        name: `label.${lang}`,
        type: 'text',
        label: `${getLanguageDisplayName(lang)} Label${lang === 'en' ? ' *' : ''}`,
        required: lang === 'en',
        placeholder: `Display label in ${getLanguageDisplayName(lang)}`,
        helperText: lang === 'en' ? 'Required' : 'Optional',
        hidden: selectedLanguage !== lang,
        gridSize: { xs: 12 },
        sx:
          lang === 'ar'
            ? {
                '& .MuiInputBase-input': {
                  direction: 'rtl',
                  textAlign: 'right',
                },
              }
            : undefined,
      })),
    },
    {
      id: 'settings',
      title: 'Additional Settings',
      description: 'Configure display order and visibility',
      gridContainer: {
        spacing: 2,
      },
      fields: [
        {
          id: 'sort-order',
          name: 'sortOrder',
          type: 'number',
          label: 'Sort Order',
          required: false,
          helperText: 'Lower numbers appear first',
          gridSize: { xs: 12, md: 6 },
        },
        {
          id: 'is-visible',
          name: 'isVisible',
          type: 'switch',
          label: 'Visible',
          helperText: 'Display value will be visible in UI',
          gridSize: { xs: 12, md: 6 },
        },
      ],
    },
  ];

  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader
          sx={{ p: 3 }}
          title="Enum Display Configuration"
          subheader={
            currentEnumDisplay
              ? 'Update existing enum display configuration'
              : 'Create new enum display configuration'
          }
        />
      </Card>

      {/* Language Selector */}
      <Card>
        <Box sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Select Language to Edit
          </Typography>
          <ButtonGroup size="small" sx={{ mb: 2 }}>
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
          <Typography variant="caption" color="text.secondary" display="block">
            Currently editing in: <strong>{getLanguageDisplayName(selectedLanguage)}</strong>
            {selectedLanguage === 'en' ? ' (Required)' : ' (Optional)'}
          </Typography>
        </Box>
      </Card>

      {/* Dynamic Form */}
      <DynamicForm
        sections={formSections}
        methods={methods}
        onSubmit={onSubmit}
        card
        cardProps={{
          sx: { overflow: 'visible' },
        }}
        actions={{
          submit: {
            label: currentEnumDisplay ? 'Update Enum Display' : 'Create Enum Display',
            loading: isSubmitting || isCreating || isUpdating,
          },
          cancel: {
            label: 'Cancel',
            onClick: () => router.back(),
          },
        }}
      />

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
                Enum: {values.enumName} | Key: {values.key || 'NO_KEY'} | Order: {values.sortOrder}{' '}
                | Status: {values.isVisible ? 'Visible' : 'Hidden'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>
    </Stack>
  );
}
