'use client';

import type { CatalogItemDataDto, CreateCatalogItemDto, UpdateCatalogItemDto } from 'src/api/models/admin';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import ButtonGroup from '@mui/material/ButtonGroup';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { allLangs } from 'src/locales/locales-config';
import {
  useCatalogAdminControllerCreate,
  useCatalogAdminControllerUpdate,
} from 'src/api/queries/admin/catalogs-admin/catalogs-admin';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// Create dynamic schema based on supported languages
const createLanguageFields = () => {
  const labelFields: Record<string, z.ZodOptional<z.ZodString> | z.ZodString> = {};
  const descriptionFields: Record<string, z.ZodOptional<z.ZodString>> = {};

  allLangs.forEach((lang, index) => {
    const fieldName = `label_${lang.value}`;
    const descFieldName = `description_${lang.value}`;

    // First language (English) is required, others are optional
    if (index === 0 || lang.value === 'en') {
      labelFields[fieldName] = z.string().min(1, `${lang.label} label is required`);
    } else {
      labelFields[fieldName] = z.string().optional();
    }

    descriptionFields[descFieldName] = z.string().optional();
  });

  return { labelFields, descriptionFields };
};

const { labelFields, descriptionFields } = createLanguageFields();

const CatalogItemFormSchema = z.object({
  catalogType: z.string().min(1, 'Catalog type is required'),
  key: z.string().min(1, 'Key is required').regex(/^[A-Z_0-9]+$/, 'Key must be in UPPER_SNAKE_CASE format'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  ...labelFields,
  ...descriptionFields,
  group: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().min(0, 'Sort order must be positive').max(9999, 'Sort order must be less than 10000'),
  isVisible: z.boolean(),
  isActive: z.boolean(),
});

type CatalogItemFormValues = z.infer<typeof CatalogItemFormSchema>;

// ----------------------------------------------------------------------

const CATALOG_TYPE_OPTIONS = [
  { value: '', label: 'Select Type' },
  { value: 'PropertyType', label: 'Property Type' },
  { value: 'RoomType', label: 'Room Type' },
  { value: 'BedType', label: 'Bed Type' },
  { value: 'Amenity', label: 'Amenity' },
  { value: 'AmenityCategory', label: 'Amenity Category' },
  { value: 'Currency', label: 'Currency' },
  { value: 'CancellationPolicy', label: 'Cancellation Policy' },
  { value: 'PaymentProvider', label: 'Payment Provider' },
  { value: 'NotificationType', label: 'Notification Type' },
];


const GROUP_OPTIONS = [
  { value: '', label: 'No Group' },
  { value: 'basics', label: 'Basics' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'safety', label: 'Safety' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'family', label: 'Family' },
  { value: 'business', label: 'Business' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'connectivity', label: 'Connectivity' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'heating-cooling', label: 'Heating & Cooling' },
];

// ----------------------------------------------------------------------

interface CatalogItemNewEditFormProps {
  currentCatalogItem?: CatalogItemDataDto;
}

export function CatalogNewEditForm({ currentCatalogItem }: CatalogItemNewEditFormProps) {
  const router = useRouter();
  const isEdit = !!currentCatalogItem;
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Get the display label for edit mode title
  const itemDisplayLabel = useMemo(() => {
    if (!currentCatalogItem) return '';
    if (typeof currentCatalogItem.label === 'object' && currentCatalogItem.label) {
      return currentCatalogItem.label.en || Object.values(currentCatalogItem.label)[0] || 'Unnamed';
    }
    return currentCatalogItem.label || 'Unnamed';
  }, [currentCatalogItem]);

  const defaultValues: CatalogItemFormValues = useMemo(() => {
    // Helper function to extract value from field (handles both string and object types)
    const getValue = (field: any, lang: string) => {
      if (typeof field === 'object' && field) {
        return field[lang] || '';
      }
      return lang === 'en' ? (field || '') : '';
    };

    // Create default values with dynamic language fields
    const createDynamicDefaults = () => {
      const dynamicFields: Record<string, string> = {};

      allLangs.forEach((lang) => {
        const labelField = `label_${lang.value}`;
        const descField = `description_${lang.value}`;

        if (currentCatalogItem) {
          dynamicFields[labelField] = getValue(currentCatalogItem.label, lang.value);
          dynamicFields[descField] = getValue(currentCatalogItem.description, lang.value);
        } else {
          dynamicFields[labelField] = '';
          dynamicFields[descField] = '';
        }
      });

      return dynamicFields;
    };

    const dynamicFields = createDynamicDefaults();

    return {
      catalogType: currentCatalogItem?.catalogType || '',
      key: currentCatalogItem?.key || '',
      slug: currentCatalogItem?.slug || '',
      ...dynamicFields,
      group: currentCatalogItem?.group || '',
      icon: currentCatalogItem?.icon || '',
      sortOrder: currentCatalogItem?.sortOrder || 0,
      isVisible: currentCatalogItem?.isVisible ?? true,
      isActive: currentCatalogItem?.isActive ?? true,
    } as CatalogItemFormValues;
  }, [currentCatalogItem]);

  const methods = useForm<CatalogItemFormValues>({
    resolver: zodResolver(CatalogItemFormSchema),
    defaultValues,
  });

  const { mutate: createCatalogItem, isPending: isCreating } = useCatalogAdminControllerCreate({
    mutation: {
      onSuccess: () => {
        toast.success('Catalog item created successfully');
        router.push(paths.dashboard.catalogs.list);
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to create catalog item');
      },
    },
  });

  const { mutate: updateCatalogItem, isPending: isUpdating } = useCatalogAdminControllerUpdate({
    mutation: {
      onSuccess: () => {
        toast.success('Catalog item updated successfully');
        router.push(paths.dashboard.catalogs.list);
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to update catalog item');
      },
    },
  });

  const handleSubmit = (data: CatalogItemFormValues) => {
    // Transform dynamic language fields back to API format
    const label: Record<string, string> = {};
    const description: Record<string, string> = {};

    allLangs.forEach((lang) => {
      const labelField = `label_${lang.value}` as keyof CatalogItemFormValues;
      const descField = `description_${lang.value}` as keyof CatalogItemFormValues;

      const labelValue = data[labelField] as string;
      const descValue = data[descField] as string;

      if (labelValue?.trim()) {
        label[lang.value] = labelValue.trim();
      }

      if (descValue?.trim()) {
        description[lang.value] = descValue.trim();
      }
    });

    if (isEdit && currentCatalogItem) {
      // Update operation - use UpdateCatalogItemDto (all fields optional, exclude catalogType and key)
      const updatePayload: UpdateCatalogItemDto = {
        slug: data.slug,
        label,
        description: Object.keys(description).length > 0 ? description : undefined,
        group: data.group || undefined,
        icon: data.icon || undefined,
        sortOrder: data.sortOrder,
        isVisible: data.isVisible,
        isActive: data.isActive,
        metadata: {}, // Optional metadata
      };

      updateCatalogItem({
        id: currentCatalogItem._id,
        data: updatePayload,
      });
    } else {
      // Create operation - use CreateCatalogItemDto (includes all required fields)
      const createPayload: CreateCatalogItemDto = {
        catalogType: data.catalogType,
        key: data.key,
        slug: data.slug,
        label,
        description: Object.keys(description).length > 0 ? description : {},
        group: data.group || '',
        icon: data.icon || '',
        sortOrder: data.sortOrder,
        isVisible: data.isVisible,
        isActive: data.isActive,
        metadata: {}, // Required metadata (can be empty object)
      };

      createCatalogItem({ data: createPayload });
    }
  };

  const handleCancel = useCallback(() => {
    router.push(paths.dashboard.catalogs.list);
  }, [router]);

  // Helper function to check if a language has content
  const hasLanguageContent = useCallback((lang: string) => {
    const labelField = `label_${lang}` as keyof CatalogItemFormValues;
    const descField = `description_${lang}` as keyof CatalogItemFormValues;

    const labelValue = methods.watch(labelField) as string;
    const descValue = methods.watch(descField) as string;

    return (labelValue && labelValue.trim()) || (descValue && descValue.trim());
  }, [methods]);

  // Helper function to get language display name
  const getLanguageDisplayName = useCallback((lang: string) => {
    const langConfig = allLangs.find(l => l.value === lang);
    return langConfig?.label || lang.toUpperCase();
  }, []);

  return (
    <Form methods={methods} onSubmit={methods.handleSubmit(handleSubmit)}>
      <Stack spacing={3}>
        {/* Basic Information Card */}
        <Card>
          <CardHeader
            title={isEdit ? `Edit Catalog Item: ${itemDisplayLabel}` : 'Create New Catalog Item'}
            subheader={isEdit ? 'Update catalog item information' : 'Enter the information for the new catalog item'}
          />

          <Stack spacing={3} sx={{ p: 3 }}>
            {/* Catalog Type, Key and Slug Fields */}
            <Box
              sx={{
                display: 'grid',
                columnGap: 2,
                rowGap: 3,
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' },
              }}
            >
              <Field.Autocomplete
                name="catalogType"
                label="Catalog Type"
                placeholder="Select type"
                disabled={isEdit}
                options={CATALOG_TYPE_OPTIONS.map(opt => opt.value)}
                getOptionLabel={(option) => {
                  const typeOption = CATALOG_TYPE_OPTIONS.find(opt => opt.value === option);
                  return typeOption?.label || option || '';
                }}
                renderOption={(props, option) => {
                  const typeOption = CATALOG_TYPE_OPTIONS.find(opt => opt.value === option);
                  return (
                    <li {...props} key={option}>
                      {typeOption?.label || option}
                    </li>
                  );
                }}
                helperText={isEdit
                  ? 'Catalog type cannot be changed for existing items'
                  : 'Select the type of catalog item'}
              />

              <Field.Text
                name="key"
                label="Key"
                placeholder="WIFI_INTERNET"
                helperText={isEdit
                  ? 'Key cannot be changed for existing items'
                  : 'Unique key in UPPER_SNAKE_CASE format'}
                disabled={isEdit}
              />

              <Field.Text
                name="slug"
                label="Slug"
                placeholder="wifi-internet"
                helperText="URL-friendly identifier (lowercase with hyphens)"
              />
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Language Labels Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Item Labels
              </Typography>

              <ButtonGroup size="small" sx={{ mb: 3 }}>
                {allLangs.map((lang) => (
                  <Button
                    key={lang.value}
                    onClick={() => setSelectedLanguage(lang.value)}
                    variant={selectedLanguage === lang.value ? 'contained' : 'outlined'}
                    sx={{
                      minWidth: 60,
                      position: 'relative',
                      fontWeight: selectedLanguage === lang.value ? 600 : 400,
                    }}
                  >
                    {lang.value.toUpperCase()}
                    {hasLanguageContent(lang.value) && (
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

              <Stack spacing={2}>
                <Typography variant="caption" color="text.secondary">
                  Currently editing in: <strong>{getLanguageDisplayName(selectedLanguage)}</strong>
                  {selectedLanguage === 'en' ? ' (Required)' : ' (Optional)'}
                </Typography>

                <Field.Text
                  name={`label_${selectedLanguage}`}
                  label={`Label${selectedLanguage === 'en' ? ' *' : ''}`}
                  placeholder={selectedLanguage === 'en'
                    ? 'WiFi & Internet'
                    : selectedLanguage === 'ar'
                    ? 'واي فاي وإنترنت'
                    : selectedLanguage === 'cn'
                    ? 'Wi-Fi和互联网'
                    : selectedLanguage === 'fr'
                    ? 'Wi-Fi et Internet'
                    : 'WiFi & Internet'}
                  helperText={`Enter the item label in ${getLanguageDisplayName(selectedLanguage)}`}
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

                <Field.Text
                  name={`description_${selectedLanguage}`}
                  label="Description"
                  placeholder={selectedLanguage === 'en'
                    ? 'Description for this catalog item...'
                    : selectedLanguage === 'ar'
                    ? 'وصف لهذا العنصر...'
                    : selectedLanguage === 'cn'
                    ? '该项目的描述...'
                    : selectedLanguage === 'fr'
                    ? 'Description de cet élément...'
                    : 'Description for this catalog item...'}
                  helperText={`Enter the item description in ${getLanguageDisplayName(selectedLanguage)}`}
                  multiline
                  rows={3}
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

            {/* Organization & Display */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Organization & Display
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  columnGap: 2,
                  rowGap: 3,
                  gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' },
                }}
              >
                <Field.Autocomplete
                  name="group"
                  label="Group"
                  placeholder="Select group"
                  options={GROUP_OPTIONS.map(opt => opt.value)}
                  getOptionLabel={(option) => {
                    const groupOption = GROUP_OPTIONS.find(opt => opt.value === option);
                    return groupOption?.label || option || '';
                  }}
                  renderOption={(props, option) => {
                    const groupOption = GROUP_OPTIONS.find(opt => opt.value === option);
                    return (
                      <li {...props} key={option}>
                        {groupOption?.label || option}
                      </li>
                    );
                  }}
                />

                <Field.IconsaxPicker
                  name="icon"
                  label="Icon (Iconsax)"
                  placeholder="Select Iconsax icon"
                  helperText="Compatible with mobile app (iconsax-react-native)"
                />

                <Field.Text
                  name="sortOrder"
                  label="Sort Order"
                  type="number"
                  placeholder="0"
                  helperText="Lower numbers appear first (0-9999)"
                />
              </Box>
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Visibility & Status */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Visibility & Status
              </Typography>

              <Stack spacing={2}>
                <Field.Switch
                  name="isVisible"
                  label="Visible"
                  helperText="When visible, this item will be shown in frontend selections"
                />

                <Field.Switch
                  name="isActive"
                  label="Active"
                  helperText="When active, this item will be available for use"
                />
              </Stack>
            </Box>
          </Stack>
        </Card>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isEdit ? isUpdating : isCreating}
          >
            {isEdit ? 'Update Catalog Item' : 'Create Catalog Item'}
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}
