import React from "react";
import { View, ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Star } from "phosphor-react-native";

import { Text } from "@/components/atoms";

export interface RatingDisplayProps {
  /** Rating value (0-5) */
  rating: number;
  /** Number of reviews */
  reviewCount?: number;
  /** Show stars */
  showStars?: boolean;
  /** Star size */
  starSize?: number;
  /** Custom style */
  style?: ViewStyle;
  /** Compact mode (smaller spacing) */
  compact?: boolean;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  rating,
  reviewCount,
  showStars = true,
  starSize = 18,
  style,
  compact = false,
}) => {
  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((index) => {
      const filled = index <= Math.floor(rating);
      const half = index === Math.ceil(rating) && rating % 1 !== 0;

      return (
        <Star
          key={index}
          size={starSize}
          color="#FFB800"
          weight={filled || half ? "fill" : "regular"}
          style={compact ? styles.starIconCompact : styles.starIcon}
        />
      );
    });
  };

  return (
    <View style={[styles.container, style]}>
      {showStars && <View style={styles.starContainer}>{renderStars()}</View>}
      <Text
        variant={compact ? "bodyXSmallMedium" : "bodySmallMedium"}
        color="neutral800"
        style={compact ? styles.ratingTextCompact : styles.ratingText}
      >
        {rating.toFixed(1)}
      </Text>
      {reviewCount !== undefined && (
        <Text
          variant={compact ? "bodyXSmallRegular" : "bodySmallRegular"}
          color="neutral600"
          style={styles.reviewText}
        >
          {reviewCount > 0 ? `• ${reviewCount} reviews` : "• No reviews"}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  starContainer: {
    flexDirection: "row",
    marginRight: theme.spacing.sm,
  },
  starIcon: {
    marginRight: theme.spacing.xxs,
  },
  starIconCompact: {
    marginRight: 2,
  },
  ratingText: {
    marginRight: theme.spacing.xs,
  },
  ratingTextCompact: {
    marginRight: theme.spacing.xxs,
  },
  reviewText: {
    marginLeft: theme.spacing.xs,
  },
}));
