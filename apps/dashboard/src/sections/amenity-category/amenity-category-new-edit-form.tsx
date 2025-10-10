'use client';

import type { IconifyName } from 'src/components/iconify';
import type { AmenityCategoryDataDto, UpdateAmenityCategoryDto } from 'src/api/models';

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

import { useAmenityCategories, useSupportedLanguages } from 'src/contexts/app/use-app-context';
import {
  useAmenityCategoriesControllerCreateV1,
  useAmenityCategoriesControllerUpdateV1,
} from 'src/api/queries/amenity-categories/amenity-categories';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// Dynamic schema creation based on supported languages
export const createAmenityCategorySchema = (supportedLanguages: string[]) => {
  const languageFields = supportedLanguages.reduce(
    (acc, lang) => {
      acc[lang] =
        lang === 'en' ? zod.string().min(1, 'English name is required') : zod.string().optional();
      return acc;
    },
    {} as Record<string, zod.ZodString>
  );

  const descriptionFields = supportedLanguages.reduce(
    (acc, lang) => {
      acc[lang] = zod.string().optional();
      return acc;
    },
    {} as Record<string, zod.ZodOptional<zod.ZodString>>
  );

  return zod.object({
    key: zod.string().min(1, 'Key is required'),
    slug: zod.string().min(1, 'Slug is required'),
    name: zod.object(languageFields),
    description: zod.object(descriptionFields).optional(),
    group: zod.string().optional(),
    icon: zod.string().optional(),
    sortOrder: zod.number().min(0, 'Sort order must be positive'),
    isActive: zod.boolean(),
  });
};

export type NewAmenityCategorySchemaType = zod.infer<
  ReturnType<typeof createAmenityCategorySchema>
>;

// ----------------------------------------------------------------------

const ICON_OPTIONS = [
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

// ----------------------------------------------------------------------

type Props = {
  currentCategory?: AmenityCategoryDataDto;
};

export function AmenityCategoryNewEditForm({ currentCategory }: Props) {
  const router = useRouter();

  // Get supported languages from API
  const supportedLanguagesData = useSupportedLanguages();
  const supportedLanguages = useMemo(() => {
    if (!supportedLanguagesData) return ['en']; // fallback to English only
    // Extract language codes from the API response data field
    if (Array.isArray(supportedLanguagesData)) {
      // If it's an array of language objects, extract codes
      return supportedLanguagesData
        .map((lang) => lang.code || lang.lang || lang.key)
        .filter(Boolean);
    } else if (typeof supportedLanguagesData === 'object') {
      // If it's an object, get the keys
      return Object.keys(supportedLanguagesData);
    }
    return ['en']; // fallback to English only
  }, [supportedLanguagesData]);

  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

  const { mutateAsync: createCategory, isPending: isCreating } =
    useAmenityCategoriesControllerCreateV1();
  const { mutateAsync: updateCategory, isPending: isUpdating } =
    useAmenityCategoriesControllerUpdateV1();

  // Get catalog data for dropdowns
  const existingCategories = useAmenityCategories();

  // Extract unique groups from existing categories
  const groupOptions = useMemo(() => {
    if (!existingCategories) return [];
    const groups = existingCategories
      .map((category) => category.group)
      .filter((group): group is string => Boolean(group))
      .filter((group, index, arr) => arr.indexOf(group) === index)
      .sort();

    return [
      { value: '', label: 'No Group' },
      ...groups.map((group) => ({ value: group, label: group })),
      { value: 'basics', label: 'Basics' },
      { value: 'entertainment', label: 'Entertainment' },
      { value: 'safety', label: 'Safety' },
      { value: 'accessibility', label: 'Accessibility' },
    ].filter(
      (option, index, arr) => arr.findIndex((item) => item.value === option.value) === index
    );
  }, [existingCategories]);

  // Dynamic schema based on supported languages
  const schema = useMemo(
    () => createAmenityCategorySchema(supportedLanguages),
    [supportedLanguages]
  );

  const defaultValues = useMemo(() => {
    // Create dynamic name and description objects based on supported languages
    const nameDefaults = supportedLanguages.reduce(
      (acc, lang) => {
        if (typeof currentCategory?.name === 'object' && currentCategory?.name) {
          acc[lang] = (currentCategory.name as Record<string, string>)[lang] || '';
        } else if (lang === 'en') {
          acc[lang] = (currentCategory?.name as string) || '';
        } else {
          acc[lang] = '';
        }
        return acc;
      },
      {} as Record<string, string>
    );

    const descriptionDefaults = supportedLanguages.reduce(
      (acc, lang) => {
        if (typeof currentCategory?.description === 'object' && currentCategory?.description) {
          acc[lang] = (currentCategory.description as Record<string, string>)[lang] || '';
        } else if (lang === 'en') {
          acc[lang] = (currentCategory?.description as string) || '';
        } else {
          acc[lang] = '';
        }
        return acc;
      },
      {} as Record<string, string>
    );

    const defaults = {
      key: currentCategory?.key || '',
      slug: currentCategory?.slug || '',
      name: nameDefaults,
      description: descriptionDefaults,
      group: currentCategory?.group || '',
      icon: currentCategory?.icon || '',
      sortOrder: currentCategory?.sortOrder || 0,
      isActive: currentCategory?.isActive ?? true,
    };

    return defaults;
  }, [currentCategory, supportedLanguages]);

  const methods = useForm<NewAmenityCategorySchemaType>({
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

  // Reset form when currentCategory changes
  useEffect(() => {
    reset(defaultValues);
  }, [reset, currentCategory, supportedLanguages.length, defaultValues]);

  // Check if a language has content
  const hasLanguageContent = (lang: string) => {
    const name = (values.name as Record<string, string>)?.[lang];
    const description = (values.description as Record<string, string>)?.[lang];
    return (name && name.trim()) || (description && description.trim());
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Check if any language has a description
      const hasDescription =
        data.description && Object.values(data.description).some((desc) => desc && desc.trim());

      const categoryData: UpdateAmenityCategoryDto = {
        name: data.name,
        slug: data.slug.toLowerCase(),
        group: data.group || undefined,
        icon: data.icon || undefined,
        sortOrder: Number(data.sortOrder),
        isActive: Boolean(data.isActive),
        description: hasDescription ? data.description : undefined,
      };

      if (currentCategory) {
        await updateCategory({ id: currentCategory._id, data: categoryData });
        toast.success('Category updated successfully!');
        router.push(paths.dashboard.amenityCategories.list);
      } else {
        await createCategory({
          data: { ...data, description: hasDescription ? data.description : undefined },
        });
        toast.success('Category created successfully!');
        reset();
        router.push(paths.dashboard.amenityCategories.list);
      }
    } catch (error) {
      console.error(error);
      toast.error(currentCategory ? 'Failed to update category' : 'Failed to create category');
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

  const generateSlugFromName = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const generateKeyFromName = (name: string) =>
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '');

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3}>
        <Card>
          <CardHeader
            title="Amenity Category Details"
            subheader={
              currentCategory ? 'Update existing amenity category' : 'Create new amenity category'
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
              <Field.Text
                name="key"
                label="Key"
                placeholder="CATEGORY_KEY"
                helperText="Unique key in UPPER_SNAKE_CASE format"
                disabled={!!currentCategory}
              />
              <Field.Text
                name="slug"
                label="Slug"
                placeholder="category-slug"
                helperText="URL-friendly slug (lowercase with hyphens)"
                disabled={!!currentCategory}
              />
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Language Toggle */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Localized Content
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

              {/* Dynamic Language-specific fields */}
              <Stack spacing={3}>
                <Typography variant="caption" color="text.secondary" sx={{ mt: -2 }}>
                  Currently editing in: <strong>{getLanguageDisplayName(selectedLanguage)}</strong>
                  {selectedLanguage === 'en' ? ' (Required)' : ' (Optional)'}
                </Typography>
                <Field.Text
                  name={`name.${selectedLanguage}`}
                  label={`Name${selectedLanguage === 'en' ? ' *' : ''}`}
                  placeholder="Category Name"
                  helperText={`Enter the category name in ${getLanguageDisplayName(selectedLanguage)}`}
                  onBlur={(e) => {
                    const name = e.target.value;
                    if (name && !currentCategory && selectedLanguage === 'en') {
                      methods.setValue('slug', generateSlugFromName(name));
                      methods.setValue('key', generateKeyFromName(name));
                    }
                  }}
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
                <Field.Text
                  name={`description.${selectedLanguage}`}
                  label="Description"
                  placeholder="Category description..."
                  helperText={`Optional description explaining what this category includes in ${getLanguageDisplayName(selectedLanguage)}`}
                  multiline
                  rows={3}
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
                gridTemplateColumns: { xs: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' },
              }}
            >
              <Field.Text
                select
                name="group"
                label="Group"
                placeholder="Select a group"
                helperText="Optional grouping for organization"
                SelectProps={{ native: false }}
              >
                {groupOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Text>

              <Field.Select
                select
                name="icon"
                label="Icon"
                placeholder="Select an icon"
                helperText="Visual icon for this category"
                SelectProps={{ native: false }}
              >
                <MenuItem value="">No Icon</MenuItem>
                {ICON_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Text
                name="sortOrder"
                label="Sort Order"
                type="number"
                helperText="Lower numbers appear first"
                inputProps={{ min: 0, step: 1 }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={values.isActive}
                    onChange={(event) => methods.setValue('isActive', event.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle2">Active Category</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Category will be visible and available for use
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Stack>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader title="Preview" />
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              How this category will appear:
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
              {values.icon && (
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'primary.contrastText',
                  }}
                >
                  <Iconify icon={values.icon as IconifyName} width={24} />
                </Box>
              )}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {(values.name as Record<string, string>)?.[selectedLanguage] ||
                    (values.name as Record<string, string>)?.en ||
                    'No name'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Key: {values.key || 'NO_KEY'} | Slug: {values.slug || 'no-slug'} | Order:{' '}
                  {values.sortOrder} | Status: {values.isActive ? 'Active' : 'Inactive'}
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
            startIcon={<Iconify icon={currentCategory ? 'eva:edit-fill' : 'eva:plus-fill'} />}
          >
            {currentCategory ? 'Update Category' : 'Create Category'}
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}
