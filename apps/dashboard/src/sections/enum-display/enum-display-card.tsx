import type { EnumDisplayDataDto } from 'src/api/models/admin';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface Props {
  enumName: string;
  items: EnumDisplayDataDto[];
  onViewDetails: (enumName: string) => void;
  onEdit: (enumName: string) => void;
}

export function EnumDisplayCard({ enumName, items, onViewDetails, onEdit }: Props) {
  const visibleCount = items.filter((item) => item.isVisible).length;
  const hiddenCount = items.filter((item) => !item.isVisible).length;
  const latestUpdate = items.reduce((latest, item) => {
    const itemDate = new Date(item.updatedAt);
    return itemDate > latest ? itemDate : latest;
  }, new Date(0));

  return (
    <Card
      sx={{
        cursor: 'pointer',
        position: 'relative',
        '&:hover': {
          boxShadow: (theme) => theme.customShadows.z20,
        },
      }}
      onClick={() => onViewDetails(enumName)}
    >
      <Stack spacing={2} sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" noWrap>
            {enumName.replace(/([A-Z])/g, ' $1').trim()}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(enumName);
            }}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1.5,
              bgcolor: 'primary.lighter',
              color: 'primary.main',
            }}
          >
            <Iconify icon="solar:list-bold-duotone" width={24} />
          </Box>

          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" noWrap>
              Total Items
            </Typography>
            <Typography variant="h4">{items.length}</Typography>
          </Box>
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <ListItemText
              primary={
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
              }
              secondary={
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  <Label variant="soft" color="success" sx={{ fontSize: '0.75rem' }}>
                    {visibleCount} Visible
                  </Label>
                  <Label variant="soft" color="error" sx={{ fontSize: '0.75rem' }}>
                    {hiddenCount} Hidden
                  </Label>
                </Stack>
              }
              sx={{ m: 0 }}
            />
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              Last updated
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {fDateTime(latestUpdate)}
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Click to view details
          </Typography>
          <Iconify icon="eva:arrow-forward-fill" width={16} sx={{ color: 'text.secondary' }} />
        </Stack>
      </Stack>
    </Card>
  );
}