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

export function PropertyLocation({
  currentProperty,
  methods,
  onSubmit,
  onReset,
  isSubmitting,
}: Props) {
  // Only show location section
  const locationSections = propertyFormSections.filter((section) => section.id === 'location');

  return (
    <Card sx={{ p: 3 }}>
      <DynamicForm
        sections={locationSections}
        methods={methods}
        onSubmit={onSubmit}
        card={false}
        actions={{
          submit: {
            label: currentProperty ? 'Update Location' : 'Save Location',
            variant: 'contained',
            loading: isSubmitting,
          },
        }}
      />
    </Card>
  );
}
