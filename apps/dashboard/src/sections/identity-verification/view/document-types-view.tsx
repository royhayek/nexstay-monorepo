'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useIdentityVerificationAdminControllerEnableDocumentType,
  useIdentityVerificationAdminControllerGetAllDocumentTypes,
  useIdentityVerificationAdminControllerDisableDocumentType,
  useIdentityVerificationAdminControllerUpdateLebanonPriority,
  useIdentityVerificationAdminControllerGetLebanonPriorityDocumentTypes,
} from 'src/api/queries/admin/identity-verification-management/identity-verification-management';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ErrorState } from 'src/components/error-state';
import { LoadingState } from 'src/components/loading-state';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

const getDocumentTypeIcon = (documentType: string) => {
  switch (documentType) {
    case 'passport':
      return 'solar:passport-bold';
    case 'national_id':
      return 'solar:card-bold';
    case 'drivers_license':
      return 'solar:car-bold';
    case 'residence_permit':
      return 'solar:home-bold';
    default:
      return 'solar:document-bold';
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

const getDocumentTypeDescription = (documentType: string) => {
  switch (documentType) {
    case 'passport':
      return 'International travel document issued by national governments';
    case 'national_id':
      return 'Government-issued identity card for citizens and residents';
    case 'drivers_license':
      return 'Official document permitting an individual to operate motor vehicles';
    case 'residence_permit':
      return 'Authorization for foreign nationals to reside in a country';
    default:
      return 'Identity verification document';
  }
};

export function DocumentTypesView() {
  const [processingTypes, setProcessingTypes] = useState<Set<string>>(new Set());

  const {
    data: documentTypesData,
    isLoading: loadingDocumentTypes,
    error: documentTypesError,
    refetch: refetchDocumentTypes,
  } = useIdentityVerificationAdminControllerGetAllDocumentTypes();

  const {
    data: lebanonPriorityData,
    isLoading: loadingPriority,
    refetch: refetchPriority,
  } = useIdentityVerificationAdminControllerGetLebanonPriorityDocumentTypes();

  const { mutate: enableDocumentType } = useIdentityVerificationAdminControllerEnableDocumentType();
  const { mutate: disableDocumentType } =
    useIdentityVerificationAdminControllerDisableDocumentType();
  const { mutate: updateLebanonPriority } =
    useIdentityVerificationAdminControllerUpdateLebanonPriority();

  const documentTypes = documentTypesData?.data || [];
  const lebanonPriorityTypes = lebanonPriorityData?.data || [];

  const handleToggleDocumentType = useCallback(
    (documentType: string, isEnabled: boolean) => {
      setProcessingTypes((prev) => new Set(prev).add(documentType));

      const mutationFn = isEnabled ? disableDocumentType : enableDocumentType;

      mutationFn(
        { documentType },
        {
          onSuccess: () => {
            toast.success(
              `${getDocumentTypeLabel(documentType)} ${isEnabled ? 'disabled' : 'enabled'} successfully`
            );
            refetchDocumentTypes();
          },
          onError: () => {
            toast.error(
              `Failed to ${isEnabled ? 'disable' : 'enable'} ${getDocumentTypeLabel(documentType)}`
            );
          },
          onSettled: () => {
            setProcessingTypes((prev) => {
              const newSet = new Set(prev);
              newSet.delete(documentType);
              return newSet;
            });
          },
        }
      );
    },
    [enableDocumentType, disableDocumentType, refetchDocumentTypes]
  );

  const handleToggleLebanonPriority = useCallback(
    (documentType: string, isPriority: boolean) => {
      setProcessingTypes((prev) => new Set(prev).add(documentType));

      const priority = isPriority ? 0 : 1; // Toggle priority

      updateLebanonPriority(
        {
          documentType,
          data: { priority },
        },
        {
          onSuccess: () => {
            toast.success(`Lebanon priority updated for ${getDocumentTypeLabel(documentType)}`);
            refetchPriority();
          },
          onError: () => {
            toast.error(
              `Failed to update Lebanon priority for ${getDocumentTypeLabel(documentType)}`
            );
          },
          onSettled: () => {
            setProcessingTypes((prev) => {
              const newSet = new Set(prev);
              newSet.delete(documentType);
              return newSet;
            });
          },
        }
      );
    },
    [updateLebanonPriority, refetchPriority]
  );

  if (documentTypesError) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Document Types Management"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Identity Verification', href: paths.dashboard.identityVerification.list },
            { name: 'Document Types' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <ErrorState
          title="Failed to load document types"
          subtitle="There was an error loading the document types. Please try again."
          onRetry={refetchDocumentTypes}
          variant="card"
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Document Types Management"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Identity Verification', href: paths.dashboard.identityVerification.list },
          { name: 'Document Types' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {loadingDocumentTypes ? (
        <LoadingState title="Loading document types..." variant="card" size="large" fullHeight />
      ) : (
        <Grid container spacing={3}>
          {/* Document Types Configuration */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card>
              <CardHeader
                title="Document Type Configuration"
                subheader="Enable or disable document types for identity verification"
              />
              <CardContent>
                <Grid container spacing={3}>
                  {documentTypes.map((docTypeConfig) => {
                    const isProcessing = processingTypes.has(docTypeConfig.documentType);
                    const isPriorityInLebanon = lebanonPriorityTypes.some(
                      (priority) => priority.documentType === docTypeConfig.documentType
                    );

                    return (
                      <Grid key={docTypeConfig.documentType} size={{ xs: 12, sm: 6 }}>
                        <Card variant="outlined" sx={{ p: 2 }}>
                          <Stack spacing={2}>
                            <Stack direction="row" spacing={2} alignItems="flex-start">
                              <Box
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 1.5,
                                  bgcolor: docTypeConfig.isEnabled ? 'primary.lighter' : 'grey.100',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Iconify
                                  icon={getDocumentTypeIcon(docTypeConfig.documentType)}
                                  width={24}
                                  color={docTypeConfig.isEnabled ? 'primary.main' : 'text.disabled'}
                                />
                              </Box>

                              <Stack flex={1}>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  sx={{ mb: 0.5 }}
                                >
                                  <Typography variant="subtitle1">
                                    {getDocumentTypeLabel(docTypeConfig.documentType)}
                                  </Typography>
                                  {isPriorityInLebanon && (
                                    <Chip
                                      label="Priority in Lebanon"
                                      size="small"
                                      color="warning"
                                      variant="soft"
                                    />
                                  )}
                                </Stack>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {getDocumentTypeDescription(docTypeConfig.documentType)}
                                </Typography>

                                {docTypeConfig.requirements && (
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    flexWrap="wrap"
                                    sx={{ mb: 1 }}
                                  >
                                    {docTypeConfig.requirements.frontImageRequired && (
                                      <Chip label="Front Image" size="small" variant="outlined" />
                                    )}
                                    {docTypeConfig.requirements.backImageRequired && (
                                      <Chip label="Back Image" size="small" variant="outlined" />
                                    )}
                                    {docTypeConfig.requirements.selfieRequired && (
                                      <Chip label="Selfie" size="small" variant="outlined" />
                                    )}
                                    {docTypeConfig.requirements.proofOfAddressRequired && (
                                      <Chip
                                        label="Proof of Address"
                                        size="small"
                                        variant="outlined"
                                      />
                                    )}
                                  </Stack>
                                )}
                              </Stack>
                            </Stack>

                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={docTypeConfig.isEnabled}
                                    onChange={(e) =>
                                      handleToggleDocumentType(
                                        docTypeConfig.documentType,
                                        e.target.checked
                                      )
                                    }
                                    disabled={isProcessing}
                                  />
                                }
                                label={docTypeConfig.isEnabled ? 'Enabled' : 'Disabled'}
                              />

                              <Button
                                size="small"
                                variant={isPriorityInLebanon ? 'contained' : 'outlined'}
                                color="warning"
                                onClick={() =>
                                  handleToggleLebanonPriority(
                                    docTypeConfig.documentType,
                                    isPriorityInLebanon
                                  )
                                }
                                disabled={isProcessing || loadingPriority}
                                startIcon={<Iconify icon="solar:star-bold" />}
                              >
                                Lebanon Priority
                              </Button>
                            </Stack>
                          </Stack>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Lebanon Priority Documents */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card>
              <CardHeader
                title="Lebanon Priority Documents"
                subheader="Documents prioritized for Lebanese users"
              />
              <CardContent>
                {loadingPriority ? (
                  <LoadingState title="Loading..." variant="circular" size="small" />
                ) : (
                  <Stack spacing={2}>
                    {lebanonPriorityTypes.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        No priority documents configured
                      </Typography>
                    ) : (
                      lebanonPriorityTypes.map((priority, index) => (
                        <Stack
                          key={priority.documentType}
                          direction="row"
                          spacing={2}
                          alignItems="center"
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              bgcolor: 'warning.lighter',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Iconify
                              icon={getDocumentTypeIcon(priority.documentType)}
                              width={16}
                              color="warning.main"
                            />
                          </Box>

                          <Stack flex={1}>
                            <Typography variant="subtitle2">
                              {getDocumentTypeLabel(priority.documentType)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Priority: {priority.priority}
                            </Typography>
                          </Stack>
                        </Stack>
                      ))
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card sx={{ mt: 3 }}>
              <CardHeader title="Quick Stats" />
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Enabled Document Types</Typography>
                    <Typography variant="subtitle2">
                      {documentTypes.filter((dt) => dt.isEnabled).length} / {documentTypes.length}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">Lebanon Priority Types</Typography>
                    <Typography variant="subtitle2">{lebanonPriorityTypes.length}</Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </DashboardContent>
  );
}
