import type {
  DynamicFormCodeField,
  DynamicFormDateField,
  DynamicFormTextField,
  DynamicFormFieldProps,
  DynamicFormPhoneField,
  DynamicFormRadioField,
  DynamicFormEditorField,
  DynamicFormRatingField,
  DynamicFormSelectField,
  DynamicFormSliderField,
  DynamicFormSwitchField,
  DynamicFormUploadField,
  DynamicFormCountryField,
  DynamicFormCheckboxField,
  DynamicFormAutocompleteField,
} from './types';

import { memo, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

import { Field } from 'src/components/hook-form';

import {
  evaluateCondition,
  generateGridOrder,
  generateGridOffset,
  calculateGridColumnSpan,
} from './utils';

// Custom hook for autocomplete functionality
const useAutocomplete = (
  onSearch?: (searchTerm: string) => Promise<Array<{ value: string | number; label: string; disabled?: boolean }>>,
  searchDelay = 300,
  minSearchLength = 1
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOptions, setSearchOptions] = useState<Array<{ value: string | number; label: string; disabled?: boolean }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(
    async (inputValue: string) => {
      if (!onSearch || inputValue.length < minSearchLength) {
        setSearchOptions([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await onSearch(inputValue);
        setSearchOptions(results);
      } catch (error) {
        console.error('Autocomplete search error:', error);
        setSearchOptions([]);
      } finally {
        setIsSearching(false);
      }
    },
    [onSearch, minSearchLength]
  );

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchTerm);
    }, searchDelay);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchDelay, handleSearch]);

  return {
    searchTerm,
    setSearchTerm,
    searchOptions,
    isSearching,
  };
};

// ----------------------------------------------------------------------

/**
 * DynamicFormField Component
 *
 * Renders individual form fields based on field configuration.
 * Supports conditional rendering, field dependencies, and transformations.
 *
 * @param field - Field configuration object
 * @param formMethods - React Hook Form methods
 */
const DynamicFormFieldComponent = ({ field, formMethods }: DynamicFormFieldProps) => {
  const { watch, setValue } = formMethods;

  // Memoize field properties to prevent infinite loops
  const fieldTransformer = useMemo(() => field.transformer, [field.transformer]);
  const fieldWatchFields = useMemo(() => field.watch, [field.watch]);
  const fieldName = useMemo(() => field.name, [field.name]);

  // Watch field dependencies with useMemo to prevent re-creation on every render
  const watchedFields = useMemo(
    () => (fieldWatchFields ? watch(fieldWatchFields) : []),
    [fieldWatchFields, watch]
  );

  // Initialize autocomplete hook conditionally at component level
  const isSelectWithAutocomplete = 
    (field.type === 'select' || field.type === 'multiselect') && 
    'autocomplete' in field && 
    field.autocomplete;

  const selectField = isSelectWithAutocomplete ? field as any : null;

  const autocompleteHookResult = useAutocomplete(
    isSelectWithAutocomplete ? selectField?.onSearch : undefined,
    isSelectWithAutocomplete ? selectField?.searchDelay : 300,
    isSelectWithAutocomplete ? selectField?.minSearchLength : 1
  );

  // Handle field transformations
  useEffect(() => {
    if (fieldTransformer && fieldWatchFields) {
      const watchedValues: Record<string, unknown> = {};
      fieldWatchFields.forEach((watchFieldName, index) => {
        watchedValues[watchFieldName] = watchedFields[index];
      });

      const currentValue = watch(fieldName);
      const transformedValue = fieldTransformer(currentValue, watchedValues);

      if (transformedValue !== currentValue) {
        setValue(fieldName, transformedValue, { shouldValidate: false, shouldDirty: false });
      }
    }
  }, [fieldTransformer, fieldWatchFields, fieldName, watchedFields, setValue, watch]);

  // Check field condition
  const isFieldVisible = useCallback(() => {
    if (!field.condition) return true;

    const { field: conditionField, operator, value } = field.condition;
    const fieldValue = watch(conditionField);

    return evaluateCondition(fieldValue, operator, value);
  }, [field.condition, watch]);

  const renderField = () => {
    const commonProps = {
      name: field.name,
      label: field.label,
      disabled: field.disabled,
      helperText: field.helperText,
      required: field.required,
      fullWidth: true,
      sx: field.sx,
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'url':
      case 'number': {
        const textField = field as DynamicFormTextField;
        return (
          <Field.Text
            {...commonProps}
            type={field.type}
            placeholder={textField.placeholder}
            multiline={textField.multiline}
            rows={textField.rows}
            maxRows={textField.maxRows}
          />
        );
      }

      case 'select': {
        const currentSelectField = field as DynamicFormSelectField;
        
        // Use autocomplete functionality if enabled
        if (currentSelectField.autocomplete) {
          const { setSearchTerm, searchOptions, isSearching } = autocompleteHookResult;

          const combinedOptions = [...currentSelectField.options, ...searchOptions];
          const uniqueOptions = combinedOptions.filter((option, index, self) =>
            index === self.findIndex(o => o.value === option.value)
          );

          // Get current field value and find corresponding option to display label
          const currentValue = watch(fieldName);
          const currentOption = uniqueOptions.find(opt => opt.value === currentValue);

          return (
            <Field.Autocomplete
              {...commonProps}
              options={uniqueOptions}
              value={currentOption || null}
              multiple={false}
              freeSolo={currentSelectField.freeSolo}
              loading={isSearching || currentSelectField.loading}
              onInputChange={(_, newInputValue) => {
                setSearchTerm(newInputValue);
              }}
              onChange={(_, newValue) => {
                // Extract only the value, not the full object
                const extractedValue = newValue && typeof newValue === 'object' && 'value' in newValue
                  ? newValue.value
                  : newValue;
                setValue(fieldName, extractedValue, { shouldValidate: true });
              }}
              getOptionLabel={(option: { label?: string; value: string | number } | string) =>
                typeof option === 'string' ? option : option.label || String(option.value)
              }
              isOptionEqualToValue={(
                option: { value: string | number },
                value: { value: string | number } | null
              ) => value ? option.value === value.value : false}
              noOptionsText={currentSelectField.noOptionsText || 'No options'}
              loadingText={currentSelectField.loadingText || 'Loading...'}
            />
          );
        }

        return <Field.Select {...commonProps} options={currentSelectField.options} />;
      }

      case 'multiselect': {
        const multiSelectField = field as DynamicFormSelectField;
        
        // Use autocomplete functionality if enabled
        if (multiSelectField.autocomplete) {
          const { setSearchTerm, searchOptions, isSearching } = autocompleteHookResult;

          const combinedOptions = [...(multiSelectField.options || []), ...searchOptions];
          const uniqueOptions = combinedOptions.filter((option, index, self) =>
            index === self.findIndex(o => o.value === option.value)
          );

          // Get current field values and find corresponding options to display labels
          const currentValues = watch(fieldName) || [];
          const currentOptions = Array.isArray(currentValues) 
            ? currentValues.map(val => uniqueOptions.find(opt => opt.value === val)).filter(Boolean)
            : [];

          return (
            <Field.Autocomplete
              {...commonProps}
              options={uniqueOptions}
              value={currentOptions}
              multiple
              freeSolo={multiSelectField.freeSolo}
              loading={isSearching || multiSelectField.loading}
              onInputChange={(_, newInputValue) => {
                setSearchTerm(newInputValue);
              }}
              onChange={(_, newValue) => {
                // Extract only the values, not the full objects
                const extractedValues = Array.isArray(newValue)
                  ? newValue.map(item => 
                      item && typeof item === 'object' && 'value' in item
                        ? item.value
                        : item
                    )
                  : newValue;
                setValue(fieldName, extractedValues, { shouldValidate: true });
              }}
              getOptionLabel={(option: { label?: string; value: string | number } | string) =>
                typeof option === 'string' ? option : option.label || String(option.value)
              }
              isOptionEqualToValue={(
                option: { value: string | number },
                value: { value: string | number }
              ) => option.value === value.value}
              noOptionsText={multiSelectField.noOptionsText || 'No options'}
              loadingText={multiSelectField.loadingText || 'Loading...'}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      size="small"
                      label={typeof option === 'string' ? option : option.label || String(option.value)}
                      {...tagProps}
                    />
                  );
                })
              }
            />
          );
        }

        return (
          <Field.MultiSelect
            {...commonProps}
            options={multiSelectField.options || []}
            checkbox
            chip
          />
        );
      }

      case 'autocomplete': {
        const autocompleteField = field as DynamicFormAutocompleteField;
        return (
          <Field.Autocomplete
            {...commonProps}
            options={autocompleteField.options || []}
            multiple={autocompleteField.multiple}
            freeSolo={autocompleteField.freeSolo}
            getOptionLabel={(option: { label?: string; value: string | number } | string) =>
              typeof option === 'string' ? option : option.label || String(option.value)
            }
            isOptionEqualToValue={(
              option: { value: string | number },
              value: { value: string | number }
            ) => option.value === value.value}
          />
        );
      }

      case 'checkbox':
        return <Field.Checkbox {...commonProps} />;

      case 'multicheckbox': {
        const multiCheckboxField = field as DynamicFormCheckboxField;
        return (
          <Field.MultiCheckbox {...commonProps} options={multiCheckboxField.options || []} row />
        );
      }

      case 'radio': {
        const radioField = field as DynamicFormRadioField;
        return (
          <Field.RadioGroup
            {...commonProps}
            options={radioField.options || []}
            row={radioField.row}
          />
        );
      }

      case 'switch':
        return <Field.Switch {...commonProps} />;

      case 'multiswitch': {
        const multiSwitchField = field as DynamicFormSwitchField;
        return <Field.MultiSwitch {...commonProps} options={multiSwitchField.options || []} />;
      }

      case 'date':
      case 'datetime': {
        const dateField = field as DynamicFormDateField;
        return field.type === 'date' ? (
          <Field.DatePicker
            {...commonProps}
            minDate={dateField.minDate}
            maxDate={dateField.maxDate}
          />
        ) : (
          <Field.MobileDateTimePicker
            {...commonProps}
            minDate={dateField.minDate}
            maxDate={dateField.maxDate}
          />
        );
      }

      case 'upload': {
        const uploadField = field as DynamicFormUploadField;

        return (
          <Field.Upload
            {...commonProps}
            thumbnail
            accept={uploadField.accept}
            multiple={uploadField.multiple}
            maxFiles={uploadField.maxFiles}
            maxSize={uploadField.maxSize}
            placeholderTitle={uploadField.placeholder}
            placeholderDescription={uploadField.dropMessage}
          />
        );
      }

      case 'upload-box': {
        const uploadBoxField = field as DynamicFormUploadField;
        return (
          <Field.UploadBox
            {...commonProps}
            accept={uploadBoxField.accept}
            multiple={uploadBoxField.multiple}
            maxFiles={uploadBoxField.maxFiles}
            maxSize={uploadBoxField.maxSize}
            placeholderTitle={uploadBoxField.placeholder}
            placeholderDescription={uploadBoxField.dropMessage}
          />
        );
      }

      case 'upload-avatar': {
        const uploadAvatarField = field as DynamicFormUploadField;
        return (
          <Field.UploadAvatar
            {...commonProps}
            accept={uploadAvatarField.accept}
            maxSize={uploadAvatarField.maxSize}
          />
        );
      }

      case 'slider': {
        const sliderField = field as DynamicFormSliderField;
        return (
          <Field.Slider
            {...commonProps}
            min={sliderField.min}
            max={sliderField.max}
            step={sliderField.step}
            marks={sliderField.marks}
            valueLabelDisplay={sliderField.valueLabelDisplay}
          />
        );
      }

      case 'rating': {
        const ratingField = field as DynamicFormRatingField;
        return (
          <Field.Rating
            {...commonProps}
            max={ratingField.max}
            precision={ratingField.precision}
            emptyIcon={ratingField.emptyIcon}
            icon={ratingField.icon}
          />
        );
      }

      case 'editor': {
        const editorField = field as DynamicFormEditorField;
        return (
          <Field.Editor
            {...commonProps}
            placeholder={editorField.placeholder}
            {...(editorField.toolbar && { toolbar: editorField.toolbar })}
          />
        );
      }

      case 'code': {
        const codeField = field as DynamicFormCodeField;
        return (
          <Field.Code
            {...commonProps}
            {...(codeField.language && { language: codeField.language })}
            {...(codeField.theme && { theme: codeField.theme })}
          />
        );
      }

      case 'phone': {
        const phoneField = field as DynamicFormPhoneField;
        return <Field.Phone {...commonProps} defaultCountry={phoneField.defaultCountry} />;
      }

      case 'country': {
        const countryField = field as DynamicFormCountryField;
        return <Field.CountrySelect {...commonProps} placeholder={countryField.placeholder} />;
      }

      case 'array':
        // Note: Array field implementation would require additional components
        // This is a placeholder for now
        console.warn('Array field type not yet implemented');
        return null;

      case 'object':
        // Note: Object field implementation would require nested form handling
        // This is a placeholder for now
        console.warn('Object field type not yet implemented');
        return null;

      default: {
        const unknownField = field as { type: string };
        console.warn(`Unknown field type: ${unknownField.type}`);
        return null;
      }
    }
  };

  // Check if field should be rendered based on conditions
  if (field.hidden || !isFieldVisible()) {
    return null;
  }

  // Calculate grid styling
  const gridProps = field.gridSize ? { ...field.gridSize } : { xs: 12 };
  const { offset, order } = gridProps;

  return (
    <Box
      sx={{
        gridColumn: {
          xs: 'span 1',
          md: calculateGridColumnSpan(field),
        },
        ...generateGridOffset(offset),
        ...generateGridOrder(order),
      }}
    >
      {renderField()}
    </Box>
  );
};

// Memoized export for performance optimization
export const DynamicFormField = memo(
  DynamicFormFieldComponent,
  (prevProps, nextProps) =>
    // Custom comparison function to optimize re-renders
    prevProps.field === nextProps.field && prevProps.formMethods === nextProps.formMethods
);
