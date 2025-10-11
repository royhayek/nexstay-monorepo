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

export function PropertyAmenities({
  currentProperty,
  methods,
  onSubmit,
  onReset,
  isSubmitting,
}: Props) {
  // Show features and amenities sections
  const amenitiesSections = propertyFormSections.filter((section) =>
    ['features', 'amenities'].includes(section.id)
  );

  return (
    <Card sx={{ p: 3 }}>
      <DynamicForm
        sections={amenitiesSections}
        methods={methods}
        onSubmit={onSubmit}
        card={false}
        actions={{
          submit: {
            label: currentProperty ? 'Update Amenities' : 'Save Amenities',
            variant: 'contained',
            loading: isSubmitting,
          },
        }}
      />
    </Card>
  );
}
