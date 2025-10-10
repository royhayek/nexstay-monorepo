import type { BookingResponseDto } from 'src/api/models';

import { useBoolean, usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fTime } from 'src/utils/format-time';

import {
  useBookingsControllerConfirmV1,
  useBookingsControllerCheckInV1,
  useBookingsControllerCheckOutV1,
} from 'src/api/queries/bookings/bookings';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: BookingResponseDto;
  selected: boolean;
  detailsHref: string;
  propertyHref: string;
  onSelectRow: () => void;
  onCancelBooking: () => void;
};

export function BookingTableRow({
  row,
  selected,
  detailsHref,
  propertyHref,
  onSelectRow,
  onCancelBooking,
}: Props) {
  const menuActions = usePopover();
  const confirmDialog = useBoolean();

  const { mutate: confirmBooking } = useBookingsControllerConfirmV1();
  const { mutate: checkInBooking } = useBookingsControllerCheckInV1();
  const { mutate: checkOutBooking } = useBookingsControllerCheckOutV1();

  const handleConfirmBooking = () => {
    confirmBooking(
      { id: row._id },
      {
        onSuccess: () => {
          toast.success('Booking confirmed successfully');
          window.location.reload();
        },
        onError: () => {
          toast.error('Failed to confirm booking');
        },
      }
    );
  };

  const handleCheckIn = () => {
    checkInBooking(
      { id: row._id },
      {
        onSuccess: () => {
          toast.success('Guest checked in successfully');
          window.location.reload();
        },
        onError: () => {
          toast.error('Failed to check in guest');
        },
      }
    );
  };

  const handleCheckOut = () => {
    checkOutBooking(
      { id: row._id },
      {
        onSuccess: () => {
          toast.success('Guest checked out successfully');
          window.location.reload();
        },
        onError: () => {
          toast.error('Failed to check out guest');
        },
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'checked_in':
        return 'success';
      case 'checked_out':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'pending':
        return 'warning';
      case 'paid':
        return 'success';
      case 'refunded':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const canConfirm = row.status === 'pending';
  const canCheckIn = row.status === 'confirmed';
  const canCheckOut = row.status === 'checked_in';
  const canCancel = row.status !== 'cancelled' && row.status !== 'checked_out';

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <li>
          <MenuItem component={RouterLink} href={detailsHref} onClick={() => menuActions.onClose()}>
            <Iconify icon="solar:eye-bold" />
            View Details
          </MenuItem>
        </li>

        {canConfirm && (
          <MenuItem
            onClick={() => {
              handleConfirmBooking();
              menuActions.onClose();
            }}
            sx={{ color: 'info.main' }}
          >
            <Iconify icon="solar:check-circle-bold" />
            Confirm Booking
          </MenuItem>
        )}

        {canCheckIn && (
          <MenuItem
            onClick={() => {
              handleCheckIn();
              menuActions.onClose();
            }}
            sx={{ color: 'success.main' }}
          >
            <Iconify icon="solar:login-3-bold" />
            Check In
          </MenuItem>
        )}

        {canCheckOut && (
          <MenuItem
            onClick={() => {
              handleCheckOut();
              menuActions.onClose();
            }}
            sx={{ color: 'warning.main' }}
          >
            <Iconify icon="solar:logout-3-bold" />
            Check Out
          </MenuItem>
        )}

        {canCancel && (
          <MenuItem
            onClick={() => {
              confirmDialog.onTrue();
              menuActions.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:close-circle-bold" />
            Cancel Booking
          </MenuItem>
        )}
      </MenuList>
    </CustomPopover>
  );

  const renderConfirmDialog = () => (
    <ConfirmDialog
      open={confirmDialog.value}
      onClose={confirmDialog.onFalse}
      title="Cancel Booking"
      content="Are you sure want to cancel this booking?"
      action={
        <Button variant="contained" color="error" onClick={onCancelBooking}>
          Cancel Booking
        </Button>
      }
    />
  );

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
          <Link
            component={RouterLink}
            href={detailsHref}
            color="inherit"
            sx={{ cursor: 'pointer' }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
              {row.confirmation_code || 'N/A'}
            </Typography>
          </Link>
        </TableCell>

        <TableCell>
          <Link
            component={RouterLink}
            href={propertyHref}
            color="inherit"
            sx={{ cursor: 'pointer' }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
              {row.property.name}
            </Typography>
          </Link>
        </TableCell>

        <TableCell>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ width: 40, height: 40 }}>
              {(row.guest_email?.[0] || 'G').toUpperCase()}
            </Avatar>

            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Typography variant="subtitle2" noWrap>
                Guest
              </Typography>
              <Box component="span" sx={{ color: 'text.disabled', typography: 'caption' }}>
                {row.guest_email || 'No email'}
              </Box>
            </Stack>
          </Box>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{fDate(row.check_in)}</Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{fDate(row.check_out)}</Typography>
        </TableCell>

        <TableCell align="center">
          <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
            {row.nights}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
            {fCurrency(row.pricing?.total_amount || 0)}
          </Typography>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={getStatusColor(row.status) as any}>
            {row.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </Label>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={getPaymentStatusColor(row.payment_status) as any}>
            {row.payment_status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </Label>
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(row.createdAt)}
            secondary={fTime(row.createdAt)}
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
            <IconButton
              color={menuActions.open ? 'inherit' : 'default'}
              onClick={menuActions.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>

      {renderMenuActions()}
      {renderConfirmDialog()}
    </>
  );
}
