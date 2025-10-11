'use client';

import type { CreateTaxJurisdictionDto } from 'src/api/models/admin';

import { z as zod } from 'zod';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  useTaxAdminControllerCreateTaxJurisdiction,
  useTaxAdminControllerUpdateTaxJurisdiction,
} from 'src/api/queries/admin/tax-management/tax-management';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type TaxJurisdictionSchemaType = zod.infer<typeof TaxJurisdictionSchema>;

export const TaxJurisdictionSchema = zod.object({
  name: zod
    .string()
    .min(1, { message: 'Jurisdiction name is required!' })
    .max(100, { message: 'Name must be less than 100 characters!' }),
  code: zod
    .string()
    .min(1, { message: 'Jurisdiction code is required!' })
    .max(10, { message: 'Code must be less than 10 characters!' }),
  level: zod.enum(['country', 'state', 'province', 'city', 'county', 'district', 'municipality'], {
    message: 'Please select a jurisdiction level!',
  }),
  country: zod
    .string()
    .min(1, { message: 'Country code is required!' })
    .max(3, { message: 'Country code must be less than 3 characters!' }),
  state: zod
    .string()
    .max(100, { message: 'State name must be less than 100 characters!' })
    .optional(),
  city: zod
    .string()
    .max(100, { message: 'City name must be less than 100 characters!' })
    .optional(),
  postalCode: zod
    .string()
    .max(20, { message: 'Postal code must be less than 20 characters!' })
    .optional(),
  parentJurisdiction: zod.string().optional(),
  description: zod
    .string()
    .max(500, { message: 'Description must be less than 500 characters!' })
    .optional(),
  effectiveFrom: schemaHelper.date({ message: { required: 'Effective from date is required!' } }),
  effectiveTo: schemaHelper.date().optional(),
});

// ----------------------------------------------------------------------

interface TaxJurisdiction {
  id: string;
  name: string;
  code: string;
  level: string;
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
  parentJurisdiction?: string;
  description?: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

type Props = {
  currentJurisdiction?: TaxJurisdiction;
};

export function TaxJurisdictionNewEditForm({ currentJurisdiction }: Props) {
  const router = useRouter();

  const defaultValues: TaxJurisdictionSchemaType = {
    name: '',
    code: '',
    level: 'city',
    country: 'US',
    state: '',
    city: '',
    postalCode: '',
    parentJurisdiction: '',
    description: '',
    effectiveFrom: null,
    effectiveTo: null,
  };

  const methods = useForm<TaxJurisdictionSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(TaxJurisdictionSchema),
    defaultValues,
    values: currentJurisdiction
      ? {
          ...currentJurisdiction,
          effectiveFrom: new Date(currentJurisdiction.effectiveFrom),
          effectiveTo: currentJurisdiction.effectiveTo
            ? new Date(currentJurisdiction.effectiveTo)
            : null,
        }
      : undefined,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const { mutate: createJurisdiction } = useTaxAdminControllerCreateTaxJurisdiction();
  const { mutate: updateJurisdiction } = useTaxAdminControllerUpdateTaxJurisdiction();

  const onSubmit = useCallback(
    async (data: TaxJurisdictionSchemaType) => {
      try {
        const payload: CreateTaxJurisdictionDto = {
          name: data.name,
          code: data.code,
          level: data.level as any,
          country: data.country,
          state: data.state || undefined,
          city: data.city || undefined,
          postalCode: data.postalCode || undefined,
          parentJurisdiction: data.parentJurisdiction || undefined,
          description: data.description || undefined,
          effectiveFrom: data.effectiveFrom!.toISOString(),
          effectiveTo: data.effectiveTo?.toISOString(),
        };

        if (currentJurisdiction) {
          updateJurisdiction(
            { jurisdictionId: currentJurisdiction.id },
            {
              onSuccess: () => {
                toast.success('Tax jurisdiction updated successfully!');
                router.push(paths.dashboard.taxAdministration.jurisdictions.list);
              },
              onError: (error) => {
                toast.error('Failed to update tax jurisdiction');
                console.error('Update error:', error);
              },
            }
          );
        } else {
          createJurisdiction(
            { data: payload },
            {
              onSuccess: () => {
                toast.success('Tax jurisdiction created successfully!');
                router.push(paths.dashboard.taxAdministration.jurisdictions.list);
              },
              onError: (error) => {
                toast.error('Failed to create tax jurisdiction');
                console.error('Create error:', error);
              },
            }
          );
        }
      } catch (error) {
        console.error('Form submission error:', error);
        toast.error('An error occurred while saving the tax jurisdiction');
      }
    },
    [createJurisdiction, updateJurisdiction, currentJurisdiction, router]
  );

  const jurisdictionLevelOptions = [
    { value: 'country', label: 'Country' },
    { value: 'state', label: 'State' },
    { value: 'province', label: 'Province' },
    { value: 'city', label: 'City' },
    { value: 'county', label: 'County' },
    { value: 'district', label: 'District' },
    { value: 'municipality', label: 'Municipality' },
  ];

  const countryOptions = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'ES', label: 'Spain' },
    { value: 'IT', label: 'Italy' },
    { value: 'AU', label: 'Australia' },
  ];

  return (
    <Form methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
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
              <Field.Text name="name" label="Jurisdiction Name" req />

              <Field.Text name="code" label="Jurisdiction Code" req />

              <Field.Select
                name="level"
                label="Jurisdiction Level"
                req
                options={jurisdictionLevelOptions}
              />

              <Field.Select name="country" label="Country" req options={countryOptions} />

              <Field.Text name="state" label="State/Province" />

              <Field.Text name="city" label="City" />

              <Field.Text name="postalCode" label="Postal Code" />

              <Field.Text name="parentJurisdiction" label="Parent Jurisdiction ID" />

              <Field.DatePicker name="effectiveFrom" label="Effective From" req />

              <Field.DatePicker name="effectiveTo" label="Effective To" />

              <Box sx={{ gridColumn: '1 / -1' }}>
                <Field.Text
                  name="description"
                  label="Description"
                  multiline
                  rows={3}
                  placeholder="Enter jurisdiction description..."
                />
              </Box>
            </Box>

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                loading={isSubmitting}
                sx={{ ml: 'auto' }}
              >
                {currentJurisdiction ? 'Update Jurisdiction' : 'Create Jurisdiction'}
              </LoadingButton>

              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push(paths.dashboard.taxAdministration.jurisdictions.list)}
              >
                Cancel
              </Button>
            </Stack>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Guidelines
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Jurisdiction Code
                </Typography>
                <Typography variant="body2">
                  Use standard codes (e.g., US-CA for California, UK-LON for London)
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Hierarchy
                </Typography>
                <Typography variant="body2">
                  Create jurisdictions in proper hierarchy: Country → State → City
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Effective Dates
                </Typography>
                <Typography variant="body2">
                  Set proper effective dates to ensure tax compliance
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
