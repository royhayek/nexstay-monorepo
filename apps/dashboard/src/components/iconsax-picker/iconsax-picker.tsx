'use client';

import type { TextFieldProps } from '@mui/material/TextField';

import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import * as IconsaxReact from 'iconsax-react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

import { ICONSAX_ICONS, ICON_CATEGORIES, ICONSAX_VARIANTS } from './iconsax-data';
import type { IconsaxVariant } from './iconsax-data';

// ----------------------------------------------------------------------

export type IconsaxPickerProps = Omit<TextFieldProps, 'onChange'> & {
  value?: string;
  onChange?: (value: string) => void;
};

export function IconsaxPicker({ value, onChange, helperText, error, ...other }: IconsaxPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedVariant, setSelectedVariant] = useState<IconsaxVariant>('Bold');
  const selectedIconRef = useRef<HTMLDivElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);

  // Parse the value format: "iconName:variant" (e.g., "home-2:Bold")
  const parseIconValue = useCallback((val: string) => {
    if (!val) return { iconName: '', variant: 'Bold' as IconsaxVariant };
    const parts = val.split(':');
    return {
      iconName: parts[0] || '',
      variant: (parts[1] as IconsaxVariant) || 'Bold',
    };
  }, []);

  const { iconName: selectedIconName, variant: currentVariant } = parseIconValue(value || '');
  const selectedIcon = ICONSAX_ICONS.find((icon) => icon.componentName === selectedIconName);

  // Debug logging
  console.log('[IconsaxPicker] Debug info:', {
    rawValue: value,
    selectedIconName,
    currentVariant,
    selectedIcon: selectedIcon ? { name: selectedIcon.name, componentName: selectedIcon.componentName } : 'NOT FOUND',
    iconAvailable: selectedIconName ? selectedIconName in (IconsaxReact as any) : false,
  });

  if (value && !selectedIcon) {
    console.warn('[IconsaxPicker] Could not find icon in ICONSAX_ICONS array:', {
      value,
      selectedIconName,
      sampleIcons: ICONSAX_ICONS.slice(0, 3).map(i => ({ name: i.name, componentName: i.componentName }))
    });
  }

  // Sync selectedVariant with currentVariant when dialog is opened
  useEffect(() => {
    if (open && currentVariant) {
      setSelectedVariant(currentVariant);
    }
  }, [open, currentVariant]);

  // Scroll to selected icon when dialog opens
  useEffect(() => {
    if (!open || !selectedIconName) return undefined;

    let attemptCount = 0;
    const maxAttempts = 10;
    let rafId: number;

    const tryScroll = () => {
      const element = selectedIconRef.current;

      if (element) {
        console.log('✅ Scrolling to selected icon:', selectedIconName, 'Attempt:', attemptCount + 1);

        // Scroll the element into view
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });

        return; // Success - stop trying
      }

      attemptCount += 1;

      if (attemptCount < maxAttempts) {
        console.log('⏳ Waiting for icon to render... Attempt:', attemptCount);
        rafId = requestAnimationFrame(tryScroll);
      } else {
        console.warn('❌ Could not find selected icon after', maxAttempts, 'attempts');
      }
    };

    // Start trying to scroll after a small delay to let React render
    const timeoutId = setTimeout(() => {
      rafId = requestAnimationFrame(tryScroll);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [open, selectedIconName]);

  const filteredIcons = ICONSAX_ICONS.filter((icon) => {
    const matchesSearch =
      search === '' ||
      icon.name.toLowerCase().includes(search.toLowerCase()) ||
      icon.keywords.some((keyword) => keyword.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || icon.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleOpen = useCallback(() => {
    // Set the category to the selected icon's category when opening
    if (selectedIcon) {
      setSelectedCategory(selectedIcon.category);
    }
    setOpen(true);
  }, [selectedIcon]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearch('');
    setSelectedCategory('All');
    setSelectedVariant('Bold');
  }, []);

  const handleSelect = useCallback(
    (componentName: string) => {
      // Combine component name and variant: "componentName:variant" (e.g., "Wifi:Linear")
      const fullValue = `${componentName}:${selectedVariant}`;
      onChange?.(fullValue);
      handleClose();
    },
    [onChange, handleClose, selectedVariant]
  );

  const handleClear = useCallback(() => {
    onChange?.('');
  }, [onChange]);

  // Dynamically render icon component
  const renderIconPreview = (componentName: string, variant: IconsaxVariant = 'Bold', size: number = 24) => {
    try {
      // Access the icon component directly from iconsax-react
      const IconComponent = (IconsaxReact as any)[componentName];

      if (!IconComponent) {
        console.warn(`[IconsaxPicker] Icon component not found: ${componentName}`);
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <Iconify icon="solar:widget-2-bold" width={size} />
          </Box>
        );
      }

      // Render the icon component with the specified variant and size
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
          <IconComponent size={size} variant={variant} />
        </Box>
      );
    } catch (error) {
      console.error('[IconsaxPicker] Error rendering icon:', componentName, error);
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
          <Iconify icon="solar:danger-triangle-bold" width={size} />
        </Box>
      );
    }
  };

  return (
    <>
      <TextField
        {...other}
        value={selectedIcon ? `${selectedIcon.componentName} (${currentVariant})` : ''}
        onClick={handleOpen}
        error={error}
        helperText={helperText}
        placeholder="Select an icon"
        slotProps={{
          input: {
            readOnly: true,
            startAdornment: selectedIcon ? (
              <InputAdornment position="start">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 0.5 }}>
                  {(() => {
                    // Directly access and render the icon component
                    const IconComponent = (IconsaxReact as any)[selectedIcon.componentName];
                    if (!IconComponent) {
                      console.error('[IconsaxPicker] Icon not found for componentName:', selectedIcon.componentName);
                      return <Iconify icon="solar:widget-2-bold" width={20} sx={{ color: 'text.secondary' }} />;
                    }
                    return <IconComponent size={20} variant={currentVariant} color="currentColor" />;
                  })()}
                </Box>
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
            sx: { height: '85vh' },
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6">Select Iconsax Icon</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Compatible with iconsax-react and iconsax-react-native
          </Typography>
          <TextField
            fullWidth
            placeholder="Search icons by name or keyword..."
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

          {/* Category Filter */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Category:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="All"
                onClick={() => setSelectedCategory('All')}
                color={selectedCategory === 'All' ? 'primary' : 'default'}
                size="small"
              />
              {ICON_CATEGORIES.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  onClick={() => setSelectedCategory(category)}
                  color={selectedCategory === category ? 'primary' : 'default'}
                  size="small"
                />
              ))}
            </Box>
          </Box>

          {/* Variant Filter */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Variant:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {ICONSAX_VARIANTS.map((variant) => (
                <Chip
                  key={variant}
                  label={variant}
                  onClick={() => setSelectedVariant(variant)}
                  color={selectedVariant === variant ? 'primary' : 'default'}
                  size="small"
                  variant={selectedVariant === variant ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent ref={dialogContentRef}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: 1.5,
              py: 2,
            }}
          >
            {filteredIcons.map((icon) => {
              // Access icon component directly from iconsax-react
              const IconComponent = (IconsaxReact as any)[icon.componentName];
              if (!IconComponent) return null;

              const isSelected = selectedIconName === icon.componentName;

              return (
                <Paper
                  key={icon.name}
                  ref={isSelected ? selectedIconRef : null}
                  onClick={() => handleSelect(icon.componentName)}
                  sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    minHeight: 100,
                    transition: 'all 0.2s',
                    border: (theme) =>
                      `2px solid ${
                        isSelected
                          ? theme.palette.primary.main
                          : 'transparent'
                      }`,
                    bgcolor: (theme) =>
                      isSelected
                        ? theme.palette.action.selected
                        : 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => theme.shadows[4],
                    },
                  }}
                >
                  <Suspense fallback={<Skeleton variant="circular" width={32} height={32} />}>
                    <IconComponent
                      size={32}
                      variant={selectedVariant}
                      color="currentColor"
                      style={{ marginBottom: 8 }}
                    />
                  </Suspense>
                  <Typography
                    variant="caption"
                    sx={{
                      textAlign: 'center',
                      fontSize: '0.7rem',
                      lineHeight: 1.2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      wordBreak: 'break-word',
                    }}
                  >
                    {icon.name}
                  </Typography>
                  {icon.category && (
                    <Chip
                      label={icon.category}
                      size="small"
                      sx={{
                        mt: 0.5,
                        height: 16,
                        fontSize: '0.6rem',
                        '& .MuiChip-label': { px: 0.5 },
                      }}
                    />
                  )}
                </Paper>
              );
            })}
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
              <Iconify icon="solar:inbox-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                No icons found matching &quot;{search}&quot;
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ mt: 1 }}>
                Try a different search term or category
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
