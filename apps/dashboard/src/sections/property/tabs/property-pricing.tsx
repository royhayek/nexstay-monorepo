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

export function PropertyPricing({
  currentProperty,
  methods,
  onSubmit,
  onReset,
  isSubmitting,
}: Props) {
  // Only show pricing section
  const pricingSections = propertyFormSections.filter((section) => section.id === 'pricing');

  return (
    <Card sx={{ p: 3 }}>
      <DynamicForm
        sections={pricingSections}
        methods={methods}
        onSubmit={onSubmit}
        card={false}
        actions={{
          submit: {
            label: currentProperty ? 'Update Pricing' : 'Save Pricing',
            variant: 'contained',
            loading: isSubmitting,
          },
        }}
      />
    </Card>
  );
}
