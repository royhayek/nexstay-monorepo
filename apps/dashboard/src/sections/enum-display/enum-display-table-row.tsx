import type { EnumDisplayDataDto } from 'src/api/models';

import { memo } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: EnumDisplayDataDto;
  selected: boolean;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export const EnumDisplayTableRow = memo(function EnumDisplayTableRow({
  row,
  selected,
  onSelectRow,
  onDeleteRow,
}: Props) {
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <li>
          <MenuItem
            component={RouterLink}
            href={paths.dashboard.enumDisplays.edit(row.enumName, row.key)}
            onClick={() => menuActions.onClose()}
          >
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>
        </li>

        <MenuItem
          onClick={() => {
            confirmDialog.onTrue();
            menuActions.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Delete"
      content="Are you sure you want to delete this enum display configuration?"
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          Delete
        </Button>
      }
    />
  );

  const getDisplayLabel = (label: any) => {
    if (!label) return row.key;
    if (typeof label === 'string') return label;
    if (typeof label === 'object') {
      return label.en || label.fr || label.ar || Object.values(label)[0] || row.key;
    }
    return row.key;
  };

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onClick={onSelectRow}
            slotProps={{
              input: {
                id: `${row._id}-checkbox`,
                'aria-label': `${row._id} checkbox`,
              },
            }}
          />
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ typography: 'body1', fontWeight: 600 }}>{getDisplayLabel(row.label)}</Box>
            <Box sx={{ typography: 'caption', color: 'text.secondary' }}>Key: {row.key}</Box>
          </Box>
        </TableCell>

        <TableCell>
          <Chip
            label={row.enumName}
            variant="soft"
            color="primary"
            size="small"
            sx={{ textTransform: 'uppercase', fontWeight: 600 }}
          />
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {row.label && typeof row.label === 'object' && (
              <>
                {Object.entries(row.label as Record<string, string>).map(([lang, value]) => (
                  <Tooltip key={lang} title={`${lang.toUpperCase()}: ${value}`} placement="top">
                    <Chip
                      label={lang.toUpperCase()}
                      variant="outlined"
                      size="small"
                      color={value ? 'success' : 'default'}
                      sx={{ minWidth: 36, fontWeight: 600 }}
                    />
                  </Tooltip>
                ))}
              </>
            )}
          </Box>
        </TableCell>

        <TableCell align="center">
          <Box sx={{ typography: 'body2', fontWeight: 600 }}>{row.sortOrder ?? 0}</Box>
        </TableCell>

        <TableCell align="center">
          <Label variant="soft" color={row.isVisible ? 'success' : 'error'}>
            {row.isVisible ? 'Visible' : 'Hidden'}
          </Label>
        </TableCell>

        <TableCell>
          <IconButton color={menuActions.open ? 'inherit' : 'default'} onClick={menuActions.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
});
