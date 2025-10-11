import type { UploadProps } from './types';

import { useDropzone } from 'react-dropzone';
import { varAlpha, mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';

import { Iconify } from '../iconify';
import { uploadClasses } from './classes';
import { UploadPlaceholder } from './components/placeholder';
import { RejectionFiles } from './components/rejection-files';
import { MultiFilePreview } from './components/preview-multi-file';
import { DeleteButton, SingleFilePreview } from './components/preview-single-file';

// ----------------------------------------------------------------------

export function Upload({
  sx,
  value,
  error,
  disabled,
  onDelete,
  onUpload,
  onRemove,
  thumbnail,
  helperText,
  onRemoveAll,
  className,
  multiple = false,
  placeholderTitle,
  placeholderDescription,
  ...other
}: UploadProps) {
  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    multiple,
    disabled,
    ...other,
  });

  const isArray = Array.isArray(value) && multiple;

  const hasFile = !isArray && !!value;
  const hasFiles = isArray && !!value.length;

  const hasError = isDragReject || !!error;

  return (
    <Box
      className={mergeClasses([uploadClasses.upload, className])}
      sx={[{ width: 1, position: 'relative' }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {/* Multi files preview */}
      {multiple && hasFiles && (
        <MultiFilePreview files={value} thumbnail={thumbnail} onRemove={onRemove} sx={{ mb: 3 }} />
      )}

      <Box
        {...getRootProps()}
        sx={[
          (theme) => ({
            p: hasFiles && multiple ? 3 : 5,
            outline: 'none',
            borderRadius: 1,
            cursor: 'pointer',
            overflow: 'hidden',
            position: 'relative',
            bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
            border: `1px dashed ${varAlpha(theme.vars.palette.grey['500Channel'], 0.2)}`,
            transition: theme.transitions.create(['opacity', 'padding']),
            '&:hover': { opacity: 0.72 },
            ...(isDragActive && { opacity: 0.72 }),
            ...(disabled && { opacity: 0.48, pointerEvents: 'none' }),
            ...(hasError && {
              color: 'error.main',
              borderColor: 'error.main',
              bgcolor: varAlpha(theme.vars.palette.error.mainChannel, 0.08),
            }),
            ...(hasFile && !multiple && { padding: '28% 0' }),
          }),
        ]}
      >
        <input {...getInputProps()} />

        {/* Placeholder for empty state or when files exist but we still want to show drop area */}
        {((!hasFile && !multiple) || !hasFiles) ? (
          <UploadPlaceholder title={placeholderTitle} description={placeholderDescription} />
        ) : (
          hasFiles && multiple && (
            <UploadPlaceholder 
              title={placeholderTitle || "Add more files"} 
              description={placeholderDescription || "Drop additional files here or click to browse"}
            />
          )
        )}
        
        {/* Single file */}
        {hasFile && !multiple && <SingleFilePreview file={value as File} />}
      </Box>

      {/* Single file */}
      {hasFile && <DeleteButton onClick={onDelete} />}

      {helperText && (
        <FormHelperText error={!!error} sx={{ mx: 1.75 }}>
          {helperText}
        </FormHelperText>
      )}

      {!!fileRejections.length && <RejectionFiles files={fileRejections} />}

      {/* Upload/Remove buttons for multi files */}
      {multiple && hasFiles && (onRemoveAll || onUpload) && (
        <Box sx={{ gap: 1.5, display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          {onRemoveAll && (
            <Button color="inherit" variant="outlined" size="small" onClick={onRemoveAll}>
              Remove all
            </Button>
          )}

          {onUpload && (
            <Button
              size="small"
              variant="contained"
              onClick={onUpload}
              startIcon={<Iconify icon="eva:cloud-upload-fill" />}
            >
              Upload
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
