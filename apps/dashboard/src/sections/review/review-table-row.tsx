import type { ReviewDataDto } from 'src/api/models';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { RouterLink } from 'src/routes/components';

import { fDate, fTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  row: ReviewDataDto;
  detailsHref: string;
};

export function ReviewTableRow({ row, detailsHref }: Props) {
  const menuActions = usePopover();

  const getReviewTypeColor = (reviewType: string) => {
    switch (reviewType) {
      case 'guest_to_host':
        return 'info';
      case 'host_to_guest':
        return 'success';
      default:
        return 'default';
    }
  };

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
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ width: 40, height: 40 }}>R</Avatar>

            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Typography variant="subtitle2" noWrap>
                Reviewer
              </Typography>
              <Box component="span" sx={{ color: 'text.disabled', typography: 'caption' }}>
                ID: {row.reviewer_id.slice(-8)}
              </Box>
            </Stack>
          </Box>
        </TableCell>

        <TableCell>
          <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ width: 40, height: 40 }}>R</Avatar>

            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Typography variant="subtitle2" noWrap>
                Reviewee
              </Typography>
              <Box component="span" sx={{ color: 'text.disabled', typography: 'caption' }}>
                ID: {row.reviewee_id.slice(-8)}
              </Box>
            </Stack>
          </Box>
        </TableCell>

        <TableCell>
          <Link
            component={RouterLink}
            href={detailsHref}
            color="inherit"
            sx={{ cursor: 'pointer' }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
              Property #{row.property_id.slice(-8)}
            </Typography>
          </Link>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={getReviewTypeColor(row.review_type) as any}>
            {row.review_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </Label>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Rating
              value={row.overall_rating || 0}
              precision={0.1}
              readOnly
              size="small"
              sx={{ '& .MuiRating-icon': { fontSize: '1rem' } }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              ({row.overall_rating?.toFixed(1) || 'N/A'})
            </Typography>
          </Box>
        </TableCell>

        <TableCell align="center">
          <Typography variant="body2">{row.accuracy?.toFixed(1) || 'N/A'}</Typography>
        </TableCell>

        <TableCell align="center">
          <Typography variant="body2">{row.communication?.toFixed(1) || 'N/A'}</Typography>
        </TableCell>

        <TableCell align="center">
          <Typography variant="body2">{row.cleanliness?.toFixed(1) || 'N/A'}</Typography>
        </TableCell>

        <TableCell align="center">
          <Typography variant="body2">{row.location?.toFixed(1) || 'N/A'}</Typography>
        </TableCell>

        <TableCell align="center">
          <Typography variant="body2">{row.value?.toFixed(1) || 'N/A'}</Typography>
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
    </>
  );
}
