import type { Theme, SxProps } from '@mui/material/styles';

import { mergeClasses } from 'minimal-shared/utils';

import { styled } from '@mui/material/styles';

import { createClasses } from 'src/theme/create-classes';
import { UploadIllustration } from 'src/assets/illustrations';

// ----------------------------------------------------------------------

export type UploadPlaceholderProps = React.ComponentProps<'div'> & {
  sx?: SxProps<Theme>;
  title?: string;
  description?: string;
};

const uploadPlaceholderClasses = {
  root: createClasses('upload__placeholder__root'),
  content: createClasses('upload__placeholder__content'),
  title: createClasses('upload__placeholder__title'),
  description: createClasses('upload__placeholder__description'),
};

export function UploadPlaceholder({ 
  sx, 
  className, 
  title = "Drop or select file",
  description = "Drop files here or click to browse through your machine.",
  ...other 
}: UploadPlaceholderProps) {
  return (
    <PlaceholderRoot
      className={mergeClasses([uploadPlaceholderClasses.root, className])}
      sx={sx}
      {...other}
    >
      <UploadIllustration hideBackground sx={{ width: 200 }} />
      <PlaceholderContent>
        <div className={uploadPlaceholderClasses.title}>{title}</div>
        <div className={uploadPlaceholderClasses.description}>
          {description.includes('browse') ? (
            <>
              {description.split('browse')[0]}
              <span>browse</span>
              {description.split('browse')[1]}
            </>
          ) : (
            description
          )}
        </div>
      </PlaceholderContent>
    </PlaceholderRoot>
  );
}

// ----------------------------------------------------------------------

const PlaceholderRoot = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  justifyContent: 'center',
}));

const PlaceholderContent = styled('div')(({ theme }) => ({
  display: 'flex',
  textAlign: 'center',
  gap: theme.spacing(1),
  flexDirection: 'column',
  [`& .${uploadPlaceholderClasses.title}`]: { ...theme.typography.h6 },
  [`& .${uploadPlaceholderClasses.description}`]: {
    ...theme.typography.body2,
    color: theme.vars.palette.text.secondary,
    '& span': {
      textDecoration: 'underline',
      margin: theme.spacing(0, 0.5),
      color: theme.vars.palette.primary.main,
    },
  },
}));
