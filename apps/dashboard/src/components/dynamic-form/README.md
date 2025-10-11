# Dynamic Form System

A professional, configuration-driven form system for React applications built with Material-UI and React Hook Form.

## Features

- 🎯 **Type-Safe**: Full TypeScript support with proper type definitions
- 🎨 **Flexible Layout**: CSS Grid-based responsive layouts
- 🔧 **Extensible**: Support for 20+ field types out of the box
- 📱 **Responsive**: Mobile-first design with breakpoint support
- 🎭 **Conditional Logic**: Show/hide fields based on other field values
- 🔄 **Field Dependencies**: Transform field values based on other fields
- 🧩 **Modular**: Composable sections and field groups
- 🛡️ **Error Boundaries**: Graceful error handling
- ⚡ **Performance**: Built-in loading states and optimizations
- 🎪 **Validation**: Integrated with Zod schema validation

## Basic Usage

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DynamicForm, type DynamicFormSection } from 'src/components/dynamic-form';

// Define your schema
const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18'),
});

type FormData = z.infer<typeof schema>;

// Define form configuration
const formSections: DynamicFormSection[] = [
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Please provide your basic information',
    fields: [
      {
        id: 'first-name',
        name: 'firstName',
        type: 'text',
        label: 'First Name',
        required: true,
        gridSize: { xs: 12, md: 6 },
      },
      {
        id: 'email',
        name: 'email',
        type: 'email',
        label: 'Email Address',
        required: true,
        gridSize: { xs: 12, md: 6 },
      },
      {
        id: 'age',
        name: 'age',
        type: 'number',
        label: 'Age',
        required: true,
        gridSize: { xs: 12, md: 6 },
      },
    ],
  },
];

function MyForm() {
  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      email: '',
      age: undefined,
    },
  });

  const handleSubmit = async (data: FormData) => {
    console.log('Form submitted:', data);
    // Handle form submission
  };

  return (
    <DynamicForm
      sections={formSections}
      methods={methods}
      onSubmit={handleSubmit}
      actions={{
        submit: {
          label: 'Submit Form',
          loading: methods.formState.isSubmitting,
        },
        cancel: {
          label: 'Cancel',
          onClick: () => console.log('Cancelled'),
        },
      }}
    />
  );
}
```

## Advanced Features

### Conditional Fields

```tsx
const conditionalFields: DynamicFormSection[] = [
  {
    id: 'conditional-example',
    title: 'Conditional Logic Example',
    fields: [
      {
        id: 'user-type',
        name: 'userType',
        type: 'select',
        label: 'User Type',
        options: [
          { value: 'individual', label: 'Individual' },
          { value: 'business', label: 'Business' },
        ],
      },
      {
        id: 'company-name',
        name: 'companyName',
        type: 'text',
        label: 'Company Name',
        condition: {
          field: 'userType',
          operator: 'equals',
          value: 'business',
        },
      },
    ],
  },
];
```

### Field Dependencies and Transformations

```tsx
const dependentFields: DynamicFormSection[] = [
  {
    id: 'dependent-example',
    title: 'Field Dependencies',
    fields: [
      {
        id: 'first-name',
        name: 'firstName',
        type: 'text',
        label: 'First Name',
      },
      {
        id: 'last-name',
        name: 'lastName',
        type: 'text',
        label: 'Last Name',
      },
      {
        id: 'full-name',
        name: 'fullName',
        type: 'text',
        label: 'Full Name',
        disabled: true,
        watch: ['firstName', 'lastName'],
        transformer: (currentValue, watchedValues) => {
          const { firstName, lastName } = watchedValues;
          return `${firstName || ''} ${lastName || ''}`.trim();
        },
      },
    ],
  },
];
```

### Custom Grid Layouts

```tsx
const customLayoutSection: DynamicFormSection[] = [
  {
    id: 'custom-layout',
    title: 'Custom Layout',
    gridContainer: {
      spacing: 3,
      gridTemplateColumns: {
        xs: 'repeat(1, 1fr)',
        md: 'repeat(3, 1fr)', // 3 columns on desktop
        lg: 'repeat(4, 1fr)', // 4 columns on large screens
      },
    },
    fields: [
      {
        id: 'field-1',
        name: 'field1',
        type: 'text',
        label: 'Field 1',
        gridSize: { xs: 12, md: 6, lg: 8 }, // Responsive sizing
      },
      {
        id: 'field-2',
        name: 'field2',
        type: 'text',
        label: 'Field 2',
        gridSize: { xs: 12, md: 6, lg: 4 },
      },
    ],
  },
];
```

### Collapsible Sections

```tsx
const collapsibleSections: DynamicFormSection[] = [
  {
    id: 'advanced-settings',
    title: 'Advanced Settings',
    description: 'Optional configuration settings',
    collapsible: true,
    defaultExpanded: false,
    fields: [
      // Your advanced fields here
    ],
  },
];
```

## Field Types

The system supports the following field types:

- **Text Fields**: `text`, `email`, `password`, `url`, `number`
- **Selection**: `select`, `multiselect`, `autocomplete`, `radio`
- **Checkboxes**: `checkbox`, `multicheckbox`
- **Toggles**: `switch`, `multiswitch`
- **Date/Time**: `date`, `datetime`, `time`
- **File Upload**: `upload`, `upload-box`, `upload-avatar`
- **Advanced**: `editor`, `code`, `phone`, `country`, `slider`, `rating`
- **Complex**: `array`, `object` (planned)

## API Reference

### DynamicForm Props

| Prop | Type | Description |
|------|------|-------------|
| `sections` | `DynamicFormSection[]` | Form configuration sections |
| `methods` | `UseFormReturn` | React Hook Form methods |
| `onSubmit` | `(data) => void \| Promise<void>` | Form submission handler |
| `onReset` | `() => void` | Form reset handler |
| `actions` | `DynamicFormActions` | Form action buttons configuration |
| `card` | `boolean` | Wrap form in Material-UI Card |
| `loading` | `boolean` | Show loading state |

### DynamicFormSection

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | Unique section identifier |
| `title` | `string` | Section title |
| `description` | `string` | Section description |
| `fields` | `DynamicFormField[]` | Section fields |
| `fieldGroups` | `DynamicFormFieldGroup[]` | Grouped fields |
| `collapsible` | `boolean` | Make section collapsible |
| `defaultExpanded` | `boolean` | Default expansion state |
| `condition` | `FieldCondition` | Show/hide condition |

## Best Practices

1. **Type Safety**: Always define proper TypeScript types for your form data
2. **Validation**: Use Zod schemas for comprehensive validation
3. **Performance**: Use React.memo() for complex field components
4. **Accessibility**: Provide proper labels and ARIA attributes
5. **Error Handling**: Implement proper error boundaries
6. **Testing**: Write unit tests for your form configurations

## Error Handling

The system includes built-in error boundaries and graceful error handling:

```tsx
<DynamicForm
  sections={sections}
  methods={methods}
  onSubmit={handleSubmit}
  // Error boundary is automatically included
/>
```

## Contributing

When adding new field types or features:

1. Update the `DynamicFormField` types in `types.ts`
2. Add the field rendering logic in `dynamic-form-field.tsx`
3. Add constants to `constants.ts` if needed
4. Update utilities in `utils.ts` for helper functions
5. Add documentation and examples

## License

This component is part of the internal component library and follows the project's license terms.