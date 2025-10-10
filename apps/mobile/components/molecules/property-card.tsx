import type { PropertyResponseDto } from "@/api/models/public/propertyResponseDto";
import { IconButton, Text } from "@/components/atoms";
import { useSharedTransition } from "@/hooks/use-shared-transition";
import { ms, mvs } from "@/utils/scaling";
import { HeartIcon, StarIcon } from "phosphor-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedRef, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

interface PropertyCardProps {
  property: PropertyResponseDto;
  onPress?: () => void;
  onFavoritePress?: () => void;
  width?: number;
  imageHeight?: number;
  titleVariant?: "bodySmallSemiBold" | "bodyMediumSemiBold" | "bodyLargeSemiBold";
}

const CARD_WIDTH = ms(160);
const DEFAULT_IMAGE_HEIGHT = mvs(170); // Default image height
const DEFAULT_TOTAL_CARD_HEIGHT = mvs(230); // Default total height

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function PropertyCard({ property, onPress, onFavoritePress, width, imageHeight, titleVariant }: PropertyCardProps) {
  const styles = propertyCardStyles;
  const cardWidth = width || CARD_WIDTH;
  const cardImageHeight = imageHeight || DEFAULT_IMAGE_HEIGHT;
  const cardTotalHeight = imageHeight ? imageHeight + mvs(60) : DEFAULT_TOTAL_CARD_HEIGHT;
  const textVariant = titleVariant || "bodySmallSemiBold";
  const scale = useSharedValue(1);
  const cardRef = useAnimatedRef<View>();
  const { setTransitionData } = useSharedTransition();

  // Get the first image or use a placeholder
  const imageUrl = property?.images?.[0]?.url || property?.pictureUrl || property?.xlPictureUrl;

  // Format price with null safety
  const nightsText =
    property?.minimumNights && property.minimumNights > 1 ? `${property.minimumNights} nights` : "night";

  const handlePressIn = () => {
    scale.value = withSpring(0.96, {
      damping: 20,
      stiffness: 500,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 20,
      stiffness: 500,
    });
  };

  const handlePress = () => {
    if (cardRef.current) {
      cardRef.current.measure((x, y, width, height, pageX, pageY) => {
        setTransitionData({
          x: pageX,
          y: pageY,
          width: width,
          height: height,
          imageUrl: imageUrl,
        });

        if (onPress) {
          setTimeout(() => {
            onPress();
          }, 20);
        }
      });
    } else if (onPress) {
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Safety check for property data
  if (!property || !property._id) {
    return (
      <View style={[styles.container, { width: cardWidth, height: cardTotalHeight }]}>
        <View style={styles.placeholderImage}>
          <Text variant="bodySmallRegular" color="textSecondary">
            Invalid Property
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: cardWidth, height: cardTotalHeight }]}>
      {/* Full Image Container */}
      <AnimatedTouchable
        ref={cardRef}
        style={[styles.imageContainer, animatedStyle, { height: cardImageHeight }]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {imageUrl ? (
          <Animated.Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Text variant="bodySmallRegular" color="textSecondary">
              No Image
            </Text>
          </View>
        )}

        {/* Favorite button */}
        <IconButton style={styles.favoriteButton} onPress={onFavoritePress}>
          <HeartIcon size={20} color="#fff" weight="regular" />
        </IconButton>
      </AnimatedTouchable>

      {/* Content Container Completely Below Image */}
      <View style={styles.contentContainer}>
        <Text variant={textVariant} color="neutral800" numberOfLines={1} style={styles.title}>
          {property.name || "Property"}
        </Text>

        <View style={styles.priceRatingContainer}>
          <View style={styles.priceContainer}>
            <Text variant="bodyMediumSemiBold" color="neutral800">
              ${property.price?.basePrice || property.price?.pricePerNight || 0}
            </Text>
            <Text variant="bodyXSmallRegular" color="neutral600">
              {" · "}
              {nightsText}
            </Text>
          </View>

          {property.averageRating && property.averageRating > 0 && (
            <View style={styles.ratingContainer}>
              <StarIcon size={ms(8)} color="#FFB800" weight="fill" />
              <Text variant="bodyXSmallSemiBold" color="neutral800">
                {property.averageRating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const propertyCardStyles = StyleSheet.create((theme) => ({
  container: {
    marginBottom: theme.spacing.lg,
  },
  imageContainer: {
    width: "100%",
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    position: "relative",
    ...theme.shadows.sm,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButton: {
    position: "absolute",
    top: theme.spacing.md,
    right: theme.spacing.md,
    width: ms(36),
    height: mvs(36),
    borderRadius: ms(18),
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  contentContainer: {
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  priceRatingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
}));
