'use client';

import type { IconifyName } from 'src/components/iconify';
import type { AmenityCategoryDataDto } from 'src/api/models';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: AmenityCategoryDataDto;
  selected: boolean;
  onEditRow: () => void;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export function AmenityCategoryTableRow({
  row,
  selected,
  onEditRow,
  onSelectRow,
  onDeleteRow,
}: Props) {
  const confirmDelete = useBoolean();
  const popover = usePopover();

  const renderPrimary = (
    <CustomPopover
      open={popover.open}
      anchorEl={popover.anchorEl}
      onClose={popover.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem
          onClick={() => {
            confirmDelete.onTrue();
            popover.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>

        <MenuItem
          onClick={() => {
            onEditRow();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onClick={onSelectRow}
            inputProps={{ id: `row-checkbox-${row._id}`, 'aria-label': `Row checkbox` }}
          />
        </TableCell>

        <TableCell>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {row.icon && (
              <Avatar sx={{ width: 32, height: 32 }}>
                <Iconify icon={row.icon as IconifyName} width={20} />
              </Avatar>
            )}
            <div>
              <div style={{ fontWeight: 600 }}>
                {typeof row.name === 'object'
                  ? String(
                      Object.values(row.name).find(
                        (name) => typeof name === 'string' && name.trim()
                      ) ??
                        Object.values(row.name)[0] ??
                        ''
                    )
                  : String(row.name ?? '')}
              </div>
              <div>
                {typeof row.description === 'object'
                  ? String(
                      Object.values(row.description).find(
                        (desc) => typeof desc === 'string' && desc.trim()
                      ) ??
                        Object.values(row.description)[0] ??
                        ''
                    )
                  : String(row.description ?? '')}
              </div>
            </div>
          </div>
        </TableCell>

        <TableCell>
          <code
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.04)',
              fontSize: '0.75rem',
            }}
          >
            {row.key}
          </code>
        </TableCell>

        <TableCell>{row.group || '-'}</TableCell>

        <TableCell align="center">{row.sortOrder}</TableCell>

        <TableCell align="center">
          <Label variant="soft" color={row.isActive ? 'success' : 'default'}>
            {row.isActive ? 'Active' : 'Inactive'}
          </Label>
        </TableCell>

        <TableCell align="right">
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      {renderPrimary}

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={confirmDelete.onFalse}
        title="Delete"
        content="Are you sure want to delete this category?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}
