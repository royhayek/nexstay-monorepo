import type { UserDataDto } from 'src/api/models';

import { memo } from 'react';
import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';

import { fDate, fTime } from 'src/utils/format-time';
import { fShortenNumber } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

import { UserQuickEditForm } from './user-quick-edit-form';

// ----------------------------------------------------------------------

type Props = {
  row: UserDataDto;
  selected: boolean;
  editHref: string;
  onSelectRow: () => void;
  onDeleteRow: () => void;
};

export const UserTableRow = memo(function UserTableRow({
  row,
  selected,
  editHref,
  onSelectRow,
  onDeleteRow,
}: Props) {
  const menuActions = usePopover();
  const confirmDialog = useBoolean();
  const quickEditForm = useBoolean();

  const renderQuickEditForm = () => (
    <UserQuickEditForm
      currentUser={row}
      open={quickEditForm.value}
      onClose={quickEditForm.onFalse}
    />
  );

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <li>
          <MenuItem component={RouterLink} href={editHref} onClick={() => menuActions.onClose()}>
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
      content="Are you sure want to delete?"
      action={
        <Button variant="contained" color="error" onClick={onDeleteRow}>
          Delete
        </Button>
      }
    />
  );

  const name = `${row.firstName} ${row.lastName}`;

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onClick={onSelectRow}
            slotProps={{
              input: {
                id: `${row.id}-checkbox`,
                'aria-label': `${row.id} checkbox`,
              },
            }}
          />
        </TableCell>

        <TableCell
          sx={{
            position: { xs: 'sticky', sm: 'static' },
            left: { xs: 0, sm: 'auto' },
            bgcolor: { xs: 'background.paper', sm: 'transparent' },
            zIndex: { xs: 1, sm: 0 },
            minWidth: { xs: 200, sm: 280 },
          }}
        >
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar
              alt={name}
              src={row.avatarUrl}
              sx={{
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                border: (theme) => `2px solid ${theme.vars.palette.background.neutral}`,
              }}
            />

            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Link
                component={RouterLink}
                href={editHref}
                color="inherit"
                sx={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {name}
              </Link>

              {row.bio && (
                <Box
                  component="span"
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: 11, sm: 12 },
                    maxWidth: { xs: 150, sm: 200 },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  {row.bio}
                </Box>
              )}
            </Stack>
          </Box>
        </TableCell>

        <TableCell>
          <Stack spacing={0.5}>
            {row.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Iconify icon="solar:phone-bold" width={16} sx={{ color: 'text.secondary' }} />
                <Box component="span" sx={{ typography: 'caption', color: 'text.secondary' }}>
                  {row.phone}
                </Box>
                {row.isPhoneVerified && (
                  <Iconify
                    icon="solar:check-circle-bold"
                    width={14}
                    sx={{ color: 'success.main' }}
                  />
                )}
              </Box>
            )}
            {row.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Iconify icon="solar:letter-bold" width={16} sx={{ color: 'text.secondary' }} />
                <Box
                  component="span"
                  sx={{
                    typography: 'caption',
                    color: 'text.secondary',
                    maxWidth: 180,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {row.email}
                </Box>
                {row.isEmailVerified && (
                  <Iconify
                    icon="solar:check-circle-bold"
                    width={14}
                    sx={{ color: 'success.main' }}
                  />
                )}
              </Box>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {row.roles.map((role) => (
              <Label
                key={role}
                variant="soft"
                color={role === 'admin' ? 'error' : role === 'host' ? 'warning' : 'default'}
                sx={{ textTransform: 'capitalize' }}
              >
                {role}
              </Label>
            ))}
          </Stack>
        </TableCell>

        <TableCell align="center">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Box sx={{ typography: 'h6', fontWeight: 600 }}>{fShortenNumber(row.reviewCount)}</Box>
          </Box>
          {row.reviewCount > 0 && (
            <Box sx={{ typography: 'caption', color: 'text.secondary' }}>
              review{row.reviewCount !== 1 ? 's' : ''}
            </Box>
          )}
        </TableCell>

        <TableCell align="center">
          {row.averageRating > 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <Iconify icon="solar:star-bold" sx={{ color: 'warning.main' }} width={18} />
              <Box sx={{ typography: 'subtitle2', fontWeight: 600 }}>
                {row.averageRating.toFixed(1)}
              </Box>
            </Box>
          ) : (
            <Box sx={{ typography: 'body2', color: 'text.disabled' }}>No rating</Box>
          )}
        </TableCell>

        <TableCell align="center">
          <Label variant="soft" color="primary" sx={{ mb: 1 }}>
            {row.status}
          </Label>
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(row.birthDate || new Date())}
            secondary={fTime(row.birthDate || new Date())}
            slotProps={{
              primary: {
                noWrap: true,
                sx: { typography: 'body2' },
              },
              secondary: {
                sx: { mt: 0.5, typography: 'caption' },
              },
            }}
          />
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Quick edit" placement="top" arrow>
              <IconButton
                color={quickEditForm.value ? 'inherit' : 'default'}
                onClick={quickEditForm.onTrue}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>

            <IconButton
              color={menuActions.open ? 'inherit' : 'default'}
              onClick={menuActions.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      {renderQuickEditForm()}
      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
});
