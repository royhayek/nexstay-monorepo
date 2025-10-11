'use client';

import type { ReviewDataDto } from 'src/api/models/admin';

import { useState, useCallback } from 'react';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import ButtonGroup from '@mui/material/ButtonGroup';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDate, fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useReviewsAdminControllerGetReviewById,
  useReviewsAdminControllerModerateReview,
} from 'src/api/queries/admin/content-moderation/content-moderation';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ErrorState } from 'src/components/error-state';
import { LoadingState } from 'src/components/loading-state';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

interface ReviewDetailsViewProps {
  id: string;
}

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

const getReviewTypeIcon = (reviewType: string) => {
  switch (reviewType) {
    case 'guest_to_host':
      return 'solar:user-bold';
    case 'host_to_guest':
      return 'solar:home-bold';
    default:
      return 'solar:star-bold';
  }
};

export function ReviewDetailsView({ id }: ReviewDetailsViewProps) {
  const [moderationReason, setModerationReason] = useState('');
  const confirmApprove = useBoolean();
  const confirmFlag = useBoolean();
  const confirmReject = useBoolean();

  const { data, isLoading, error, refetch } = useReviewsAdminControllerGetReviewById(id);

  const { mutate: moderateReview, isPending: moderating } = useReviewsAdminControllerModerateReview(
    {
      mutation: {
        onSuccess: (response) => {
          toast.success(response.message || 'Review moderated successfully');
          refetch();
          confirmApprove.onFalse();
          confirmFlag.onFalse();
          confirmReject.onFalse();
          setModerationReason('');
        },
        onError: (moderationError) => {
          toast.error('Failed to moderate review');
          console.error('Moderation error:', moderationError);
        },
      },
    }
  );

  const review = data?.data;

  const handleModerateReview = useCallback(
    (action: 'approve' | 'reject' | 'flag') => {
      if (!review) return;

      moderateReview({
        id: review._id,
        data: {
          action,
          reason:
            moderationReason || `${action.charAt(0).toUpperCase() + action.slice(1)}ed by admin`,
        },
      });
    },
    [review, moderateReview, moderationReason]
  );

  const renderRatingCard = (title: string, rating: number | undefined, icon: string) => (
    <Card sx={{ textAlign: 'center', py: 2 }}>
      <Stack spacing={1} alignItems="center">
        <Iconify icon={icon} width={24} sx={{ color: 'primary.main' }} />
        <Typography variant="h4" sx={{ color: rating ? 'text.primary' : 'text.disabled' }}>
          {rating?.toFixed(1) || 'N/A'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
        {rating && (
          <Rating
            value={rating}
            precision={0.1}
            readOnly
            size="small"
            sx={{ '& .MuiRating-icon': { fontSize: '1rem' } }}
          />
        )}
      </Stack>
    </Card>
  );

  const renderStatusCard = (reviewData: ReviewDataDto) => (
    <Card>
      <CardHeader
        title="Review Status"
        avatar={
          <Iconify icon="solar:shield-check-bold" width={24} sx={{ color: 'primary.main' }} />
        }
      />
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
              Approved:
            </Typography>
            <Label
              variant="soft"
              color={reviewData.is_approved ? 'success' : 'warning'}
              startIcon={
                <Iconify
                  icon={
                    reviewData.is_approved ? 'solar:check-circle-bold' : 'solar:clock-circle-bold'
                  }
                  width={16}
                />
              }
            >
              {reviewData.is_approved ? 'Approved' : 'Pending'}
            </Label>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
              Flagged:
            </Typography>
            <Label
              variant="soft"
              color={reviewData.is_flagged ? 'error' : 'default'}
              startIcon={
                <Iconify
                  icon={reviewData.is_flagged ? 'solar:flag-bold' : 'solar:check-circle-bold'}
                  width={16}
                />
              }
            >
              {reviewData.is_flagged ? 'Flagged' : 'Clean'}
            </Label>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
              Visibility:
            </Typography>
            <Label
              variant="soft"
              color={reviewData.is_hidden ? 'default' : 'info'}
              startIcon={
                <Iconify
                  icon={reviewData.is_hidden ? 'solar:eye-closed-bold' : 'solar:eye-bold'}
                  width={16}
                />
              }
            >
              {reviewData.is_hidden ? 'Hidden' : 'Visible'}
            </Label>
          </Box>

          {reviewData.moderated_by && (
            <>
              <Divider />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium', mb: 1 }}>
                  Moderation Details:
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Moderated by:
                    </Typography>
                    <Typography variant="caption">{reviewData.moderated_by}</Typography>
                  </Box>
                  {reviewData.moderated_at && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Moderated at:
                      </Typography>
                      <Typography variant="caption">
                        {fDateTime(reviewData.moderated_at)}
                      </Typography>
                    </Box>
                  )}
                  {reviewData.moderation_reason && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Reason:
                      </Typography>
                      <Typography variant="caption">{reviewData.moderation_reason}</Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  const renderReviewContent = (reviewData: ReviewDataDto) => (
    <Card>
      <CardHeader
        title="Review Content"
        avatar={
          <Iconify icon="solar:chat-round-dots-bold" width={24} sx={{ color: 'primary.main' }} />
        }
      />
      <CardContent>
        <Stack spacing={3}>
          {reviewData.public_review && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Public Review:
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  p: 2,
                  bgcolor: 'background.neutral',
                  borderRadius: 1,
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                }}
              >
                &ldquo;{reviewData.public_review}&rdquo;
              </Typography>
            </Box>
          )}

          {reviewData.private_feedback && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Private Feedback:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  border: (theme) => `1px dashed ${theme.vars.palette.divider}`,
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                }}
              >
                &ldquo;{reviewData.private_feedback}&rdquo;
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', mt: 1, display: 'block' }}
              >
                This feedback is only visible to the host/guest and admin
              </Typography>
            </Box>
          )}

          {!reviewData.public_review && !reviewData.private_feedback && (
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                color: 'text.disabled',
                fontStyle: 'italic',
              }}
            >
              No written review content provided
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  const renderParticipantCard = (
    title: string,
    participantId: string,
    icon: string,
    color: 'primary' | 'success' = 'primary'
  ) => (
    <Card>
      <CardHeader
        title={title}
        avatar={<Iconify icon={icon} width={24} sx={{ color: `${color}.main` }} />}
      />
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: `${color}.lighter` }}>
            <Iconify icon={icon} width={24} sx={{ color: `${color}.main` }} />
          </Avatar>
          <Stack>
            <Typography variant="subtitle2">{title}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              ID: {participantId}
            </Typography>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <DashboardContent>
        <LoadingState title="Loading review details..." variant="card" fullHeight />
      </DashboardContent>
    );
  }

  if (error || !review) {
    return (
      <DashboardContent>
        <ErrorState title="Failed to load review details" onRetry={refetch} variant="card" />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        backHref={paths.dashboard.reviews.list}
        heading={`Review #${id.slice(-8)}`}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Reviews', href: paths.dashboard.reviews.list },
          { name: 'Details' },
        ]}
        action={
          <Stack direction="row" spacing={2}>
            {review && (
              <ButtonGroup variant="outlined" size="small">
                {!review.is_approved && (
                  <Button
                    startIcon={<Iconify icon="solar:check-circle-bold" />}
                    color="success"
                    onClick={confirmApprove.onTrue}
                    disabled={moderating}
                  >
                    Approve
                  </Button>
                )}

                <Button
                  startIcon={<Iconify icon="solar:flag-bold" />}
                  color="warning"
                  onClick={confirmFlag.onTrue}
                  disabled={moderating}
                >
                  Flag
                </Button>

                <Button
                  startIcon={<Iconify icon="solar:close-circle-bold" />}
                  color="error"
                  onClick={confirmReject.onTrue}
                  disabled={moderating}
                >
                  Reject
                </Button>
              </ButtonGroup>
            )}
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        {/* Review Header */}
        <Card>
          <CardHeader
            title={
              <Stack direction="row" alignItems="center" spacing={2}>
                <Iconify
                  icon={getReviewTypeIcon(review.review_type)}
                  width={24}
                  sx={{ color: 'primary.main' }}
                />
                <Typography variant="h6">Review Details</Typography>
                <Label
                  variant="soft"
                  color={getReviewTypeColor(review.review_type) as any}
                  startIcon={<Iconify icon={getReviewTypeIcon(review.review_type)} width={16} />}
                >
                  {review.review_type.replace(/_/g, ' ').replace(/\\b\\w/g, (l) => l.toUpperCase())}
                </Label>
              </Stack>
            }
            subheader={
              <Stack direction="row" spacing={2} sx={{ mt: 1, mb: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Created: {fDate(review.createdAt)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  •
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Booking: #{review.booking_id.slice(-8)}
                </Typography>
              </Stack>
            }
          />
        </Card>

        {/* Property Link */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Iconify icon="solar:home-2-bold" width={24} sx={{ color: 'primary.main' }} />
              <Stack sx={{ flex: 1 }}>
                <Typography variant="subtitle2">Property</Typography>
                <Button
                  component={RouterLink}
                  href={paths.dashboard.properties.details(review.propertyId)}
                  variant="text"
                  size="small"
                  startIcon={<Iconify icon="solar:eye-bold" />}
                  sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                >
                  View Property #{review.propertyId.slice(-8)}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Participants */}
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {renderParticipantCard('Reviewer', review.reviewer_id, 'solar:user-bold', 'primary')}
          {renderParticipantCard(
            'Reviewee',
            review.reviewee_id,
            'solar:user-check-bold',
            'success'
          )}
        </Box>

        {/* Overall Rating */}
        <Card>
          <CardHeader
            title="Overall Rating"
            avatar={<Iconify icon="solar:star-bold" width={24} sx={{ color: 'warning.main' }} />}
          />
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h2" sx={{ color: 'warning.main', mb: 1 }}>
                {review.overall_rating?.toFixed(1) || 'N/A'}
              </Typography>
              {review.overall_rating && (
                <Rating
                  value={review.overall_rating}
                  precision={0.1}
                  readOnly
                  size="large"
                  sx={{ mb: 1 }}
                />
              )}
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Overall Experience
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Individual Ratings */}
        <Card>
          <CardHeader
            title="Detailed Ratings"
            avatar={
              <Iconify icon="solar:chart-square-bold" width={24} sx={{ color: 'info.main' }} />
            }
          />
          <CardContent>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(3, 1fr)',
                  md: 'repeat(6, 1fr)',
                },
              }}
            >
              {renderRatingCard('Accuracy', review.accuracy, 'solar:target-bold')}
              {renderRatingCard('Communication', review.communication, 'solar:chat-round-bold')}
              {renderRatingCard('Cleanliness', review.cleanliness, 'solar:broom-bold')}
              {renderRatingCard('Location', review.location, 'solar:map-point-bold')}
              {renderRatingCard('Check-in', review.check_in, 'solar:key-bold')}
              {renderRatingCard('Value', review.value, 'solar:dollar-bold')}
            </Box>
          </CardContent>
        </Card>

        {/* Review Content */}
        {renderReviewContent(review)}

        {/* Status Information */}
        {renderStatusCard(review)}
      </Stack>

      {/* Moderation Dialogs */}
      <ConfirmDialog
        open={confirmApprove.value}
        onClose={confirmApprove.onFalse}
        title="Approve Review"
        content={
          <Stack spacing={2}>
            <Typography>
              Are you sure you want to approve this review? This action will make the review visible
              to users and mark it as approved.
            </Typography>
            <TextField
              fullWidth
              label="Moderation Reason (Optional)"
              placeholder="Enter reason for approval..."
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              multiline
              rows={2}
            />
          </Stack>
        }
        action={
          <Button
            variant="contained"
            color="success"
            onClick={() => handleModerateReview('approve')}
            disabled={moderating}
            startIcon={<Iconify icon="solar:check-circle-bold" />}
          >
            {moderating ? 'Approving...' : 'Approve Review'}
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmFlag.value}
        onClose={confirmFlag.onFalse}
        title="Flag Review"
        content={
          <Stack spacing={2}>
            <Typography>
              Are you sure you want to flag this review? This will mark it for further review and
              may hide it from users.
            </Typography>
            <TextField
              fullWidth
              label="Moderation Reason"
              placeholder="Enter reason for flagging..."
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              multiline
              rows={2}
              required
            />
          </Stack>
        }
        action={
          <Button
            variant="contained"
            color="warning"
            onClick={() => handleModerateReview('flag')}
            disabled={moderating || !moderationReason.trim()}
            startIcon={<Iconify icon="solar:flag-bold" />}
          >
            {moderating ? 'Flagging...' : 'Flag Review'}
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmReject.value}
        onClose={confirmReject.onFalse}
        title="Reject Review"
        content={
          <Stack spacing={2}>
            <Typography>
              Are you sure you want to reject this review? This action will mark the review as
              rejected and may hide it from public view.
            </Typography>
            <TextField
              fullWidth
              label="Moderation Reason"
              placeholder="Enter reason for rejection..."
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              multiline
              rows={2}
              required
            />
          </Stack>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => handleModerateReview('reject')}
            disabled={moderating || !moderationReason.trim()}
            startIcon={<Iconify icon="solar:close-circle-bold" />}
          >
            {moderating ? 'Rejecting...' : 'Reject Review'}
          </Button>
        }
      />
    </DashboardContent>
  );
}
