import type { DynamicFormField } from './types';

import { GRID_COLUMN_SPANS, CONDITION_OPERATORS } from './constants';

/**
 * Evaluates a condition based on field value and operator
 */
export function evaluateCondition(
  fieldValue: any,
  operator: string,
  conditionValue: any
): boolean {
  switch (operator) {
    case CONDITION_OPERATORS.EQUALS:
      return fieldValue === conditionValue;
    
    case CONDITION_OPERATORS.NOT_EQUALS:
      return fieldValue !== conditionValue;
    
    case CONDITION_OPERATORS.CONTAINS:
      return Array.isArray(fieldValue) 
        ? fieldValue.includes(conditionValue) 
        : String(fieldValue).includes(conditionValue);
    
    case CONDITION_OPERATORS.NOT_CONTAINS:
      return Array.isArray(fieldValue) 
        ? !fieldValue.includes(conditionValue) 
        : !String(fieldValue).includes(conditionValue);
    
    case CONDITION_OPERATORS.GREATER_THAN:
      return Number(fieldValue) > Number(conditionValue);
    
    case CONDITION_OPERATORS.LESS_THAN:
      return Number(fieldValue) < Number(conditionValue);
    
    case CONDITION_OPERATORS.IN:
      return Array.isArray(conditionValue) 
        ? conditionValue.includes(fieldValue) 
        : false;
    
    case CONDITION_OPERATORS.NOT_IN:
      return Array.isArray(conditionValue) 
        ? !conditionValue.includes(fieldValue) 
        : true;
    
    case CONDITION_OPERATORS.EXISTS:
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    
    case CONDITION_OPERATORS.NOT_EXISTS:
      return fieldValue === undefined || fieldValue === null || fieldValue === '';
    
    default:
      return true;
  }
}

/**
 * Calculates the grid column span based on field size configuration
 */
export function calculateGridColumnSpan(field: DynamicFormField): string {
  const gridSize = field.gridSize;
  
  if (!gridSize) {
    return GRID_COLUMN_SPANS.full;
  }
  
  // For medium and larger screens
  if (gridSize.md === 12) {
    return GRID_COLUMN_SPANS.full;
  }
  
  if (gridSize.md === 6) {
    return GRID_COLUMN_SPANS.half;
  }
  
  // Default to half width
  return GRID_COLUMN_SPANS.half;
}

/**
 * Generates grid offset styles based on field configuration
 */
export function generateGridOffset(offset?: DynamicFormField['gridSize']['offset']) {
  if (!offset) return {};
  
  return {
    marginLeft: {
      xs: offset.xs ? `${(offset.xs / 12) * 100}%` : undefined,
      sm: offset.sm ? `${(offset.sm / 12) * 100}%` : undefined,
      md: offset.md ? `${(offset.md / 12) * 100}%` : undefined,
      lg: offset.lg ? `${(offset.lg / 12) * 100}%` : undefined,
      xl: offset.xl ? `${(offset.xl / 12) * 100}%` : undefined,
    }
  };
}

/**
 * Generates grid order styles based on field configuration
 */
export function generateGridOrder(order?: DynamicFormField['gridSize']['order']) {
  if (!order) return {};
  
  return {
    order: {
      xs: order.xs,
      sm: order.sm,
      md: order.md,
      lg: order.lg,
      xl: order.xl,
    }
  };
}

/**
 * Validates if a field should be visible based on its condition
 */
export function isFieldVisible(
  condition: DynamicFormField['condition'],
  getFieldValue: (fieldName: string) => any
): boolean {
  if (!condition) return true;
  
  const { field, operator, value } = condition;
  const fieldValue = getFieldValue(field);
  
  return evaluateCondition(fieldValue, operator, value);
}

/**
 * Groups fields by their type for better organization
 */
export function groupFieldsByType(fields: DynamicFormField[]): Record<string, DynamicFormField[]> {
  return fields.reduce((acc, field) => {
    const type = field.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(field);
    return acc;
  }, {} as Record<string, DynamicFormField[]>);
}

/**
 * Flattens all fields from sections and field groups
 */
export function flattenFormFields(sections: any[]): DynamicFormField[] {
  const fields: DynamicFormField[] = [];
  
  sections.forEach(section => {
    if (section.fields) {
      fields.push(...section.fields);
    }
    
    if (section.fieldGroups) {
      section.fieldGroups.forEach((group: any) => {
        if (group.fields) {
          fields.push(...group.fields);
        }
      });
    }
  });
  
  return fields;
}

/**
 * Validates if all required fields have values
 */
export function validateRequiredFields(
  fields: DynamicFormField[],
  values: Record<string, any>
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  fields.forEach(field => {
    if (field.required && !field.hidden) {
      const value = values[field.name];
      if (value === undefined || value === null || value === '') {
        missingFields.push(field.name);
      }
    }
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}