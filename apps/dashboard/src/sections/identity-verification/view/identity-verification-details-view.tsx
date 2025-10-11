'use client';

import type { UpdateVerificationStatusDto } from 'src/api/models/admin';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';

import { fDate, fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { UpdateVerificationStatusDtoStatus } from 'src/api/models/admin';
import {
  useIdentityVerificationAdminControllerGetVerification,
  useIdentityVerificationAdminControllerUpdateVerificationStatus,
} from 'src/api/queries/admin/identity-verification-management/identity-verification-management';

import { Label } from 'src/components/label';
import { Image } from 'src/components/image';
import { toast } from 'src/components/snackbar';
import { ErrorState } from 'src/components/error-state';
import { LoadingState } from 'src/components/loading-state';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

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

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'under_review':
      return 'Under Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'expired':
      return 'Expired';
    default:
      return status;
  }
};

// ----------------------------------------------------------------------

interface Props {
  id: string;
}

export function IdentityVerificationDetailsView({ id }: Props) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
  }>({
    open: false,
    action: null,
  });

  const { data, isLoading, error, refetch } =
    useIdentityVerificationAdminControllerGetVerification(id);
  const { mutate: updateVerificationStatus, isPending: isUpdating } =
    useIdentityVerificationAdminControllerUpdateVerificationStatus();

  const verification = data?.data;

  const handleStatusUpdate = useCallback((action: 'approve' | 'reject') => {
    setConfirmDialog({
      open: true,
      action,
    });
  }, []);

  const handleConfirmStatusUpdate = useCallback(() => {
    if (!verification || !confirmDialog.action) return;

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
        id: verification._id,
        data: updateData,
      },
      {
        onSuccess: () => {
          toast.success(`Verification ${confirmDialog.action}d successfully`);
          refetch();
          setConfirmDialog({ open: false, action: null });
        },
        onError: () => {
          toast.error(`Failed to ${confirmDialog.action} verification`);
        },
      }
    );
  }, [verification, confirmDialog, updateVerificationStatus, refetch]);

  if (error) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Verification Details"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Identity Verification', href: paths.dashboard.identityVerification.list },
            { name: 'Details' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <ErrorState
          title="Failed to load verification details"
          subtitle="There was an error loading the verification details. Please try again."
          onRetry={refetch}
          variant="card"
        />
      </DashboardContent>
    );
  }

  if (isLoading) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Verification Details"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Identity Verification', href: paths.dashboard.identityVerification.list },
            { name: 'Details' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <LoadingState
          title="Loading verification details..."
          variant="card"
          size="large"
          fullHeight
        />
      </DashboardContent>
    );
  }

  if (!verification) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Verification Details"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Identity Verification', href: paths.dashboard.identityVerification.list },
            { name: 'Details' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <ErrorState
          title="Verification not found"
          subtitle="The requested verification could not be found."
          variant="card"
        />
      </DashboardContent>
    );
  }

  const canApprove = verification.status !== 'approved' && verification.status !== 'expired';
  const canReject = verification.status !== 'rejected' && verification.status !== 'expired';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Verification Details"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Identity Verification', href: paths.dashboard.identityVerification.list },
          {
            name: `${verification.firstName} ${verification.lastName}`,
          },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            {canApprove && (
              <Button
                variant="contained"
                color="success"
                onClick={() => handleStatusUpdate('approve')}
                disabled={isUpdating}
                startIcon={<Box component="span">✓</Box>}
              >
                Approve
              </Button>
            )}
            {canReject && (
              <Button
                variant="contained"
                color="error"
                onClick={() => handleStatusUpdate('reject')}
                disabled={isUpdating}
                startIcon={<Box component="span">✗</Box>}
              >
                Reject
              </Button>
            )}
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        {/* User Information */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader
              title="User Information"
              avatar={
                <Avatar
                  src={verification.user?.profilePictureUrl}
                  alt={verification.user?.firstName + ' ' + verification.user?.lastName}
                  sx={{ width: 48, height: 48 }}
                />
              }
            />
            <CardContent>
              <Stack spacing={2}>
                <Stack>
                  <Typography variant="subtitle2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">
                    {`${verification.firstName} ${verification.lastName}`}
                  </Typography>
                </Stack>

                <Stack>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{verification.user?.email || 'N/A'}</Typography>
                </Stack>

                <Stack>
                  <Typography variant="subtitle2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1">{verification.user?.phoneNumber || 'N/A'}</Typography>
                </Stack>

                <Stack>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Label
                    color={getStatusColor(verification.status)}
                    variant="soft"
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {getStatusLabel(verification.status)}
                  </Label>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Document Information */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardHeader title="Document Information" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={2}>
                    <Stack>
                      <Typography variant="subtitle2" color="text.secondary">
                        Document Type
                      </Typography>
                      <Typography variant="body1">
                        {getDocumentTypeLabel(verification.documentType)}
                      </Typography>
                    </Stack>

                    <Stack>
                      <Typography variant="subtitle2" color="text.secondary">
                        Document Number
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {verification.documentNumber}
                      </Typography>
                    </Stack>

                    <Stack>
                      <Typography variant="subtitle2" color="text.secondary">
                        Issuing Country
                      </Typography>
                      <Typography variant="body1">{verification.issuingCountry}</Typography>
                    </Stack>

                    {verification.issuingState && (
                      <Stack>
                        <Typography variant="subtitle2" color="text.secondary">
                          Issuing State
                        </Typography>
                        <Typography variant="body1">{verification.issuingState}</Typography>
                      </Stack>
                    )}
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Stack spacing={2}>
                    <Stack>
                      <Typography variant="subtitle2" color="text.secondary">
                        Date of Birth
                      </Typography>
                      <Typography variant="body1">{fDate(verification.dateOfBirth)}</Typography>
                    </Stack>

                    <Stack>
                      <Typography variant="subtitle2" color="text.secondary">
                        Nationality
                      </Typography>
                      <Typography variant="body1">{verification.nationality || 'N/A'}</Typography>
                    </Stack>

                    <Stack>
                      <Typography variant="subtitle2" color="text.secondary">
                        Expiration Date
                      </Typography>
                      <Typography
                        variant="body1"
                        color={
                          new Date(verification.expirationDate) < new Date()
                            ? 'error.main'
                            : 'text.primary'
                        }
                        sx={{
                          fontWeight:
                            new Date(verification.expirationDate) < new Date() ? 600 : 400,
                        }}
                      >
                        {fDate(verification.expirationDate)}
                        {new Date(verification.expirationDate) < new Date() && ' (Expired)'}
                      </Typography>
                    </Stack>

                    <Stack>
                      <Typography variant="subtitle2" color="text.secondary">
                        Attempts
                      </Typography>
                      <Typography variant="body1">{verification.attemptCount}</Typography>
                    </Stack>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Document Images */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader title="Document Images" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Front</Typography>
                    <Image
                      src={verification.documentFrontImageUrl}
                      alt="Document Front"
                      ratio="4/3"
                      sx={{
                        borderRadius: 1,
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                      }}
                    />
                  </Stack>
                </Grid>

                {verification.documentBackImageUrl && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Back</Typography>
                      <Image
                        src={verification.documentBackImageUrl}
                        alt="Document Back"
                        ratio="4/3"
                        sx={{
                          borderRadius: 1,
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                        }}
                      />
                    </Stack>
                  </Grid>
                )}

                {verification.selfieImageUrl && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Selfie</Typography>
                      <Image
                        src={verification.selfieImageUrl}
                        alt="Selfie"
                        ratio="4/3"
                        sx={{
                          borderRadius: 1,
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                        }}
                      />
                    </Stack>
                  </Grid>
                )}

                {verification.proofOfAddressImageUrl && (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">Proof of Address</Typography>
                      <Image
                        src={verification.proofOfAddressImageUrl}
                        alt="Proof of Address"
                        ratio="4/3"
                        sx={{
                          borderRadius: 1,
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                        }}
                      />
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Timeline */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader title="Status History" />
            <CardContent>
              <Stack spacing={2}>
                {verification.statusHistory.map((history, index) => (
                  <Stack key={index}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Label color={getStatusColor(history.status)} variant="soft">
                        {getStatusLabel(history.status)}
                      </Label>
                      <Typography variant="body2" color="text.secondary">
                        {fDateTime(history.changedAt)}
                      </Typography>
                      {history.changedBy && (
                        <Typography variant="body2">by {history.changedBy}</Typography>
                      )}
                    </Stack>
                    {history.comment && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 2, mt: 0.5 }}>
                        {history.comment}
                      </Typography>
                    )}
                    {index < verification.statusHistory.length - 1 && <Divider sx={{ mt: 1 }} />}
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null })}
        title={`${confirmDialog.action === 'approve' ? 'Approve' : 'Reject'} Verification`}
        content={
          <Box>
            <Typography>
              Are you sure you want to {confirmDialog.action} the verification for{' '}
              <strong>{`${verification.firstName} ${verification.lastName}`}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Document: {getDocumentTypeLabel(verification.documentType)} -{' '}
              {verification.documentNumber}
            </Typography>
          </Box>
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
    </DashboardContent>
  );
}
