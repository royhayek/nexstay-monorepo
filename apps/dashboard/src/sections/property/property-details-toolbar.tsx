import type { PropertyResponseDto } from 'src/api/models/admin';

import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

type Props = {
  backHref: string;
  editHref: string;
  liveHref: string;
  status: string;
  onChangeStatus: (newValue: string) => void;
  statusOptions?: { value: string; label: string }[];
  property: PropertyResponseDto;
  isStatusLoading?: boolean;
};

export function PropertyDetailsToolbar({
  status,
  backHref,
  editHref,
  liveHref,
  statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'deleted', label: 'Deleted' },
  ],
  onChangeStatus,
  property,
  isStatusLoading,
  ...other
}: Props) {
  const menuActions = usePopover();

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case 'published':
        return <Iconify icon="eva:cloud-upload-fill" />;
      case 'draft':
        return <Iconify icon="solar:file-text-bold" />;
      case 'suspended':
        return <Iconify icon="solar:pause-circle-bold" />;
      case 'deleted':
        return <Iconify icon="solar:trash-bin-minimalistic-bold" />;
      default:
        return <Iconify icon="solar:question-circle-bold" />;
    }
  };

  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case 'published':
        return 'success.main';
      case 'draft':
        return 'warning.main';
      case 'suspended':
        return 'error.main';
      case 'deleted':
        return 'error.main';
      default:
        return 'text.primary';
    }
  };

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'top-right' } }}
    >
      <MenuList>
        {statusOptions.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === status}
            disabled={isStatusLoading}
            onClick={() => {
              menuActions.onClose();
              if (option.value !== status && onChangeStatus) {
                onChangeStatus(option.value);
              }
            }}
          >
            {getStatusIcon(option.value)}
            {option.label}
          </MenuItem>
        ))}
      </MenuList>
    </CustomPopover>
  );


  return (
    <>
      <Box sx={{ mb: 2, gap: 1.5, display: 'flex' }} {...other}>
        <Button
          component={RouterLink}
          href={backHref}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
        >
          Back
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Tooltip title="Edit">
          <IconButton component={RouterLink} href={editHref}>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        </Tooltip>

        <Tooltip
          title={
            status === 'deleted'
              ? 'Property status cannot be changed once deleted'
              : 'Change property status'
          }
        >
          <span>
            <Button
              color="inherit"
              variant="contained"
              disabled={isStatusLoading || status === 'deleted'}
              endIcon={status !== 'deleted' ? <Iconify icon="eva:arrow-ios-downward-fill" /> : null}
              onClick={status !== 'deleted' ? menuActions.onOpen : undefined}
              startIcon={getStatusIcon(status)}
              sx={{
                textTransform: 'capitalize',
                opacity: isStatusLoading ? 0.6 : status === 'deleted' ? 0.7 : 1,
                backgroundColor: getStatusColor(status),
                cursor: status === 'deleted' ? 'not-allowed' : 'pointer',
                '&:hover': {
                  backgroundColor: getStatusColor(status),
                  filter: status !== 'deleted' ? 'brightness(0.9)' : 'none',
                },
                '&.Mui-disabled': {
                  backgroundColor: status === 'deleted' ? getStatusColor(status) : undefined,
                  color: status === 'deleted' ? 'white' : undefined,
                },
              }}
            >
              {isStatusLoading ? 'Loading...' : status}
              {status === 'deleted' && ' (Read-only)'}
            </Button>
          </span>
        </Tooltip>
      </Box>

      {renderMenuActions()}
    </>
  );
}
