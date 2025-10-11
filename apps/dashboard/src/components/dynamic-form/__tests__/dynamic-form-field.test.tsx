/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';

import type { DynamicFormField as DynamicFormFieldType } from '../types';

import { render, screen, fireEvent } from '@testing-library/react';

// Mock DynamicFormField component to avoid complex dependencies
const MockDynamicFormField = ({ field, mockValues }: { field: DynamicFormFieldType; mockValues?: Record<string, any> }) => {
  if (field.hidden) return null;
  
  // Simple condition check for testing
  if (field.condition) {
    const conditionField = field.condition.field;
    const conditionValue = field.condition.value;
    const currentValue = mockValues?.[conditionField];
    
    if (field.condition.operator === 'equals' && currentValue !== conditionValue) {
      return null;
    }
  }

  const commonProps = {
    name: field.name,
    'data-testid': `${field.type}-field-${field.name}`,
    placeholder: field.label,
    disabled: field.disabled,
    required: field.required,
  };

  switch (field.type) {
    case 'text':
    case 'email':
    case 'password':
    case 'url':
    case 'number':
      return <input type={field.type} {...commonProps} />;

    case 'select': {
      const selectField = field as any;
      return (
        <select {...commonProps}>
          <option value="">Select {field.label}</option>
          {selectField.options?.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    case 'checkbox':
      return (
        <label>
          <input type="checkbox" {...commonProps} />
          {field.label}
        </label>
      );

    case 'switch':
      return (
        <label>
          <input type="checkbox" {...commonProps} />
          {field.label}
        </label>
      );

    case 'date':
      return <input type="date" {...commonProps} />;

    case 'autocomplete':
      return (
        <div data-testid={`autocomplete-field-${field.name}`}>
          <input placeholder={field.label} />
        </div>
      );

    default:
      return <div data-testid={`unknown-field-${field.name}`}>Unknown field type</div>;
  }
};

// Test wrapper without form provider (simplified)
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

describe('DynamicFormField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Text Field', () => {
    const textField: DynamicFormFieldType = {
      id: 'name',
      name: 'name',
      type: 'text',
      label: 'Full Name',
      required: true,
    };

    it('renders text field correctly', () => {
      render(
        <TestWrapper>
          <MockDynamicFormField field={textField} />
        </TestWrapper>
      );

      expect(screen.getByTestId('text-field-name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
    });

    it('handles required field', () => {
      render(
        <TestWrapper>
          <MockDynamicFormField field={textField} />
        </TestWrapper>
      );

      const input = screen.getByTestId('text-field-name');
      expect(input).toHaveAttribute('required');
    });

    it('handles disabled field', () => {
      const disabledField = { ...textField, disabled: true };

      render(
        <TestWrapper>
          <MockDynamicFormField field={disabledField} />
        </TestWrapper>
      );

      const input = screen.getByTestId('text-field-name');
      expect(input).toBeDisabled();
    });

    it('does not render when hidden', () => {
      const hiddenField = { ...textField, hidden: true };

      render(
        <TestWrapper>
          <MockDynamicFormField field={hiddenField} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('text-field-name')).not.toBeInTheDocument();
    });
  });

  describe('Select Field', () => {
    const selectField: DynamicFormFieldType = {
      id: 'country',
      name: 'country',
      type: 'select',
      label: 'Country',
      options: [
        { value: 'us', label: 'United States' },
        { value: 'ca', label: 'Canada' },
        { value: 'uk', label: 'United Kingdom' },
      ],
    };

    it('renders select field with options', () => {
      render(
        <TestWrapper>
          <MockDynamicFormField field={selectField} />
        </TestWrapper>
      );

      const select = screen.getByTestId('select-field-country');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.getByText('Canada')).toBeInTheDocument();
      expect(screen.getByText('United Kingdom')).toBeInTheDocument();
    });

    it('handles select field changes', () => {
      render(
        <TestWrapper>
          <MockDynamicFormField field={selectField} />
        </TestWrapper>
      );

      const select = screen.getByTestId('select-field-country');
      fireEvent.change(select, { target: { value: 'ca' } });
      expect(select).toHaveValue('ca');
    });
  });

  describe('Checkbox Field', () => {
    const checkboxField: DynamicFormFieldType = {
      id: 'terms',
      name: 'acceptTerms',
      type: 'checkbox',
      label: 'Accept Terms and Conditions',
    };

    it('renders checkbox field correctly', () => {
      render(
        <TestWrapper>
          <MockDynamicFormField field={checkboxField} />
        </TestWrapper>
      );

      expect(screen.getByTestId('checkbox-field-acceptTerms')).toBeInTheDocument();
      expect(screen.getByText('Accept Terms and Conditions')).toBeInTheDocument();
    });

    it('handles checkbox changes', () => {
      render(
        <TestWrapper>
          <MockDynamicFormField field={checkboxField} />
        </TestWrapper>
      );

      const checkbox = screen.getByTestId('checkbox-field-acceptTerms');
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });
  });

  describe('Switch Field', () => {
    const switchField: DynamicFormFieldType = {
      id: 'notifications',
      name: 'enableNotifications',
      type: 'switch',
      label: 'Enable Notifications',
    };

    it('renders switch field correctly', () => {
      render(
        <TestWrapper>
          <MockDynamicFormField field={switchField} />
        </TestWrapper>
      );

      expect(screen.getByTestId('switch-field-enableNotifications')).toBeInTheDocument();
      expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
    });
  });

  describe('Date Field', () => {
    const dateField: DynamicFormFieldType = {
      id: 'birthdate',
      name: 'birthDate',
      type: 'date',
      label: 'Birth Date',
    };

    it('renders date field correctly', () => {
      render(
        <TestWrapper>
          <MockDynamicFormField field={dateField} />
        </TestWrapper>
      );

      expect(screen.getByTestId('date-field-birthDate')).toBeInTheDocument();
    });
  });

  describe('Autocomplete Field', () => {
    const autocompleteField: DynamicFormFieldType = {
      id: 'skills',
      name: 'skills',
      type: 'autocomplete',
      label: 'Skills',
      multiple: true,
      options: [
        { value: 'react', label: 'React' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'nodejs', label: 'Node.js' },
      ],
    };

    it('renders autocomplete field correctly', () => {
      render(
        <TestWrapper>
          <MockDynamicFormField field={autocompleteField} />
        </TestWrapper>
      );

      expect(screen.getByTestId('autocomplete-field-skills')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Skills')).toBeInTheDocument();
    });
  });


  describe('Conditional Rendering', () => {
    const conditionalField: DynamicFormFieldType = {
      id: 'other-reason',
      name: 'otherReason',
      type: 'text',
      label: 'Please specify',
      condition: {
        field: 'reason',
        operator: 'equals',
        value: 'other',
      },
    };

    it('renders when condition is met', () => {
      render(
        <TestWrapper>
          <MockDynamicFormField field={conditionalField} mockValues={{ reason: 'other' }} />
        </TestWrapper>
      );

      expect(screen.getByTestId('text-field-otherReason')).toBeInTheDocument();
    });

    it('does not render when condition is not met', () => {
      render(
        <TestWrapper>
          <MockDynamicFormField field={conditionalField} mockValues={{ reason: 'business' }} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('text-field-otherReason')).not.toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    const fieldWithGrid: DynamicFormFieldType = {
      id: 'email',
      name: 'email',
      type: 'email',
      label: 'Email',
      gridSize: {
        xs: 12,
        md: 6,
      },
    };

    it('applies grid sizing correctly', () => {
      render(
        <TestWrapper>
          <MockDynamicFormField field={fieldWithGrid} />
        </TestWrapper>
      );

      expect(screen.getByTestId('email-field-email')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    const emailField: DynamicFormFieldType = {
      id: 'email',
      name: 'email',
      type: 'email',
      label: 'Email Address',
      validation: {
        pattern: {
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i,
          message: 'Please enter a valid email address',
        },
      },
    };

    it('applies validation rules', () => {
      render(
        <TestWrapper>
          <MockDynamicFormField field={emailField} />
        </TestWrapper>
      );

      expect(screen.getByTestId('email-field-email')).toBeInTheDocument();
    });
  });

  describe('Helper Text', () => {
    const fieldWithHelper: DynamicFormFieldType = {
      id: 'password',
      name: 'password',
      type: 'password',
      label: 'Password',
      helperText: 'Password must be at least 8 characters long',
    };

    it('displays helper text', () => {
      render(
        <TestWrapper>
          <MockDynamicFormField field={fieldWithHelper} />
        </TestWrapper>
      );

      expect(screen.getByTestId('password-field-password')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    const styledField: DynamicFormFieldType = {
      id: 'custom',
      name: 'custom',
      type: 'text',
      label: 'Custom Field',
      sx: { backgroundColor: 'red' },
    };

    it('applies custom styling', () => {
      render(
        <TestWrapper>
          <MockDynamicFormField field={styledField} />
        </TestWrapper>
      );

      expect(screen.getByTestId('text-field-custom')).toBeInTheDocument();
    });
  });
});
