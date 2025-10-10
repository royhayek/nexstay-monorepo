export interface ReviewFilters {
  property_id?: string;
  reviewer_id?: string;
  reviewee_id?: string;
  review_type?: string;
  overall_rating?: {
    $gte?: number;
    $lte?: number;
  };
  $or?: Array<{
    public_review?: { $regex: string; $options: string };
    private_feedback?: { $regex: string; $options: string };
  }>;
}

export interface ModerationData {
  updatedAt: Date;
  moderated_by: string;
  moderated_at: Date;
  moderation_reason?: string;
  is_flagged?: boolean;
  is_approved?: boolean;
  is_hidden?: boolean;
}

export interface ReviewAverages {
  averageRating?: number;
  averageAccuracy?: number;
  averageCommunication?: number;
  averageCleanliness?: number;
  averageLocation?: number;
  averageCheckIn?: number;
  averageValue?: number;
}

export interface RatingTotals {
  overall_rating: number;
  accuracy: number;
  communication: number;
  cleanliness: number;
  location: number;
  check_in: number;
  value: number;
}

export interface RatingCounts {
  overall_rating: number;
  accuracy: number;
  communication: number;
  cleanliness: number;
  location: number;
  check_in: number;
  value: number;
}

export interface AdminReviewFilters {
  page?: number;
  limit?: number;
  search?: string;
  minRating?: number;
  maxRating?: number;
}

export interface ModerationAction {
  action: 'approve' | 'reject' | 'flag';
  reason?: string;
}
