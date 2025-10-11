import type { UseFormReturn } from 'react-hook-form';
import type { DynamicFormFieldGroup as DynamicFormFieldGroupType } from './types';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

import { DynamicFormField } from './dynamic-form-field';

// ----------------------------------------------------------------------

interface DynamicFormFieldGroupProps {
  fieldGroup: DynamicFormFieldGroupType;
  formMethods: UseFormReturn<any>;
}

export function DynamicFormFieldGroup({ 
  fieldGroup, 
  formMethods
}: DynamicFormFieldGroupProps) {
  const { watch } = formMethods;
  const { label, description, fields, collapsible, defaultExpanded = true, sx, gridContainer } = fieldGroup;

  const [expanded, setExpanded] = useState(defaultExpanded);

  // Check field group condition
  const isGroupVisible = useCallback(() => {
    if (!fieldGroup.condition) return true;

    const { field, operator, value } = fieldGroup.condition;
    const fieldValue = watch(field);

    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'not_equals':
        return fieldValue !== value;
      case 'contains':
        return Array.isArray(fieldValue) ? fieldValue.includes(value) : String(fieldValue).includes(value);
      case 'not_contains':
        return Array.isArray(fieldValue) ? !fieldValue.includes(value) : !String(fieldValue).includes(value);
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      case 'in':
        return Array.isArray(value) ? value.includes(fieldValue) : false;
      case 'not_in':
        return Array.isArray(value) ? !value.includes(fieldValue) : true;
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null || fieldValue === '';
      default:
        return true;
    }
  }, [fieldGroup.condition, watch]);

  const handleToggle = () => {
    if (collapsible) {
      setExpanded(!expanded);
    }
  };

  if (!isGroupVisible()) {
    return null;
  }

  const groupContent = (
    <Box
      sx={{
        display: 'grid',
        columnGap: gridContainer?.spacing || 2,
        rowGap: 3,
        gridTemplateColumns: gridContainer?.gridTemplateColumns || { 
          xs: 'repeat(1, 1fr)', 
          sm: 'repeat(1, 1fr)',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(2, 1fr)',
        },
        ...gridContainer?.sx,
      }}
    >
      {fields.map((field) => (
        <DynamicFormField
          key={field.id}
          field={field}
          formMethods={formMethods}
        />
      ))}
    </Box>
  );

  return (
    <Stack spacing={1} sx={{ width: '100%', ...sx }}>
      {(label || description) && (
        <Stack 
          direction="row" 
          alignItems="center" 
          spacing={1}
          sx={{ cursor: collapsible ? 'pointer' : 'default' }}
          onClick={handleToggle}
        >
          {label && (
            <Typography variant="subtitle2" component="h4">
              {label}
            </Typography>
          )}
          {collapsible && (
            <IconButton size="small">
              <Iconify 
                icon={expanded ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'} 
              />
            </IconButton>
          )}
        </Stack>
      )}
      
      {description && !collapsible && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {description}
        </Typography>
      )}

      {collapsible ? (
        <Collapse in={expanded}>
          {description && (
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
              {description}
            </Typography>
          )}
          {groupContent}
        </Collapse>
      ) : (
        groupContent
      )}
    </Stack>
  );
}