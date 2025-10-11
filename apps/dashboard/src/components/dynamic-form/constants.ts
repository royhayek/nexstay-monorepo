/**
 * Dynamic Form Constants
 * Centralized configuration and constants for the dynamic form system
 */

// Default grid configurations
export const DEFAULT_GRID_CONFIG = {
  spacing: 2,
  columns: {
    xs: 'repeat(1, 1fr)',
    sm: 'repeat(1, 1fr)',
    md: 'repeat(2, 1fr)',
    lg: 'repeat(2, 1fr)',
  },
} as const;

// Default row gap for CSS Grid
export const DEFAULT_ROW_GAP = 3;

// Field type groups for organization
export const FIELD_TYPE_GROUPS = {
  text: ['text', 'email', 'password', 'url', 'number'],
  selection: ['select', 'multiselect', 'autocomplete', 'radio', 'checkbox', 'multicheckbox'],
  toggle: ['switch', 'multiswitch'],
  date: ['date', 'datetime', 'time'],
  file: ['upload', 'upload-box', 'upload-avatar'],
  advanced: ['editor', 'code', 'phone', 'country', 'slider', 'rating'],
  complex: ['array', 'object'],
} as const;

// Validation operators
export const CONDITION_OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  IN: 'in',
  NOT_IN: 'not_in',
  EXISTS: 'exists',
  NOT_EXISTS: 'not_exists',
} as const;

// Grid column span calculations
export const GRID_COLUMN_SPANS = {
  full: 'span 2',
  half: 'span 1',
  third: 'span 1',
  twoThirds: 'span 2',
} as const;

// Default form messages
export const FORM_MESSAGES = {
  submitSuccess: 'Form submitted successfully',
  submitError: 'An error occurred while submitting the form',
  validationError: 'Please fix the validation errors',
  resetSuccess: 'Form has been reset',
} as const;