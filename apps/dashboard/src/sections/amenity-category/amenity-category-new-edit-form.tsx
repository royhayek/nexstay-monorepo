'use client';

import type { AmenityCategoryDataDto, CreateAmenityCategoryDto } from 'src/api/models/admin';

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
  useAmenityCategoriesAdminControllerCreate,
  useAmenityCategoriesAdminControllerUpdate,
} from 'src/api/queries/admin/amenity-categories-management/amenity-categories-management';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// Create dynamic schema based on supported languages
const createLanguageFields = () => {
  const nameFields: Record<string, z.ZodOptional<z.ZodString> | z.ZodString> = {};
  const descriptionFields: Record<string, z.ZodOptional<z.ZodString>> = {};

  allLangs.forEach((lang, index) => {
    const fieldName = `name_${lang.value}`;
    const descFieldName = `description_${lang.value}`;
    
    // First language (English) is required, others are optional
    if (index === 0 || lang.value === 'en') {
      nameFields[fieldName] = z.string().min(1, `${lang.label} name is required`);
    } else {
      nameFields[fieldName] = z.string().optional();
    }
    
    descriptionFields[descFieldName] = z.string().optional();
  });

  return { nameFields, descriptionFields };
};

const { nameFields, descriptionFields } = createLanguageFields();

const AmenityCategoryFormSchema = z.object({
  key: z.string().min(1, 'Key is required').regex(/^[A-Z_]+$/, 'Key must be in UPPER_SNAKE_CASE format'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  ...nameFields,
  ...descriptionFields,
  group: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().min(0, 'Sort order must be positive'),
  isActive: z.boolean(),
});

type AmenityCategoryFormValues = z.infer<typeof AmenityCategoryFormSchema>;

// ----------------------------------------------------------------------

const ICON_OPTIONS = [
  { value: '', label: 'No Icon' },
  { value: 'solar:checklist-minimalistic-bold', label: 'Essential' },
  { value: 'solar:tv-bold', label: 'Entertainment' },
  { value: 'solar:shield-check-bold', label: 'Safety' },
  { value: 'solar:accessibility-bold', label: 'Accessibility' },
  { value: 'solar:users-group-rounded-bold', label: 'Family' },
  { value: 'solar:case-bold', label: 'Business' },
  { value: 'solar:crown-bold', label: 'Luxury' },
  { value: 'solar:cup-hot-bold', label: 'Kitchen' },
  { value: 'solar:bath-bold', label: 'Bathroom' },
  { value: 'solar:swimming-bold', label: 'Outdoor' },
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
];

// ----------------------------------------------------------------------

interface AmenityCategoryNewEditFormProps {
  currentCategory?: AmenityCategoryDataDto;
}

export function AmenityCategoryNewEditForm({ currentCategory }: AmenityCategoryNewEditFormProps) {
  const router = useRouter();
  const isEdit = !!currentCategory;
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const defaultValues: AmenityCategoryFormValues = useMemo(() => {
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
        const nameField = `name_${lang.value}`;
        const descField = `description_${lang.value}`;
        
        if (currentCategory) {
          dynamicFields[nameField] = getValue(currentCategory.name, lang.value);
          dynamicFields[descField] = getValue(currentCategory.description, lang.value);
        } else {
          dynamicFields[nameField] = '';
          dynamicFields[descField] = '';
        }
      });

      return dynamicFields;
    };

    const dynamicFields = createDynamicDefaults();

    return {
      key: currentCategory?.key || '',
      slug: currentCategory?.slug || '',
      ...dynamicFields,
      group: currentCategory?.group || '',
      icon: currentCategory?.icon || '',
      sortOrder: currentCategory?.sortOrder || 0,
      isActive: currentCategory?.isActive ?? true,
    } as AmenityCategoryFormValues;
  }, [currentCategory]);

  const methods = useForm<AmenityCategoryFormValues>({
    resolver: zodResolver(AmenityCategoryFormSchema),
    defaultValues,
  });

  const { mutate: createCategory, isPending: isCreating } = useAmenityCategoriesAdminControllerCreate({
    mutation: {
      onSuccess: () => {
        toast.success('Category created successfully');
        router.push(paths.dashboard.amenityCategories.list);
      },
      onError: () => {
        toast.error('Failed to create category');
      },
    },
  });

  const { mutate: updateCategory, isPending: isUpdating } = useAmenityCategoriesAdminControllerUpdate({
    mutation: {
      onSuccess: () => {
        toast.success('Category updated successfully');
        router.push(paths.dashboard.amenityCategories.list);
      },
      onError: () => {
        toast.error('Failed to update category');
      },
    },
  });

  const handleSubmit = (data: AmenityCategoryFormValues) => {
    // Transform dynamic language fields back to API format
    const name: Record<string, string> = {};
    const description: Record<string, string> = {};
    
    allLangs.forEach((lang) => {
      const nameField = `name_${lang.value}` as keyof AmenityCategoryFormValues;
      const descField = `description_${lang.value}` as keyof AmenityCategoryFormValues;
      
      const nameValue = data[nameField] as string;
      const descValue = data[descField] as string;
      
      if (nameValue?.trim()) {
        name[lang.value] = nameValue.trim();
      }
      
      if (descValue?.trim()) {
        description[lang.value] = descValue.trim();
      }
    });

    const payload: CreateAmenityCategoryDto = {
      key: data.key,
      slug: data.slug,
      name,
      ...(Object.keys(description).length > 0 && { description }),
      group: data.group || undefined,
      icon: data.icon || undefined,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    };

    if (isEdit && currentCategory) {
      updateCategory({
        id: currentCategory._id,
        data: payload as any, // UpdateAmenityCategoryDto has same structure
      });
    } else {
      createCategory({ data: payload });
    }
  };


  const handleCancel = useCallback(() => {
    router.push(paths.dashboard.amenityCategories.list);
  }, [router]);

  // Helper function to check if a language has content
  const hasLanguageContent = useCallback((lang: string) => {
    const nameField = `name_${lang}` as keyof AmenityCategoryFormValues;
    const descField = `description_${lang}` as keyof AmenityCategoryFormValues;
    
    const nameValue = methods.watch(nameField) as string;
    const descValue = methods.watch(descField) as string;
    
    return (nameValue && nameValue.trim()) || (descValue && descValue.trim());
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
            title={isEdit ? `Edit Category: ${defaultValues.name_en || 'Unnamed'}` : 'Create New Amenity Category'}
            subheader={isEdit ? 'Update category information' : 'Enter the information for the new amenity category'}
          />

          <Stack spacing={3} sx={{ p: 3 }}>
            {/* Key and Slug Fields */}
            <Box
              sx={{
                display: 'grid',
                columnGap: 2,
                rowGap: 3,
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' },
              }}
            >
              <Field.Text
                name="key"
                label="Key"
                placeholder="WIFI_INTERNET"
                helperText={isEdit 
                  ? 'Key cannot be changed for existing categories'
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

            {/* Language Names Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Category Names
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
                  name={`name_${selectedLanguage}`}
                  label={`Name${selectedLanguage === 'en' ? ' *' : ''}`}
                  placeholder={selectedLanguage === 'en' 
                    ? 'WiFi & Internet' 
                    : selectedLanguage === 'ar' 
                    ? 'واي فاي وإنترنت'
                    : selectedLanguage === 'cn'
                    ? 'Wi-Fi和互联网'
                    : selectedLanguage === 'fr'
                    ? 'Wi-Fi et Internet'
                    : 'WiFi & Internet'}
                  helperText={`Enter the category name in ${getLanguageDisplayName(selectedLanguage)}`}
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
                    ? 'Internet and connectivity amenities...'
                    : selectedLanguage === 'ar'
                    ? 'وسائل الراحة للإنترنت والاتصال...'
                    : selectedLanguage === 'cn'
                    ? '互联网和连接设施...'
                    : selectedLanguage === 'fr'
                    ? 'Commodités Internet et connectivité...'
                    : 'Internet and connectivity amenities...'}
                  helperText={`Enter the category description in ${getLanguageDisplayName(selectedLanguage)}`}
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
                <Field.Select name="group" label="Group" placeholder="Select group">
                  {GROUP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Field.Select>

                <Field.Select name="icon" label="Icon" placeholder="Select icon">
                  {ICON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Field.Select>

                <Field.Text
                  name="sortOrder"
                  label="Sort Order"
                  type="number"
                  placeholder="0"
                  helperText="Lower numbers appear first"
                />
              </Box>
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Status */}
            <Field.Switch
              name="isActive"
              label="Active"
              helperText="When active, this category will be available for use"
            />
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
            {isEdit ? 'Update Category' : 'Create Category'}
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}