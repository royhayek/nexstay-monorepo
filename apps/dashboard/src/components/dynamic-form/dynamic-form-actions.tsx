import type { UseFormReturn } from 'react-hook-form';
import type { DynamicFormActions as DynamicFormActionsType } from './types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';

// ----------------------------------------------------------------------

interface DynamicFormActionsProps {
  actions: DynamicFormActionsType;
  formMethods: UseFormReturn<any>;
  loading?: boolean;
  onReset?: () => void;
}

export function DynamicFormActions({ 
  actions, 
  formMethods, 
  loading = false,
  onReset
}: DynamicFormActionsProps) {
  const { reset } = formMethods;

  const handleReset = () => {
    reset();
    if (onReset) {
      onReset();
    }
  };

  const renderSubmitButton = () => {
    if (!actions.submit) return null;

    const {
      label = 'Submit',
      variant = 'contained',
      color = 'primary',
      size = 'large',
      fullWidth = false,
      loading: submitLoading = false,
      disabled = false,
      startIcon,
      endIcon,
      sx,
    } = actions.submit;

    return (
      <LoadingButton
        type="submit"
        variant={variant}
        color={color}
        size={size}
        loading={loading || submitLoading}
        disabled={disabled}
        fullWidth={fullWidth}
        startIcon={startIcon}
        endIcon={endIcon}
        sx={sx}
      >
        {label}
      </LoadingButton>
    );
  };

  const renderResetButton = () => {
    if (!actions.reset) return null;

    const {
      label = 'Reset',
      variant = 'outlined',
      color = 'inherit',
      size = 'large',
      fullWidth = false,
      disabled = false,
      startIcon,
      endIcon,
      sx,
    } = actions.reset;

    return (
      <Button
        type="button"
        variant={variant}
        color={color}
        size={size}
        disabled={disabled || loading}
        fullWidth={fullWidth}
        startIcon={startIcon}
        endIcon={endIcon}
        onClick={handleReset}
        sx={sx}
      >
        {label}
      </Button>
    );
  };

  const renderCancelButton = () => {
    if (!actions.cancel) return null;

    const {
      label = 'Cancel',
      variant = 'outlined',
      color = 'inherit',
      size = 'large',
      fullWidth = false,
      disabled = false,
      startIcon,
      endIcon,
      onClick,
      sx,
    } = actions.cancel;

    return (
      <Button
        type="button"
        variant={variant}
        color={color}
        size={size}
        disabled={disabled || loading}
        fullWidth={fullWidth}
        startIcon={startIcon}
        endIcon={endIcon}
        onClick={onClick}
        sx={sx}
      >
        {label}
      </Button>
    );
  };

  const renderCustomButtons = () => {
    if (!actions.custom || actions.custom.length === 0) return null;

    return actions.custom.map((customAction) => {
      const {
        id,
        label,
        variant = 'outlined',
        color = 'inherit',
        size = 'large',
        fullWidth = false,
        disabled = false,
        startIcon,
        endIcon,
        onClick,
        sx,
      } = customAction;

      return (
        <Button
          key={id}
          type="button"
          variant={variant}
          color={color}
          size={size}
          disabled={disabled || loading}
          fullWidth={fullWidth}
          startIcon={startIcon}
          endIcon={endIcon}
          onClick={onClick}
          sx={sx}
        >
          {label}
        </Button>
      );
    });
  };

  const hasActions = actions.submit || actions.reset || actions.cancel || (actions.custom && actions.custom.length > 0);

  if (!hasActions) {
    return null;
  }

  return (
    <Box sx={{ pt: 2 }}>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={2}
        justifyContent="flex-end"
        alignItems="center"
      >
        {renderCancelButton()}
        {renderResetButton()}
        {renderCustomButtons()}
        {renderSubmitButton()}
      </Stack>
    </Box>
  );
}