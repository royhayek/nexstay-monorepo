import type { BoxProps } from '@mui/material/Box';
import type { CardProps } from '@mui/material/Card';
import type { ButtonProps } from '@mui/material/Button';
import type { Theme, SxProps } from '@mui/material/styles';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

// ----------------------------------------------------------------------

export interface DynamicFormFieldBase {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  helperText?: string;
  gridSize?: {
    xs?: number | 'auto';
    sm?: number | 'auto';
    md?: number | 'auto';
    lg?: number | 'auto';
    xl?: number | 'auto';
    offset?: {
      xs?: number;
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
    };
    order?: {
      xs?: number;
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
    };
  };
  sx?: SxProps<Theme>;
  // Conditional rendering
  condition?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
    value: unknown;
  };
  // Field dependencies
  dependsOn?: string[];
  // Field watchers and transformers
  watch?: string[];
  transformer?: (value: unknown, watchedValues: Record<string, unknown>) => unknown;
  // Validation
  validate?: (value: unknown, formValues: Record<string, unknown>) => string | undefined;
}

export interface DynamicFormTextField extends DynamicFormFieldBase {
  type: 'text' | 'email' | 'password' | 'url' | 'number';
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxRows?: number;
  minLength?: number;
  maxLength?: number;
}

export interface DynamicFormSelectField extends DynamicFormFieldBase {
  type: 'select' | 'multiselect';
  options: Array<{
    value: string | number;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  multiple?: boolean;
  // Autocomplete functionality
  autocomplete?: boolean;
  onSearch?: (searchTerm: string) => Promise<Array<{
    value: string | number;
    label: string;
    description?: string;
    disabled?: boolean;
  }>>;
  freeSolo?: boolean;
  loading?: boolean;
  minSearchLength?: number;
  searchDelay?: number;
  noOptionsText?: string;
  loadingText?: string;
}

export interface DynamicFormAutocompleteField extends DynamicFormFieldBase {
  type: 'autocomplete';
  options: Array<{
    value: string | number;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  multiple?: boolean;
  freeSolo?: boolean;
}

export interface DynamicFormCheckboxField extends DynamicFormFieldBase {
  type: 'checkbox' | 'multicheckbox';
  options?: Array<{
    value: string | number;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
}

export interface DynamicFormRadioField extends DynamicFormFieldBase {
  type: 'radio';
  options: Array<{
    value: string | number;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  row?: boolean;
}

export interface DynamicFormSwitchField extends DynamicFormFieldBase {
  type: 'switch' | 'multiswitch';
  options?: Array<{
    value: string | number;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
}

export interface DynamicFormDateField extends DynamicFormFieldBase {
  type: 'date' | 'datetime' | 'time';
  minDate?: Date | string;
  maxDate?: Date | string;
}

export interface DynamicFormUploadField extends DynamicFormFieldBase {
  type: 'upload' | 'upload-box' | 'upload-avatar';
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  // Custom messages
  placeholder?: string; // e.g., "Drop or select image(s)"
  dropMessage?: string; // e.g., "Drop images here or click to..."
}

export interface DynamicFormSliderField extends DynamicFormFieldBase {
  type: 'slider';
  min?: number;
  max?: number;
  step?: number;
  marks?: boolean | Array<{ value: number; label?: string }>;
  valueLabelDisplay?: 'on' | 'off' | 'auto';
}

export interface DynamicFormRatingField extends DynamicFormFieldBase {
  type: 'rating';
  max?: number;
  precision?: number;
  emptyIcon?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface DynamicFormEditorField extends DynamicFormFieldBase {
  type: 'editor';
  placeholder?: string;
  toolbar?: string[];
}

export interface DynamicFormCodeField extends DynamicFormFieldBase {
  type: 'code';
  language?: string;
  theme?: 'light' | 'dark';
}

export interface DynamicFormPhoneField extends DynamicFormFieldBase {
  type: 'phone';
  defaultCountry?: string;
  preferredCountries?: string[];
}

export interface DynamicFormCountryField extends DynamicFormFieldBase {
  type: 'country';
  placeholder?: string;
}

export interface DynamicFormArrayField extends DynamicFormFieldBase {
  type: 'array';
  itemSchema: DynamicFormField;
  minItems?: number;
  maxItems?: number;
  addButtonLabel?: string;
  removeButtonLabel?: string;
  emptyMessage?: string;
  sortable?: boolean;
}

export interface DynamicFormObjectField extends DynamicFormFieldBase {
  type: 'object';
  fields: DynamicFormField[];
  gridContainer?: {
    spacing?: number;
    sx?: SxProps<Theme>;
  };
}

export type DynamicFormField =
  | DynamicFormTextField
  | DynamicFormSelectField
  | DynamicFormAutocompleteField
  | DynamicFormCheckboxField
  | DynamicFormRadioField
  | DynamicFormSwitchField
  | DynamicFormDateField
  | DynamicFormUploadField
  | DynamicFormSliderField
  | DynamicFormRatingField
  | DynamicFormEditorField
  | DynamicFormCodeField
  | DynamicFormPhoneField
  | DynamicFormCountryField
  | DynamicFormArrayField
  | DynamicFormObjectField;

// ----------------------------------------------------------------------

export interface DynamicFormFieldGroup {
  id: string;
  label?: string;
  description?: string;
  fields: DynamicFormField[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  sx?: SxProps<Theme>;
  gridContainer?: {
    spacing?: number;
    gridTemplateColumns?: {
      xs?: string;
      sm?: string;
      md?: string;
      lg?: string;
      xl?: string;
    };
    sx?: SxProps<Theme>;
  };
  condition?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
    value: unknown;
  };
}

export interface DynamicFormSection {
  id: string;
  title?: string;
  description?: string;
  fields?: DynamicFormField[];
  fieldGroups?: DynamicFormFieldGroup[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
  gridContainer?: {
    spacing?: number;
    gridTemplateColumns?: {
      xs?: string;
      sm?: string;
      md?: string;
      lg?: string;
      xl?: string;
    };
    sx?: SxProps<Theme>;
  };
  sx?: SxProps<Theme>;
  condition?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
    value: unknown;
  };
}

// ----------------------------------------------------------------------

export interface DynamicFormActions {
  submit?: {
    label?: string;
    variant?: ButtonProps['variant'];
    color?: ButtonProps['color'];
    size?: ButtonProps['size'];
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    fullWidth?: boolean;
    loading?: boolean;
    disabled?: boolean;
    sx?: SxProps<Theme>;
  };
  reset?: {
    label?: string;
    variant?: ButtonProps['variant'];
    color?: ButtonProps['color'];
    size?: ButtonProps['size'];
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    fullWidth?: boolean;
    disabled?: boolean;
    sx?: SxProps<Theme>;
  };
  cancel?: {
    label?: string;
    variant?: ButtonProps['variant'];
    color?: ButtonProps['color'];
    size?: ButtonProps['size'];
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    fullWidth?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    sx?: SxProps<Theme>;
  };
  custom?: Array<{
    id: string;
    label: string;
    variant?: ButtonProps['variant'];
    color?: ButtonProps['color'];
    size?: ButtonProps['size'];
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    fullWidth?: boolean;
    disabled?: boolean;
    onClick: () => void;
    sx?: SxProps<Theme>;
  }>;
}

// ----------------------------------------------------------------------

export interface DynamicFormProps<TFormValues extends FieldValues = FieldValues> {
  // Core configuration
  sections: DynamicFormSection[];
  methods: UseFormReturn<TFormValues>;
  
  // Form behavior
  onSubmit?: (data: TFormValues) => void | Promise<void>;
  onReset?: () => void;
  
  // Actions
  actions?: DynamicFormActions;
  
  // Styling & layout
  card?: boolean;
  cardProps?: Omit<CardProps, 'children'>;
  containerProps?: BoxProps;
  loading?: boolean;
  
  // Custom styling
  sx?: SxProps<Theme>;
}

// ----------------------------------------------------------------------

export interface DynamicFormFieldProps {
  field: DynamicFormField;
  formMethods: UseFormReturn<FieldValues>;
}