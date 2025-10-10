// ================================
// Request Body Interfaces
// ================================

export type ModerationAction = 'approve' | 'reject' | 'flag' | 'unflag' | 'hide' | 'show';

export interface BulkModerateReviewsRequest {
  reviewIds: string[];
  action: ModerationAction;
  reason?: string;
}
