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

export function PropertyGeneral({
  currentProperty,
  methods,
  onSubmit,
  onReset,
  isSubmitting,
}: Props) {
  // Show basic info and images sections
  const generalSections = propertyFormSections.filter((section) =>
    ['basic-info', 'images'].includes(section.id)
  );

  return (
    <Card sx={{ p: 3 }}>
      <DynamicForm
        sections={generalSections}
        methods={methods}
        onSubmit={onSubmit}
        card={false}
        actions={{
          submit: {
            label: currentProperty ? 'Update Property' : 'Create Property',
            variant: 'contained',
            loading: isSubmitting,
          },
        }}
      />
    </Card>
  );
}
