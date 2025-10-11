'use client';

import type { DynamicTableColumn } from 'src/components/dynamic-table';
import type {
  IdentityVerificationDto,
  UpdateVerificationStatusDto,
  IdentityVerificationAdminControllerListVerificationsParams,
} from 'src/api/models/admin';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate, fTime } from 'src/utils/format-time';

import {
  IdentityVerificationDtoStatus,
  UpdateVerificationStatusDtoStatus,
  IdentityVerificationDtoDocumentType,
} from 'src/api/models/admin';
import {
  useIdentityVerificationAdminControllerListVerifications,
  useIdentityVerificationAdminControllerDeleteVerification,
  useIdentityVerificationAdminControllerUpdateVerificationStatus,
} from 'src/api/queries/admin/identity-verification-management/identity-verification-management';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { useTable } from 'src/components/table';
import { DynamicTable } from 'src/components/dynamic-table';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'under_review':
      return 'info';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'expired':
      return 'default';
    default:
      return 'default';
  }
};

const getDocumentTypeLabel = (documentType: string) => {
  switch (documentType) {
    case 'passport':
      return 'Passport';
    case 'national_id':
      return 'National ID';
    case 'drivers_license':
      return "Driver's License";
    case 'residence_permit':
      return 'Residence Permit';
    default:
      return documentType;
  }
};

const TABLE_COLUMNS: DynamicTableColumn<IdentityVerificationDto>[] = [
  {
    id: 'user',
    label: 'User',
    width: 200,
    render: (verification) => (
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar
          alt={`${verification.user?.firstName} ${verification.user?.lastName}`}
          sx={{ width: 32, height: 32 }}
        />
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {verification.user?.firstName && verification.user?.lastName
              ? `${verification.user.firstName} ${verification.user.lastName}`
              : `${verification.firstName} ${verification.lastName}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {verification.user?.email}
          </Typography>
        </Stack>
      </Stack>
    ),
  },
  {
    id: 'documentType',
    label: 'Document Type',
    width: 140,
    render: (verification) => (
      <Chip
        label={getDocumentTypeLabel(verification.documentType)}
        size="small"
        variant="outlined"
        color="info"
      />
    ),
  },
  {
    id: 'documentNumber',
    label: 'Document Number',
    width: 150,
    render: (verification) => (
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {verification.documentNumber}
      </Typography>
    ),
  },
  {
    id: 'status',
    label: 'Status',
    width: 120,
    align: 'center',
    render: (verification) => {
      const statusConfig = {
        pending: { label: 'Pending' },
        under_review: { label: 'Under Review' },
        approved: { label: 'Approved' },
        rejected: { label: 'Rejected' },
        expired: { label: 'Expired' },
      };

      const config = statusConfig[verification.status as keyof typeof statusConfig] || {
        label: 'Unknown',
      };

      return (
        <Label color={getStatusColor(verification.status)} variant="soft">
          {config.label}
        </Label>
      );
    },
  },
  {
    id: 'attemptCount',
    label: 'Attempts',
    width: 100,
    align: 'center',
    render: (verification) => <Typography variant="body2">{verification.attemptCount}</Typography>,
  },
  {
    id: 'submittedAt',
    label: 'Submitted',
    width: 160,
    render: (verification) => (
      <ListItemText
        primary={fDate(verification.submittedAt)}
        secondary={fTime(verification.submittedAt)}
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
    ),
  },
  {
    id: 'expirationDate',
    label: 'Document Expires',
    width: 140,
    render: (verification) => (
      <Typography
        variant="body2"
        color={new Date(verification.expirationDate) < new Date() ? 'error.main' : 'text.primary'}
      >
        {fDate(verification.expirationDate)}
      </Typography>
    ),
  },
];

// ----------------------------------------------------------------------

interface IdentityVerificationFilter extends Record<string, unknown> {
  status: string;
  documentType: string[];
  issuingCountry: string[];
  userId: string;
  reviewerId: string;
  dateFrom: string;
  dateTo: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: IdentityVerificationDtoStatus.pending, label: 'Pending' },
  { value: IdentityVerificationDtoStatus.under_review, label: 'Under Review' },
  { value: IdentityVerificationDtoStatus.approved, label: 'Approved' },
  { value: IdentityVerificationDtoStatus.rejected, label: 'Rejected' },
  { value: IdentityVerificationDtoStatus.expired, label: 'Expired' },
];

const DOCUMENT_TYPE_OPTIONS = [
  { value: IdentityVerificationDtoDocumentType.passport, label: 'Passport' },
  { value: IdentityVerificationDtoDocumentType.national_id, label: 'National ID' },
  { value: IdentityVerificationDtoDocumentType.drivers_license, label: "Driver's License" },
  { value: IdentityVerificationDtoDocumentType.residence_permit, label: 'Residence Permit' },
];

export function IdentityVerificationList() {
  const table = useTable();
  const router = useRouter();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
    verification: IdentityVerificationDto | null;
  }>({
    open: false,
    action: null,
    verification: null,
  });

  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | 'delete' | null;
    ids: string[];
  }>({
    open: false,
    action: null,
    ids: [],
  });

  const filters = useSetState<IdentityVerificationFilter>({
    status: 'all',
    documentType: [],
    issuingCountry: [],
    userId: '',
    reviewerId: '',
    dateFrom: '',
    dateTo: '',
  });
  const { state: currentFilters, setState: updateFilters } = filters;

  const tableColumns = useMemo(() => TABLE_COLUMNS, []);

  const queryParams = useMemo((): IdentityVerificationAdminControllerListVerificationsParams => {
    const params: IdentityVerificationAdminControllerListVerificationsParams = {
      page: table.page,
      limit: table.rowsPerPage,
    };

    if (currentFilters.status !== 'all') {
      params.status = currentFilters.status as any;
    }

    if (currentFilters.documentType.length > 0) {
      params.documentType = currentFilters.documentType[0] as any;
    }

    if (currentFilters.issuingCountry.length > 0) {
      params.issuingCountry = currentFilters.issuingCountry[0];
    }

    if (currentFilters.userId) {
      params.userId = currentFilters.userId;
    }

    if (currentFilters.reviewerId) {
      params.reviewerId = currentFilters.reviewerId;
    }

    if (currentFilters.dateFrom) {
      params.dateFrom = currentFilters.dateFrom;
    }

    if (currentFilters.dateTo) {
      params.dateTo = currentFilters.dateTo;
    }

    return params;
  }, [table.page, table.rowsPerPage, currentFilters]);

  const { data, isLoading, error, refetch } =
    useIdentityVerificationAdminControllerListVerifications(queryParams);
  const { mutate: updateVerificationStatus, isPending: isUpdating } =
    useIdentityVerificationAdminControllerUpdateVerificationStatus();
  const { mutate: deleteVerification } = useIdentityVerificationAdminControllerDeleteVerification();

  const verificationsList = useMemo(() => data?.data?.items || [], [data]);

  const canResetFilters = useCallback(
    (filterState: IdentityVerificationFilter) =>
      filterState.status !== 'all' ||
      filterState.documentType.length > 0 ||
      filterState.issuingCountry.length > 0 ||
      !!filterState.userId ||
      !!filterState.reviewerId ||
      !!filterState.dateFrom ||
      !!filterState.dateTo,
    []
  );

  const handleTabChange = useCallback(
    (newValue: string) => {
      table.onResetPage();
      updateFilters({ status: newValue });
    },
    [updateFilters, table]
  );

  const handleRowClick = useCallback(
    (verification: IdentityVerificationDto) => {
      router.push(paths.dashboard.identityVerification.details(verification._id));
    },
    [router]
  );

  const handleStatusUpdate = useCallback(
    (verification: IdentityVerificationDto, action: 'approve' | 'reject') => {
      setConfirmDialog({
        open: true,
        action,
        verification,
      });
    },
    []
  );

  const handleConfirmStatusUpdate = useCallback(() => {
    if (!confirmDialog.verification || !confirmDialog.action) return;

    const status =
      confirmDialog.action === 'approve'
        ? UpdateVerificationStatusDtoStatus.approved
        : UpdateVerificationStatusDtoStatus.rejected;

    const updateData: UpdateVerificationStatusDto = {
      status,
      rejectionReason: confirmDialog.action === 'reject' ? ('admin_decision' as any) : undefined,
      comment: confirmDialog.action === 'reject' ? 'Rejected by admin' : undefined,
    };

    updateVerificationStatus(
      {
        id: confirmDialog.verification._id,
        data: updateData,
      },
      {
        onSuccess: () => {
          toast.success(`Verification ${confirmDialog.action}d successfully`);
          refetch();
          setConfirmDialog({ open: false, action: null, verification: null });
        },
        onError: () => {
          toast.error(`Failed to ${confirmDialog.action} verification`);
        },
      }
    );
  }, [confirmDialog, updateVerificationStatus, refetch]);

  const handleBulkAction = useCallback(
    (action: 'approve' | 'reject' | 'delete') => {
      if (table.selected.length === 0) {
        toast.warning('Please select at least one verification');
        return;
      }

      setBulkActionDialog({
        open: true,
        action,
        ids: table.selected,
      });
    },
    [table.selected]
  );

  const handleConfirmBulkAction = useCallback(async () => {
    if (!bulkActionDialog.action || bulkActionDialog.ids.length === 0) return;

    const promises = bulkActionDialog.ids.map((id) => {
      if (bulkActionDialog.action === 'delete') {
        return new Promise((resolve, reject) => {
          deleteVerification(
            { id },
            {
              onSuccess: resolve,
              onError: reject,
            }
          );
        });
      } else {
        const status =
          bulkActionDialog.action === 'approve'
            ? UpdateVerificationStatusDtoStatus.approved
            : UpdateVerificationStatusDtoStatus.rejected;

        const updateData: UpdateVerificationStatusDto = {
          status,
          rejectionReason:
            bulkActionDialog.action === 'reject' ? ('admin_decision' as any) : undefined,
          comment: bulkActionDialog.action === 'reject' ? 'Bulk rejected by admin' : undefined,
        };

        return new Promise((resolve, reject) => {
          updateVerificationStatus(
            { id, data: updateData },
            {
              onSuccess: resolve,
              onError: reject,
            }
          );
        });
      }
    });

    try {
      await Promise.all(promises);
      toast.success(
        `Successfully ${bulkActionDialog.action === 'delete' ? 'deleted' : `${bulkActionDialog.action}d`} ${bulkActionDialog.ids.length} verification(s)`
      );
      table.onSelectAllRows(false, []);
      refetch();
    } catch (err) {
      toast.error(`Failed to ${bulkActionDialog.action} some verifications`);
    } finally {
      setBulkActionDialog({ open: false, action: null, ids: [] });
    }
  }, [bulkActionDialog, deleteVerification, updateVerificationStatus, table, refetch]);

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Failed to load identity verifications
        </Typography>
        <Button variant="contained" onClick={() => refetch()} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <>
      <DynamicTable
        data={verificationsList}
        loading={isLoading}
        columns={tableColumns}
        getRowId={(row) => row._id}
        onRowClick={handleRowClick}
        pagination={{
          page: table.page,
          rowsPerPage: table.rowsPerPage,
          totalCount: (data as any)?.data?.total || 0,
          onPageChange: table.onChangePage,
          onRowsPerPageChange: table.onChangeRowsPerPage,
        }}
        sorting={{
          orderBy: table.orderBy,
          order: table.order,
          onSort: table.onSort,
        }}
        selection={{
          selected: table.selected,
          onSelectRow: table.onSelectRow,
          onSelectAllRows: (checked) =>
            table.onSelectAllRows(
              checked,
              verificationsList.map((row) => row._id)
            ),
          bulkActions: [
            {
              label: 'Approve',
              icon: 'solar:check-circle-bold',
              onClick: () => handleBulkAction('approve'),
              color: 'success',
            },
            {
              label: 'Reject',
              icon: 'solar:close-circle-bold',
              onClick: () => handleBulkAction('reject'),
              color: 'error',
            },
            {
              label: 'Delete',
              icon: 'solar:trash-bin-trash-bold',
              onClick: () => handleBulkAction('delete'),
              color: 'error',
            },
          ],
        }}
        filtering={{
          state: currentFilters,
          setState: updateFilters,
          showFiltersResult: true,
          canResetFilters,
          filterFields: [
            {
              id: 'documentType',
              label: 'Document Type',
              type: 'multiselect',
              name: 'documentType',
              options: DOCUMENT_TYPE_OPTIONS,
            },
            {
              id: 'issuingCountry',
              label: 'Issuing Country',
              type: 'multiselect',
              name: 'issuingCountry',
              options: [
                { value: 'LB', label: 'Lebanon' },
                { value: 'US', label: 'United States' },
                { value: 'GB', label: 'United Kingdom' },
                { value: 'CA', label: 'Canada' },
                { value: 'AU', label: 'Australia' },
                { value: 'DE', label: 'Germany' },
                { value: 'FR', label: 'France' },
                { value: 'IT', label: 'Italy' },
                { value: 'ES', label: 'Spain' },
                { value: 'NL', label: 'Netherlands' },
              ],
            },
            {
              id: 'userId',
              label: 'User ID',
              type: 'text',
              name: 'userId',
            },
            {
              id: 'reviewerId',
              label: 'Reviewer ID',
              type: 'text',
              name: 'reviewerId',
            },
            {
              id: 'dateFrom',
              label: 'Date From',
              type: 'date',
              name: 'dateFrom',
            },
            {
              id: 'dateTo',
              label: 'Date To',
              type: 'date',
              name: 'dateTo',
            },
          ],
        }}
        tabs={{
          tabs: STATUS_OPTIONS,
          activeTab: currentFilters.status,
          onTabChange: handleTabChange,
        }}
        options={{
          dense: table.dense,
          onChangeDense: table.onChangeDense,
          minWidth: 1200,
        }}
        rowActions={[
          {
            label: 'View Details',
            icon: 'solar:eye-bold',
            onClick: (verification: any) => handleRowClick(verification as IdentityVerificationDto),
            color: 'primary',
          },
          {
            label: 'Approve',
            icon: 'solar:check-circle-bold',
            onClick: (verification: any) =>
              handleStatusUpdate(verification as IdentityVerificationDto, 'approve'),
            color: 'success',
            disabled: (verification: any) =>
              (verification as IdentityVerificationDto).status === 'approved' ||
              (verification as IdentityVerificationDto).status === 'expired',
          },
          {
            label: 'Reject',
            icon: 'solar:close-circle-bold',
            onClick: (verification: any) =>
              handleStatusUpdate(verification as IdentityVerificationDto, 'reject'),
            color: 'error',
            disabled: (verification: any) =>
              (verification as IdentityVerificationDto).status === 'rejected' ||
              (verification as IdentityVerificationDto).status === 'expired',
          },
        ]}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null, verification: null })}
        title={`${confirmDialog.action === 'approve' ? 'Approve' : 'Reject'} Verification`}
        content={
          confirmDialog.verification ? (
            <Box>
              <Typography>
                Are you sure you want to {confirmDialog.action} the verification for{' '}
                <strong>
                  {confirmDialog.verification.user?.firstName &&
                  confirmDialog.verification.user?.lastName
                    ? `${confirmDialog.verification.user.firstName} ${confirmDialog.verification.user.lastName}`
                    : `${confirmDialog.verification.firstName} ${confirmDialog.verification.lastName}`}
                </strong>
                ?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Document: {getDocumentTypeLabel(confirmDialog.verification.documentType)} -{' '}
                {confirmDialog.verification.documentNumber}
              </Typography>
            </Box>
          ) : null
        }
        action={
          <Button
            variant="contained"
            color={confirmDialog.action === 'approve' ? 'success' : 'error'}
            onClick={handleConfirmStatusUpdate}
            disabled={isUpdating}
          >
            {isUpdating
              ? 'Processing...'
              : confirmDialog.action === 'approve'
                ? 'Approve'
                : 'Reject'}
          </Button>
        }
      />

      {/* Bulk Action Confirmation Dialog */}
      <ConfirmDialog
        open={bulkActionDialog.open}
        onClose={() => setBulkActionDialog({ open: false, action: null, ids: [] })}
        title={`Bulk ${
          bulkActionDialog.action === 'delete'
            ? 'Delete'
            : bulkActionDialog.action === 'approve'
              ? 'Approve'
              : 'Reject'
        } Verifications`}
        content={
          <Box>
            <Typography>
              Are you sure you want to{' '}
              {bulkActionDialog.action === 'delete' ? 'delete' : bulkActionDialog.action}{' '}
              <strong>{bulkActionDialog.ids.length}</strong> selected verification(s)?
            </Typography>
            {bulkActionDialog.action === 'delete' && (
              <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                Warning: This action cannot be undone.
              </Typography>
            )}
            {(bulkActionDialog.action === 'approve' || bulkActionDialog.action === 'reject') && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This will {bulkActionDialog.action} all selected verifications at once.
              </Typography>
            )}
          </Box>
        }
        action={
          <Button
            variant="contained"
            color={
              bulkActionDialog.action === 'delete'
                ? 'error'
                : bulkActionDialog.action === 'approve'
                  ? 'success'
                  : 'error'
            }
            onClick={handleConfirmBulkAction}
            disabled={isUpdating}
          >
            {isUpdating
              ? 'Processing...'
              : `${
                  bulkActionDialog.action === 'delete'
                    ? 'Delete'
                    : bulkActionDialog.action === 'approve'
                      ? 'Approve'
                      : 'Reject'
                } ${bulkActionDialog.ids.length} Item(s)`}
          </Button>
        }
      />
    </>
  );
}
