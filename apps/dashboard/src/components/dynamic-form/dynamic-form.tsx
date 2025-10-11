import type { DynamicFormProps } from './types';

import { Suspense, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';

import { Form } from 'src/components/hook-form';

import { DynamicFormSection } from './dynamic-form-section';
import { DynamicFormActions } from './dynamic-form-actions';
import { DynamicFormErrorBoundary } from './error-boundary';

// ----------------------------------------------------------------------

/**
 * DynamicForm Component
 * 
 * A flexible, configuration-driven form component that renders forms based on
 * a declarative configuration object. Supports complex layouts, conditional fields,
 * field dependencies, and various field types.
 * 
 * @template TFormValues - The shape of the form data
 * 
 * @example
 * ```tsx
 * const formSections = [{
 *   id: 'basic',
 *   title: 'Basic Info',
 *   fields: [
 *     { id: 'name', name: 'name', type: 'text', label: 'Name', required: true },
 *     { id: 'email', name: 'email', type: 'email', label: 'Email' }
 *   ]
 * }];
 * 
 * <DynamicForm
 *   sections={formSections}
 *   methods={methods}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export function DynamicForm<TFormValues extends Record<string, any> = Record<string, any>>({
  sections,
  methods,
  onSubmit,
  onReset,
  actions,
  card = true,
  cardProps,
  containerProps,
  loading = false,
  sx,
}: DynamicFormProps<TFormValues>) {
  const { handleSubmit } = methods;

  const handleFormSubmit = useCallback(
    async (data: TFormValues) => {
      if (onSubmit) {
        try {
          await onSubmit(data);
        } catch (error) {
          console.error('Form submission error:', error);
        }
      }
    },
    [onSubmit]
  );


  // Loading skeleton component
  const FormSkeleton = () => (
    <Stack spacing={3}>
      {[...Array(sections.length)].map((_, index) => (
        <Box key={index}>
          <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
          </Stack>
          {index < sections.length - 1 && <Divider sx={{ my: 3 }} />}
        </Box>
      ))}
    </Stack>
  );

  const formContent = (
    <DynamicFormErrorBoundary>
      <Form methods={methods} onSubmit={handleSubmit(handleFormSubmit)}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Suspense fallback={<FormSkeleton />}>
            <Stack spacing={3} sx={{ width: '100%' }}>
              {sections.map((section, index) => (
                <Box key={section.id} sx={{ width: '100%' }}>
                  <DynamicFormSection
                    section={section}
                    formMethods={methods}
                  />
                  {index < sections.length - 1 && <Divider sx={{ my: 3 }} />}
                </Box>
              ))}

              {actions && (
                <DynamicFormActions
                  actions={actions}
                  formMethods={methods}
                  loading={loading}
                  onReset={onReset}
                />
              )}
            </Stack>
          </Suspense>
        )}
      </Form>
    </DynamicFormErrorBoundary>
  );

  if (card) {
    return (
      <Card {...cardProps} sx={{ ...cardProps?.sx, ...sx }}>
        <Box sx={{ p: 3 }}>
          {formContent}
        </Box>
      </Card>
    );
  }

  return (
    <Box {...containerProps} sx={{ ...containerProps?.sx, ...sx }}>
      {formContent}
    </Box>
  );
}