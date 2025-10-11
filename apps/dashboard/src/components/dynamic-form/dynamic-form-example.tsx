import type { DynamicFormSection } from './types';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { DynamicForm } from './dynamic-form';

// ----------------------------------------------------------------------

// Example validation schema
const formSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  age: z.number().min(18, 'Must be at least 18 years old'),
  country: z.string().min(1, 'Country is required'),
  bio: z.string().optional(),
  interests: z.array(z.string()).optional(),
  newsletter: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Example form configuration
const formSections: DynamicFormSection[] = [
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Please provide your basic information',
    fields: [
      {
        id: 'firstName',
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        required: true,
        gridSize: { xs: 12, md: 6 },
      },
      {
        id: 'lastName',
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        required: true,
        gridSize: { xs: 12, md: 6 },
      },
      {
        id: 'email',
        name: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
        gridSize: { xs: 12 },
      },
      {
        id: 'phone',
        name: 'phone',
        label: 'Phone Number',
        type: 'phone',
        gridSize: { xs: 12, md: 6 },
        defaultCountry: 'US',
      },
      {
        id: 'age',
        name: 'age',
        label: 'Age',
        type: 'number',
        required: true,
        gridSize: { xs: 12, md: 6 },
      },
    ],
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Tell us about your preferences',
    fields: [
      {
        id: 'country',
        name: 'country',
        label: 'Country',
        type: 'country',
        required: true,
        gridSize: { xs: 12, md: 6 },
      },
      {
        id: 'interests',
        name: 'interests',
        label: 'Interests',
        type: 'multiselect',
        options: [
          { value: 'travel', label: 'Travel' },
          { value: 'sports', label: 'Sports' },
          { value: 'music', label: 'Music' },
          { value: 'technology', label: 'Technology' },
          { value: 'food', label: 'Food & Cooking' },
        ],
        gridSize: { xs: 12, md: 6 },
      },
      {
        id: 'bio',
        name: 'bio',
        label: 'Bio',
        type: 'text',
        multiline: true,
        rows: 4,
        placeholder: 'Tell us about yourself...',
        gridSize: { xs: 12 },
      },
      {
        id: 'rating',
        name: 'rating',
        label: 'Rate your experience',
        type: 'rating',
        max: 5,
        precision: 0.5,
        gridSize: { xs: 12, md: 6 },
      },
      {
        id: 'newsletter',
        name: 'newsletter',
        label: 'Subscribe to newsletter',
        type: 'switch',
        gridSize: { xs: 12, md: 6 },
      },
    ],
  },
];

// ----------------------------------------------------------------------

export function DynamicFormExample() {
  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      age: 18,
      country: '',
      bio: '',
      interests: [],
      newsletter: false,
      rating: 0,
    },
  });

  const handleSubmit = async (data: FormValues) => {
    console.log('Form submitted:', data);
    // Handle form submission here
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
  };

  const handleReset = () => {
    console.log('Form reset');
  };

  const handleFieldChange = (fieldName: any, value: any) => {
    console.log(`Field ${fieldName} changed to:`, value);
  };

  const handleCancel = () => {
    console.log('Form cancelled');
  };

  return (
    <DynamicForm<FormValues>
      sections={formSections}
      methods={methods}
      onSubmit={handleSubmit}
      onReset={handleReset}
      onFieldChange={handleFieldChange}
      loading={methods.formState.isSubmitting}
      actions={{
        submit: {
          label: 'Submit Form',
          loading: methods.formState.isSubmitting,
        },
        reset: {
          label: 'Reset Form',
        },
        cancel: {
          label: 'Cancel',
          onClick: handleCancel,
        },
        custom: [
          {
            id: 'save-draft',
            label: 'Save Draft',
            variant: 'outlined',
            color: 'secondary',
            onClick: () => console.log('Draft saved'),
          },
        ],
      }}
      card
      cardProps={{
        sx: { maxWidth: 800, mx: 'auto' },
      }}
    />
  );
}