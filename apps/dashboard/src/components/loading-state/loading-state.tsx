'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

// ----------------------------------------------------------------------

type LoadingStateProps = {
  title?: string;
  subtitle?: string;
  variant?: 'linear' | 'circular' | 'skeleton' | 'card';
  size?: 'small' | 'medium' | 'large';
  fullHeight?: boolean;
  sx?: object;
};

export function LoadingState({
  title = 'Loading...',
  subtitle,
  variant = 'card',
  size = 'medium',
  fullHeight = false,
  sx,
}: LoadingStateProps) {
  const getLoadingIcon = () => {
    switch (variant) {
      case 'circular':
        return (
          <CircularProgress
            size={size === 'small' ? 32 : size === 'medium' ? 48 : 64}
            sx={{ mb: 2 }}
          />
        );
      case 'linear':
        return (
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress sx={{ borderRadius: 1, height: 4 }} />
          </Box>
        );
      case 'skeleton':
        return (
          <Stack spacing={2} sx={{ width: '100%', mb: 2 }}>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="80%" height={24} />
            <Skeleton variant="rectangular" width="100%" height={120} />
          </Stack>
        );
      default:
        return (
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress sx={{ borderRadius: 1, height: 4 }} />
          </Box>
        );
    }
  };

  if (variant === 'card') {
    return (
      <Card sx={{ p: 4, textAlign: 'center', ...sx }}>
        <Stack spacing={2} alignItems="center">
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 2,
              bgcolor: 'primary.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress
              size={40}
              sx={{
                color: 'primary.main',
              }}
            />
          </Box>
          <Stack spacing={1} alignItems="center">
            <Typography variant="h6" color="text.primary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Stack>
        </Stack>
      </Card>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
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
      {getLoadingIcon()}

      <Stack spacing={1} alignItems="center">
        <Typography
          variant={size === 'small' ? 'body1' : size === 'medium' ? 'h6' : 'h5'}
          color="text.primary"
          fontWeight={600}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant={size === 'small' ? 'caption' : 'body2'} color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
