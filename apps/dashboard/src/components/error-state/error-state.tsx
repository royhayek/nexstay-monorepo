'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type ErrorStateProps = {
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'card' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  fullHeight?: boolean;
  showRetry?: boolean;
  retryText?: string;
  onRetry?: () => void;
  icon?: string;
  sx?: object;
};

export function ErrorState({
  title = 'Something went wrong',
  subtitle = 'Please try again later',
  variant = 'card',
  size = 'medium',
  fullHeight = false,
  showRetry = true,
  retryText = 'Try Again',
  onRetry,
  icon = 'solar:danger-triangle-bold-duotone',
  sx,
}: ErrorStateProps) {
  const iconSize = size === 'small' ? 40 : size === 'medium' ? 56 : 72;
  const titleVariant = size === 'small' ? 'body1' : size === 'medium' ? 'h6' : 'h5';
  const subtitleVariant = size === 'small' ? 'caption' : 'body2';

  if (variant === 'card') {
    return (
      <Card sx={{ p: 4, textAlign: 'center', ...sx }}>
        <Stack spacing={3} alignItems="center">
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 2,
              bgcolor: 'error.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon={icon} width={iconSize} sx={{ color: 'error.main' }} />
          </Box>

          <Stack spacing={1} alignItems="center">
            <Typography variant={titleVariant} color="text.primary" fontWeight={600}>
              {title}
            </Typography>
            <Typography variant={subtitleVariant} color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>

          {showRetry && onRetry && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="solar:refresh-bold" />}
              onClick={onRetry}
              sx={{ mt: 2 }}
            >
              {retryText}
            </Button>
          )}
        </Stack>
      </Card>
    );
  }

  if (variant === 'minimal') {
    return (
      <Stack
        spacing={2}
        alignItems="center"
        sx={{
          p: 2,
          textAlign: 'center',
          ...sx,
        }}
      >
        <Typography variant={titleVariant} color="error.main" fontWeight={600}>
          {title}
        </Typography>
        {showRetry && onRetry && (
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<Iconify icon="solar:refresh-bold" />}
            onClick={onRetry}
          >
            {retryText}
          </Button>
        )}
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullHeight ? '400px' : 'auto',
        ...sx,
      }}
    >
      <Stack spacing={3} alignItems="center" sx={{ maxWidth: 400 }}>
        <Box
          sx={{
            width: size === 'small' ? 60 : size === 'medium' ? 80 : 100,
            height: size === 'small' ? 60 : size === 'medium' ? 80 : 100,
            borderRadius: 2,
            bgcolor: 'error.lighter',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify icon={icon} width={iconSize} sx={{ color: 'error.main' }} />
        </Box>

        <Stack spacing={1} alignItems="center">
          <Typography variant={titleVariant} color="text.primary" fontWeight={600}>
            {title}
          </Typography>
          <Typography variant={subtitleVariant} color="text.secondary">
            {subtitle}
          </Typography>
        </Stack>

        {showRetry && onRetry && (
          <Button
            variant="contained"
            color="primary"
            size={size === 'small' ? 'medium' : 'large'}
            startIcon={<Iconify icon="solar:refresh-bold" />}
            onClick={onRetry}
            sx={{ mt: 1 }}
          >
            {retryText}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
