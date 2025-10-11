import type { UseFormReturn } from 'react-hook-form';
import type { DynamicFormSection as DynamicFormSectionType } from './types';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

import { evaluateCondition } from './utils';
import { DynamicFormField } from './dynamic-form-field';
import { DEFAULT_ROW_GAP, DEFAULT_GRID_CONFIG } from './constants';
import { DynamicFormFieldGroup } from './dynamic-form-field-group';

// ----------------------------------------------------------------------

interface DynamicFormSectionProps {
  section: DynamicFormSectionType;
  formMethods: UseFormReturn<any>;
}

/**
 * DynamicFormSection Component
 * 
 * Renders a form section containing fields and field groups.
 * Supports collapsible sections, conditional rendering, and responsive grid layouts.
 * 
 * @param section - Section configuration object
 * @param formMethods - React Hook Form methods
 */
export function DynamicFormSection({ 
  section, 
  formMethods
}: DynamicFormSectionProps) {
  const { watch } = formMethods;
  const { 
    title, 
    description, 
    fields = [], 
    fieldGroups = [], 
    collapsible, 
    defaultExpanded = true, 
    gridContainer,
    sx 
  } = section;

  const [expanded, setExpanded] = useState(defaultExpanded);

  // Check section condition
  const isSectionVisible = useCallback(() => {
    if (!section.condition) return true;

    const { field, operator, value } = section.condition;
    const fieldValue = watch(field);

    return evaluateCondition(fieldValue, operator, value);
  }, [section.condition, watch]);

  const handleToggle = () => {
    if (collapsible) {
      setExpanded(!expanded);
    }
  };

  if (!isSectionVisible()) {
    return null;
  }

  const sectionContent = (
    <Stack spacing={3} sx={{ width: '100%' }}>
      {/* Regular fields */}
      {fields.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            columnGap: gridContainer?.spacing || DEFAULT_GRID_CONFIG.spacing,
            rowGap: DEFAULT_ROW_GAP,
            gridTemplateColumns: gridContainer?.gridTemplateColumns || DEFAULT_GRID_CONFIG.columns,
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
      )}

      {/* Field groups */}
      {fieldGroups.map((fieldGroup) => (
        <DynamicFormFieldGroup
          key={fieldGroup.id}
          fieldGroup={fieldGroup}
          formMethods={formMethods}
        />
      ))}
    </Stack>
  );

  return (
    <Stack spacing={2} sx={{ width: '100%', ...sx }}>
      {(title || description) && (
        <Stack 
          direction="row" 
          alignItems="center" 
          spacing={1}
          sx={{ cursor: collapsible ? 'pointer' : 'default' }}
          onClick={handleToggle}
        >
          {title && (
            <Typography variant="h6" component="h3">
              {title}
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
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {description}
        </Typography>
      )}

      {collapsible ? (
        <Collapse in={expanded}>
          {description && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              {description}
            </Typography>
          )}
          {sectionContent}
        </Collapse>
      ) : (
        sectionContent
      )}
    </Stack>
  );
}