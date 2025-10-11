'use client';

import type { CreateTaxRateDto } from 'src/api/models/admin';

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
  useTaxAdminControllerCreateTaxRate,
  useTaxAdminControllerUpdateTaxRate,
  useTaxAdminControllerGetTaxJurisdictions,
} from 'src/api/queries/admin/tax-management/tax-management';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type TaxRateSchemaType = zod.infer<typeof TaxRateSchema>;

export const TaxRateSchema = zod.object({
  name: zod
    .string()
    .min(1, { message: 'Tax rate name is required!' })
    .max(100, { message: 'Name must be less than 100 characters!' }),
  type: zod.enum(
    [
      'vat',
      'gst',
      'sales_tax',
      'occupancy_tax',
      'tourism_tax',
      'city_tax',
      'service_tax',
      'withholding_tax',
    ],
    {
      message: 'Please select a tax type!',
    }
  ),
  jurisdictionId: zod.string().min(1, { message: 'Jurisdiction is required!' }),
  calculationMethod: zod.enum(['percentage', 'fixed', 'progressive'], {
    message: 'Please select a calculation method!',
  }),
  rate: zod.number().min(0, { message: 'Rate must be positive!' }),
  minimumAmount: zod.number().min(0, { message: 'Minimum amount must be positive!' }).optional(),
  maximumAmount: zod.number().min(0, { message: 'Maximum amount must be positive!' }).optional(),
  fixedAmount: zod.number().min(0, { message: 'Fixed amount must be positive!' }).optional(),
  applicability: zod.enum(['guest', 'host', 'both'], {
    message: 'Please select who pays this tax!',
  }),
  minimumStayDays: zod
    .number()
    .min(0, { message: 'Minimum stay days must be positive!' })
    .optional(),
  maximumStayDays: zod
    .number()
    .min(0, { message: 'Maximum stay days must be positive!' })
    .optional(),
  minimumBookingAmount: zod
    .number()
    .min(0, { message: 'Minimum booking amount must be positive!' })
    .optional(),
  maximumBookingAmount: zod
    .number()
    .min(0, { message: 'Maximum booking amount must be positive!' })
    .optional(),
  priority: zod.number().min(0, { message: 'Priority must be positive!' }).optional(),
  description: zod
    .string()
    .max(500, { message: 'Description must be less than 500 characters!' })
    .optional(),
  registrationNumber: zod
    .string()
    .max(20, { message: 'Registration number must be less than 20 characters!' })
    .optional(),
  remittanceAccount: zod
    .string()
    .max(100, { message: 'Remittance account must be less than 100 characters!' })
    .optional(),
  effectiveFrom: schemaHelper.date({ message: { required: 'Effective from date is required!' } }),
  effectiveTo: schemaHelper.date().optional(),
});

// ----------------------------------------------------------------------

interface TaxRate {
  id: string;
  name: string;
  type: string;
  jurisdictionId: string;
  calculationMethod: string;
  rate: number;
  minimumAmount?: number;
  maximumAmount?: number;
  fixedAmount?: number;
  applicability: string;
  minimumStayDays?: number;
  maximumStayDays?: number;
  minimumBookingAmount?: number;
  maximumBookingAmount?: number;
  priority?: number;
  description?: string;
  registrationNumber?: string;
  remittanceAccount?: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

type Props = {
  currentTaxRate?: TaxRate;
};

export function TaxRateNewEditForm({ currentTaxRate }: Props) {
  const router = useRouter();

  const defaultValues: TaxRateSchemaType = {
    name: '',
    type: 'occupancy_tax',
    jurisdictionId: '',
    calculationMethod: 'percentage',
    rate: 0,
    minimumAmount: undefined,
    maximumAmount: undefined,
    fixedAmount: undefined,
    applicability: 'guest',
    minimumStayDays: undefined,
    maximumStayDays: undefined,
    minimumBookingAmount: undefined,
    maximumBookingAmount: undefined,
    priority: 1,
    description: '',
    registrationNumber: '',
    remittanceAccount: '',
    effectiveFrom: null,
    effectiveTo: null,
  };

  const methods = useForm<TaxRateSchemaType>({
    mode: 'onSubmit',
    resolver: zodResolver(TaxRateSchema),
    defaultValues,
    values: currentTaxRate
      ? {
          ...currentTaxRate,
          effectiveFrom: new Date(currentTaxRate.effectiveFrom),
          effectiveTo: currentTaxRate.effectiveTo ? new Date(currentTaxRate.effectiveTo) : null,
        }
      : undefined,
  });

  const {
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const watchCalculationMethod = watch('calculationMethod');

  const { data: jurisdictionsData } = useTaxAdminControllerGetTaxJurisdictions({});
  const { mutate: createTaxRate } = useTaxAdminControllerCreateTaxRate();
  const { mutate: updateTaxRate } = useTaxAdminControllerUpdateTaxRate();

  const jurisdictionOptions =
    (jurisdictionsData as any)?.data?.items?.map((jurisdiction: any) => ({
      value: jurisdiction.id,
      label: `${jurisdiction.name} (${jurisdiction.code})`,
    })) || [];

  const onSubmit = useCallback(
    async (data: TaxRateSchemaType) => {
      try {
        const payload: CreateTaxRateDto = {
          name: data.name,
          type: data.type as any,
          jurisdictionId: data.jurisdictionId,
          calculationMethod: data.calculationMethod as any,
          rate: data.rate,
          minimumAmount: data.minimumAmount,
          maximumAmount: data.maximumAmount,
          fixedAmount: data.fixedAmount,
          applicability: data.applicability as any,
          minimumStayDays: data.minimumStayDays,
          maximumStayDays: data.maximumStayDays,
          minimumBookingAmount: data.minimumBookingAmount,
          maximumBookingAmount: data.maximumBookingAmount,
          priority: data.priority,
          description: data.description || undefined,
          registrationNumber: data.registrationNumber || undefined,
          remittanceAccount: data.remittanceAccount || undefined,
          effectiveFrom: data.effectiveFrom!.toISOString(),
          effectiveTo: data.effectiveTo?.toISOString(),
        };

        if (currentTaxRate) {
          updateTaxRate(
            { taxRateId: currentTaxRate.id },
            {
              onSuccess: () => {
                toast.success('Tax rate updated successfully!');
                router.push(paths.dashboard.taxAdministration.rates.list);
              },
              onError: (error) => {
                toast.error('Failed to update tax rate');
                console.error('Update error:', error);
              },
            }
          );
        } else {
          createTaxRate(
            { data: payload },
            {
              onSuccess: () => {
                toast.success('Tax rate created successfully!');
                router.push(paths.dashboard.taxAdministration.rates.list);
              },
              onError: (error) => {
                toast.error('Failed to create tax rate');
                console.error('Create error:', error);
              },
            }
          );
        }
      } catch (error) {
        console.error('Form submission error:', error);
        toast.error('An error occurred while saving the tax rate');
      }
    },
    [createTaxRate, updateTaxRate, currentTaxRate, router]
  );

  const taxTypeOptions = [
    { value: 'vat', label: 'VAT (Value Added Tax)' },
    { value: 'gst', label: 'GST (Goods and Services Tax)' },
    { value: 'sales_tax', label: 'Sales Tax' },
    { value: 'occupancy_tax', label: 'Occupancy Tax' },
    { value: 'tourism_tax', label: 'Tourism Tax' },
    { value: 'city_tax', label: 'City Tax' },
    { value: 'service_tax', label: 'Service Tax' },
    { value: 'withholding_tax', label: 'Withholding Tax' },
  ];

  const calculationMethodOptions = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'fixed', label: 'Fixed Amount' },
    { value: 'progressive', label: 'Progressive' },
  ];

  const applicabilityOptions = [
    { value: 'guest', label: 'Guest Pays' },
    { value: 'host', label: 'Host Pays' },
    { value: 'both', label: 'Both Pay' },
  ];

  return (
    <Form methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            {/* Basic Information */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Basic Information
              </Typography>

              <Box
                sx={{
                  rowGap: 3,
                  columnGap: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                }}
              >
                <Field.Text name="name" label="Tax Rate Name" req />

                <Field.Select name="type" label="Tax Type" req options={taxTypeOptions} />

                <Field.Select
                  name="jurisdictionId"
                  label="Tax Jurisdiction"
                  req
                  options={jurisdictionOptions}
                  placeholder="Select jurisdiction..."
                />

                <Field.Select
                  name="calculationMethod"
                  label="Calculation Method"
                  req
                  options={calculationMethodOptions}
                />

                <Field.Text
                  name="rate"
                  label={watchCalculationMethod === 'percentage' ? 'Rate (%)' : 'Rate Amount'}
                  type="number"
                  req
                />

                <Field.Select
                  name="applicability"
                  label="Who Pays"
                  req
                  options={applicabilityOptions}
                />

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Field.Text
                    name="description"
                    label="Description"
                    multiline
                    rows={3}
                    placeholder="Enter tax rate description..."
                  />
                </Box>
              </Box>
            </Card>

            {/* Rate Limits */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Rate Limits & Conditions
              </Typography>

              <Box
                sx={{
                  rowGap: 3,
                  columnGap: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                }}
              >
                <Field.Text
                  name="minimumAmount"
                  label="Minimum Tax Amount"
                  type="number"
                  placeholder="0.00"
                />

                <Field.Text
                  name="maximumAmount"
                  label="Maximum Tax Amount"
                  type="number"
                  placeholder="0.00"
                />

                {watchCalculationMethod === 'fixed' && (
                  <Field.Text
                    name="fixedAmount"
                    label="Fixed Tax Amount"
                    type="number"
                    placeholder="0.00"
                  />
                )}

                <Field.Text
                  name="minimumStayDays"
                  label="Minimum Stay Days"
                  type="number"
                  placeholder="1"
                />

                <Field.Text
                  name="maximumStayDays"
                  label="Maximum Stay Days"
                  type="number"
                  placeholder="30"
                />

                <Field.Text
                  name="minimumBookingAmount"
                  label="Minimum Booking Amount"
                  type="number"
                  placeholder="0.00"
                />

                <Field.Text
                  name="maximumBookingAmount"
                  label="Maximum Booking Amount"
                  type="number"
                  placeholder="0.00"
                />

                <Field.Text
                  name="priority"
                  label="Priority (1 = highest)"
                  type="number"
                  placeholder="1"
                />
              </Box>
            </Card>

            {/* Administrative Details */}
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Administrative Details
              </Typography>

              <Box
                sx={{
                  rowGap: 3,
                  columnGap: 2,
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' },
                }}
              >
                <Field.Text
                  name="registrationNumber"
                  label="Tax Registration Number"
                  placeholder="TAX-123456"
                />

                <Field.Text
                  name="remittanceAccount"
                  label="Remittance Account"
                  placeholder="Account for tax payments"
                />

                <Field.DatePicker name="effectiveFrom" label="Effective From" req />

                <Field.DatePicker name="effectiveTo" label="Effective To" />
              </Box>
            </Card>

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                loading={isSubmitting}
                sx={{ ml: 'auto' }}
              >
                {currentTaxRate ? 'Update Tax Rate' : 'Create Tax Rate'}
              </LoadingButton>

              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push(paths.dashboard.taxAdministration.rates.list)}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Tax Rate Guidelines
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Rate Calculation
                </Typography>
                <Typography variant="body2">
                  • Percentage: Rate as % of booking amount
                  <br />
                  • Fixed: Flat amount per booking
                  <br />• Progressive: Tiered rates based on amount
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Applicability
                </Typography>
                <Typography variant="body2">
                  Choose who is responsible for paying this tax
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Stay Limits
                </Typography>
                <Typography variant="body2">
                  Set minimum/maximum stay days for tax applicability
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Priority
                </Typography>
                <Typography variant="body2">
                  Lower numbers have higher priority when multiple rates apply
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
