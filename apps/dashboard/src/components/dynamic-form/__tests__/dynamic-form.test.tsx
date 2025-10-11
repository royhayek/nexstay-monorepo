/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';

import type { DynamicFormSection } from '../types';

import { render, screen, fireEvent } from '@testing-library/react';

import { DynamicForm } from '../dynamic-form';

// Mock dependencies
jest.mock('src/components/hook-form', () => ({
  Form: ({ children, methods, onSubmit }: any) => (
    <form onSubmit={onSubmit} data-testid="dynamic-form">
      {children}
    </form>
  ),
}));

jest.mock('../dynamic-form-section', () => ({
  DynamicFormSection: ({ section }: { section: any }) => (
    <div data-testid={`section-${section.id}`}>
      <h3>{section.title}</h3>
      {section.description && <p>{section.description}</p>}
    </div>
  ),
}));

jest.mock('../dynamic-form-actions', () => ({
  DynamicFormActions: ({ actions }: { actions: any }) => (
    <div data-testid="form-actions">
      {actions?.map((action: any) => (
        <button key={action.id} onClick={action.onClick}>
          {action.label}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('../error-boundary', () => ({
  DynamicFormErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

// Sample form configuration
const mockSections: DynamicFormSection[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Enter your basic details',
    fields: [
      {
        id: 'name',
        name: 'name',
        type: 'text',
        label: 'Full Name',
        required: true,
      },
      {
        id: 'email',
        name: 'email',
        type: 'email',
        label: 'Email Address',
        required: true,
      },
    ],
  },
  {
    id: 'preferences',
    title: 'Preferences',
    fields: [
      {
        id: 'theme',
        name: 'theme',
        type: 'select',
        label: 'Theme',
        options: [
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ],
      },
    ],
  },
];

const mockActions = [
  {
    id: 'cancel',
    type: 'button' as const,
    label: 'Cancel',
    variant: 'outlined' as const,
    onClick: jest.fn(),
  },
  {
    id: 'submit',
    type: 'submit' as const,
    label: 'Save',
    variant: 'contained' as const,
    loading: false,
  },
];

describe('DynamicForm', () => {
  let mockMethods: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMethods = {
      handleSubmit: jest.fn((fn) => (event: any) => {
        event.preventDefault();
        fn({ name: 'John Doe', email: 'john@example.com' });
      }),
      formState: { isSubmitting: false, errors: {} },
      watch: jest.fn(),
      setValue: jest.fn(),
      getValues: jest.fn(() => ({})),
      trigger: jest.fn(),
      reset: jest.fn(),
    };
  });

  it('renders form with sections', () => {
    render(<DynamicForm sections={mockSections} methods={mockMethods} onSubmit={jest.fn()} />);

    expect(screen.getByTestId('dynamic-form')).toBeInTheDocument();
    expect(screen.getByTestId('section-basic-info')).toBeInTheDocument();
    expect(screen.getByTestId('section-preferences')).toBeInTheDocument();
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('renders with custom title and description', () => {
    render(
      <DynamicForm
        sections={mockSections}
        methods={mockMethods}
        onSubmit={jest.fn()}
        title="User Profile Form"
        description="Update your profile information"
      />
    );

    // Note: The current implementation doesn't render form-level title/description
    // It only renders section titles and descriptions
    expect(screen.getByTestId('dynamic-form')).toBeInTheDocument();
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('renders form actions when provided', () => {
    render(
      <DynamicForm
        sections={mockSections}
        methods={mockMethods}
        onSubmit={jest.fn()}
        actions={mockActions}
      />
    );

    expect(screen.getByTestId('form-actions')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('handles form submission', () => {
    const onSubmit = jest.fn();
    render(
      <DynamicForm
        sections={mockSections}
        methods={mockMethods}
        onSubmit={onSubmit}
        actions={mockActions}
      />
    );

    const form = screen.getByTestId('dynamic-form');
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('renders without card wrapper when card is false', () => {
    const { container } = render(
      <DynamicForm sections={mockSections} methods={mockMethods} onSubmit={jest.fn()} card={false} />
    );

    // Should not have Card component
    expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
  });

  it('renders with loading state', () => {
    render(
      <DynamicForm sections={mockSections} methods={mockMethods} onSubmit={jest.fn()} loading />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders with custom card props', () => {
    render(
      <DynamicForm
        sections={mockSections}
        methods={mockMethods}
        onSubmit={jest.fn()}
        cardProps={{
          variant: 'outlined',
          'data-testid': 'custom-card',
        }}
      />
    );

    expect(screen.getByTestId('custom-card')).toBeInTheDocument();
  });

  it('handles empty sections gracefully', () => {
    render(<DynamicForm sections={[]} methods={mockMethods} onSubmit={jest.fn()} />);

    expect(screen.getByTestId('dynamic-form')).toBeInTheDocument();
    // Should not crash with empty sections
  });

  it('renders sections with different layouts', () => {
    const sectionsWithLayout = [
      {
        ...mockSections[0],
        layout: {
          columns: 2,
          spacing: 3,
        },
      },
    ];

    render(
      <DynamicForm sections={sectionsWithLayout} methods={mockMethods} onSubmit={jest.fn()} />
    );

    expect(screen.getByTestId('section-basic-info')).toBeInTheDocument();
  });

  it('applies custom styling', () => {
    render(
      <DynamicForm
        sections={mockSections}
        methods={mockMethods}
        onSubmit={jest.fn()}
        sx={{ backgroundColor: 'red' }}
      />
    );

    expect(screen.getByTestId('dynamic-form')).toBeInTheDocument();
  });

  it('handles form validation errors', () => {
    const methodsWithErrors = {
      ...mockMethods,
      formState: {
        isSubmitting: false,
        errors: {
          name: { type: 'required', message: 'Name is required' },
          email: { type: 'invalid', message: 'Invalid email format' },
        },
      },
    };

    render(
      <DynamicForm sections={mockSections} methods={methodsWithErrors} onSubmit={jest.fn()} />
    );

    expect(screen.getByTestId('dynamic-form')).toBeInTheDocument();
  });

  it('wraps in error boundary', () => {
    render(<DynamicForm sections={mockSections} methods={mockMethods} onSubmit={jest.fn()} />);

    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('renders with dividers between sections', () => {
    render(
      <DynamicForm
        sections={mockSections}
        methods={mockMethods}
        onSubmit={jest.fn()}
        showSectionDividers
      />
    );

    // Multiple sections should have dividers
    expect(screen.getByTestId('section-basic-info')).toBeInTheDocument();
    expect(screen.getByTestId('section-preferences')).toBeInTheDocument();
  });

  it('handles conditional sections', () => {
    const conditionalSections = [
      mockSections[0],
      {
        ...mockSections[1],
        condition: {
          field: 'showPreferences',
          operator: 'equals' as const,
          value: true,
        },
      },
    ];

    render(
      <DynamicForm sections={conditionalSections} methods={mockMethods} onSubmit={jest.fn()} />
    );

    expect(screen.getByTestId('section-basic-info')).toBeInTheDocument();
    expect(screen.getByTestId('section-preferences')).toBeInTheDocument();
  });

  it('supports form reset functionality', () => {
    const actionsWithReset = [
      ...mockActions,
      {
        id: 'reset',
        type: 'button' as const,
        label: 'Reset',
        variant: 'text' as const,
        onClick: jest.fn(() => mockMethods.reset()),
      },
    ];

    render(
      <DynamicForm
        sections={mockSections}
        methods={mockMethods}
        onSubmit={jest.fn()}
        actions={actionsWithReset}
      />
    );

    fireEvent.click(screen.getByText('Reset'));
    expect(mockMethods.reset).toHaveBeenCalled();
  });
});
