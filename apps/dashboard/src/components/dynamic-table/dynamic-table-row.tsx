import type { DynamicTableRowProps } from './types';
import type { IconifyName } from 'src/components/iconify';

import { useMemo } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/routes/components';

import { fDate, fDateTime } from 'src/utils/format-time';
import { fNumber, fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export function DynamicTableRow<TData = any>({
  row,
  selected,
  onSelectRow,
  columns,
  actions = [],
}: DynamicTableRowProps<TData>) {
  const popover = usePopover();

  const hasActions = actions.length > 0;
  const multipleActions = actions.length > 1;

  const availableActions = useMemo(
    () => actions.filter((action) => !action.disabled?.(row)),
    [actions, row]
  );

  const primaryAction = availableActions.find((action) => action.href) || availableActions[0];
  
  const getHref = (action: typeof availableActions[0]) => {
    if (typeof action.href === 'function') {
      return action.href(row);
    }
    return action.href;
  };

  const renderCell = (column: any, value: any) => {
    if (column.render) {
      return column.render(row);
    }

    if (value == null) return '—';

    // Handle advanced formatting
    if (column.format) {
      switch (column.format) {
        case 'currency':
          return fCurrency(value, column.currency);
        case 'number':
          return fNumber(value, column.decimals);
        case 'date':
          return fDate(value, column.dateFormat);
        case 'datetime':
          return fDateTime(value, column.dateFormat);
        case 'boolean':
          return (
            <Iconify
              width={16}
              icon={value ? 'eva:checkmark-fill' as IconifyName : 'eva:close-fill' as IconifyName}
              sx={{ color: value ? 'success.main' : 'error.main' }}
            />
          );
        case 'status': {
          const statusColor = column.statusColors?.[value] || 'default';
          return (
            <Label variant="soft" color={statusColor}>
              {String(value)}
            </Label>
          );
        }
        case 'rating':
          return (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Rating value={Number(value)} readOnly size="small" />
              <Box component="span" sx={{ ml: 0.5, typography: 'body2' }}>
                {Number(value).toFixed(1)}
              </Box>
            </Box>
          );
        case 'image':
          return <Avatar alt="" src={String(value)} sx={{ width: 32, height: 32 }} />;
        default:
          break;
      }
    }

    // Default formatting
    if (typeof value === 'boolean') {
      return (
        <Iconify
          width={16}
          icon={value ? 'eva:checkmark-fill' as IconifyName : 'eva:close-fill' as IconifyName}
          sx={{ color: value ? 'success.main' : 'error.main' }}
        />
      );
    }

    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    return String(value);
  };

  const renderActionCell = () => {
    if (!hasActions) return null;

    if (!multipleActions && primaryAction) {
      const href = getHref(primaryAction);
      if (href) {
        return (
          <Tooltip title={primaryAction.label}>
            <IconButton
              component={RouterLink}
              href={href}
              color={primaryAction.color || 'default'}
            >
              <Iconify icon={primaryAction.icon as IconifyName} />
            </IconButton>
          </Tooltip>
        );
      }

      return (
        <Tooltip title={primaryAction.label}>
          <IconButton
            onClick={() => primaryAction.onClick(row)}
            color={primaryAction.color || 'default'}
          >
            <Iconify icon={primaryAction.icon as IconifyName} />
          </IconButton>
        </Tooltip>
      );
    }

    return (
      <>
        <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
          <Iconify icon={'eva:more-vertical-fill' as IconifyName} />
        </IconButton>

        <CustomPopover
          open={popover.open}
          anchorEl={popover.anchorEl}
          onClose={popover.onClose}
          slotProps={{ arrow: { placement: 'right-top' } }}
        >
          <MenuList>
            {availableActions.map((action) => (
              <MenuItem
                key={action.label}
                onClick={() => {
                  const href = getHref(action);
                  if (href) {
                    // Handle navigation
                    window.open(href, '_self');
                  } else {
                    action.onClick(row);
                  }
                  popover.onClose();
                }}
                sx={{
                  color: action.color === 'error' ? 'error.main' : 'inherit',
                }}
              >
                <Iconify icon={action.icon as IconifyName} />
                {action.label}
              </MenuItem>
            ))}
          </MenuList>
        </CustomPopover>
      </>
    );
  };

  return (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox
          checked={selected}
          onClick={onSelectRow}
          slotProps={{ input: { id: `row-checkbox-${JSON.stringify(row)}` } }}
        />
      </TableCell>

      {columns.map((column) => {
        const value = (row as any)[column.id];
        return (
          <TableCell 
            key={String(column.id)} 
            align={column.align || 'left'} 
            sx={[
              { 
                // Width is controlled by table header, no need to set it here
                // Text overflow is now handled at table level
                ...(column.render && {
                  // Custom renders might need to override overflow behavior
                  whiteSpace: 'normal',
                  overflow: 'visible'
                })
              },
              ...(Array.isArray(column.cellSx) ? column.cellSx : [column.cellSx])
            ]}
          >
            {renderCell(column, value)}
          </TableCell>
        );
      })}

      <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
        {renderActionCell()}
      </TableCell>
    </TableRow>
  );
}
