import type { UseFormReturn } from 'react-hook-form';
import type { PropertyResponseDto } from 'src/api/models/admin';
import type { UpdatePropertySchemaType } from '../property-form-provider';

import Card from '@mui/material/Card';

import { DynamicForm } from 'src/components/dynamic-form';

import { propertyFormSections } from '../property-form-config';

// ----------------------------------------------------------------------

type Props = {
  currentProperty?: PropertyResponseDto;
  methods: UseFormReturn<UpdatePropertySchemaType>;
  onSubmit: (data: UpdatePropertySchemaType) => void;
  onReset: () => void;
  isSubmitting: boolean;
};

export function PropertyDetails({
  currentProperty,
  methods,
  onSubmit,
  onReset,
  isSubmitting,
}: Props) {
  // Show property details, booking rules, and additional info
  const detailsSections = propertyFormSections.filter((section) =>
    ['property-details', 'booking-rules', 'additional-info'].includes(section.id)
  );

  return (
    <Card sx={{ p: 3 }}>
      <DynamicForm
        sections={detailsSections}
        methods={methods}
        onSubmit={onSubmit}
        card={false}
        actions={{
          submit: {
            label: currentProperty ? 'Update Details' : 'Save Details',
            variant: 'contained',
            loading: isSubmitting,
          },
        }}
      />
    </Card>
  );
}
