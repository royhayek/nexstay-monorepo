'use client';

import type { DynamicFormSection } from 'src/components/dynamic-form/types';
import type { CreatePayoutDto, PayoutResponseDto } from 'src/api/models/admin';

import { z } from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CreatePayoutDtoType } from 'src/api/models/admin';
import {
  usePayoutsAdminControllerCreatePayoutForHost,
  usePayoutsAdminControllerGetHostEligibleEarnings,
} from 'src/api/queries/admin/payouts-management/payouts-management';

import { toast } from 'src/components/snackbar';
import { DynamicForm } from 'src/components/dynamic-form';

// ----------------------------------------------------------------------

const PayoutFormSchema = z.object({
  hostId: z.string().min(1, 'Host ID is required'),
  payoutMethodId: z.string().min(1, 'Payout method ID is required'),
  type: z.enum(['instant', 'standard', 'manual', 'emergency'], {
    required_error: 'Payout type is required',
  }),
  amount: z.number().min(1, 'Amount must be greater than 0').optional(),
  description: z.string().optional(),
});

type PayoutFormValues = z.infer<typeof PayoutFormSchema>;

// ----------------------------------------------------------------------

interface PayoutNewEditFormProps {
  currentPayout?: PayoutResponseDto;
}

export function PayoutNewEditForm({ currentPayout }: PayoutNewEditFormProps) {
  const router = useRouter();
  const isEdit = !!currentPayout;

  const defaultValues: PayoutFormValues = useMemo(
    () => ({
      hostId: currentPayout?.hostId || '',
      payoutMethodId: currentPayout?.payoutMethodId || '',
      type: currentPayout?.type || 'standard',
      amount: currentPayout?.netAmount?.amount || undefined,
      description: currentPayout?.description || '',
    }),
    [currentPayout]
  );

  const methods = useForm<PayoutFormValues>({
    resolver: zodResolver(PayoutFormSchema),
    defaultValues,
  });

  const { watch } = methods;
  const hostId = watch('hostId');

  // Get eligible earnings for the selected host
  const { data: eligibleEarnings } = usePayoutsAdminControllerGetHostEligibleEarnings(
    hostId || '',
    {
      query: {
        enabled: !!hostId,
      },
    }
  );

  const { mutate: createPayout, isPending: isCreating } =
    usePayoutsAdminControllerCreatePayoutForHost({
      mutation: {
        onSuccess: () => {
          toast.success(isEdit ? 'Payout updated successfully' : 'Payout created successfully');
          router.push(paths.dashboard.payouts.list);
        },
        onError: (error) => {
          toast.error('Failed to save payout');
          console.error('Payout creation error:', error);
        },
      },
    });

  const handleSubmit = (data: PayoutFormValues) => {
    const payload: CreatePayoutDto = {
      payoutMethodId: data.payoutMethodId,
      type: data.type as CreatePayoutDtoType,
      amount: data.amount,
      description: data.description,
    };

    createPayout({
      hostId: data.hostId,
      data: payload,
    });
  };

  const formSections: DynamicFormSection[] = useMemo(
    () => [
      {
        id: 'payout-details',
        title: 'Payout Details',
        description: isEdit ? 'Update payout information' : 'Create a new payout for a host',
        fields: [
          {
            id: 'hostId',
            name: 'hostId',
            label: 'Host ID',
            type: 'text',
            required: true,
            disabled: isEdit,
            gridSize: { xs: 12, md: 6 },
            placeholder: 'Enter host ID...',
            helperText: isEdit ? 'Host ID cannot be changed for existing payouts' : undefined,
          },
          {
            id: 'payoutMethodId',
            name: 'payoutMethodId',
            label: 'Payout Method ID',
            type: 'text',
            required: true,
            gridSize: { xs: 12, md: 6 },
            placeholder: 'Enter payout method ID...',
          },
          {
            id: 'type',
            name: 'type',
            label: 'Payout Type',
            type: 'select',
            required: true,
            gridSize: { xs: 12, md: 6 },
            options: Object.values(CreatePayoutDtoType).map((type) => ({
              value: type,
              label: type.charAt(0).toUpperCase() + type.slice(1),
            })),
          },
          {
            id: 'amount',
            name: 'amount',
            label: 'Amount',
            type: 'number',
            gridSize: { xs: 12, md: 6 },
            placeholder: 'Leave empty for full eligible amount',
            helperText: eligibleEarnings?.totalEarnings
              ? `Eligible earnings: ${eligibleEarnings.totalEarnings} ${eligibleEarnings.currency}`
              : 'Amount will default to all eligible earnings if not specified',
          },
        ],
      },
      {
        id: 'additional-info',
        title: 'Additional Information',
        description: 'Optional details for the payout',
        fields: [
          {
            id: 'description',
            name: 'description',
            label: 'Description',
            type: 'textarea',
            gridSize: { xs: 12 },
            placeholder: 'Enter a description for this payout...',
            rows: 3,
          },
        ],
      },
    ],
    [isEdit, eligibleEarnings]
  );

  const handleCancel = () => {
    router.push(paths.dashboard.payouts.list);
  };

  return (
    <DynamicForm
      title={isEdit ? `Edit Payout: ${currentPayout?.reference}` : 'Create New Payout'}
      sections={formSections}
      methods={methods}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitLabel={isEdit ? 'Update Payout' : 'Create Payout'}
      isSubmitting={isCreating}
    />
  );
}
