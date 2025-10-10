import type { ConfigDataDto } from 'src/api/models';

import { z as zod } from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export type ConfigurationFormSchemaType = zod.infer<typeof ConfigurationFormSchema>;

export const ConfigurationFormSchema = zod.object({
  key: zod.string().min(1, { message: 'Key is required!' }),
  value: zod.string().min(1, { message: 'Value is required!' }),
  title: zod.string().min(1, { message: 'Title is required!' }),
  description: zod.string().optional(),
});

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: ConfigurationFormSchemaType) => void;
  currentConfig?: ConfigDataDto | null;
};

export function ConfigurationForm({ open, onClose, onSave, currentConfig }: Props) {
  const isEditing = !!currentConfig;

  const defaultValues: ConfigurationFormSchemaType = useMemo(
    () => ({
      key: currentConfig?.key || '',
      value: currentConfig?.value || '',
      title: currentConfig?.title || '',
      description: currentConfig?.description || '',
    }),
    [currentConfig]
  );

  const methods = useForm<ConfigurationFormSchemaType>({
    mode: 'all',
    resolver: zodResolver(ConfigurationFormSchema),
    defaultValues,
    values: defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      onSave(data);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { overflow: 'visible' },
      }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>
          <Typography variant="h6">
            {isEditing ? 'Edit Configuration' : 'New Configuration'}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Field.Text
              name="key"
              label="Key"
              placeholder="e.g. app.name, api.rate_limit, feature.enabled"
              disabled={isEditing}
              helperText={
                isEditing
                  ? 'Key cannot be changed when editing'
                  : 'Unique identifier for the configuration'
              }
            />

            <Field.Text
              name="title"
              label="Title"
              placeholder="e.g. Application Name, API Rate Limit, Feature Enabled"
              helperText="Human-readable title for display in the UI"
            />

            <Field.Text
              name="value"
              label="Value"
              placeholder="Configuration value"
              multiline
              rows={3}
              helperText="The actual configuration value (can be JSON, text, number, etc.)"
            />

            <Field.Text
              name="description"
              label="Description"
              placeholder="Optional description of what this configuration does"
              multiline
              rows={2}
              helperText="Optional description to help others understand this configuration"
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
