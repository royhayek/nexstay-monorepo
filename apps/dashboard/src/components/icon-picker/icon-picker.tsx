'use client';

import type { TextFieldProps } from '@mui/material/TextField';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const SOLAR_ICONS = [
  'add-circle-bold',
  'add-folder-bold',
  'archive-down-minimlistic-bold',
  'bed-bold',
  'bell-bing-bold',
  'bell-bing-bold-duotone',
  'bell-off-bold',
  'bill-list-bold',
  'box-minimalistic-bold',
  'calendar-date-bold',
  'camera-add-bold',
  'cart-3-bold',
  'cart-plus-bold',
  'case-minimalistic-bold',
  'chat-round-dots-bold',
  'check-circle-bold',
  'clock-circle-bold',
  'close-circle-bold',
  'copy-bold',
  'cup-star-bold',
  'danger-bold',
  'danger-triangle-bold',
  'double-alt-arrow-down-bold-duotone',
  'double-alt-arrow-right-bold-duotone',
  'double-alt-arrow-up-bold-duotone',
  'download-bold',
  'dumbbell-large-minimalistic-bold',
  'electric-refueling-bold',
  'eraser-bold',
  'export-bold',
  'eye-bold',
  'eye-closed-bold',
  'file-text-bold',
  'flag-bold',
  'forbidden-circle-bold',
  'forward-bold',
  'gallery-add-bold',
  'gallery-wide-bold',
  'gamepad-bold',
  'heart-bold',
  'home-angle-bold-duotone',
  'import-bold',
  'inbox-bold',
  'inbox-in-bold',
  'info-circle-bold',
  'letter-bold',
  'letter-unread-bold',
  'like-bold',
  'list-bold',
  'medical-kit-bold',
  'menu-dots-bold-duotone',
  'microphone-bold',
  'monitor-bold',
  'notebook-bold-duotone',
  'notes-bold-duotone',
  'palette-bold',
  'palette-bold-duotone',
  'pen-bold',
  'phone-bold',
  'play-circle-bold',
  'printer-minimalistic-bold',
  'reply-bold',
  'restart-bold',
  'settings-bold',
  'settings-bold-duotone',
  'share-bold',
  'shield-check-bold',
  'shield-keyhole-bold-duotone',
  'smartphone-2-bold',
  'ssd-round-bold',
  'stop-circle-bold',
  'suitcase-tag-bold',
  'tag-horizontal-bold-duotone',
  'tea-cup-bold',
  'transfer-horizontal-bold-duotone',
  'trash-bin-trash-bold',
  'tv-bold',
  'user-id-bold',
  'user-plus-bold',
  'user-rounded-bold',
  'users-group-rounded-bold',
  'users-group-rounded-bold-duotone',
  'verified-check-bold',
  'videocamera-record-bold',
  'volume-bold',
  'volume-loud-bold',
  'wad-of-money-bold',
  // Additional commonly used icons
  'home-2-outline',
  'buildings-2-bold',
  'sofa-bold',
  'wifi-router-bold',
  'swimming-bold',
  'parking-bold',
  'cup-hot-bold',
  'bath-bold',
  'accessibility-bold',
  'crown-bold',
  'checklist-minimalistic-bold',
  'users-group-rounded-bold',
  'case-bold',
  'dollar-minimalistic-bold',
  'card-bold',
].sort();

// ----------------------------------------------------------------------

export type IconPickerProps = Omit<TextFieldProps, 'onChange'> & {
  value?: string;
  onChange?: (value: string) => void;
};

export function IconPicker({ value, onChange, helperText, error, ...other }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedIcon = value ? value.replace('solar:', '') : '';

  const filteredIcons = SOLAR_ICONS.filter((icon) =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearch('');
  }, []);

  const handleSelect = useCallback(
    (iconName: string) => {
      onChange?.(`solar:${iconName}`);
      handleClose();
    },
    [onChange, handleClose]
  );

  const handleClear = useCallback(() => {
    onChange?.('');
  }, [onChange]);

  return (
    <>
      <TextField
        {...other}
        value={selectedIcon ? `solar:${selectedIcon}` : ''}
        onClick={handleOpen}
        error={error}
        helperText={helperText}
        slotProps={{
          input: {
            readOnly: true,
            startAdornment: selectedIcon ? (
              <InputAdornment position="start">
                <Iconify icon={`solar:${selectedIcon}`} width={24} />
              </InputAdornment>
            ) : null,
            endAdornment: (
              <InputAdornment position="end">
                {selectedIcon && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    edge="end"
                  >
                    <Iconify icon="solar:close-circle-bold" width={20} />
                  </IconButton>
                )}
                <IconButton size="small" onClick={handleOpen} edge="end">
                  <Iconify icon="solar:double-alt-arrow-down-bold-duotone" width={20} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{
          cursor: 'pointer',
          '& .MuiInputBase-input': {
            cursor: 'pointer',
          },
        }}
      />

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: { height: '80vh' },
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6">Select Icon</Typography>
          <TextField
            fullWidth
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="mingcute:search-line" width={20} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mt: 2 }}
          />
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: 1,
              py: 2,
            }}
          >
            {filteredIcons.map((iconName) => (
              <Paper
                key={iconName}
                onClick={() => handleSelect(iconName)}
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  minHeight: 80,
                  transition: 'all 0.2s',
                  border: (theme) =>
                    `2px solid ${
                      selectedIcon === iconName ? theme.palette.primary.main : 'transparent'
                    }`,
                  bgcolor: (theme) =>
                    selectedIcon === iconName ? theme.palette.action.selected : 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'translateY(-2px)',
                    boxShadow: (theme) => theme.shadows[4],
                  },
                }}
              >
                <Iconify
                  icon={`solar:${iconName}`}
                  width={32}
                  sx={{ color: 'primary.main', mb: 0.5 }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    textAlign: 'center',
                    fontSize: '0.65rem',
                    lineHeight: 1.2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                  }}
                >
                  {iconName}
                </Typography>
              </Paper>
            ))}
          </Box>

          {filteredIcons.length === 0 && (
            <Box
              sx={{
                py: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify
                icon="solar:inbox-bold"
                width={64}
                sx={{ color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                No icons found matching &quot;{search}&quot;
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
